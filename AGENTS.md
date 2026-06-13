# AGENTS.md — E-Commerce Microservices

## Quick start

```bash
make infra-up        # PostgreSQL:5433, Redis:6379, RabbitMQ:5672/15672
make setup           # npm install + prisma generate + db push (all services)
make dev-all         # all 10 services concurrently (ts-node-dev hot-reload)
```

One service: `make dev-auth` (replace auth) or `npm run dev:auth`. Node >=20, npm >=10.

## Commands

Each `services/<name>/`:
```
npm run dev|build|test|test:watch|test:coverage|lint|lint:fix|prisma:generate|prisma:migrate|prisma:push
```
Root: `npm run dev:<name>` (auth|gateway|user|product|cart|order|payment|notification|search|admin) or `dev:all`. `npm run build|test|lint` runs all workspaces.

Make targets: `infra-up|down`, `setup|test|lint|build|docker-build` (with `-<name>` suffix for single), `dev-all`, `docker-up|down`, `clean`.

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

## Tests

- Jest + ts-jest, `tests/` dir, `**/*.test.ts`
- Inline `jest.mock()` at module level, dynamic `await import()` inside `it()`
- All jest configs: `isolatedModules: true`
- 6 services have `tsconfig.test.json` (extend tsconfig, `strict: false`): auth, user, cart, payment, notification, search. Missing: gateway, product, order, admin.
- Test one file: `npm run test -- --testPathPattern="auth.service.test.ts"` (from service dir)

## Frontend

`frontend/` — Vite+React 18 (NOT Next.js despite docs/ saying so). `npm run dev` on `:5173`. Build: `tsc && vite build`. Vite proxies `/api` → `localhost:3000` (gateway).

Tech: react-router-dom, Zustand, Tailwind, shadcn/ui (Radix), Axios.

## RabbitMQ

Only `search` has a live consumer (`src/events/rabbitmq.service.ts` wired in `app.ts`). Exchange: `product.events` (topic), routing keys `product.*`. `product` and `order` have `amqplib` dep + config but no publish/consume code.

## Misc

- `packages/` in workspace config (`package.json` workspaces) but directory does not exist
- All services have `.env.example`; `make setup` auto-copies it to `.env`
- No CI workflows (no `.github/workflows/`)
- `docs/` (9 files, ~5000 lines) is aspirational: references non-existent `packages/`, wrong creds (`ecommerce/ecommerce_dev_password` — actual: `postgres/postgres`). Use code as source of truth.
- Also see `CLAUDE.md` (similar content, Claude Code specific)
