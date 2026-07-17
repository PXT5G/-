#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
API_URL="${API_URL:-http://localhost:4000}"
WEB_URL="${WEB_URL:-http://localhost:3000}"
DEMO_EMAIL="${DEMO_EMAIL:-demo@gulfos.app}"
DEMO_PASSWORD="${DEMO_PASSWORD:-Demo1234!}"
WEB_PID=""

cleanup() {
  if [ -n "$WEB_PID" ] && kill -0 "$WEB_PID" 2>/dev/null; then
    kill "$WEB_PID" 2>/dev/null || true
  fi
}
trap cleanup EXIT

echo "╔══════════════════════════════════════════════════╗"
echo "║     GULFOS Professional Full Demo Runner       ║"
echo "╚══════════════════════════════════════════════════╝"
echo ""

# ─── Check MongoDB ───────────────────────────────────────────────────────────
if ! pgrep -x mongod >/dev/null 2>&1; then
  echo "▶ Starting MongoDB..."
  mkdir -p /tmp/mongodb-data /tmp/mongo-sock
  mongod --dbpath /tmp/mongodb-data --bind_ip 127.0.0.1 --port 27017 \
    --unixSocketPrefix /tmp/mongo-sock --fork --logpath /tmp/mongod.log
  sleep 2
fi

# ─── Check API ───────────────────────────────────────────────────────────────
if ! curl -sf "$API_URL/health" >/dev/null 2>&1; then
  echo "▶ Starting API on port 4000..."
  cd "$ROOT/apps/api" && npm run dev &
  for i in $(seq 1 30); do
    curl -sf "$API_URL/health" >/dev/null 2>&1 && break
    sleep 2
  done
fi

# ─── Production Web (stable for Playwright) ───────────────────────────────────
pkill -f "next dev" 2>/dev/null || true
pkill -f "next start" 2>/dev/null || true
sleep 1

if ! curl -sf "$WEB_URL" >/dev/null 2>&1; then
  echo "▶ Building & starting Web (production) on port 3000..."
  cd "$ROOT/apps/web"
  npm run build
  PORT=3000 npm run start &
  WEB_PID=$!
  for i in $(seq 1 30); do
    curl -sf "$WEB_URL" >/dev/null 2>&1 && break
    sleep 2
  done
fi

echo "✓ API: $API_URL"
echo "✓ Web: $WEB_URL"

# ─── Ensure demo user exists ─────────────────────────────────────────────────
echo "▶ Ensuring demo user exists..."
curl -sf -X POST "$API_URL/api/auth/register" \
  -H 'Content-Type: application/json' \
  -d "{\"username\":\"demouser\",\"email\":\"$DEMO_EMAIL\",\"password\":\"$DEMO_PASSWORD\",\"displayName\":\"مستخدم تجريبي\"}" \
  >/dev/null 2>&1 || true

TOKEN=$(curl -sf -X POST "$API_URL/api/auth/login" \
  -H 'Content-Type: application/json' \
  -d "{\"email\":\"$DEMO_EMAIL\",\"password\":\"$DEMO_PASSWORD\"}" \
  | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['tokens']['accessToken'])" 2>/dev/null || echo "")

if [ -n "$TOKEN" ]; then
  curl -sf -X POST "$API_URL/api/system/ready" \
    -H "Authorization: Bearer $TOKEN" \
    -H 'Content-Type: application/json' >/dev/null 2>&1 || true
  echo "✓ Demo user ready"
else
  echo "⚠ Could not authenticate demo user — store install may require manual login"
fi

# ─── Run Playwright demo ─────────────────────────────────────────────────────
echo ""
echo "▶ Running GULFOS Full Demo (Playwright + Video Recording)..."
echo "  Showcase: 38 steps | Apps audit: all registered apps"
echo ""

cd "$ROOT/apps/web"
export PLAYWRIGHT_BASE_URL="$WEB_URL"
export PLAYWRIGHT_API_URL="$API_URL"
export DEMO_SLOW_MO="${DEMO_SLOW_MO:-60}"

npx playwright test e2e/gulfos-full-demo.spec.ts --config=playwright.config.ts
npx playwright test e2e/gulfos-apps-audit.spec.ts --config=playwright.config.ts

# ─── Collect video ─────────────────────────────────────────────────────────
VIDEO_SRC=$(find demo-output/test-results -name "video.webm" 2>/dev/null | head -1)
if [ -n "$VIDEO_SRC" ]; then
  mkdir -p demo-output
  cp "$VIDEO_SRC" demo-output/gulfos-full-demo.webm
  echo ""
  echo "✓ Video saved: apps/web/demo-output/gulfos-full-demo.webm"
fi

if [ -f demo-output/demo-report.md ]; then
  echo "✓ Report saved: apps/web/demo-output/demo-report.md"
  echo ""
  head -50 demo-output/demo-report.md
fi

if [ -f demo-output/apps-audit/demo-report.md ]; then
  echo ""
  echo "✓ Apps audit: apps/web/demo-output/apps-audit/demo-report.md"
  head -30 demo-output/apps-audit/demo-report.md
fi

echo ""
echo "══════════════════════════════════════════════════"
echo " Demo complete! Open demo-output/ for video + report"
echo "══════════════════════════════════════════════════"
