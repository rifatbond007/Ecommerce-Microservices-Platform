---
name: verify-service
description: Run the CI-equivalent checks (prisma generate, lint, build, test, frontend build) for every service changed on the current branch and report real results. Use before any commit or PR, after editing service code, or when asked to "verify", "check" or "run the tests".
---

# Verify service

This runs the same checks as `.github/workflows/ci.yml` (the lint, typecheck/build, test and frontend jobs) for only the parts of the repo you changed. The `commits` and `pr-protocol` skills both depend on it.

## 1. Find what changed

```bash
base=$(git merge-base HEAD origin/main)
git diff --name-only "$base"...HEAD; git diff --name-only; git diff --name-only --staged
```

- A path under `services/<svc>/` means service `<svc>` changed.
- A path under `frontend/` means the frontend changed.
- If `scripts/api-test.sh`, `infra/`, a gateway route or the root `package.json` changed, mention api-test in the report (step 4).

## 2. Run each changed service, in order

```bash
for svc in <changed services>; do
  echo "=== $svc ==="
  (cd services/$svc && npx prisma generate && npm run lint && npm run build && npm test) || { echo "FAILED: $svc"; break; }
done
```

- **Run `prisma generate` first, every time, for each service.** Without it, `build` and `test` compile against whichever service generated last, which gives false type errors or a false pass.
- Run the services one at a time, never in parallel, because the generate steps share state.
- The gateway has no tests. Its `npm test` passes only because of `passWithNoTests`, so say "no tests" in the report rather than "passed".
- No Postgres is needed, since the unit tests mock the database. If a test tries to connect to a database, that is a bug in the test.

## 3. Frontend (only if `frontend/` changed)

```bash
(cd frontend && npm run build)   # tsc && vite build
```

The frontend has its own lockfile, so if `node_modules` is missing, run `npm ci` in `frontend/` first.

## 4. api-test (full stack, optional)

```bash
make infra-up && make dev-all   # dev-all starts only 6 services; start user/notification/search/admin with npm run dev:<svc> or `cd services/<svc> && npm run dev`
bash scripts/api-test.sh
```

Run this only when the user asks, or when the change affects routing or status codes and the stack is already running. Otherwise, report that CI's api-test job will cover it.

## 5. Report

Give one line per check with the real numbers from the output:

```
auth     lint ok · build ok · test 23 passed (2 suites)
payment  lint ok · build ok · test FAILED 1/14 — payments.service.test.ts "refund requires admin"
frontend build ok
api-test not run (needs full stack) — CI will run it
```

- Never report a check as passed if you didn't run it.
- If a check fails, show the failing test name or the first compiler error, then fix the cause.
- Never skip a failing check, delete a test, or add `--passWithNoTests` to make it green.
- Save these lines: the `pr-protocol` skill's **How to test** section quotes them.
