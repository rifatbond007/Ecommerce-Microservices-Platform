#!/usr/bin/env bash
# Gateway ownership smoke test.
#
# Verifies that the process serving http://localhost:3000 is actually THIS
# project's gateway (not a stray container that has captured port 3000 —
# which is exactly the bug that produced the 403 Forbidden on
# POST /api/v1/auth/register earlier).
#
# Usage:
#   bash scripts/check-gateway.sh
#
# Exits 0 if the gateway is the project's, 1 otherwise.

set -euo pipefail

GATEWAY_URL="${GATEWAY_URL:-http://localhost:3000}"
EXPECTED_ORIGIN="${EXPECTED_ORIGIN:-http://localhost:5173}"

echo "▶ Checking that $GATEWAY_URL is the project gateway..."

# 1. /health must return JSON with a "service":"gateway" field. A stray
#    container (e.g. another project's server) will not match this marker.
health_body=$(curl -s -o /dev/stdout -w "\nHTTP_STATUS:%{http_code}" "$GATEWAY_URL/health")
status=$(echo "$health_body" | sed -n 's/^HTTP_STATUS://p')
body=$(echo "$health_body" | sed '/^HTTP_STATUS:/d')

if [ "$status" != "200" ]; then
  echo "✗ FAIL: $GATEWAY_URL/health returned HTTP $status (expected 200)."
  echo "  Body: $body"
  echo "  ➤  Port 3000 may be held by a stray process. Run:"
  echo "        docker ps | grep ':3000->'"
  echo "        docker stop <container-id>"
  exit 1
fi

if ! echo "$body" | grep -q '"service":"gateway"'; then
  echo "✗ FAIL: $GATEWAY_URL/health did not return the gateway service marker."
  echo "  Expected JSON to contain \"service\":\"gateway\"."
  echo "  Got: $body"
  echo "  ➤  A different server is bound to port 3000. Stop it and restart the gateway."
  exit 1
fi

echo "✓ health endpoint reports service=gateway"

# 2. CORS preflight on /api/v1/auth/register from the frontend origin must
#    succeed. A stranger server with a stricter CORS policy will reject this.
preflight_status=$(curl -s -o /dev/null -w "%{http_code}" \
  -X OPTIONS "$GATEWAY_URL/api/v1/auth/register" \
  -H "Origin: $EXPECTED_ORIGIN" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: content-type")

if [ "$preflight_status" != "200" ] && [ "$preflight_status" != "204" ]; then
  echo "✗ FAIL: CORS preflight from $EXPECTED_ORIGIN returned HTTP $preflight_status."
  echo "  Expected 200 or 204. The gateway CORS policy is not allowing the frontend."
  exit 1
fi

echo "✓ CORS preflight from $EXPECTED_ORIGIN allowed (HTTP $preflight_status)"

# 3. /api/v1/auth/register must be reachable and a public POST must not be
#    rejected by auth. A 4xx (validation) is fine; a 401/403 means the route
#    is incorrectly protected.
register_status=$(curl -s -o /dev/null -w "%{http_code}" \
  -X POST "$GATEWAY_URL/api/v1/auth/register" \
  -H "Content-Type: application/json" \
  -H "Origin: $EXPECTED_ORIGIN" \
  -d '{}')

if [ "$register_status" = "401" ] || [ "$register_status" = "403" ]; then
  echo "✗ FAIL: POST /api/v1/auth/register returned HTTP $register_status."
  echo "  The register endpoint is incorrectly protected — it must be public."
  exit 1
fi

echo "✓ POST /api/v1/auth/register is public (HTTP $register_status — expected 201/400/409/429)"

echo "✅ Gateway ownership check passed."
