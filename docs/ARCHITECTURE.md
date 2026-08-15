# Architecture

The single source of truth for how the platform fits together. If this file disagrees with code in `services/`, `infra/`, or `frontend/`, the code wins and this document must be updated.

## System at a glance

```
        ┌──────────────────────────────────────────┐
        │            Frontend (Vite + React)       │
        │           http://localhost:5173          │
        └────────────────────┬─────────────────────┘
                             │ /api/*  (Vite dev proxy → gateway)
                             ▼
        ┌──────────────────────────────────────────┐
        │      API Gateway — port 3000             │
        │  JWT verify · CORS · rate limit · proxy  │
        └─────┬────────┬─────────┬─────────┬───────┘
              │        │         │         │
            auth      user     product    cart    order   payment   notification   search   admin
            :3001     :3002    :3003     :3004    :3005   :3006      :3007          :3008    :3009
              │                              │
              │       ┌──────────────────────────────────┐
              └────►  │ PostgreSQL 16 — single instance   │
              │       │ one DB (`ecommerce`), per-service │
              │       │ schemas (`auth`, `user_service`, │
              │       │ `product_service`, …)             │
              │       └──────────────────────────────────┘
              │
              ├────► Redis 7  (sessions, login-attempts,
              │                 cart cache, search cache,
              │                 idempotency keys,
              │                 rate-limit counters)
              │
              └────► RabbitMQ 3 (topic exchange `ecommerce.events`
                                  + `product.events`)
```

There is **no** `packages/` folder, no Lerna, no Turbo, no monorepo build orchestrator. It's plain npm workspaces over `services/*`. Do not add one without team discussion.

## Services

| # | Service       | Port | DB schema            | Auth required | Responsibility |
|---|---------------|------|----------------------|---------------|----------------|
| 1 | gateway       | 3000 | `gateway`            | n/a           | JWT validation, rate limit, CORS, reverse proxy |
| 2 | auth          | 3001 | `auth`               | no            | Register/login, JWT + refresh tokens, sessions, login attempts |
| 3 | user          | 3002 | `user_service`       | yes           | Profile, addresses, wishlists, reviews, sellers |
| 4 | product       | 3003 | `product_service`    | no            | Categories, brands, products, variants, inventory, warehouses |
| 5 | cart          | 3004 | `cart_service`       | yes           | Active cart, saved carts |
| 6 | order         | 3005 | `order_schema`       | yes           | Orders, items, status history, shipments, refunds, returns |
| 7 | payment       | 3006 | `payment_service`    | yes           | Payments, refunds, Stripe webhooks + generic webhook endpoint |
| 8 | notification  | 3007 | `notification_service` | yes         | Preferences, notifications, email queue, templates |
| 9 | search        | 3008 | `search_service`     | no            | Product search index (read-side), suggestions, trending, click log |
| 10 | admin        | 3009 | `admin_service`      | yes (admin)   | Dashboard, manage users/products/orders/settings |

## Gateway routing table

Source of truth: `services/gateway/src/modules/router/router.controller.ts` → `defaultRoutes`.

| Path prefix                  | Upstream service | Auth |
|------------------------------|------------------|------|
| `/api/v1/auth`               | auth             | optional |
| `/api/v1/users`              | user             | yes |
| `/api/v1/sellers`, `/api/v1/seller` | user       | yes |
| `/api/v1/products`, `/api/v1/categories`, `/api/v1/brands`, `/api/v1/variants`, `/api/v1/inventory` | product | optional |
| `/api/v1/carts`, `/api/v1/saved-carts` | cart      | yes |
| `/api/v1/orders`             | order            | yes |
| `/api/v1/payments`           | payment          | yes |
| `/api/v1/notifications`      | notification     | yes |
| `/api/v1/search`             | search           | optional |
| `/api/v1/admin`              | admin            | yes |
| `/api/v1/webhooks`           | payment          | no — verified by service |

Routes prefixed with `/api/v1/auth`, `/api/v1/users`, etc. are matched in order; unknown paths fall through to the DB-driven `routerService.resolveTargetService` (`RouteConfig` model).

Gateway exposes:
- `GET /health` — liveness + dependency probe (Postgres + Redis). Returns 503 with per-check status when degraded.
- `GET /routes` — current routing table (admin-only; bearer token required, role=admin).
- `GET /docs` — list of per-service Swagger UIs.
- `GET /docs/:name` — proxies the per-service Swagger UI (works in any environment, not just dev).

## Database strategy

- **Single PostgreSQL 16 instance** — one DB (`ecommerce`), one user (`postgres`).
- **Per-service schema** isolation. Each service scopes itself via `?schema=<schema>` in its `DATABASE_URL`.
- **Schemas are created at infra bring-up** by `infra/postgres/init-scripts/init-schemas.sql`. The schema list is the contract.
- **Migrations**: `npx prisma db push` per service in dev. There are no migration files checked in; CI mirrors dev with `prisma db push --accept-data-loss` (see [ADR-0002](adr/0002-migrations.md) for the production migration plan).
- **No cross-schema reads in business code**. Analytics views in admin are the only documented exception, and they don't exist yet.

### Schema ownership

| Schema               | Service       | Models |
|----------------------|---------------|--------|
| `auth`               | auth          | User, Role, UserRole, Session, LoginAttempt |
| `user_service`       | user          | Profile, Address, Wishlist, WishlistItem, Review, ReviewHelpful |
| `product_service`    | product       | Category, Brand, Product, ProductVariant, Inventory, Warehouse |
| `cart_service`       | cart          | Cart, CartItem, SavedCart |
| `order_schema`       | order         | Order, OrderItem, OrderStatusHistory, Shipment, Refund, Return |
| `payment_service`    | payment       | Payment, Refund |
| `notification_service` | notification | NotificationPreference, Notification, NotificationTemplate, EmailQueue |
| `search_service`     | search        | ProductSearchIndex, SearchLog |
| `admin_service`      | admin         | AdminLog, SystemSetting |
| `gateway`            | gateway       | RateLimit, ApiKey, RouteConfig |

## Redis usage

- Sessions and refresh-token bookkeeping (auth service).
- Per-service caching (cart, product detail, search suggestions) — TTLs are service-local; pick a sensible value and document it in the module that owns the cache.
- Idempotency keys for payments.

Key namespacing convention: `<service>:<entity>:<id>` (e.g., `cart:cart:<userId>`).

## RabbitMQ

A single topic exchange is currently in active use:

| Exchange          | Routing key pattern | Producers | Consumers | Notes |
|-------------------|---------------------|-----------|-----------|-------|
| `product.events`  | `product.*`         | product   | search    | Catalog reindex. |

`payment` and `notification` have `amqplib` declared as a dep with a `rabbitmq.ts` util but no live publish/consume code wired into `index.ts` today.

When you add a new event flow: define the exchange name + routing key here first, then implement the publisher and consumer. Do not invent new exchanges without updating this section.

## Authentication

- **JWT access tokens** — HS256, 15-minute TTL, signed with `JWT_SECRET`.
- **Refresh tokens** — 7-day TTL, signed with `JWT_REFRESH_SECRET`, persisted as `Session` rows in `auth.sessions`.
- **Header** — `Authorization: Bearer <token>`.
- The **gateway validates** the JWT, then forwards `x-user-id`, `x-user-email`, `x-user-role` to downstream services so they don't re-validate.
- **Failed logins** — `LoginAttempt` rows + a `lockedUntil` window on the user (auth-service implementation).

Token refresh: `POST /api/v1/auth/refresh` (handled by auth service).

### Inter-service trust (HMAC)

Downstream services trust the gateway-forwarded `x-user-*` headers, so anyone
who can reach a service port directly could otherwise forge identity. To close
this gap, every proxied request is signed at the gateway and verified by each
downstream service before any controller code runs.

- **Sign algorithm** — HMAC-SHA256 over `${METHOD}\n${originalUrl}\n${ts}\n${sha256(body)}`.
  `originalUrl` includes the query string, so `?status=shipped` is part of the
  signature. Helpers live in `services/gateway/src/utils/sign.ts` and
  `services/<svc>/src/utils/sign.ts`.
- **Headers set by the gateway** on every proxied request:
  - `x-inter-service-signature` — hex HMAC
  - `x-inter-service-timestamp` — unix seconds
  - `x-inter-service-key-id` — defaults to `v1`
- **Verifier** — `services/<svc>/src/utils/verify.ts` exports
  `verifyInterServiceSignature(...)` and is mounted via
  `services/<svc>/src/middleware/inter-service.middleware.ts` ahead of the
  per-route auth middleware in `app.ts`. Enforces:
  - All three headers present
  - Timestamp parses as a positive integer
  - Timestamp within ±`INTER_SERVICE_CLOCK_SKEW_SECONDS` (default 60s) of now
  - `keyId` matches the configured `INTER_SERVICE_KEY_ID`
  - HMAC matches (timing-safe equal)
- **Shared secret** — `INTER_SERVICE_SECRET`, identical across the gateway and
  all 10 services. In production it MUST NOT be the placeholder value
  (`__SETME_INTER_SERVICE_SECRET_IN_PROD__`); services refuse to boot. Generate
  with `openssl rand -base64 48`.
- **Rejection** — any failure throws `UnauthorizedError`, the global error
  middleware serializes it to `{ success:false, error:{ code:"INTER_SERVICE_SIGNATURE_INVALID", ... } }`
  with HTTP 401.
- **Allow-list** — the payment service allow-lists `/api/v1/webhooks/*` so
  Stripe webhooks (which carry their own `stripe-signature` header) bypass the
  HMAC check. The auth service allow-lists the public login/register/refresh
  endpoints so the browser can reach them directly when the gateway is
  bypassed in dev/e2e. The admin service skips the check when a request
  carries `x-internal-admin-call: true` (defence-in-depth; the existing
  `internalAdminCallGuard` middleware handles that flow).
- **Outbound signing** — when a service calls another service directly (e.g.
  payment → order at `:3005`, order → cart at `:3004`), it uses
  `buildSignedHeaders({ method, path, body })` from its own `src/utils/sign.ts`
  to attach the three headers. Calls that already go through the gateway
  (admin → user/order/product) are auto-signed by the gateway.
- **Direct-path bypass** — the defence-in-depth that ultimately closes the
  gap is network-level: only the gateway should be reachable on its port. In
  dev, `scripts/api-test.sh` runs `test_inter_service_auth` to assert forged
  `x-user-id` requests against `:3005` and `:3006` get 401.

If you add a new inter-service call that doesn't go through the gateway, sign
it with `buildSignedHeaders`. Every new direct call widens the trust gap
unless it carries the HMAC.

## Canonical error shape

Every service throws `AppError(statusCode, errorCode, message[, details])`. Error responses look like:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Email is required",
    "details": { "field": "email" }
  }
}
```

`code` is a stable, machine-readable string. `details` is optional and per-endpoint. Stack traces are never leaked in `message`; they may appear in `error.stack` only when `NODE_ENV !== 'production'`.

## Frontend integration

- Vite + React 18 on `:5173`.
- Axios client in `frontend/src/lib/api.ts` proxies `/api/*` to gateway `:3000` via Vite's dev proxy.
- JWT in `localStorage` (the api client is auth-header-based; if you switch to httpOnly cookies later, set `withCredentials: true`).
- Refresh-on-401 interceptor coalesces concurrent refresh attempts into a single `/auth/refresh` call.
- State: Zustand stores — `auth`, `cart`. Add more stores as features grow.

## Repository layout

```
.
├── README.md                ← quick start + service table
├── PUKU.md                  ← puku-cli session notes
├── AGENTS.md                ← agent-specific notes
├── CLAUDE.md                ← Claude Code specific notes
├── Makefile                 ← canonical command surface
├── package.json             ← npm workspaces over services/*
├── infra/                   ← docker-compose, postgres init scripts
├── services/                ← 10 microservices
├── frontend/                ← Vite + React
├── planning/                ← phased build plans
├── scripts/                 ← api-test.sh and helpers
└── docs/                    ← architecture, API, operations
```

## Local development

```bash
make infra-up        # Postgres + Redis + RabbitMQ (with health waits)
make setup           # npm install + prisma generate + db push for all services
make dev-all         # all services + frontend (concurrently)
```

Per-service:

```bash
make dev-auth                # one service
cd services/auth && npm run test -- --testPathPattern="auth.service.test.ts"   # single test file
cd services/auth && npm run lint:fix                                            # format + lint
```

Frontend: `cd frontend && npm run dev` (port 5173). Vite proxies `/api` → gateway.
