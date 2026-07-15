# Architecture Decision Records (ADRs)

This directory contains the significant architectural decisions for the
platform, recorded in Michael Nygard format.

## Index

| ADR                                          | Title                                                              | Status   |
|----------------------------------------------|--------------------------------------------------------------------|----------|
| [0002-migrations.md](0002-migrations.md)     | Adopt Prisma Migrate for production deployments                    | Accepted |
| [0003-jwt-rotation.md](0003-jwt-rotation.md) | Two-phase JWT secret rotation with overlap window                  | Accepted |
| [0004-cors.md](0004-cors.md)                 | Multi-origin CORS via parsed allowlist                             | Accepted |
| [0005-observability.md](0005-observability.md) | Prometheus metrics per service, Grafana dashboards, OTel-ready   | Accepted |
| [0006-backups.md](0006-backups.md)           | Daily logical backups with WAL archiving, 30-day retention         | Accepted |
| [0007-tls.md](0007-tls.md)                   | TLS termination at a reverse proxy in front of the gateway         | Accepted |

## How to write a new ADR

1. Copy `0000-template.md` (if present) or use the header of any
   existing ADR.
2. Number sequentially — the next available is **0008**.
3. Fill in **Status**, **Context**, **Decision**, **Consequences**.
   The **Context** must explain the *why*; the **Decision** is what
   we will do; the **Consequences** lists both the wins and the
   follow-ups we accept.
4. Update this index.
5. Link the new ADR from any existing doc that should change as a
   result (`ARCHITECTURE.md`, `RUNBOOK.md`, `INFRASTRUCTURE.md`).

## Status legend

- **Proposed** — under discussion. Not yet binding.
- **Accepted** — the decision is in force. Subsequent ADRs may
  supersede it (link the superseder).
- **Deprecated** — historically accepted but no longer in force.
  Do not delete the file; mark and link the replacement.
- **Superseded** — replaced by a later ADR.