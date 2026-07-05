#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
API_URL="${API_URL:-http://localhost:4000}"
WEB_URL="${WEB_URL:-http://localhost:3000}"
BITRATE="${SHOWCASE_BITRATE:-100M}"
CRF="${SHOWCASE_CRF:-8}"
WEB_PID=""
SKIP_PREFLIGHT="${SKIP_PREFLIGHT:-0}"

cleanup() {
  if [ -n "$WEB_PID" ] && kill -0 "$WEB_PID" 2>/dev/null; then
    kill "$WEB_PID" 2>/dev/null || true
  fi
}
trap cleanup EXIT

echo "╔══════════════════════════════════════════════════════════╗"
echo "║   GULFOS Official 4K Showcase — Final Release            ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo ""
echo "Pipeline: preflight → record → export → verify"
echo "Quality:  3840×2160 native browser capture, H.264 High Profile"
echo "Note:     Native ~25 FPS (no interpolation). 60/120 FPS needs HW capture."
echo ""

# ─── MongoDB ─────────────────────────────────────────────────────────────────
if ! pgrep -x mongod >/dev/null 2>&1; then
  echo "▶ Starting MongoDB..."
  mkdir -p /tmp/mongodb-data /tmp/mongo-sock
  mongod --dbpath /tmp/mongodb-data --bind_ip 127.0.0.1 --port 27017 \
    --unixSocketPrefix /tmp/mongo-sock --fork --logpath /tmp/mongod.log
  sleep 2
fi

# ─── API ─────────────────────────────────────────────────────────────────────
if ! curl -sf "$API_URL/health" >/dev/null 2>&1; then
  echo "▶ Starting API..."
  cd "$ROOT/apps/api" && npm run dev &
  for i in $(seq 1 40); do curl -sf "$API_URL/health" >/dev/null 2>&1 && break; sleep 2; done
fi

# ─── Production Web (stable 4K capture) ──────────────────────────────────────
if ! curl -sf "$WEB_URL" >/dev/null 2>&1; then
  pkill -f "next dev" 2>/dev/null || true
  pkill -f "next start" 2>/dev/null || true
  sleep 1
  echo "▶ Building production web..."
  cd "$ROOT/apps/web"
  npm run build
  PORT=3000 npm run start &
  WEB_PID=$!
  for i in $(seq 1 60); do curl -sf "$WEB_URL" >/dev/null 2>&1 && break; sleep 2; done
else
  echo "▶ Using existing web server at $WEB_URL"
fi

echo "✓ API: $API_URL"
echo "✓ Web: $WEB_URL"
echo ""

export PLAYWRIGHT_BASE_URL="$WEB_URL"
export PLAYWRIGHT_API_URL="$API_URL"
export DEMO_SLOW_MO="${DEMO_SLOW_MO:-100}"

OUTPUT="$ROOT/apps/web/demo-output"
mkdir -p "$OUTPUT"

# ─── Preflight gate ──────────────────────────────────────────────────────────
if [ "$SKIP_PREFLIGHT" != "1" ]; then
  echo "▶ Running preflight audit..."
  cd "$ROOT/apps/web"
  npx playwright test e2e/gulfos-preflight.spec.ts --config=playwright.config.ts || {
    echo "❌ Preflight failed — fix errors before recording."
    echo "   Set SKIP_PREFLIGHT=1 to bypass (not recommended)."
    exit 1
  }
  echo "✓ Preflight passed"
  echo ""
fi

# ─── Record official showcase ────────────────────────────────────────────────
echo "▶ Recording official 4K showcase (cinematic pacing)..."
cd "$ROOT/apps/web"
npx playwright test e2e/gulfos-official-showcase.spec.ts --config=playwright.showcase.config.ts

RAW="$OUTPUT/gulfos-showcase-raw.webm"
OUT="$OUTPUT/gulfos-showcase-4k.mp4"
OUT_HQ="$OUTPUT/gulfos-showcase-4k-hq.mp4"

if [ -f "$RAW" ]; then
  echo ""
  echo "▶ Exporting 4K H.264 High Profile (CRF ${CRF})..."

  # Primary export: CRF-based high quality (preserves source detail)
  ffmpeg -y -i "$RAW" \
    -c:v libx264 -preset slow -profile:v high -pix_fmt yuv420p \
    -crf "$CRF" -movflags +faststart \
    -vf "scale=3840:2160:flags=lanczos" \
    "$OUT" 2>/dev/null

  # Optional high-bitrate pass for distribution
  if [ "${SHOWCASE_TWO_PASS:-0}" = "1" ]; then
    echo "▶ Two-pass ${BITRATE} encode..."
    PASSLOG="$OUTPUT/ffmpeg2pass"
    ffmpeg -y -i "$RAW" -c:v libx264 -preset slow -profile:v high -b:v "$BITRATE" \
      -vf "scale=3840:2160:flags=lanczos" -pass 1 -passlogfile "$PASSLOG" -an -f null /dev/null 2>/dev/null
    ffmpeg -y -i "$RAW" -c:v libx264 -preset slow -profile:v high -b:v "$BITRATE" \
      -maxrate 120M -bufsize 240M -vf "scale=3840:2160:flags=lanczos" \
      -pass 2 -passlogfile "$PASSLOG" -movflags +faststart "$OUT_HQ" 2>/dev/null
    rm -f "${PASSLOG}"* 2>/dev/null || true
  fi

  echo ""
  echo "══════════════════════════════════════════════════════════"
  echo "  DELIVERABLES"
  echo "══════════════════════════════════════════════════════════"
  echo "  Raw:        apps/web/demo-output/gulfos-showcase-raw.webm"
  echo "  4K Final:   apps/web/demo-output/gulfos-showcase-4k.mp4"
  echo "  App Audit:  apps/web/demo-output/official/application-audit.md"
  echo "  Runtime:    apps/web/demo-output/official/runtime-audit.md"
  echo "  Performance: apps/web/demo-output/official/performance-report.md"
  echo "  Verification: apps/web/demo-output/official/final-verification-report.md"
  echo "══════════════════════════════════════════════════════════"

  if command -v ffprobe >/dev/null 2>&1; then
    ffprobe -v quiet -print_format json -show_streams "$OUT" 2>/dev/null \
      | python3 -c "
import sys, json
d = json.load(sys.stdin)
v = [x for x in d['streams'] if x['codec_type']=='video'][0]
br = int(v.get('bit_rate') or 0) // 1000
fps = v.get('r_frame_rate','?')
print(f'  Resolution: {v.get(\"width\")}x{v.get(\"height\")} | Profile: {v.get(\"profile\",\"high\")} | FPS: {fps} | Bitrate: {br} kbps')
" 2>/dev/null || ls -lh "$OUT"
  fi
else
  echo "⚠ Raw video not found — check showcase-results/"
  exit 1
fi

echo ""
echo "✓ Official GULFOS showcase complete."
