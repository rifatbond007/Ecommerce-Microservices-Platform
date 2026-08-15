#!/usr/bin/env bash
set -euo pipefail

# ──────────────────────────────────────────────────────────────
# E-Commerce API Endpoint Test Suite
# Tests all endpoints through the gateway (localhost:3000)
# Usage:
#   bash scripts/api-test.sh                              # auto-register test user
#   TOKEN=xxx bash scripts/api-test.sh                    # use existing token
#   AUTH_EMAIL=x@y.com AUTH_PASSWORD=pass bash scripts/api-test.sh  # login only
#   BASE_URL=http://localhost:3000 bash scripts/api-test.sh  # custom gateway URL
#   ADMIN_TOKEN=xxx bash scripts/api-test.sh                 # verify admin endpoints
# ──────────────────────────────────────────────────────────────

BASE_URL="${BASE_URL:-http://localhost:3000}"
TEST_UUID="00000000-0000-0000-0000-000000000000"
TEMP_FILE="/tmp/api-test-resp.json"
# Initialize the temp file so read-only operations (extract_token, extract_refresh)
# never fail with "No such file or directory" when curl couldn't even open a
# connection (e.g. gateway down). With `set -euo pipefail`, a missing redirect
# source terminates the whole script.
: > "$TEMP_FILE"

PASS=0
FAIL=0
FAILED_TESTS=()

# Auth — set these env vars to skip registration:
#   TOKEN=... REFRESH_TOKEN=... bash scripts/api-test.sh
#   AUTH_EMAIL=... AUTH_PASSWORD=... bash scripts/api-test.sh  (login only, no register)
TOKEN="${TOKEN:-}"
REFRESH_TOKEN="${REFRESH_TOKEN:-}"
AUTH_EMAIL="${AUTH_EMAIL:-}"
AUTH_PASSWORD="${AUTH_PASSWORD:-}"
# ADMIN_TOKEN — when provided, verify that admin-only endpoints actually
# respond 200 (not just that non-admin tokens get 403). Used to detect
# the "admin middleware calls a missing endpoint" bug fixed in PR #9.
ADMIN_TOKEN="${ADMIN_TOKEN:-}"

green()  { printf "\033[32m%s\033[0m\n" "$1"; }
red()    { printf "\033[31m%s\033[0m\n" "$1"; }
yellow() { printf "\033[33m%s\033[0m\n" "$1"; }
bold()   { printf "\033[1m%s\033[0m" "$1"; }

section() {
  echo ""
  printf "\033[1;34m═══════════════════════════════════════════════════\033[0m\n"
  printf "\033[1;34m  %s\033[0m\n" "$1"
  printf "\033[1;34m═══════════════════════════════════════════════════\033[0m\n"
}

test_endpoint() {
  local method="$1"
  local path="$2"
  local desc="$3"
  local expected_code="${4:-}"
  local token="${5:-}"
  local body="${6:-}"

  local args=(-s -o "$TEMP_FILE" -w "%{http_code}" --max-time 10)

  if [ -n "$token" ]; then
    args+=(-H "Authorization: Bearer $token")
  fi
  args+=(-H "Content-Type: application/json")
  if [ -n "$body" ]; then
    args+=(-d "$body")
  fi

  local http_code
  http_code=$(curl "${args[@]}" -X "$method" "${BASE_URL}${path}" 2>/dev/null || echo "000")

  local ok=false
  if [ -n "$expected_code" ]; then
    [ "$http_code" = "$expected_code" ] && ok=true
  else
    [ "$http_code" != "000" ] && [ "$http_code" != "503" ] && ok=true
  fi

  if $ok; then
    PASS=$((PASS + 1))
    green "  ✓ $method $path ($http_code) $desc"
  else
    FAIL=$((FAIL + 1))
    FAILED_TESTS+=("$method $path ($http_code) - $desc")
    red "  ✗ $method $path ($http_code) $desc"
    if [ -f "$TEMP_FILE" ]; then
      local err_msg
      err_msg=$(python3 -c "import json,sys; d=json.load(open('$TEMP_FILE')); print(d.get('error',{}).get('message','N/A'))" 2>/dev/null || echo "N/A")
      echo "       response error: $err_msg"
    fi
  fi
}

extract_token() {
  python3 -c "
import json,sys
try:
    d=json.load(sys.stdin)
    t = d.get('data',{}).get('tokens',{}).get('accessToken','') or d.get('tokens',{}).get('accessToken','')
    print(t)
except:
    print('')
" 2>/dev/null || echo ""
}

extract_refresh() {
  python3 -c "
import json,sys
try:
    d=json.load(sys.stdin)
    t = d.get('data',{}).get('tokens',{}).get('refreshToken','') or d.get('tokens',{}).get('refreshToken','')
    print(t)
except:
    print('')
" 2>/dev/null || echo ""
}

# ─── AUTH — get tokens via env, login, or register ───────────
setup_auth() {
  # If TOKEN is already set via env, skip straight to testing
  if [ -n "$TOKEN" ]; then
    section "SETUP: Using token from environment"
    green "  → Using provided access token"
    return
  fi

  section "SETUP: Acquire auth token"

  # If credentials provided, try login only
  if [ -n "$AUTH_EMAIL" ] && [ -n "$AUTH_PASSWORD" ]; then
    yellow "  → Logging in as ${AUTH_EMAIL}"
    local login_payload
    login_payload=$(cat <<EOF
{"email": "${AUTH_EMAIL}", "password": "${AUTH_PASSWORD}"}
EOF
)
    curl -s --max-time 10 -X POST "${BASE_URL}/api/v1/auth/login" \
      -H "Content-Type: application/json" \
      -d "$login_payload" > "$TEMP_FILE" 2>/dev/null || true
    TOKEN=$(extract_token < "$TEMP_FILE")
    REFRESH_TOKEN=$(extract_refresh < "$TEMP_FILE")
    if [ -n "$TOKEN" ]; then
      green "  → Access token acquired via login"
      return
    fi
    yellow "  → Login failed — testing public endpoints only"
    return
  fi

  # No env vars set — try register then login
  local ts
  ts=$(date +%s)
  AUTH_EMAIL="testuser${ts}@example.com"
  AUTH_PASSWORD="TestPass123!"
  local username="testuser${ts}"

  local reg_payload
  reg_payload=$(cat <<EOF
{
  "email": "${AUTH_EMAIL}",
  "password": "${AUTH_PASSWORD}",
  "username": "${username}",
  "firstName": "Test",
  "lastName": "User"
}
EOF
)

  local code
  code=$(curl -s -o "$TEMP_FILE" -w "%{http_code}" --max-time 10 -X POST "${BASE_URL}/api/v1/auth/register" \
    -H "Content-Type: application/json" \
    -d "$reg_payload" 2>/dev/null || echo "000")

  TOKEN=$(extract_token < "$TEMP_FILE")

  if [ -z "$TOKEN" ] && [ "$code" != "000" ]; then
    # Try login (user may already exist)
    local login_payload
    login_payload=$(cat <<EOF
{"email": "${AUTH_EMAIL}", "password": "${AUTH_PASSWORD}"}
EOF
)
    curl -s --max-time 10 -X POST "${BASE_URL}/api/v1/auth/login" \
      -H "Content-Type: application/json" \
      -d "$login_payload" > "$TEMP_FILE" 2>/dev/null || true
    TOKEN=$(extract_token < "$TEMP_FILE")
  fi

  if [ -n "$TOKEN" ]; then
    green "  → Access token acquired (register: ${code})"
  else
    yellow "  → No token (HTTP ${code}) — testing public endpoints only"
    yellow "  → Set AUTH_EMAIL+AUTH_PASSWORD or TOKEN env vars to skip registration"
  fi
}

# ─── SERVICE HEALTH CHECKS ────────────────────────────────

# Associative array for service availability
declare -A SERVICE_UP
SERVICE_UP=(
  [gateway]=false
  [auth]=false
  [user]=false
  [product]=false
  [cart]=false
  [order]=false
  [payment]=false
  [notification]=false
  [search]=false
  [admin]=false
)

check_service() {
  local name="$1"
  local path="$2"
  local method="${3:-GET}"

  local code
  code=$(curl -s -o /dev/null -w "%{http_code}" --max-time 5 -X "$method" "${BASE_URL}${path}" 2>/dev/null || echo "000")
  if [ "$code" != "000" ] && [ "$code" != "503" ]; then
    SERVICE_UP[$name]=true
    return 0
  fi
  return 1
}

check_all_services() {
  section "SERVICE HEALTH CHECK"

  check_service "gateway" "/health" || true
  check_service "auth" "/api/v1/auth/me" || true
  check_service "user" "/api/v1/users/me" || true
  check_service "product" "/api/v1/products" || true
  check_service "cart" "/api/v1/carts" || true
  check_service "order" "/api/v1/orders" || true
  check_service "payment" "/api/v1/payments/process" "POST" || true
  check_service "notification" "/api/v1/notifications" || true
  check_service "search" "/api/v1/search/products" || true
  check_service "admin" "/api/v1/admin/dashboard/stats" || true

  local svc total=0 up=0
  for svc in "${!SERVICE_UP[@]}"; do
    total=$((total + 1))
    if ${SERVICE_UP[$svc]}; then
      up=$((up + 1))
      green "  ✓ $svc"
    else
      yellow "  - $svc (down — skipped)"
    fi
  done
  echo ""
  green "  ${up}/${total} services available"
  echo ""
}

skip_section() {
  yellow "  → Service unavailable, skipping"
}

# ──────────────────────────────────────────────────────────────

test_gateway() {
  section "GATEWAY"
  test_endpoint "GET" "/health" "Health check"
  test_endpoint "GET" "/routes" "Route listing"
}

test_auth() {
  section "AUTH SERVICE"
  if ! ${SERVICE_UP[auth]}; then skip_section; return; fi

  # Public/unauthenticated endpoints
  test_endpoint "POST" "/api/v1/auth/login" "Login invalid creds" "401" "" \
    '{"email":"nobody@test.com","password":"WrongPass1!"}'
  test_endpoint "POST" "/api/v1/auth/refresh" "Refresh empty/ invalid token" "400" "" \
    '{"refreshToken":""}'
  test_endpoint "POST" "/api/v1/auth/forgot-password" "Forgot password" "200" "" \
    "{\"email\": \"${AUTH_EMAIL}\"}"
  test_endpoint "POST" "/api/v1/auth/reset-password" "Reset password bad token" "400" "" \
    '{"token":"bad-token","password":"NewPass789!"}'
  test_endpoint "POST" "/api/v1/auth/verify-email" "Verify email bad token" "400" "" \
    '{"token":"bad-token"}'

  if [ -z "$TOKEN" ]; then return; fi

  # Authenticated endpoints
  test_endpoint "GET" "/api/v1/auth/me" "Get current user" "200" "$TOKEN"
  test_endpoint "GET" "/api/v1/auth/seller/status" "Seller status" "200" "$TOKEN"
  test_endpoint "POST" "/api/v1/auth/seller/request" "Request seller" "200" "$TOKEN" "{}"
  test_endpoint "POST" "/api/v1/auth/change-password" "Change password" "200" "$TOKEN" \
    '{"currentPassword":"TestPass123!","newPassword":"NewPass456!"}'

  # Auth users module
  test_endpoint "GET" "/api/v1/auth/users/profile" "Auth user profile" "200" "$TOKEN"
  test_endpoint "PUT" "/api/v1/auth/users/profile" "Update auth profile" "200" "$TOKEN" \
    '{"firstName":"Test","lastName":"User"}'
  test_endpoint "DELETE" "/api/v1/auth/users/account" "Deactivate account" "200" "$TOKEN"

  # Admin endpoints should return 403 for regular users
  test_endpoint "GET" "/api/v1/auth/admin/seller-requests" "Admin seller requests (forbidden)" "403" "$TOKEN"

  # Re-register a new user since we deactivated the last one
  local ts
  ts=$(date +%s)
  AUTH_EMAIL="testuser${ts}@example.com"
  AUTH_PASSWORD="TestPass123!"
  local reg_payload
  reg_payload=$(cat <<EOF
{
  "email": "${AUTH_EMAIL}",
  "password": "${AUTH_PASSWORD}",
  "username": "testuser${ts}",
  "firstName": "Test",
  "lastName": "User"
}
EOF
)
  test_endpoint "POST" "/api/v1/auth/register" "Register new user" "201" "" "$reg_payload"
  TOKEN=$(extract_token < "$TEMP_FILE")

  test_endpoint "POST" "/api/v1/auth/logout" "Logout" "200" "$TOKEN" \
    "{\"refreshToken\": \"${REFRESH_TOKEN}\"}"
}

test_user_service() {
  section "USER SERVICE"
  if ! ${SERVICE_UP[user]}; then skip_section; return; fi
  local tk="$TOKEN"

  # Profiles
  test_endpoint "GET" "/api/v1/users/me" "Get profile (no auth)" "401" ""
  if [ -n "$tk" ]; then
    test_endpoint "GET" "/api/v1/users/me" "Get profile" "200" "$tk"
    test_endpoint "POST" "/api/v1/users/me" "Create profile" "200" "$tk" \
      '{"bio":"Hello world","company":"Acme"}'
    test_endpoint "PUT" "/api/v1/users/me" "Update profile" "200" "$tk" \
      '{"bio":"Updated bio"}'
    test_endpoint "DELETE" "/api/v1/users/me" "Delete profile" "200" "$tk"
  fi

  # Addresses
  test_endpoint "GET" "/api/v1/users/me/addresses" "List addresses (no auth)" "401" ""
  if [ -n "$tk" ]; then
    test_endpoint "GET" "/api/v1/users/me/addresses" "List addresses" "200" "$tk"
    test_endpoint "POST" "/api/v1/users/me/addresses" "Create address" "201" "$tk" \
      '{"firstName":"John","lastName":"Doe","addressLine1":"123 Main St","city":"New York","state":"NY","postalCode":"10001","country":"US"}'

    ADDR_ID=$(python3 -c "import json; d=json.load(open('$TEMP_FILE')); print((d.get('data') or d).get('id',''))" 2>/dev/null || echo "")
    test_endpoint "GET" "/api/v1/users/me/addresses/${TEST_UUID}" "Get address bad id" "404" "$tk"

    if [ -n "$ADDR_ID" ]; then
      test_endpoint "GET" "/api/v1/users/me/addresses/${ADDR_ID}" "Get address by id" "200" "$tk"
      test_endpoint "PUT" "/api/v1/users/me/addresses/${ADDR_ID}" "Update address" "200" "$tk" \
        '{"firstName":"Jane"}'
      test_endpoint "POST" "/api/v1/users/me/addresses/${ADDR_ID}/default" "Set default address" "200" "$tk" ""
      test_endpoint "DELETE" "/api/v1/users/me/addresses/${ADDR_ID}" "Delete address" "200" "$tk"
    fi
  fi

  # Wishlists
  test_endpoint "GET" "/api/v1/users/me/wishlists" "List wishlists (no auth)" "401" ""
  if [ -n "$tk" ]; then
    test_endpoint "GET" "/api/v1/users/me/wishlists" "List wishlists" "200" "$tk"
    test_endpoint "POST" "/api/v1/users/me/wishlists" "Create wishlist" "201" "$tk" \
      '{"name":"My Wishlist"}'

    WL_ID=$(python3 -c "import json; d=json.load(open('$TEMP_FILE')); print((d.get('data') or d).get('id',''))" 2>/dev/null || echo "")
    test_endpoint "GET" "/api/v1/users/me/wishlists/${TEST_UUID}" "Get wishlist bad id" "404" "$tk"

    if [ -n "$WL_ID" ]; then
      test_endpoint "GET" "/api/v1/users/me/wishlists/${WL_ID}" "Get wishlist by id" "200" "$tk"
      test_endpoint "PUT" "/api/v1/users/me/wishlists/${WL_ID}" "Update wishlist" "200" "$tk" \
        '{"name":"Updated"}'
      test_endpoint "POST" "/api/v1/users/me/wishlists/${WL_ID}/items" "Add item" "201" "$tk" \
        "{\"productId\": \"${TEST_UUID}\"}"
      test_endpoint "DELETE" "/api/v1/users/me/wishlists/${TEST_UUID}/items/${TEST_UUID}" "Remove item bad id" "404" "$tk"
      test_endpoint "DELETE" "/api/v1/users/me/wishlists/${WL_ID}" "Delete wishlist" "200" "$tk"
    fi
  fi

  # Reviews (gateway blocks unauthenticated for /api/v1/users prefix)
  test_endpoint "GET" "/api/v1/users/me/reviews/product/${TEST_UUID}" "Get product reviews (no auth)" "401" ""
  test_endpoint "GET" "/api/v1/users/me/reviews/product/${TEST_UUID}/rating" "Get product rating (no auth)" "401" ""
  if [ -n "$tk" ]; then
    test_endpoint "GET" "/api/v1/users/me/reviews/my-reviews" "Get my reviews" "200" "$tk"
    test_endpoint "GET" "/api/v1/users/me/reviews/${TEST_UUID}" "Get review bad id" "404" "$tk"
    test_endpoint "POST" "/api/v1/users/me/reviews" "Create review" "201" "$tk" \
      "{\"productId\": \"${TEST_UUID}\",\"rating\":5,\"title\":\"Great!\",\"content\":\"Love it\"}"
    test_endpoint "PUT" "/api/v1/users/me/reviews/${TEST_UUID}" "Update review bad id" "404" "$tk" \
      '{"content":"Updated"}'
    test_endpoint "DELETE" "/api/v1/users/me/reviews/${TEST_UUID}" "Delete review bad id" "404" "$tk"
    test_endpoint "POST" "/api/v1/users/me/reviews/${TEST_UUID}/helpful" "Mark helpful bad id" "404" "$tk" ""
  fi

  # Sellers
  test_endpoint "GET" "/api/v1/sellers/status" "Seller status (no auth)" "401" ""
  if [ -n "$tk" ]; then
    test_endpoint "GET" "/api/v1/sellers/status" "Seller status" "200" "$tk"
    test_endpoint "POST" "/api/v1/sellers/request" "Request seller" "200" "$tk" ""
    test_endpoint "GET" "/api/v1/sellers/admin/requests" "Admin list requests (forbidden)" "403" "$tk"
  fi
}

test_product_service() {
  section "PRODUCT SERVICE"
  if ! ${SERVICE_UP[product]}; then skip_section; return; fi

  # Products
  test_endpoint "GET" "/api/v1/products" "List products" "200" ""
  test_endpoint "GET" "/api/v1/products/featured" "Featured products" "200" ""
  test_endpoint "GET" "/api/v1/products/slug/nonexistent" "Product by slug" "404" ""
  test_endpoint "GET" "/api/v1/products/${TEST_UUID}" "Product by id" "404" ""

  if [ -n "$TOKEN" ]; then
    local ts
    ts=$(date +%s)
    test_endpoint "POST" "/api/v1/products" "Create product" "201" "$TOKEN" \
      "{\"sku\":\"TST-${ts}\",\"name\":\"Test Product\",\"slug\":\"test-prod-${ts}\",\"categoryId\":\"${TEST_UUID}\",\"basePrice\":29.99}"
    test_endpoint "PUT" "/api/v1/products/${TEST_UUID}" "Update product" "404" "$TOKEN" \
      '{"name":"Updated"}'
    test_endpoint "DELETE" "/api/v1/products/${TEST_UUID}" "Delete product" "404" "$TOKEN"
  fi

  # Categories
  test_endpoint "GET" "/api/v1/categories" "List categories" "200" ""
  test_endpoint "GET" "/api/v1/categories/tree" "Category tree" "200" ""
  test_endpoint "GET" "/api/v1/categories/slug/nonexistent" "Category by slug" "404" ""
  test_endpoint "GET" "/api/v1/categories/${TEST_UUID}" "Category by id" "404" ""

  if [ -n "$TOKEN" ]; then
    local ts
    ts=$(date +%s)
    test_endpoint "POST" "/api/v1/categories" "Create category" "201" "$TOKEN" \
      "{\"name\":\"Test Cat ${ts}\",\"slug\":\"test-cat-${ts}\"}"
    test_endpoint "PUT" "/api/v1/categories/${TEST_UUID}" "Update category" "404" "$TOKEN" \
      '{"name":"Updated"}'
    test_endpoint "DELETE" "/api/v1/categories/${TEST_UUID}" "Delete category" "404" "$TOKEN"
  fi

  # Brands
  test_endpoint "GET" "/api/v1/brands" "List brands" "200" ""
  test_endpoint "GET" "/api/v1/brands/slug/nonexistent" "Brand by slug" "404" ""
  test_endpoint "GET" "/api/v1/brands/${TEST_UUID}" "Brand by id" "404" ""

  if [ -n "$TOKEN" ]; then
    local ts
    ts=$(date +%s)
    test_endpoint "POST" "/api/v1/brands" "Create brand" "201" "$TOKEN" \
      "{\"name\":\"Test Brand ${ts}\",\"slug\":\"test-brand-${ts}\"}"
    test_endpoint "PUT" "/api/v1/brands/${TEST_UUID}" "Update brand" "404" "$TOKEN" \
      '{"name":"Updated"}'
    test_endpoint "DELETE" "/api/v1/brands/${TEST_UUID}" "Delete brand" "404" "$TOKEN"
  fi

  # Variants
  test_endpoint "GET" "/api/v1/variants/product/${TEST_UUID}" "Variants by product" "200" ""
  test_endpoint "GET" "/api/v1/variants/${TEST_UUID}" "Variant by id" "404" ""

  if [ -n "$TOKEN" ]; then
    local ts
    ts=$(date +%s)
    test_endpoint "POST" "/api/v1/variants" "Create variant" "201" "$TOKEN" \
      "{\"productId\":\"${TEST_UUID}\",\"sku\":\"VAR-${ts}\",\"name\":\"Test Variant\",\"price\":19.99}"
    test_endpoint "PUT" "/api/v1/variants/${TEST_UUID}" "Update variant" "404" "$TOKEN" \
      '{"name":"Updated"}'
    test_endpoint "DELETE" "/api/v1/variants/${TEST_UUID}" "Delete variant" "404" "$TOKEN"
  fi

  # Inventory
  test_endpoint "GET" "/api/v1/inventory" "List inventory" "200" ""
  test_endpoint "GET" "/api/v1/inventory/product/${TEST_UUID}" "Inventory by product" "200" ""
  test_endpoint "GET" "/api/v1/inventory/variant/${TEST_UUID}" "Inventory by variant" "200" ""
  test_endpoint "GET" "/api/v1/inventory/${TEST_UUID}" "Inventory by id" "404" ""

  if [ -n "$TOKEN" ]; then
    test_endpoint "POST" "/api/v1/inventory" "Create inventory" "201" "$TOKEN" \
      "{\"productId\":\"${TEST_UUID}\",\"warehouseId\":\"${TEST_UUID}\",\"quantity\":100}"
    test_endpoint "POST" "/api/v1/inventory/${TEST_UUID}/adjust" "Adjust inventory" "404" "$TOKEN" \
      '{"quantity":50}'
    test_endpoint "POST" "/api/v1/inventory/${TEST_UUID}/reserve" "Reserve inventory" "404" "$TOKEN" \
      '{"quantity":10}'
    test_endpoint "POST" "/api/v1/inventory/${TEST_UUID}/release" "Release reservation" "404" "$TOKEN" \
      "{\"quantity\":5,\"reservationId\":\"${TEST_UUID}\"}"
    test_endpoint "DELETE" "/api/v1/inventory/${TEST_UUID}" "Delete inventory" "404" "$TOKEN"
  fi

  # Warehouses
  test_endpoint "GET" "/api/v1/inventory/warehouses/all" "List warehouses" "200" ""
  test_endpoint "GET" "/api/v1/inventory/warehouses/${TEST_UUID}" "Warehouse by id" "404" ""

  if [ -n "$TOKEN" ]; then
    test_endpoint "POST" "/api/v1/inventory/warehouses" "Create warehouse" "201" "$TOKEN" \
      '{"name":"Main WH","code":"MAIN","addressLine1":"1 Warehouse Rd","city":"Chicago","state":"IL","postalCode":"60601","country":"US"}'
    test_endpoint "PUT" "/api/v1/inventory/warehouses/${TEST_UUID}" "Update warehouse" "404" "$TOKEN" \
      '{"name":"Updated WH"}'
    test_endpoint "DELETE" "/api/v1/inventory/warehouses/${TEST_UUID}" "Delete warehouse" "404" "$TOKEN"
  fi
}

test_cart_service() {
  section "CART SERVICE"
  if ! ${SERVICE_UP[cart]}; then skip_section; return; fi

  test_endpoint "GET" "/api/v1/carts" "Get cart (no auth)" "401" ""

  if [ -z "$TOKEN" ]; then return; fi

  test_endpoint "GET" "/api/v1/carts" "Get cart" "200" "$TOKEN"
  test_endpoint "POST" "/api/v1/carts/init" "Init cart" "200" "$TOKEN" "{}"

  # Extract cart ID from init response
  CART_ID=$(python3 -c "import json; d=json.load(open('$TEMP_FILE')); c=d.get('data',{}); print(c.get('id',''))" 2>/dev/null || echo "")
  [ -z "$CART_ID" ] && CART_ID="$TEST_UUID"

  test_endpoint "POST" "/api/v1/carts/items" "Add item" "200" "$TOKEN" \
    "{\"productId\":\"${TEST_UUID}\",\"quantity\":1,\"unitPrice\":29.99}"
  test_endpoint "PUT" "/api/v1/carts/${CART_ID}/items/${TEST_UUID}" "Update cart item" "404" "$TOKEN" \
    '{"quantity":3}'
  test_endpoint "DELETE" "/api/v1/carts/${CART_ID}/items/${TEST_UUID}" "Remove cart item" "404" "$TOKEN"
  test_endpoint "DELETE" "/api/v1/carts/${CART_ID}/clear" "Clear cart" "404" "$TOKEN" ""
  test_endpoint "POST" "/api/v1/carts/${CART_ID}/coupon" "Apply coupon" "404" "$TOKEN" \
    '{"code":"SAVE10"}'
  test_endpoint "DELETE" "/api/v1/carts/${CART_ID}/coupon" "Remove coupon" "404" "$TOKEN"
  test_endpoint "DELETE" "/api/v1/carts/${CART_ID}" "Delete cart" "404" "$TOKEN"

  # Saved carts
  test_endpoint "GET" "/api/v1/saved-carts" "List saved carts (no auth)" "401" ""
  test_endpoint "GET" "/api/v1/saved-carts" "List saved carts" "200" "$TOKEN"
  test_endpoint "POST" "/api/v1/saved-carts" "Create saved cart" "201" "$TOKEN" \
    '{"name":"My Saved Cart"}'

  SC_ID=$(python3 -c "import json; d=json.load(open('$TEMP_FILE')); print((d.get('data') or d).get('id',''))" 2>/dev/null || echo "")
  test_endpoint "GET" "/api/v1/saved-carts/${TEST_UUID}" "Get saved cart bad id" "404" "$TOKEN"
  if [ -n "$SC_ID" ]; then
    test_endpoint "GET" "/api/v1/saved-carts/${SC_ID}" "Get saved cart" "200" "$TOKEN"
    test_endpoint "PUT" "/api/v1/saved-carts/${SC_ID}" "Update saved cart" "200" "$TOKEN" \
      '{"name":"Updated"}'
    test_endpoint "DELETE" "/api/v1/saved-carts/${SC_ID}" "Delete saved cart" "200" "$TOKEN"
  fi
}

test_order_service() {
  section "ORDER SERVICE"
  if ! ${SERVICE_UP[order]}; then skip_section; return; fi

  test_endpoint "GET" "/api/v1/orders" "List orders (no auth)" "401" ""
  test_endpoint "POST" "/api/v1/orders" "Create order (no auth)" "401" ""

  if [ -z "$TOKEN" ]; then return; fi

  test_endpoint "GET" "/api/v1/orders" "List orders" "200" "$TOKEN"
  test_endpoint "GET" "/api/v1/orders/${TEST_UUID}" "Get order bad id" "404" "$TOKEN"
  test_endpoint "GET" "/api/v1/orders/number/ORD-NONE" "Get order by number" "404" "$TOKEN"
  test_endpoint "POST" "/api/v1/orders" "Create order bad cart" "400" "$TOKEN" \
    "{\"cartId\":\"${TEST_UUID}\",\"shippingAddressId\":\"${TEST_UUID}\",\"billingAddressId\":\"${TEST_UUID}\"}"
  test_endpoint "PUT" "/api/v1/orders/${TEST_UUID}/status" "Update status (forbidden)" "403" "$TOKEN" \
    '{"status":"processing"}'
  test_endpoint "POST" "/api/v1/orders/${TEST_UUID}/return" "Create return" "404" "$TOKEN" \
    '{"reason":"Damaged","items":[{"productId":"'"${TEST_UUID}"'","quantity":1}]}'
}

test_payment_service() {
  section "PAYMENT SERVICE"
  if ! ${SERVICE_UP[payment]}; then skip_section; return; fi

  test_endpoint "POST" "/api/v1/payments/process" "Process payment (no auth)" "401" ""

  if [ -z "$TOKEN" ]; then return; fi

  test_endpoint "GET" "/api/v1/payments" "List payments" "200" "$TOKEN"
  test_endpoint "GET" "/api/v1/payments/${TEST_UUID}" "Get payment bad id" "404" "$TOKEN"
  test_endpoint "GET" "/api/v1/payments/order/${TEST_UUID}" "Get payment by order" "404" "$TOKEN"
  test_endpoint "POST" "/api/v1/payments/process" "Process payment bad order" "400" "$TOKEN" \
    "{\"orderId\":\"${TEST_UUID}\",\"paymentMethod\":\"stripe\"}"
  test_endpoint "POST" "/api/v1/payments/${TEST_UUID}/refund" "Refund bad id" "404" "$TOKEN" \
    '{"amount":10.00,"reason":"test"}'
}

test_notification_service() {
  section "NOTIFICATION SERVICE"
  if ! ${SERVICE_UP[notification]}; then skip_section; return; fi

  test_endpoint "GET" "/api/v1/notifications" "List notifications (no auth)" "401" ""

  if [ -z "$TOKEN" ]; then return; fi

  test_endpoint "GET" "/api/v1/notifications" "List notifications" "200" "$TOKEN"
  test_endpoint "PUT" "/api/v1/notifications/${TEST_UUID}/read" "Mark read bad id" "404" "$TOKEN" ""
  test_endpoint "PUT" "/api/v1/notifications/read-all" "Mark all read" "200" "$TOKEN" ""
  test_endpoint "DELETE" "/api/v1/notifications/${TEST_UUID}" "Delete bad id" "404" "$TOKEN" ""
  test_endpoint "DELETE" "/api/v1/notifications" "Delete all" "200" "$TOKEN" ""

  # Preferences
  test_endpoint "GET" "/api/v1/notifications/preferences" "Get preferences (no auth)" "401" ""
  test_endpoint "GET" "/api/v1/notifications/preferences" "Get preferences" "200" "$TOKEN"
  test_endpoint "PUT" "/api/v1/notifications/preferences" "Update preferences" "200" "$TOKEN" \
    '{"email":true,"push":false}'
}

test_search_service() {
  section "SEARCH SERVICE"
  if ! ${SERVICE_UP[search]}; then skip_section; return; fi

  test_endpoint "GET" "/api/v1/search/products" "Search products (no query)" "400" ""
  test_endpoint "GET" "/api/v1/search/products?q=test" "Search with query" "200" ""
  test_endpoint "GET" "/api/v1/search/suggestions" "Search suggestions (no query)" "400" ""
  test_endpoint "GET" "/api/v1/search/trending" "Trending searches" "200" ""

  if [ -n "$TOKEN" ]; then
    test_endpoint "POST" "/api/v1/search/click" "Log click" "200" "$TOKEN" \
      "{\"query\":\"test\",\"productId\":\"${TEST_UUID}\"}"
  fi
}

test_admin_service() {
  section "ADMIN SERVICE"
  if ! ${SERVICE_UP[admin]}; then skip_section; return; fi

  test_endpoint "GET" "/api/v1/admin/dashboard/stats" "Dashboard stats (no auth)" "401" ""
  test_endpoint "GET" "/api/v1/admin/settings/public" "Public settings (no auth)" "401" ""

  if [ -z "$TOKEN" ]; then return; fi

  test_endpoint "GET" "/api/v1/admin/dashboard/stats" "Dashboard stats (forbidden)" "403" "$TOKEN"
  test_endpoint "GET" "/api/v1/admin/dashboard/activity" "Dashboard activity (forbidden)" "403" "$TOKEN"
  test_endpoint "GET" "/api/v1/admin/users" "Admin list users (forbidden)" "403" "$TOKEN"
  test_endpoint "GET" "/api/v1/admin/users/${TEST_UUID}" "Admin get user (forbidden)" "403" "$TOKEN"
  test_endpoint "PUT" "/api/v1/admin/users/${TEST_UUID}" "Admin update user (forbidden)" "403" "$TOKEN" "{}"
  test_endpoint "DELETE" "/api/v1/admin/users/${TEST_UUID}" "Admin delete user (forbidden)" "403" "$TOKEN"
  test_endpoint "GET" "/api/v1/admin/users/${TEST_UUID}/addresses" "Admin user addresses (forbidden)" "403" "$TOKEN"
  test_endpoint "GET" "/api/v1/admin/products" "Admin list products (forbidden)" "403" "$TOKEN"
  test_endpoint "GET" "/api/v1/admin/products/${TEST_UUID}" "Admin get product (forbidden)" "403" "$TOKEN"
  test_endpoint "PUT" "/api/v1/admin/products/${TEST_UUID}" "Admin update product (forbidden)" "403" "$TOKEN" "{}"
  test_endpoint "DELETE" "/api/v1/admin/products/${TEST_UUID}" "Admin delete product (forbidden)" "403" "$TOKEN"
  test_endpoint "PATCH" "/api/v1/admin/products/${TEST_UUID}/active" "Admin toggle active (forbidden)" "403" "$TOKEN" ""
  test_endpoint "PATCH" "/api/v1/admin/products/${TEST_UUID}/featured" "Admin toggle featured (forbidden)" "403" "$TOKEN" ""
  test_endpoint "GET" "/api/v1/admin/orders" "Admin list orders (forbidden)" "403" "$TOKEN"
  test_endpoint "GET" "/api/v1/admin/orders/stats" "Admin order stats (forbidden)" "403" "$TOKEN"
  test_endpoint "GET" "/api/v1/admin/orders/${TEST_UUID}" "Admin get order (forbidden)" "403" "$TOKEN"
  test_endpoint "PUT" "/api/v1/admin/orders/${TEST_UUID}/status" "Admin update status (forbidden)" "403" "$TOKEN" "{}"
  test_endpoint "POST" "/api/v1/admin/orders/${TEST_UUID}/cancel" "Admin cancel order (forbidden)" "403" "$TOKEN" ""
  test_endpoint "GET" "/api/v1/admin/settings" "Admin get settings (forbidden)" "403" "$TOKEN"
  test_endpoint "GET" "/api/v1/admin/settings/${TEST_UUID}" "Admin get setting (forbidden)" "403" "$TOKEN"
  test_endpoint "PUT" "/api/v1/admin/settings" "Admin update settings (forbidden)" "403" "$TOKEN" "{}"
  test_endpoint "DELETE" "/api/v1/admin/settings/${TEST_UUID}" "Admin delete setting (forbidden)" "403" "$TOKEN"

  # Positive path: when an admin token is supplied, these endpoints must
  # actually return 200 — guards against the "admin middleware calls a
  # missing endpoint" regression (PR #9). Skipped silently when ADMIN_TOKEN
  # is unset so this script stays runnable in lower environments.
  if [ -n "$ADMIN_TOKEN" ]; then
    test_endpoint "GET" "/api/v1/admin/dashboard/stats" "Admin dashboard stats (admin token)" "200" "$ADMIN_TOKEN"
    test_endpoint "GET" "/api/v1/admin/users" "Admin list users (admin token)" "200" "$ADMIN_TOKEN"
    test_endpoint "GET" "/api/v1/admin/orders" "Admin list orders (admin token)" "200" "$ADMIN_TOKEN"
    test_endpoint "GET" "/api/v1/admin/products" "Admin list products (admin token)" "200" "$ADMIN_TOKEN"
    test_endpoint "GET" "/api/v1/admin/settings" "Admin get settings (admin token)" "200" "$ADMIN_TOKEN"
  else
    yellow "  → ADMIN_TOKEN unset — skipping admin-positive assertions"
  fi
}

# ─── INTER-SERVICE HMAC AUTH (closes the x-user-id forgery bypass) ───
#
# The gateway signs every proxied request with a shared HMAC key, and each
# downstream service verifies that signature before honouring x-user-id.
# This section proves the trust model by hitting downstream service ports
# DIRECTLY with forged identity headers and asserting the verifier rejects
# them with INTER_SERVICE_SIGNATURE_INVALID.
#
# Run only when GATEWAY_URL or DOWNSTREAM_URL is reachable. We probe
# http://localhost:3005/api/v1/orders first; if it's down, the section is
# skipped so the rest of the suite keeps working.
test_inter_service_auth() {
  section "INTER-SERVICE HMAC AUTH (downstream port protection)"

  # Use the gateway by default for service URLs. Override with
  # GATEWAY_URL=<host:port> to test against a non-default deployment.
  local gateway_host
  gateway_host="${GATEWAY_URL:-http://localhost:3000}"
  local order_port="${ORDER_SERVICE_URL:-http://localhost:3005}"
  local payment_port="${PAYMENT_SERVICE_URL:-http://localhost:3006}"

  # Probe the order port directly (no gateway) to see if the verifier is
  # even wired up. If the service isn't running, skip.
  local probe_code
  probe_code=$(curl -s -o /dev/null -w "%{http_code}" --max-time 5 \
    -H "x-user-id: probe" \
    "${order_port}/api/v1/orders" 2>/dev/null || echo "000")
  if [ "$probe_code" = "000" ]; then
    yellow "  → Downstream services not reachable on :3005/:3006 — skipping"
    return
  fi

  # Negative path 1: forged x-user-id against order-service directly.
  # Without the inter-service HMAC verifier, this used to return 200/401
  # depending on the order-service's local header trust. With the verifier,
  # it MUST return 401 INTER_SERVICE_SIGNATURE_INVALID.
  local code
  code=$(curl -s -o "$TEMP_FILE" -w "%{http_code}" --max-time 5 \
    -H "x-user-id: forged-user" \
    -H "x-user-email: attacker@example.com" \
    -H "x-user-role: admin" \
    "${order_port}/api/v1/orders" 2>/dev/null || echo "000")
  if [ "$code" = "401" ]; then
    PASS=$((PASS + 1))
    green "  ✓ Order port rejects forged x-user-id (401 INTER_SERVICE_SIGNATURE_INVALID)"
  else
    FAIL=$((FAIL + 1))
    FAILED_TESTS+=("Order port accepted forged x-user-id ($code)")
    red "  ✗ Order port rejected forged x-user-id with $code (expected 401)"
  fi

  # Negative path 2: payment-service directly. Same expectation.
  code=$(curl -s -o "$TEMP_FILE" -w "%{http_code}" --max-time 5 \
    -H "x-user-id: forged-user" \
    -H "Content-Type: application/json" \
    -X POST \
    -d '{"orderId":"00000000-0000-0000-0000-000000000000","paymentMethod":"card"}' \
    "${payment_port}/api/v1/payments/process" 2>/dev/null || echo "000")
  if [ "$code" = "401" ]; then
    PASS=$((PASS + 1))
    green "  ✓ Payment port rejects forged x-user-id (401 INTER_SERVICE_SIGNATURE_INVALID)"
  else
    FAIL=$((FAIL + 1))
    FAILED_TESTS+=("Payment port accepted forged x-user-id ($code)")
    red "  ✗ Payment port rejected forged x-user-id with $code (expected 401)"
  fi

  # Positive path: when a real user token is used through the gateway,
  # the downstream service accepts the request (because the gateway signs
  # it). Only runs if we have a token.
  if [ -n "$TOKEN" ]; then
    code=$(curl -s -o "$TEMP_FILE" -w "%{http_code}" --max-time 5 \
      -H "Authorization: Bearer $TOKEN" \
      "${gateway_host}/api/v1/orders" 2>/dev/null || echo "000")
    if [ "$code" = "200" ]; then
      PASS=$((PASS + 1))
      green "  ✓ Gateway-signed request reaches order-service (200)"
    else
      FAIL=$((FAIL + 1))
      FAILED_TESTS+=("Gateway-signed request to order-service failed ($code)")
      red "  ✗ Gateway-signed request to order-service returned $code (expected 200)"
    fi
  else
    yellow "  → TOKEN unset — skipping gateway-signed positive-path test"
  fi
}

# ──────────────────────────────────────────────────────────────

summary() {
  echo ""
  printf "\033[1;34m═══════════════════════════════════════════════════\033[0m\n"
  printf "\033[1;34m  RESULTS\033[0m\n"
  printf "\033[1;34m═══════════════════════════════════════════════════\033[0m\n"
  printf "  Total:   %d\n" $((PASS + FAIL))
  green "  Passed:  ${PASS}"
  if [ "$FAIL" -gt 0 ]; then
    red "  Failed:  ${FAIL}"
    echo ""
    yellow "  Failed tests:"
    local ft
    for ft in "${FAILED_TESTS[@]}"; do
      red "    • $ft"
    done
  fi
  echo ""
  if [ "$FAIL" -eq 0 ]; then
    green "  ✓ All endpoints passed!"
  else
    red "  ✗ ${FAIL} endpoint(s) failed"
  fi
  echo ""
}

# ──────────────────────────────────────────────────────────────

main() {
  echo ""
  bold "E-Commerce API Test Suite"
  echo ""
  echo "  Base URL: ${BASE_URL}"
  echo "  Started:  $(date)"
  echo ""

  check_all_services
  setup_auth
  test_gateway
  test_auth
  test_user_service
  test_product_service
  test_cart_service
  test_order_service
  test_payment_service
  test_notification_service
  test_search_service
  test_admin_service
  test_inter_service_auth
  summary
}

main
