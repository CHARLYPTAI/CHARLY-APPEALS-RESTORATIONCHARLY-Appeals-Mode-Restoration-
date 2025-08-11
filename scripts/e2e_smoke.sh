#!/usr/bin/env bash
set -euo pipefail

BASE="http://127.0.0.1:8002"
EMAIL="admin@charly.com"
PASS="admin"

echo "1) Login"
TOKENS=$(curl -s -X POST "$BASE/api/auth/login" -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASS\"}")
ACCESS=$(echo "$TOKENS" | sed -n 's/.*"access_token":"\([^"]*\)".*/\1/p')
[ -n "$ACCESS" ] || { echo "Login failed"; exit 1; }

auth() { echo -H "Authorization: Bearer $ACCESS"; }

echo "2) Create property"
PROP=$(curl -s -X POST "$BASE/api/portfolio/" $(auth) -H "Content-Type: application/json" \
  -d '{"address":"1804 Main Street","city":"Demo","county":"Demo","property_type":"Commercial","market_value":1000000,"current_assessment":1200000}')
PROP_ID=$(echo "$PROP" | sed -n 's/.*"id":"\([^"]*\)".*/\1/p')
[ -n "$PROP_ID" ] || { echo "No property id"; echo "$PROP"; exit 1; }
echo "   id=$PROP_ID"

echo "3) Valuation"
curl -sf "$BASE/api/portfolio/valuation/$PROP_ID" $(auth) >/dev/null

echo "4) Supernova generate"
REP=$(curl -s -X POST "$BASE/api/reports/generate" $(auth) -H "Content-Type: application/json" \
  -d "{\"property_id\":\"$PROP_ID\",\"report_type\":\"supernova\"}")
RID=$(echo "$REP" | sed -n 's/.*"id":"\([^"]*\)".*/\1/p')
[ -n "$RID" ] || { echo "No report id"; echo "$REP"; exit 1; }

echo "4b) Unlock"
UNL=$(curl -s -X POST "$BASE/api/reports/unlock" $(auth) -H "Content-Type: application/json" \
  -d "{\"report_id\":\"$RID\"}")
DURL=$(echo "$UNL" | sed -n 's/.*"download_url":"\([^"]*\)".*/\1/p')
[ -n "$DURL" ] || { echo "No download_url"; echo "$UNL"; exit 1; }

echo "4c) Download"
curl -sf "$BASE$DURL" $(auth) -o /tmp/supernova.pdf

echo "5) Appeals generate"
AP=$(curl -s -X POST "$BASE/api/appeals/generate-packet" $(auth) -H "Content-Type: application/json" \
  -d "{\"property_id\":\"$PROP_ID\"}")
PID=$(echo "$AP" | sed -n 's/.*"packet_id":"\([^"]*\)".*/\1/p')
[ -n "$PID" ] || { echo "No packet_id"; echo "$AP"; exit 1; }

echo "5b) Poll status"
for i in {1..10}; do
  ST=$(curl -s "$BASE/api/appeals/packet-status/$PID" $(auth))
  echo "$ST" | grep -q '"status":"ready"' && break || sleep 1
  [ $i -eq 10 ] && { echo "Packet not ready"; echo "$ST"; exit 1; }
done

echo "5c) Download packet"
curl -sf "$BASE/api/appeals/download/$PID" $(auth) -o /tmp/appeal_packet.pdf

echo "OK ✅"