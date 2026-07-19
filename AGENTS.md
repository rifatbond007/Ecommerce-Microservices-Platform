# AGENTS.md — E-Commerce Microservices

## Quick start

```bash
make infra-up        # PostgreSQL:5433, Redis:6379, RabbitMQ:5672/15672
make setup           # npm install + prisma generate + db push (all services, copies .env.example→.env)
make dev-all         # all 10 services concurrently (ts-node-dev hot-reload)
```

One service: `make dev-auth` (replace auth) or `npm run dev:auth`. Node >=20, npm >=10.

## Commands

Each `services/<name>/`:
```
npm run dev|build|test|test:watch|test:coverage|lint|lint:fix|prisma:generate|prisma:migrate|prisma:push
```
Root: `npm run dev:<name>` (auth|gateway|user|product|cart|order|payment|notification|search|admin) or `dev:all`. `npm run build|test|lint` runs all workspaces.

Make targets: `infra-up|down`, `setup|test|lint|build` (with `-<name>` suffix for single), `dev-all`, `clean`.

## Services

10 Express microservices, shared PostgreSQL via schemas, Redis (cache/sessions), RabbitMQ (async events).

| Service | Port | DB Schema | Auth |
|---------|------|-----------|------|
| gateway | 3000 | gateway | - |
| auth | 3001 | auth | No |
| user | 3002 | user_service | Yes |
| product | 3003 | product_service | No |
| cart | 3004 | cart_service | Yes |
| order | 3005 | order_schema | Yes |
| payment | 3006 | payment_service | Yes |
| notification | 3007 | notification_service | Yes |
| search | 3008 | search_service | No |
| admin | 3009 | admin_service | Yes |

Gateway proxies via `http-proxy` — routes map prefix→service (e.g., `/api/v1/products` → product:3003). Routes table in `src/modules/router/router.controller.ts`.

Prisma schemas exist in all 10 services. Init SQL at `infra/postgres/init-scripts/init-schemas.sql` creates all schemas.

## Structure

```
src/{index.ts,app.ts,config/,routes/,middleware/,repositories/,utils/}
src/modules/<feature>/{controller,service,route,validator,types,index}.ts
tests/
prisma/schema.prisma
```

Import alias: `@/*` → `src/`. Error format: `{ success: false, error: { code, message, details? } }` using `AppError(statusCode, errorCode, message)`.

## Prisma gotcha

`@prisma/client` is hoisted to root `node_modules` (npm workspaces). The last service to run `prisma generate` "wins". When building or testing one service in isolation, always regenerate first:
```
cd services/<name> && npx prisma generate
```
Or use `make setup-<name>` which does install + generate + push in one step. CI does this explicitly in a loop (see `.github/workflows/ci.yml` typecheck job).

## Tests

- Jest + ts-jest, `tests/` dir, `**/*.test.ts`
- Inline `jest.mock()` at module level, dynamic `await import()` inside `it()`
- 3 services have `isolatedModules: true` in jest config: auth, cart, user
- 6 services have `tsconfig.test.json` (extends tsconfig, `strict: false`): auth, user, cart, payment, notification, search. Missing: gateway, product, order, admin.
- **Unit tests mock the DB layer** — no Postgres needed locally for `npm run test`. CI does spin up Postgres+Redis for integration checks.
- Test one file: `npm run test -- --testPathPattern="auth.service.test.ts"` (from service dir)

## Frontend

`frontend/` — Vite+React 18 (NOT Next.js despite docs/ saying so). `npm run dev` on `:5173`. Build: `tsc && vite build`. Vite proxies `/api` → `localhost:3000` (gateway).

Frontend has its own `package-lock.json` (not part of npm workspaces). Separate `npm ci` / `npm install` needed.

Tech: react-router-dom, Zustand, Tailwind, shadcn/ui (Radix), Axios, framer-motion.

## CI

`.github/workflows/ci.yml` runs on push/PR to main: **lint** → **typecheck** (build, services one-at-a-time with prisma generate before each) → **test** (unit, no DB) → **frontend build** → **api-test** (full stack, depends on typecheck+test).

## RabbitMQ

Only `search` has a live consumer (`src/events/rabbitmq.service.ts` wired in `app.ts`). Exchange: `product.events` (topic), routing keys `product.*`. `product` and `order` have `amqplib` dep + config but no publish/consume code.

## Misc

- `packages/` in workspace config (`package.json` workspaces) but directory does not exist
- All services have `.env.example`; `make setup` auto-copies it to `.env`
- `docs/` (9 files) is aspirational: references non-existent `packages/`, wrong creds (`ecommerce/ecommerce_dev_password` — actual: `postgres/postgres`). Use code as source of truth.
- `scripts/seed.sh` bootstraps an admin user via the auth API (requires gateway+auth running)
