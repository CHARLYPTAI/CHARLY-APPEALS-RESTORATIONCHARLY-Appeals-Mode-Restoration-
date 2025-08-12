#!/usr/bin/env bash
set -euo pipefail

BASE="http://127.0.0.1:8001"
USER="admin@charly.com"
PASS="CharlyCTO2025!"   # from .env file
OUT="/tmp/charly_smoke_$(date +%s)"
mkdir -p "$OUT"

# Helper function for JSON parsing (fallback to grep if jq not available)
j() { 
  if command -v jq >/dev/null 2>&1; then
    jq -r "$1"
  else
    # Fallback grep-based JSON parsing
    case "$1" in
      '.access_token') grep -o '"access_token":"[^"]*"' | cut -d'"' -f4 ;;
      '.refresh_token') grep -o '"refresh_token":"[^"]*"' | cut -d'"' -f4 ;;
      '.id') grep -o '"id":"[^"]*"' | cut -d'"' -f4 ;;
      '.report_id // .id // .uuid') grep -o -E '"(report_id|id|uuid)":"[^"]*"' | head -1 | cut -d'"' -f4 ;;
      '.packet_id // .id // .uuid // .packetId') grep -o -E '"(packet_id|id|uuid|packetId)":"[^"]*"' | head -1 | cut -d'"' -f4 ;;
      '.status') grep -o '"status":"[^"]*"' | cut -d'"' -f4 ;;
      *) echo "null" ;;
    esac
  fi
}

echo "[1/8] Login"
LOGIN=$(curl -s -X POST "$BASE/api/auth/login" -H "Content-Type: application/json" -d "{\"email\":\"$USER\",\"password\":\"$PASS\"}")
echo "$LOGIN" > "$OUT/login.json"
ACCESS=$(echo "$LOGIN" | j '.access_token')
REFRESH=$(echo "$LOGIN" | j '.refresh_token')
[ "$ACCESS" != "null" ] && [ -n "$ACCESS" ] || { echo "FAIL login"; cat "$OUT/login.json"; exit 1; }

H="Authorization: Bearer $ACCESS"

echo "[2/8] Me"
curl -s -H "$H" "$BASE/api/auth/me" | tee "$OUT/me.json" >/dev/null

echo "[3/8] Create property"
PROP_REQ='{"address":"1804 Main Street","city":"Louisville","county":"Jefferson County, KY","property_type":"Commercial","square_footage":5000,"year_built":1973,"current_assessment":3000000,"market_value":1200000}'
PROP=$(curl -s -X POST "$BASE/api/portfolio/" -H "$H" -H "Content-Type: application/json" -d "$PROP_REQ")
echo "$PROP" > "$OUT/property.json"
PID=$(echo "$PROP" | j '.id')
[ -n "$PID" ] && [ "$PID" != "null" ] || { echo "FAIL create property"; cat "$OUT/property.json"; exit 1; }

echo "[4/8] Valuation"
curl -s -H "$H" "$BASE/api/portfolio/valuation/$PID" | tee "$OUT/valuation.json" >/dev/null

echo "[5/8] Supernova generate"
REP=$(curl -s -X POST "$BASE/api/reports/generate" -H "$H" -H "Content-Type: application/json" -d "{\"property_id\":\"$PID\",\"report_type\":\"supernova\"}")
echo "$REP" > "$OUT/report.json"
RID=$(echo "$REP" | j '.report_id // .id // .uuid')
[ -n "$RID" ] && [ "$RID" != "null" ] || { echo "FAIL report generate"; cat "$OUT/report.json"; exit 1; }

echo "[6/8] Supernova unlock"
UNL=$(curl -s -X POST "$BASE/api/reports/unlock" -H "$H" -H "Content-Type: application/json" -d "{\"report_id\":\"$RID\"}")
echo "$UNL" > "$OUT/unlock.json"

echo "[7/8] Appeals generate"
APP=$(curl -s -X POST "$BASE/api/appeals/generate-packet" -H "$H" -H "Content-Type: application/json" -d "{\"property_id\":\"$PID\"}")
echo "$APP" > "$OUT/appeal.json"
AID=$(echo "$APP" | j '.packet_id // .id // .uuid // .packetId')

echo "[8/8] Appeals status→download (best-effort)"
if [ -n "${AID:-}" ] && [ "$AID" != "null" ]; then
  for i in {1..10}; do
    ST=$(curl -s -H "$H" "$BASE/api/appeals/packet-status/$AID")
    echo "$ST" > "$OUT/appeal_status_$i.json"
    READY=$(echo "$ST" | j '.status')
    [ "$READY" = "ready" ] && break
    sleep 1
  done
  curl -s -D "$OUT/appeal_headers.txt" -H "$H" "$BASE/api/appeals/download/$AID" -o "$OUT/appeal_packet.bin" || true
fi

echo "OK"