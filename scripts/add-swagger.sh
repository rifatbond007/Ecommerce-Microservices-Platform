#!/usr/bin/env bash
# Add swagger-ui-express + swagger-jsdoc to a service, drop in src/config/swagger.ts,
# and mount /api/docs in src/app.ts. Skips gateway.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
TEMPLATE="$ROOT/scripts/templates/swagger.ts.txt"

# svc:title:description:port
SERVICES=(
  "auth:Auth Service:Register/login, JWT + refresh tokens, sessions, login attempts.:3001"
  "user:User Service:Profile, addresses, wishlists, reviews, sellers.:3002"
  "product:Product Service:Categories, brands, products, variants, inventory, warehouses.:3003"
  "cart:Cart Service:Active cart and saved carts.:3004"
  "order:Order Service:Orders, items, status history, shipments, refunds, returns.:3005"
  "payment:Payment Service:Payments, refunds, Stripe + generic webhooks.:3006"
  "notification:Notification Service:Preferences, notifications, email queue, templates.:3007"
  "search:Search Service:Product search index, search logs, autocomplete.:3008"
  "admin:Admin Service:Dashboard, manage users/products/orders/settings.:3009"
)

for entry in "${SERVICES[@]}"; do
  IFS=':' read -r svc title desc port <<<"$entry"
  SVC_DIR="$ROOT/services/$svc"
  PKG="$SVC_DIR/package.json"
  APP="$SVC_DIR/src/app.ts"
  CONF="$SVC_DIR/src/config/swagger.ts"

  echo "==> $svc"

  # 1) Drop in swagger config (title and description interpolated).
  sed -e "s|__SERVICE_TITLE__|$title|g" \
      -e "s|__SERVICE_DESCRIPTION__|$desc|g" \
      -e "s|__PORT__|$port|g" \
      "$TEMPLATE" > "$CONF"

  # 2) Add deps to package.json (skip if already present).
  if ! grep -q '"swagger-ui-express"' "$PKG"; then
    node -e "
      const fs = require('fs');
      const p = JSON.parse(fs.readFileSync('$PKG','utf8'));
      p.dependencies = p.dependencies || {};
      p.dependencies['swagger-ui-express'] = p.dependencies['swagger-ui-express'] || '^5.0.0';
      p.dependencies['swagger-jsdoc'] = p.dependencies['swagger-jsdoc'] || '^6.2.8';
      p.devDependencies = p.devDependencies || {};
      p.devDependencies['@types/swagger-ui-express'] = p.devDependencies['@types/swagger-ui-express'] || '^4.1.6';
      p.devDependencies['@types/swagger-jsdoc'] = p.devDependencies['@types/swagger-jsdoc'] || '^6.0.4';
      fs.writeFileSync('$PKG', JSON.stringify(p, null, 2) + '\n');
    "
  fi

  # 3) Patch src/app.ts to import and mount swagger. Idempotent.
  if ! grep -q "from './config/swagger'" "$APP"; then
    # add import line after the last existing import
    awk '
      /^import .* from .*/ && !done { last=NR; lines[NR]=$0 }
      !/^import / && last && !done {
        for (i=1;i<=last;i++) print lines[i]
        print "import swaggerUi from '\''swagger-ui-express'\'';"
        print "import { swaggerSpec } from '\''./config/swagger'\'';"
        done=1
      }
      done || (lines[NR]=$0)
      END { for (i in lines) if (!printed[i]++) print lines[i] }
    ' "$APP" > "$APP.tmp" && mv "$APP.tmp" "$APP"
  fi

  # Insert app.use mount before /api/v1 routes (idempotent — checks for existing mount).
  if ! grep -q "/api/docs" "$APP"; then
    node -e "
      const fs = require('fs');
      const p = '$APP';
      let s = fs.readFileSync(p,'utf8');
      const re = /app\.use\(['\"]\/api\/v1[^'\"]*['\"]/;
      const m = s.match(re);
      if (!m) { console.error('  could not find /api/v1 mount in '+p); process.exit(1); }
      const idx = m.index;
      const mount = \"\\n  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));\\n\\n  \";
      s = s.slice(0,idx) + mount + s.slice(idx);
      fs.writeFileSync(p, s);
    "
  fi
done

echo "Done. Run 'npm install' at the repo root to pull in the new deps."