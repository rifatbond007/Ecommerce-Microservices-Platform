# Infrastructure

## Docker Compose

`infra/docker-compose.yml` runs the full stack. Local dev uses just `make infra-up` to start the three infra services (Postgres, Redis, RabbitMQ), then `make dev-all` for the apps.

`make docker-up` starts the full stack — infra + every service + frontend.

### Services

| Service    | Image                          | Host port | Notes |
|------------|--------------------------------|-----------|-------|
| postgres   | postgres:16-alpine             | 5433      | One DB `ecommerce`, schemas created at init |
| redis      | redis:7-alpine                 | 6379      | AOF + RDB persistence |
| rabbitmq   | rabbitmq:3-management-alpine   | 5672/15672 | Topology loaded from `infra/rabbitmq/definitions.json` |
| gateway    | local build (`services/gateway`)   | 3000 | Depends on infra only |
| auth       | local build                      | 3001 | |
| user       | local build                      | 3002 | |
| product    | local build                      | 3003 | |
| cart       | local build                      | 3004 | |
| order      | local build                      | 3005 | |
| payment    | local build                      | 3006 | |
| notification | local build                  | 3007 | |
| search     | local build                      | 3008 | |
| admin      | local build                      | 3009 | |
| frontend   | local build (`frontend/`)        | 5173 | Nginx-served Vite build, proxies `/api/*` to gateway |

All service images are multi-stage `node:20-alpine` → runtime `node:20-alpine`. They run as a non-root user (`appuser`, UID 1001).

### Healthchecks

Every container has a Docker `HEALTHCHECK`. The infra services use the standard probes (`pg_isready`, `redis-cli ping`, `rabbitmq-diagnostics check_running`). The application services `wget /health` — `/health` is exempt from rate limit so probes stay cheap.

### Topology

- Single `ecommerce-network` bridge. No segmentation.
- No resource limits or restart policies yet — see [RUNBOOK.md](RUNBOOK.md) for the production checklist.

## Postgres

- Init SQL at `infra/postgres/init-scripts/init-schemas.sql`. Runs once on first container start (volume is empty).
- The script ONLY creates schemas + the `uuid-ossp` extension. Service tables are created by `prisma db push`.

## RabbitMQ

- Topology is loaded at boot via `management.load_definitions = /etc/rabbitmq/definitions.json`.
- See [ARCHITECTURE.md](ARCHITECTURE.md#rabbitmq) for the exchange/routing-key contract.

## Redis

- Bound to all interfaces (`bind 0.0.0.0`). No auth. Acceptable for local dev only — see [RUNBOOK.md](RUNBOOK.md) for production.
- AOF + RDB persistence (`appendonly yes`, `save 900 1`, etc.).
- `allkeys-lru` eviction. Sessions must not evict; if you add large cache entries, consider separate Redis instances.

## Environment variables

The contract lives in `services/<name>/.env.example` per service. The Makefile's `setup-%` target copies `.env.example` → `.env` if missing. CI exports the same keys via workflow `env:`.

### Service-level variables (gateway + 9 services)

| Variable | Default | Notes |
|----------|---------|-------|
| `PORT`                          | per-service | |
| `SERVICE_NAME`                  | per-service | appears in logs |
| `NODE_ENV`                      | development | |
| `DATABASE_URL`                  | `postgresql://postgres:postgres@localhost:5433/ecommerce?schema=<schema>` | |
| `REDIS_URL`                     | `redis://localhost:6379` | gateway uses `REDIS_HOST`/`REDIS_PORT` instead |
| `RABBITMQ_URL`                  | `amqp://localhost:5672` | only services that use it |
| `RABBITMQ_EXCHANGE`             | `ecommerce.events` or `product.events` | per service |
| `JWT_SECRET`                    | `change-me-in-production` | shared across services |
| `JWT_REFRESH_SECRET`            | `change-me-too` | auth service only |
| `JWT_EXPIRES_IN` / `JWT_REFRESH_EXPIRES_IN` | `15m` / `7d` | |
| `CORS_ORIGIN`                   | `http://localhost:5173` | gateway is the only CORS-enforcing layer |
| `FRONTEND_URL`                  | `http://localhost:5173` | used for redirects + emails |
| `TAX_RATE`                      | `0.10` | cart + order |
| `ADMIN_EMAIL`                   | `admin@ecommerce.local` | auth promotes this email to admin |
| `ADMIN_PASSWORD`                | `Admin123!Change-me` | bootstrap password — change immediately |
| `STRIPE_SECRET_KEY`             | empty | empty ⇒ mock provider in dev |
| `STRIPE_WEBHOOK_SECRET`         | `whsec_replace_in_production` | required to verify signatures |
| `STRIPE_PUBLISHABLE_KEY`        | empty | |
| `EMAIL_HOST`/`EMAIL_USER`/`EMAIL_PASS`/`EMAIL_FROM`/`EMAIL_PORT`/`EMAIL_SECURE` | empty | SMTP — when empty, no SMTP send attempted |
| `RATE_LIMIT_WINDOW_MS`          | `900000` (15 min) | gateway is `60000` (1 min) |
| `RATE_LIMIT_MAX_REQUESTS`       | `100` | gateway is `200` |
| `LOG_LEVEL`                     | `info` | winston |

### Docker Compose env

`infra/docker-compose.yml` declares a small set of defaults. Override via `.env` in the `infra/` directory or shell env.

```bash
# infra/.env (not committed)
JWT_SECRET=...
JWT_REFRESH_SECRET=...
STRIPE_SECRET_KEY=...
STRIPE_WEBHOOK_SECRET=...
ADMIN_EMAIL=admin@ecommerce.local
ADMIN_PASSWORD=...
EMAIL_HOST=...
EMAIL_PORT=587
EMAIL_USER=...
EMAIL_PASS=...
EMAIL_FROM=...
```

## Production checklist (not done today)

- [ ] Pin all images by digest (not `alpine`).
- [ ] Run as non-root in every container.
- [ ] Add `read_only: true` and `cap_drop: ALL` to every service.
- [ ] Add `restart: unless-stopped` (Compose already does for our services).
- [ ] Add `mem_limit` / `cpus` per service.
- [ ] Move Postgres secrets into Docker secrets.
- [ ] Add a TLS-terminating reverse proxy in front of the gateway.
- [ ] Enable RabbitMQ heartbeat + dead-letter queues.
- [ ] Backups (see [RUNBOOK.md](RUNBOOK.md)).
- [ ] Health-check HTTP probes for services (currently `wget`, can move to `curl` for prod images).
- [ ] Resource limits in production docker-compose override.