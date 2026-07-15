# Operations runbook

Day-2 operations. Each section lists symptoms, the first thing to check, and the fix.

## Common commands

```bash
make infra-status              # show container status
make infra-up                  # start infra (with health waits)
make infra-down                # stop infra

make dev-all                   # start every service + frontend
make dev-<name>                # start one service

# Run tests
make test                      # all services (needs infra)
make test-<name>               # one service
bash scripts/api-test.sh       # live API smoke test (needs infra + services)

# Prisma
(cd services/auth && npx prisma generate)
(cd services/auth && npx prisma db push)

# Logs
make stop                      # stop all dev processes (keep infra)
```

## Incident: gateway returns 503

Symptom: every call to the gateway fails with `SERVICE_UNAVAILABLE`.

1. `make infra-status` — Postgres, Redis, RabbitMQ all healthy?
2. If yes, the failing upstream is likely auth (the gateway talks to auth to validate). Check `make dev-auth` output for crashes.
3. Gateway dev logs show `Proxy error: connect ECONNREFUSED :3001` → the auth service is down.

## Incident: Prisma client out of sync

Symptom: `PrismaClientInitializationError` or missing-model errors after a schema change.

```bash
# for the affected service
cd services/<name>
npx prisma generate
```

If the schema in the DB has drifted (e.g., a `db push` was skipped), `npx prisma db push --accept-data-loss`. In production, prefer `prisma migrate deploy`.

## Incident: RabbitMQ consumer stuck

Symptom: `product.created` events published, but `search` doesn't reflect new products.

1. `docker exec ecommerce-rabbitmq rabbitmqctl list_queues name messages_ready messages_unacknowledged`
2. If `messages_unacknowledged > 0` on `search.product.index`, restart the search container: `docker compose restart search` (Compose) or `pkill -f "ts-node-dev.*search"` (dev).
3. Increase prefetch in `services/search/src/events/rabbitmq.service.ts` if you see sustained backlog.

## Incident: cart shows wrong totals

Cause candidate: `TAX_RATE` env drift between cart (3004) and order (3005) after a config change.

1. Confirm both services read `TAX_RATE` via `config.tax.rate`.
2. Restart them after the env update: `make stop && make dev-cart make-dev-order` (or restart the containers).

## Incident: webhook signature fails

Symptom: Stripe Dashboard shows webhook deliveries failing with 400.

1. Confirm `STRIPE_WEBHOOK_SECRET` matches the endpoint's configured secret in the Stripe dashboard.
2. Test locally with `stripe listen --forward-to http://localhost:3000/api/v1/webhooks/stripe` (use the resulting `whsec_...` as the env var).

## Backups

Not configured today. The minimum viable backup for production:

```bash
# Daily full + WAL archiving
docker exec ecommerce-postgres pg_dump -U postgres -Fc ecommerce > backup_$(date +%F).dump
# verify
pg_restore --list backup_$(date +%F).dump
```

Track in [`adr/0006-backups.md`](adr/0006-backups.md).

## Scaling playbook

- **Cart / order / notification / payment** are stateless — horizontal scale is safe.
- **Search** is read-mostly. Scaling means adding workers (today: 1 consumer per queue). When throughput hits the indexer's ceiling, add partitions by ID range.
- **Auth** is stateful in Redis. Scaling horizontally is safe; auth's only DB bottleneck is `users.email` lookups (use `idx_users_email`).
- **Gateway** is fully stateless but rate-limit Redis must be shared.

## Secrets rotation

| Secret                     | Where it lives                | Rotation policy |
|----------------------------|-------------------------------|-----------------|
| `JWT_SECRET`               | env / docker secret           | planned; see [`adr/0003-jwt-rotation.md`](adr/0003-jwt-rotation.md) |
| `JWT_REFRESH_SECRET`       | env / docker secret           | sync with JWT_SECRET |
| Postgres `postgres` password| docker-compose / docker secret| sync with infra team |
| `STRIPE_*`                 | docker secret                 | on Stripe dashboard rotation |

When rotating, all services that share the secret must restart in lockstep — there is no overlap-window implementation today.

## Logs

Per-service:
```
services/<name>/logs/
├── combined-<date>.log         # winston JSON lines
└── error-<date>.log
```

Tail live: `tail -F services/auth/logs/combined-*.log`.

## Open production gaps (sorted by impact)

1. **No backups.** Bump this first when going live. → [`adr/0006-backups.md`](adr/0006-backups.md)
2. **TLS** — gateway speaks plain HTTP. Add an nginx/cloud LB with cert. → [`adr/0007-tls.md`](adr/0007-tls.md)
3. **Metrics** — no Prometheus. Add `prom-client` per service + a Grafana dashboard. → [`adr/0005-observability.md`](adr/0005-observability.md)
4. **Migration policy** — `prisma db push` in production is dangerous. Switch to `migrate deploy`. → [`adr/0002-migrations.md`](adr/0002-migrations.md)
5. **Resource limits + restart policies** — partial on restart; resource limits missing.
6. **JWT rotation** — no overlap window. → [`adr/0003-jwt-rotation.md`](adr/0003-jwt-rotation.md)
