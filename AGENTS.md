# AGENTS.md — E-Commerce Microservices

## Commands (service dir: `services/<name>/`)

```
npm run dev|build|test|test:watch|test:coverage|lint|lint:fix|prisma:generate|prisma:migrate|prisma:push
```

Root: `npm run dev:<name>` (auth, gateway, user, product, cart, order, payment, notification, search, admin) or `dev:all`. `npm run build|test|lint` runs all workspaces.

Makefile: `make infra-up|down|setup|stop|clean|docker-build|docker-up|docker-down|test-<name>`.

## Architecture

10 Express microservices behind API Gateway, shared PostgreSQL via schemas, Redis, RabbitMQ.

| Service | Port | Schema | Auth | tsconfig.test.json |
|---------|------|--------|------|-------------------|
| gateway | 3000 | gateway | - | **MISSING** — strict:false, tests/ empty, passWithNoTests:true |
| auth | 3001 | auth | No | ✅ (but compiled .js artifacts in tests/) |
| user | 3002 | user_service | Yes | ✅ |
| product | 3003 | product_service | No | **MISSING** |
| cart | 3004 | cart_service | Yes | ✅ (empty src/controllers/ dir — dead path) |
| order | 3005 | order_schema | Yes | **MISSING** |
| payment | 3006 | payment_service | Yes | ✅ |
| notification | 3007 | notification_service | Yes | ✅ |
| search | 3008 | search_service | No | ✅ (only service with working RabbitMQ consumer in events/) |
| admin | 3009 | admin_service | Yes | **MISSING** |

## Module Pattern

```
src/{index.ts,app.ts,config/,routes/,middleware/,repositories/,utils/,modules/<feature>/{controller,service,route,validator,types,index}.ts}
tests/
prisma/schema.prisma
```

Gateway also has `src/shared/redis/` + `src/shared/prisma/`. Missing tsconfig.test.json for product, order, admin, gateway.

**Import alias**: `@/*` → `src/` (some services like auth define per-path aliases in tsconfig).
**Error format**: `{ success: false, error: { code, message, details? } }` using `AppError(status, code, msg)`.

## Tests

- Jest + ts-jest, `tests/` dir, `**/*.test.ts` pattern
- Inline `jest.mock()` at module level, dynamic `await import()` inside `it()` blocks
- All jest configs set `isolatedModules: true`
- All tsconfig.test.json extend `tsconfig.json` with `strict: false`

## Frontend

```
frontend/  (Vite+React, NOT Next.js despite what docs/ say)
```
React 18, Vite 5, react-router-dom, Zustand, Tailwind, shadcn/ui, Axios. `vite.config.ts` proxies `/api` → `localhost:3000`. `npm run dev` on `:5173`.

## RabbitMQ

Only `search` has actual consumer (`events/rabbitmq.service.ts` — wired in `app.ts`). `product` and `order` have `amqplib` dep + config but **no publish/consume code**.

## Docs Caveat

`docs/` folder (9 files, ~5000 lines) is **aspirational**. References non-existent `packages/`, Next.js (wrong), wrong creds (`ecommerce/ecommerce_dev_password` — actual: `postgres/postgres`), wrong container naming (underscores vs hyphens). Use code as source of truth.
