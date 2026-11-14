---
name: new-endpoint
description: Checklist for adding or changing an HTTP endpoint in any service of this repo — module layout, zod validation, authn/authz and ownership checks, AppError envelope, gateway route table, api-test.sh, frontend lib/api.ts, swagger, tests. Use whenever adding, renaming, or changing the auth/status/shape of a route.
---

# New or changed endpoint

Work through every step. Most shipped bugs in this repo came from skipping one: a missing gateway entry, a missing ownership check, a frontend path that doesn't exist, or api-test drift.

## 1. Module files

These go in `services/<svc>/src/modules/<feature>/`:

| File | Contains |
|---|---|
| `<feature>.validator.ts` | zod schemas for body, params and query |
| `<feature>.route.ts` | `router.<method>(path, authenticate, [requireX], validate…(schema), controller.fn)` and the `@swagger` JSDoc block |
| `<feature>.controller.ts` | Reads `req.user!.userId`, `req.params` and `req.body`. Calls the service and responds `{ success: true, data }`. Errors go to `next(error)`. |
| `<feature>.service.ts` | Business logic and authorization decisions. Receives `userId` (and `role` when needed) as arguments. |
| `<feature>.types.ts` | Input and response types |
| `index.ts` | Re-exports the routes |

Mount it in `src/routes/index.ts`. **Order matters:** register literal paths such as `/stats`, `/admin` and `/order/:orderId` before `/:id`.

## 2. Validation

Validate every input: `validate(schema)` for the body, `validateParams(schema)` for `:id` params (`z.string().uuid()`), and `validateQuery(schema)` for query strings. These come from `src/utils/validate.ts`.
- Clamp pagination: `limit` gets `.int().min(1).max(100)`.
- Enum-validate any `period`, `status` or `sort`. An unvalidated `period` caused a 500 in user stats.
- **Never accept a price, total, role or owner id from the client.** Look prices up from the product service and take the owner from `req.user`. The cart's client-supplied `unitPrice` is the known bug here.

## 3. Authentication and authorization

- Use `authenticate` for user routes and `optionalAuth` only for genuinely public reads.
- Add `requireAdmin` for any admin action. Refunds, status changes, stats and any change to another user's data all count.
- **Ownership: for every `:id` that belongs to a user** (cart, order, payment, address, review, saved cart), load the record and compare `record.userId === userId`. If it doesn't match, throw `NotFoundError`, so other users' ids aren't revealed. Admins bypass the check through an explicit `role === 'admin'` branch, never by comparing `userId === 'admin'`.
- Seller resources need an owner column (`sellerId`). `requireAdminOrSeller` alone lets any seller edit anything.
- Webhooks must verify the provider signature, including a timestamp tolerance, before any state change. Never add an unauthenticated "generic" webhook.

## 4. Errors

Throw the classes from `@ecommerce/common`, never `res.status(...).json` by hand: `ValidationError` (400), `UnauthorizedError` (401), `ForbiddenError` (403), `NotFoundError` (404), `ConflictError` (409), or `AppError(status, CODE, message)`. The envelope must always be `{ success: false, error: { code, message, details? } }`.

## 5. Gateway route table

In `services/gateway/src/modules/router/router.controller.ts` → `defaultRoutes`:
- A new top-level prefix (e.g. `/api/v1/coupons`) needs a new entry, with `targetService` and `authRequired` set correctly. Without it the gateway returns 404.
- `authRequired: false` makes the whole prefix public at the gateway, so the service must then gate its writes itself.
- Sub-paths under an existing prefix need no gateway change.

## 6. Calls to other services

If the endpoint calls another service, follow the `inter-service-call` skill: signed headers, exact path, and unwrapping `res.data.data`.

## 7. api-test

Add or update lines in `scripts/api-test.sh` for the new route's no-auth and happy-path cases, plus a bad-id case:

```bash
test_endpoint "GET" "/api/v1/<prefix>/${TEST_UUID}" "<desc> bad id" "404" "$TOKEN"
test_endpoint "POST" "/api/v1/<prefix>" "<desc> (no auth)" "401" ""
```

If you change a status code, update every existing expectation for it too. CI's api-test job fails otherwise.

## 8. Frontend

If the UI uses the endpoint, add or update the wrapper in `frontend/src/lib/api.ts` under the matching `xxxApi` object.
- **Confirm the exact path exists** in the service's route file. The seller pages and `/my-reviews` broke because they called routes nobody had written.
- Match the response shape the service really returns. For example, `averageRating` arrives as a string, not a number.

## 9. Docs and tests

- Add the `@swagger` block on the route. If the endpoint is listed in `docs/API_REFERENCE.md` and `docs/SERVICE_LIST.md`, update it there too.
- Add tests in `services/<svc>/tests/` that mock the repository and axios:
  - the happy path
  - validation failure
  - **another user's id returns 404**
  - a non-admin calling an admin route is refused
- Finish with the `verify-service` skill.
