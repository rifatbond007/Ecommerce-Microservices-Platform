# AGENTS.md — E-Commerce Microservices

---

## Key Commands

Run from service directory (`services/<name>/`):
```
npm run dev              # ts-node-dev hot-reload
npm run build            # tsc → dist/ (also serves as type-check)
npm run test             # Jest (all tests)
npm run test:watch       # Jest --watch
npm run test:coverage    # Jest --coverage
npm run test -- --testPathPattern="auth.service.test.ts"  # single file
npm run test -- --testNamePattern="should authenticate"   # single test
npm run lint             # ESLint
npm run lint:fix         # ESLint --fix
npm run prisma:generate  # generate Prisma client
npm run prisma:migrate   # run migrations
npm run prisma:push      # push schema without migration
```

Root workspace shortcuts:
```
npm run dev:auth  npm run dev:gateway  npm run dev:user  npm run dev:product
npm run dev:cart  npm run dev:order    npm run dev:payment  npm run dev:notification
npm run dev:search  npm run dev:admin
npm run dev:all     # start all 10 concurrently
npm run build       # all workspaces
npm run test        # all workspaces
npm run lint        # all workspaces
```

Makefile (root):
```
make infra-up       # docker-compose up + health checks
make infra-down     # docker-compose down
make dev-auth       # start one service (npm)
make dev-all        # start all services (npm)
make test           # test all services
make test-auth      # test one service
make setup          # install + prisma generate + db push for all
make stop           # kill service processes
make clean          # stop services + infra-down
make docker-build   # build all 10 Docker images
make docker-up      # docker compose up (full stack)
make docker-down    # docker compose down
```
- Compose file: `infra/docker-compose.yml` (defines postgres, redis, rabbitmq + all 10 services)
- Each service has a `Dockerfile` + `.dockerignore` (multi-stage build)
- Build individual: `docker build -t ecommerce/auth:latest services/auth`
- Docker infra creds: postgres/postgres, rabbitmq guest/guest. Update `.env` files from `.env.example` with real credentials.

---

## Architecture

10 Express.js microservices behind an API Gateway (workspaces: `services/*`, `packages/*` — no packages/ directory exists yet):

| Service | Port | Schema | Auth |
|---------|------|--------|------|
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

- All services share one PostgreSQL via **separate schemas** (`auth`, `user_service`, etc.)
- Init schemas in `infra/postgres/init-scripts/init-schemas.sql`
- Redis for caching/sessions, RabbitMQ for async events
- JWT access tokens (15m) + refresh tokens (7d) via `Authorization: Bearer <token>`

---

## Per-Service Structure

Each service follows the modular pattern:

```
src/
├── index.ts                 # entry point
├── app.ts                   # Express app setup
├── config/
├── modules/<feature>/       # self-contained feature modules
│   ├── <feature>.controller.ts
│   ├── <feature>.service.ts
│   ├── <feature>.route.ts
│   ├── <feature>.validator.ts  # Zod schemas
│   ├── <feature>.middleware.ts
│   ├── <feature>.types.ts
│   └── index.ts
├── middleware/               # shared middleware
├── repositories/             # data access layer
├── routes/                   # main router
├── utils/                    # logger, errors, jwt, validate, email
└── (gateway also has src/shared/)
tests/
prisma/schema.prisma
```

**Import alias**: `@/*` maps to `src/` via tsconfig paths and jest `moduleNameMapper`.

**Error response format**:
```typescript
{ success: false, error: { code: 'VALIDATION_ERROR', message: '...', details?: ... } }
```
Error classes extend `AppError(statusCode, errorCode, message)`.

---

## Frontend (React + Vite)

```
frontend/
├── src/
│   ├── app/         pages + layouts + routes (react-router-dom)
│   ├── components/  shadcn/ui (Radix primitives), feature components
│   ├── store/       Zustand stores
│   ├── lib/         API client (axios), utils
│   └── styles/      globals.css (Tailwind)
├── vite.config.ts   proxy /api → localhost:3000
└── tailwind.config.js
```

Stack: React 18, Vite 5, react-router-dom, Zustand, Tailwind CSS, shadcn/ui (Radix), Axios.

```bash
cd frontend && npm run dev   # localhost:5173
```

Note: `npm run build` runs `tsc && vite build` — pre-existing TS errors may cause it to fail. Dev mode (Vite esbuild transpilation) works fine.

---

## Tests

- Jest + ts-jest, `tests/` directory, `**/*.test.ts` pattern
- Mocks are inline per test file (manual `jest.mock()` calls)
- Root `npm run test` runs all workspaces (services)
- No integration test prerequisites beyond infra being up
- Each service has `tsconfig.test.json` (extends `tsconfig.json` with `strict: false`) — it's what jest configs reference via `ts-jest`
