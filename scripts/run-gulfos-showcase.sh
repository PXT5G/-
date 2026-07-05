#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
API_URL="${API_URL:-http://localhost:4000}"
WEB_URL="${WEB_URL:-http://localhost:3000}"
DEMO_EMAIL="${DEMO_EMAIL:-demo@gulfos.app}"
DEMO_PASSWORD="${DEMO_PASSWORD:-Demo1234!}"
BITRATE="${SHOWCASE_BITRATE:-100M}"
WEB_PID=""

cleanup() {
  if [ -n "$WEB_PID" ] && kill -0 "$WEB_PID" 2>/dev/null; then
    kill "$WEB_PID" 2>/dev/null || true
  fi
}
trap cleanup EXIT

echo "╔══════════════════════════════════════════════════════════╗"
echo "║   GULFOS Cinematic 4K Showcase Recorder                  ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo ""
echo "Note: 240 FPS/HDR require dedicated capture hardware."
echo "      This pipeline records native browser frames at 4K,"
echo "      then exports high-bitrate H.264 (~${BITRATE})."
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
  for i in $(seq 1 40); do curl -sf "$WEB_URL" >/dev/null 2>&1 && break; sleep 2; done
else
  echo "▶ Using existing web server at $WEB_URL"
fi

echo "✓ API: $API_URL"
echo "✓ Web: $WEB_URL (production)"
echo ""

# ─── Record showcase ─────────────────────────────────────────────────────────
export PLAYWRIGHT_BASE_URL="$WEB_URL"
export PLAYWRIGHT_API_URL="$API_URL"
export DEMO_SLOW_MO="${DEMO_SLOW_MO:-120}"

echo "▶ Recording 4K cinematic showcase..."
cd "$ROOT/apps/web"
npx playwright test e2e/gulfos-cinematic-showcase.spec.ts --config=playwright.showcase.config.ts

RAW="$ROOT/apps/web/demo-output/gulfos-showcase-raw.webm"
OUT="$ROOT/apps/web/demo-output/gulfos-showcase-4k.mp4"

if [ -f "$RAW" ]; then
  echo ""
  echo "▶ Exporting high-bitrate 4K H.264..."
  ffmpeg -y -i "$RAW" \
    -c:v libx264 -preset slow -pix_fmt yuv420p \
    -b:v "$BITRATE" -maxrate 120M -bufsize 240M \
    -vf "scale=3840:2160:flags=lanczos" \
    -movflags +faststart \
    "$OUT" 2>/dev/null

  echo "✓ Raw:  apps/web/demo-output/gulfos-showcase-raw.webm"
  echo "✓ 4K:   apps/web/demo-output/gulfos-showcase-4k.mp4"
  ffprobe -v quiet -print_format json -show_streams "$OUT" 2>/dev/null \
    | python3 -c "import sys,json; s=[x for x in json.load(sys.stdin)['streams'] if x['codec_type']=='video'][0]; print(f\"  Resolution: {s.get('width')}x{s.get('height')} | Codec: {s.get('codec_name')} | Bitrate: {int(s.get('bit_rate',0))//1000}kbps\")" \
    || ls -lh "$OUT"
else
  echo "⚠ Raw video not found — check showcase-results/"
fi

echo ""
echo "══════════════════════════════════════════════════════════"
