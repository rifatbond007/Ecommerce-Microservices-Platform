# ADR-0005: Prometheus metrics per service, Grafana dashboards, OpenTelemetry-ready

- **Status:** Accepted
- **Date:** 2026-07-15
- **Deciders:** Platform team

## Context

We have structured JSON logging via `winston` per service and request
IDs propagated through the gateway, but no metrics, no traces, and no
aggregated dashboards. Operators today rely on log-grep for incident
response, which does not scale across 10 services and does not
answer questions like "what is the p99 latency of `POST /api/v1/orders`
right now?".

For a production-grade system we need:

1. **Metrics** — request rate, error rate, latency histograms, queue
   depth, DB pool saturation. Alertable.
2. **Traces** — distributed traces across the gateway → service →
   RabbitMQ chain. Used to debug latency spikes.
3. **Dashboards** — Grafana boards keyed to service, with the four
   golden signals visible at a glance.

This ADR scopes the **metrics** piece. Tracing is a follow-up.

## Decision

We adopt **Prometheus** for metrics collection and **Grafana** for
dashboards, deployed via the existing Docker Compose stack.

### Library

Each service uses [`prom-client`](https://github.com/siimon/prom-client).
The gateway and every backend service expose a `GET /metrics` endpoint
on the same port as the service (not behind `/api/v1` — the metrics
scrape is from the cluster network, not the public internet).

### Default metric set

Every service registers, at minimum:

- `process_*` — CPU, memory, event-loop lag (from `prom-client`
  `collectDefaultMetrics`).
- `http_requests_total{method, route, status}` — counter.
- `http_request_duration_seconds{method, route, status}` — histogram
  with buckets `[0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5,
  5]`.
- `http_requests_in_flight` — gauge.

Services that publish/consume messages additionally export:

- `rabbitmq_messages_published_total{exchange, routing_key}` —
  counter.
- `rabbitmq_messages_consumed_total{queue, status}` — counter.
  `status` is `ack | nack | requeue`.

Services with DB pools export:

- `db_pool_acquired` / `db_pool_pending` — gauges.

### Endpoint and auth

- Path: `GET /metrics`.
- Auth: **none at the application layer.** Network policy or an
  internal-only listener must block public access. In Compose this is
  achieved by binding the metrics endpoint to a separate network
  interface; in production, a sidecar or service mesh enforces it.
- Format: standard Prometheus text exposition (`prom-client` default).

### Cardinality discipline

- `route` uses the Express route template (e.g., `/api/v1/orders/:id`),
  not the resolved URL with IDs.
- We do **not** label by `userId`, `requestId`, or any high-cardinality
  field. Spans belong in tracing; metrics stay low-cardinality.
- Status codes are bucketed into 2xx / 3xx / 4xx / 5xx for dashboards,
  with raw codes retained for debugging.

### Dashboards

A starter Grafana dashboard (`infra/grafana/dashboards/platform.json`,
provisioned at startup) shows, per service:

1. Request rate (RPS) and error rate (5xx ratio).
2. p50 / p95 / p99 latency.
3. In-flight requests and event-loop lag.
4. RabbitMQ queue depth (for `search`).

### Alerting rules (initial set)

- 5xx ratio > 1% over 5m → page.
- p99 latency > 1s for any route over 10m → ticket.
- Any service `up == 0` for > 1m → page.
- `db_pool_pending > 0` sustained 5m → ticket.

## Consequences

**Positive**

- The four golden signals become queryable, not grep-able.
- Capacity planning becomes possible (we can read utilization, not
  guess it).
- Incidents stop being "rebuild the picture from logs".

**Negative / costs**

- ~5MB of additional RAM per service for `prom-client`'s default
  metric registry.
- We must enforce cardinality discipline in code review — a stray
  `userId` label will blow up Prometheus' storage.
- The metrics endpoint must be network-isolated. A misconfiguration
  that exposes it publicly leaks internal performance data.

**Follow-ups**

- Add OpenTelemetry SDK behind a feature flag, with the same route
  template. Exporters: OTLP → Tempo or Jaeger.
- Wire alerts to PagerDuty / Slack.
- Record per-business metrics (`orders_created_total`,
  `payment_amount_total`) once the metrics pipeline is stable.