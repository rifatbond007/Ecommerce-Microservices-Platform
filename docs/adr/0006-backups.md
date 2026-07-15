# ADR-0006: Daily logical backups with WAL archiving, 30-day retention

- **Status:** Accepted
- **Date:** 2026-07-15
- **Deciders:** Platform team

## Context

Today we have **no backups** of the Postgres instance that holds all
ten per-service schemas. The runbook (`docs/RUNBOOK.md`) flags this
as the highest-impact production gap. If the container is destroyed,
or the underlying volume corrupts, we lose every user's data.

For a customer-facing e-commerce platform this is unacceptable:

- A user's order history, addresses, and saved payment methods must
  survive infrastructure failures.
- Regulations (PCI DSS for the payment service, GDPR for user data)
  implicitly require that we be able to recover within a defined
  window.

This ADR scopes the **backup** side. Disaster recovery procedure and
restore drills are follow-ups.

## Decision

We adopt a **two-tier backup strategy** for the Postgres instance:

1. **Daily logical backups** via `pg_dump` in custom format
   (`-Fc`), compressed, retained for **30 days**.
2. **Continuous WAL archiving** to allow point-in-time recovery
   (PITR) within the retention window.

### Daily logical backup

```bash
# /usr/local/bin/backup-postgres.sh — runs in a sidecar cron container
docker exec ecommerce-postgres \
  pg_dump -U postgres -Fc -d ecommerce \
  > /backups/daily/ecommerce-$(date -u +%F).dump

# retention: 30 days
find /backups/daily -name 'ecommerce-*.dump' -mtime +30 -delete

# verification: list contents to confirm non-empty
pg_restore --list /backups/daily/ecommerce-$(date -u +%F).dump >/dev/null
```

The job runs in a sidecar container that shares the Postgres
container's volume via a named volume (`postgres-backups`). The cron
schedule is `0 2 * * *` UTC (off-peak for our projected user
geography).

### WAL archiving

`postgresql.conf` additions:

```
wal_level = replica
archive_mode = on
archive_command = 'test ! -f /var/lib/postgresql/wal-archive/%f && cp %p /var/lib/postgresql/wal-archive/%f'
archive_timeout = 300
```

WAL segments are retained for **7 days**; combined with the daily
logical backup this gives us up to 30 days of PITR within the most
recent week and up-to-30-day point-in-time snapshots before that.

### Storage

- Local: a dedicated volume `postgres-backups` mounted on both the
  Postgres container (read-write for `archive_command`) and the cron
  sidecar (read-write for `pg_dump`).
- Off-host: a daily `rclone sync` job uploads the previous day's
  dump + a tarball of the last 24h of WAL to an S3-compatible bucket
  (`s3://<account>-postgres-backups/`). Encryption: SSE-S3.

### Verification

- **Every backup** is verified with `pg_restore --list`. A non-zero
  exit aborts the upload step and emits a `BACKUP_VERIFY_FAILED`
  log line that pages on-call.
- **Monthly** we run a full restore into a throwaway database and
  diff row counts against the live DB. The diff is logged and must
  be empty (or explained by an in-progress migration).

### Recovery objectives

- **RPO (Recovery Point Objective):** 5 minutes (one WAL archive
  interval) inside the 7-day PITR window; up to 24h outside it.
- **RTO (Recovery Time Objective):** 1 hour for a same-region
  restore from local backups; 4 hours for a cross-region restore
  from S3.

## Consequences

**Positive**

- Data loss is bounded to a 5-minute window in the worst case.
- Restore drills can be run on demand without disturbing production.
- The archive doubles as a snapshot source for spinning up
  analytics replicas.

**Negative / costs**

- Storage grows linearly with write volume. At our projected rate we
  budget ~50GB/month for WAL + ~5GB/day for dumps = ~200GB total,
  mirrored to S3.
- A backup job that runs against a busy primary can cause I/O
  pressure. We mitigate by running during off-peak hours and by
  using `-Fc` (parallel-restore-ready, but single-writer).
- The sidecar cron container adds one more moving part to the
  Compose stack. We treat its image as immutable and version it
  alongside the rest of `infra/`.

**Follow-ups**

- Add a Grafana panel showing backup age and last-verify status.
- Build a one-shot `restore-from-backup.sh` script with `--point-in-time`
  support.
- Schedule quarterly DR drills with a documented RTO measurement.
- Investigate `pgBackRest` once write volume justifies the
  operational complexity.