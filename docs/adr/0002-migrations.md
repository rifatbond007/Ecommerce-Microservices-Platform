# ADR-0002: Adopt Prisma Migrate for production deployments

- **Status:** Accepted
- **Date:** 2026-07-15
- **Deciders:** Platform team

## Context

Today we run `prisma db push` against the database in every environment
including CI. `db push` is intentionally a developer tool: it syncs the
schema without producing a migration, so the database can drift silently
from the committed `schema.prisma`. Symptoms we have already seen:

- A model added in code but never persisted in CI (`prisma generate`
  succeeded, runtime failed).
- Column drops that ran in dev but were never recorded, then
  `db push` "fixed" them again on the next run.
- An unintentional `prisma db push --accept-data-loss` in CI wiped a
  column that should have been preserved.

For a production-ready system we need:

1. **Reviewable schema changes.** Every column change is a file that
   goes through a PR.
2. **Reproducible deployments.** `prisma migrate deploy` must produce
   the same database shape on every node.
3. **Rollback discipline.** The migration history is the audit log; we
   never need to reason about "what state is the DB in right now".
4. **CI alignment.** CI cannot use `--accept-data-loss` against
   shared infrastructure.

## Decision

We adopt **Prisma Migrate** (`prisma migrate`) as the only sanctioned
way to evolve the database schema in non-development environments.

- **Local dev:** `prisma migrate dev` (creates a migration file from
  the schema diff and applies it; may prompt for reset). This replaces
  the current `prisma db push` usage in `make setup`.
- **CI:** `prisma migrate deploy` against a throwaway database seeded
  from `init-schemas.sql` to verify migrations apply cleanly.
- **Production:** `prisma migrate deploy` as part of the release
  pipeline. No `db push`, no `--accept-data-loss`, no manual SQL
  outside a migration file.
- **Bootstrap of fresh environments:** `init-schemas.sql` creates the
  per-service schemas (`auth`, `user_service`, …). `migrate deploy`
  then applies migrations. The two are not redundant: the init
  script provisions *namespaces*; migrations provision *tables*.
- **Migration files** live in `services/<name>/prisma/migrations/` and
  are committed alongside the code change that requires them.
- **CI gate:** a check that fails the build if `schema.prisma` differs
  from the head migration (`prisma migrate diff`).

## Consequences

**Positive**

- Schema drift becomes impossible to introduce silently.
- Production rollbacks are deterministic — we can `migrate deploy` an
  earlier base.
- Reviewers see schema diffs in PRs instead of inferring them from
  behaviour.
- Drops and renames are explicit (`--create-only`, then a separate
  data migration step), eliminating `--accept-data-loss` incidents.

**Negative / costs**

- Slower inner loop for local dev — every schema edit produces a
  migration file. We mitigate by keeping migrations small and
  committing them with the feature.
- We must remember to run `prisma migrate dev --name <feature>` and
  not edit the schema by hand without regenerating. This is enforced
  by a lint rule in CI (see above).
- Existing drift between committed schema and deployed databases must
  be reconciled by an initial `migrate diff` → migration file before
  the first `migrate deploy` rollout.

**Follow-ups**

- Add `prisma migrate diff --from-migrations ./prisma/migrations --to-schema-datamodel ./prisma/schema.prisma --shadow-database-url $SHADOW_URL` to CI.
- Update `make setup` to call `migrate deploy` against local
  Postgres after `make infra-up`.
- Document the "first-time bootstrap" runbook entry once the initial
  reconciliation migration is written.