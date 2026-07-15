# Contributing

## Branching

- **Never commit directly to `main`.** Open a PR even for tiny fixes.
- Format: `<type>/<scope>-<short-desc>`
  - `feat/cart-coupon-applied-event`
  - `fix/payment-stripe-signature`
  - `docs/api-reference-rate-limit`
  - `refactor/order-error-envelope`
  - `chore/ci-cache-prisma`

## Commits

Conventional-commits-ish:

```
<type>(<scope>): <subject>

<body — describe why, not what>

<footer>
```

Subject is imperative ("add" not "added"), ≤ 72 chars. Body wrapped at 72. Footer references issues (`Closes #123`) and breaking changes (`BREAKING CHANGE:`).

Types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`, `perf`.

## Pull requests

- Title mirrors the PR's primary change.
- Description references the issue and explains the choice.
- CI must pass: lint, typecheck (build), tests, frontend build, api-test.
- Reviewers: at least one maintainer on services touching >1 service. For docs-only / chores, a single reviewer is enough.

## Code style

### TypeScript

- Strict mode where the service's `tsconfig.json` enables it. Don't disable with `@ts-ignore`.
- `AppError(statusCode, errorCode, message[, details])` is the only way to throw an HTTP error. The error middleware unwraps it into the canonical envelope.
- Zod validators live next to the controller. The service layer should never re-validate; controllers do.
- Prefer named exports, especially for `*Repository` classes.
- Don't add `@/*` imports to existing files that use relative paths — keep the codebase consistent.

### Logs

- Use the winston `logger` from `utils/logger`. Don't `console.log` in service code.
- Include `requestId`, `userId` (when known), and the resource id being operated on.

### Tests

- One test file per concern. Place under `tests/`.
- Placeholder tests today are intentional (PUKU.md acknowledged these). When adding real tests:
  - `jest.mock(...)` at module level, then `await import(...)` inside `it()` (project convention).
  - Don't import `prisma` directly — mock the repository.

### Frontend

- Tailwind tokens, not raw hex. New components must pull from `--background`, `--foreground`, `--primary`, etc.
- Shadcn-style primitives live in `frontend/src/components/ui/`. Don't fork them per page.
- Forms: prefer `react-hook-form` + Zod. Add `@hookform/resolvers` if absent.
- API calls: use the typed wrappers in `src/lib/api.ts`. Don't add ad-hoc axios calls inside pages.

## Local checks before pushing

```bash
make setup                                       # once after rebasing on main
make verify-deep                                 # lint + typecheck + tests
bash scripts/api-test.sh                         # full live API walk-through
cd frontend && npm run build                     # ensure it bundles
```

> **Prisma gotcha:** because `@prisma/client` is hoisted to the root `node_modules`, the last service to run `prisma generate` "wins". When building or testing one service in isolation, always regenerate first:
>
> ```bash
> (cd services/<name> && npx prisma generate) && make build-<name> && make test-<name>
> ```
>
> `make setup` does this for you in sequence, but mixing `make test-<a>` and `make build-<b>` back-to-back without a `prisma generate` will produce stale-model TypeScript errors.

## Reviewer checklist

- [ ] Branch name follows convention.
- [ ] Commits follow convention; history is rebased/squashed sensibly.
- [ ] No unrelated files changed (`git diff main --stat` is short).
- [ ] Service touched owns the change (no business logic in gateway).
- [ ] If you touched a Prisma model, `prisma/schema.prisma` is in the diff and `prisma generate` was run.
- [ ] If you published/consumed a new event, `docs/ARCHITECTURE.md#rabbitmq` is updated.
- [ ] Error responses match the canonical envelope.
- [ ] `.env.example` is updated when adding a new env var.
- [ ] No new TODOs left in code without an `// TODO(your-name):` prefix.