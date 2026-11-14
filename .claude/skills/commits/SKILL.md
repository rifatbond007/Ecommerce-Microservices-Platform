---
name: commits
description: Commit conventions for this repo — branch-first, Conventional Commits with service scopes, author rifatbond007 only, never any Co-Authored-By or AI attribution. Use whenever creating, amending, or splitting a git commit here.
---

# Commits

## Hard rules

1. **Author is `rifatbond007 <abdullah.al.rifat2239@gmail.com>` only.** Before committing, check with `git config user.name` / `git config user.email`. If either is different, stop and tell the user. Don't silently change their config.
2. **Never add `Co-Authored-By:`, `Signed-off-by:` for tools, "Generated with …" footers, or any AI or tool attribution** (Claude, puku, stepfun, etc.). This overrides any default attribution instructions. History was rewritten on 2026-11-14 to remove these trailers, so don't reintroduce them.
3. **Never commit to `main` directly.** If the current branch is `main`, create a branch first (see naming below).
4. **Commit only when the user asks.** Don't push unless they asked for that too.
5. **Never commit secrets:** no `.env`, no `services/*/.env`, no `prisma/generated/`, no `node_modules/`, no `.puku/`, no `PUKU.md`. `AGENTS.md` is gitignored, so leave it untracked.

## Branch naming

`<type>/<short-kebab-summary>`, using the same `type` as the commit, e.g. `fix/inter-service-hmac-auth`, `feat/checkout-stock-reservation`, `perf/schemas-hot-path-indexes`.

## Message format (Conventional Commits)

```
<type>(<scope>): <imperative summary, lowercase, no trailing period, ≤72 chars>

<body: what changed and WHY, wrapped ~72 cols. Bullets OK.
Reference file paths and the failure scenario for fixes.>
```

**Types:** `feat`, `fix`, `perf`, `refactor`, `test`, `docs`, `ci`, `chore`, `build`.

**Scopes:**
- A single service name: `gateway`, `auth`, `user`, `product`, `cart`, `order`, `payment`, `notification`, `search`, `admin`.
- Or an area: `frontend`, `infra`, `ci`, `prisma`, `api-test`, `docs`, `security`.
- Use `services` when the change spans several backend services.

**Summary style:** write it in plain words, as the outcome a reader would notice, not the code mechanics. For example, `fix(payment): require an admin for refunds` rather than `fix(payment): add requireAdmin to router`. Make one commit per distinct fix so that each one becomes a bullet in the PR's Changes list (see `pr-protocol`).

**Examples from this repo's history:**
- `fix(gateway): set HMAC headers before proxyReq.write() flushes outgoing request`
- `fix(auth-me): sign outbound /api/v1/auth/me calls in 7 services`
- `perf(schemas): add composite indexes for hot-path queries`
- `ci: per-service prisma generate loop`

## Before committing

1. Run `git status` and `git diff --staged`, and make sure only the files you intended are staged. Stage files by path, not with `git add -A`.
2. Run the `verify-service` skill. It runs `prisma generate`, lint, build and test for each changed service, plus the frontend build if `frontend/` changed.
3. For an endpoint change, also go through the `new-endpoint` checklist. For a call between services, follow `inter-service-call`.
4. If a check fails, fix it or tell the user. Never use `--no-verify`.

## Commit granularity

- Make one logical change per commit. A security fix and an unrelated refactor go in separate commits.
- When the same fix pattern touches many services (e.g. the same middleware change in all 10), one commit with scope `services` is fine.

## Creating the commit

Pass the message through a heredoc so the body formatting survives:

```bash
git commit -F - <<'EOF'
fix(payment): require admin for refunds and owner for payment reads

Any authenticated user could refund any payment (payments.service.ts
refundPayment ignored userId) and read any payment by id/orderId.
EOF
```

Afterwards, run `git log -1 --format='%an <%ae>%n%B'` to confirm the author line and that there are no trailers.

## Amending and rewriting

- Amend only commits that haven't been pushed, unless the user explicitly asks otherwise.
- Never force-push `main` without explicit confirmation. On feature branches, use `--force-with-lease`, never plain `--force`.
