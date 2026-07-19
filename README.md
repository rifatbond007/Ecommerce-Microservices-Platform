# E-Commerce Microservices Platform

A full-featured e-commerce platform built with **10 Node.js / Express microservices** and a **Vite + React** frontend. Per-service PostgreSQL schemas in a single DB, Redis for caching/sessions, RabbitMQ for async events.

---

## Quick start

```bash
make infra-up        # PostgreSQL:5433, Redis:6379, RabbitMQ:5672/15672 (with health waits)
make setup           # npm install + prisma generate + db push (all services)
make dev-all         # all 10 services + frontend concurrently (ts-node-dev hot-reload)
```

Single service: `make dev-auth` (replace `auth` with any service name).
Frontend only: `make dev-frontend` → http://localhost:5173

**Node ≥ 20, npm ≥ 10.** Docker required for infra.

---

## Services

| # | Service       | Port | DB schema            | Description |
|---|---------------|------|----------------------|-------------|
| 1 | gateway       | 3000 | `gateway`            | Routing, JWT verification, rate limit, CORS |
| 2 | auth          | 3001 | `auth`               | Register/login, JWT + refresh tokens, sessions |
| 3 | user          | 3002 | `user_service`       | Profile, addresses, wishlists, reviews, sellers |
| 4 | product       | 3003 | `product_service`    | Categories, brands, products, variants, inventory, warehouses |
| 5 | cart          | 3004 | `cart_service`       | Active cart, saved carts |
| 6 | order         | 3005 | `order_schema`       | Orders, items, status history, shipments, refunds, returns |
| 7 | payment       | 3006 | `payment_service`    | Payments, refunds, Stripe + generic webhooks |
| 8 | notification  | 3007 | `notification_service` | Preferences, notifications, email queue |
| 9 | search        | 3008 | `search_service`     | Product search index, suggestions, trending |
| 10 | admin        | 3009 | `admin_service`      | Dashboard, manage users/products/orders/settings |

Full per-service endpoint catalog → [docs/SERVICE_LIST.md](docs/SERVICE_LIST.md)

---

## Tech stack

| Layer        | Technology |
|--------------|------------|
| Runtime      | Node.js 20 LTS |
| Backend      | Express.js, TypeScript, Prisma 5 |
| Frontend     | React 18, Vite, Tailwind, shadcn/ui, Zustand, Axios |
| Database     | PostgreSQL 16 (per-service schemas) |
| Cache        | Redis 7.2 |
| Messaging    | RabbitMQ 3.12 |
| Auth         | JWT (HS256) access 15m + refresh 7d |
| Payments     | Stripe (optional — mock provider if `STRIPE_SECRET_KEY` empty) |

---

## Project layout

```
.
├── README.md                ← you are here
├── Makefile                 ← canonical command surface (make help for full list)
├── package.json             ← npm workspaces over services/*
├── infra/                   ← docker-compose, postgres init, rabbitmq definitions
├── services/                ← 10 microservices (gateway, auth, user, product, cart,
│                              order, payment, notification, search, admin)
├── frontend/                ← Vite + React
├── planning/                ← phased build plans
├── scripts/                 ← api-test.sh and helpers
└── docs/                    ← architecture, API, operations, ADRs
```

Per-service layout (identical for all 10):
```
services/<name>/
├── src/{index,app}.ts
├── src/{config,middleware,repositories,routes,utils}/
├── src/modules/<feature>/{controller,service,route,validator,middleware,types,index}.ts
├── tests/*.test.ts
└── prisma/schema.prisma
```

---

## Commands

The Makefile is the canonical command surface. Run `make help` for the full list.

| Command                              | What it does |
|--------------------------------------|--------------|
| `make infra-up` / `infra-down`       | Start/stop Postgres + Redis + RabbitMQ (with health waits) |
| `make setup` / `make setup-auth`     | Install + `prisma generate` + `db push` for one or all services |
| `make dev-all` / `make dev-<name>`   | Start all services or one (also `make dev-frontend`) |
| `make test` / `make test-auth`       | Run tests for all or one service |
| `make lint` / `make lint-auth`       | ESLint all or one service |
| `make build` / `make build-auth`     | `tsc` build for all or one service |
| `make api-test`                      | `scripts/api-test.sh` — full live walk-through against the gateway |
| `make stop`                          | Kill all dev processes (keep infra) |
| `make clean`                         | Stop everything (services + infra) |

Single test file:
```bash
cd services/auth && npm run test -- --testPathPattern="auth.service.test.ts"
```

---

## Documentation

| Doc                                          | What it covers |
|----------------------------------------------|----------------|
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | System diagram, service catalog, gateway routing, DB strategy, RabbitMQ topology, auth, error envelope |
| [docs/SERVICE_LIST.md](docs/SERVICE_LIST.md) | Per-service responsibilities and HTTP endpoint catalog |
| [docs/API_REFERENCE.md](docs/API_REFERENCE.md) | Cross-cutting API contracts: pagination, idempotency, auth flow, webhooks |
| [docs/DATABASE_SCHEMA.md](docs/DATABASE_SCHEMA.md) | Per-service schemas, ER overview, indexes |
| [docs/INFRASTRUCTURE.md](docs/INFRASTRUCTURE.md) | Docker Compose, env vars, secrets, RabbitMQ topology |
| [docs/RUNBOOK.md](docs/RUNBOOK.md)           | Day-2 operations, common incidents, debugging steps |
| [docs/CONTRIBUTING.md](docs/CONTRIBUTING.md) | Branching, commits, PR review, code style |
| [docs/adr/](docs/adr/)                       | Architecture Decision Records |

Tool/agent notes (not user docs — keep these too):
- `PUKU.md`, `PUKU.local.md` — puku-cli session notes
- `AGENTS.md` — generic agent notes
- `CLAUDE.md` — Claude Code specific notes

---

## Contributing

- **Never commit directly to `main`.** Open a PR even for tiny fixes.
- Branch naming: `feat/<scope>-<short-desc>`, `fix/<scope>-<short-desc>`, `docs/...`, `refactor/...`.
- Commits: `<type>(<scope>): <subject>` — `feat(auth): …`, `fix(cart): …`, etc.
- PR must pass CI: lint, typecheck (build), tests, frontend build, api-test.

See [docs/CONTRIBUTING.md](docs/CONTRIBUTING.md) for full guidelines.

---

## License

MIT
