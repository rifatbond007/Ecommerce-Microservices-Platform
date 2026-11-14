---
name: inter-service-call
description: The one correct way for a service in this repo to call another service, and to trust the caller identity it receives — HMAC signing with buildSignedHeaders, path contract, identity headers, envelope unwrapping, error mapping. Use whenever writing or reviewing axios/fetch calls between services, the gateway proxy, auth middleware, or anything touching x-user-* / x-inter-service-* headers.
---

# Inter-service calls

This trust chain has broken in at least four PRs (#9, #10, #11, #16). Follow these steps exactly.

## How trust works

1. The **gateway** checks the JWT. It sets `x-user-id`, `x-user-email` and `x-user-role` from the token. It then signs the request using its `proxyReq` listener (`services/gateway/src/modules/router/router.controller.ts`).
2. Every **service** mounts `verifyInterService` (`src/middleware/inter-service.middleware.ts`) on `/api/v1`. That middleware rejects any request without a valid signature.
3. The service's `authenticate` middleware then trusts the `x-user-*` headers, or calls auth `/api/v1/auth/me` with the Bearer token.

**The signature does not cover the `x-user-*` headers.** Those headers are only as trustworthy as the code that set them. So:
- **The gateway must delete every client-supplied `x-user-*` and `x-internal-*` header before proxying**, and set them only from a verified JWT.
- A service must never read identity from headers on a request that skipped `verifyInterService`.

## Making a call from service A to service B

Always call the target service's own URL from config, e.g. `config.orderService.url`. Never call back through the gateway: that's how admin creates loops.

```ts
import axios from 'axios';
import { buildSignedHeaders } from '../../lib/inter-service';   // bound to this service's config; core lives in packages/inter-service

const path = `/api/v1/orders/${orderId}`;            // full path INCLUDING query string
const res = await axios.get(`${config.orderService.url}${path}`, {
  headers: {
    ...buildSignedHeaders({ method: 'GET', path, body: '' }),
    'x-user-id': userId,                              // only an id you already verified
    'x-user-role': role,                              // never hard-code 'admin' to bypass checks
  },
  timeout: 5000,
});
const order = res.data?.data;                         // unwrap { success, data }
```

**Rules:**
- **`path` must match `req.originalUrl` on the receiving side exactly.** Include `/api/v1/...` and any query string, e.g. `` `/api/v1/orders?status=paid&limit=5` ``. If you also pass `params:` to axios, the signed path and the real URL differ and the signature fails.
- **`body` must be the exact string sent.** For POST, PUT and PATCH, stringify once and send that same string:
  ```ts
  const body = JSON.stringify(payload);
  await axios.post(url + path, body, { headers: { ...buildSignedHeaders({ method: 'POST', path, body }), 'Content-Type': 'application/json' } });
  ```
  Passing an object lets axios re-serialize it, which can change the bytes.
- **Use the method in capitals**, and the same method you actually send.
- **Sign every call.** That includes calls to auth `/me`, health-ish calls and admin stats calls. An unsigned call fails with 401 `UNAUTHORIZED`, and a `.catch(() => 0)` will hide it. Never swallow these errors silently.
- **Unwrap the response once.** Services return `{ success, data }`, so take `res.data.data`. Don't wrap it again in your own `{ success, data }`; the sellers module had that bug.
- **Map errors on purpose.** A 404 from the target becomes your own `NotFoundError`. A 401 or 403 means a signing or config bug: log it and return 503 or 500, not "not found". A network error or timeout becomes `new AppError(503, 'SERVICE_UNAVAILABLE', …)`; only gateway and payment have a `ServiceUnavailableError` class.
- **Set a `timeout`** on every call.

## Receiving identity (the auth middleware)

- Use the `x-user-*` path only after `verifyInterService` has run on that router. Check this in `app.ts` mount order.
- When the request carries no identity, default the role to `'user'`, never anything higher.
- Never add a header that skips verification. `x-internal-admin-call` in admin is this anti-pattern and is a known hole. Remove such headers rather than copy them.
- The JWT payload from auth is `{ userId, email, role }`. Read `userId`, not `id`.

## Config every service needs

These must be the same in all 10 services and the gateway, in both `.env` and `.env.example`:

```
INTER_SERVICE_SECRET=   # openssl rand -base64 48 — services refuse to boot in production with the placeholder
INTER_SERVICE_KEY_ID=v1
INTER_SERVICE_CLOCK_SKEW_SECONDS=60
```

## Testing a new call

Add a case to the calling service's `tests/auth.middleware.test.ts` (or a test next to the new client), following the pattern from #11. Signature algorithm tests live once in `packages/inter-service/tests/`:
1. Mock `axios`.
2. Run the code path.
3. Assert that the outgoing request has a 64-hex `x-inter-service-signature`, and that `verifyInterServiceSignature` accepts it for the same method and path.

Also add one test where the target returns 401, and check that it isn't reported as success or zero.
