#!/usr/bin/env bash
# Bootstrap: ensure the initial admin user exists and is promoted to role=admin.
# Idempotent — safe to run repeatedly.
#
# Usage:
#   ADMIN_EMAIL=admin@ecommerce.local ADMIN_PASSWORD='Admin123!Change-me' bash scripts/seed.sh
#
# Requires: auth service running AND gateway reachable. Defaults match .env.example.

set -euo pipefail

ADMIN_EMAIL="${ADMIN_EMAIL:-admin@ecommerce.local}"
ADMIN_PASSWORD="${ADMIN_PASSWORD:-Admin123!Change-me}"
BASE_URL="${BASE_URL:-http://localhost:3000}"

echo "▶ Ensuring admin exists at $ADMIN_EMAIL"

# Register (idempotent: 409 is fine — user already exists)
register_code=$(curl -s -o /tmp/seed-register.json -w "%{http_code}" \
  -X POST "$BASE_URL/api/v1/auth/register" \
  -H 'Content-Type: application/json' \
  -d "$(jq -n --arg email "$ADMIN_EMAIL" --arg pw "$ADMIN_PASSWORD" --arg u admin_$(date +%s) \
      '{email:$email, password:$pw, username:$u, firstName:"Site", lastName:"Admin", phone:""}')")
echo "  register: HTTP $register_code"

# Login
login_json=$(curl -s -X POST "$BASE_URL/api/v1/auth/login" \
  -H 'Content-Type: application/json' \
  -d "$(jq -n --arg email "$ADMIN_EMAIL" --arg pw "$ADMIN_PASSWORD" '{email:$email, password:$pw}')")
TOKEN=$(echo "$login_json" | jq -r '.data.accessToken // .data.access_token // empty')

if [ -z "$TOKEN" ] || [ "$TOKEN" = "null" ]; then
  echo "  login: failed"
  echo "$login_json" | jq . || true
  exit 1
fi
echo "  login: ✓"

# Verify admin role
me=$(curl -s "$BASE_URL/api/v1/auth/me" -H "Authorization: Bearer $TOKEN")
role=$(echo "$me" | jq -r '.data.role // empty')
echo "  /me role: $role"

if [ "$role" != "admin" ]; then
  echo "  role is not admin. Check that ADMIN_EMAIL in auth/.env matches the registered email."
  echo "  The auth service auto-promotes users whose email matches config.admin.email."
  exit 2
fi

echo "✔ admin user is ready"
echo "  email:    $ADMIN_EMAIL"
echo "  password: $ADMIN_PASSWORD"
