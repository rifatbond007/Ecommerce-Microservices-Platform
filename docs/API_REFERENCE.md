# API reference

The platform exposes REST endpoints through the gateway at `http://localhost:3000/api/v1`. Per-service Swagger UIs are linked from `GET /docs` on the gateway. See [SERVICE_LIST.md](SERVICE_LIST.md) for the endpoint catalog and this file for contracts that apply everywhere.

## Conventions

### Versioning

- All endpoints are under `/api/v1`. The `v1` is a literal prefix, not derived.
- When breaking a contract, add a new prefix (`/api/v2`) and keep the old alive for the deprecation window.

### Authentication

```
Authorization: Bearer <jwt-access-token>
```

Endpoints that require auth return `401 Unauthorized` when missing or invalid, `403 Forbidden` when role doesn't allow.

### Query parameters

| Param        | Used for                          | Notes |
|--------------|-----------------------------------|-------|
| `limit`      | list endpoints                    | default `20`, max `100` |
| `page`       | list endpoints                    | 1-based, paired with `limit` |
| `sort`       | list endpoints                    | `<field>:<asc|desc>` |
| `q`          | search endpoints                  | full-text query |
| `categoryId` | product list                      | filter |
| `brandId`    | product list                      | filter |

### Pagination

```json
{ "success": true, "data": { "items": [...], "page": 2, "total": 123, "limit": 20 } }
```

### Idempotency

For write endpoints that fan out to external systems (payment, order create), pass `Idempotency-Key: <uuid>`. The server keeps the response cached for 24h and returns the same response for replayed keys.

### Errors

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Email is required",
    "details": { "field": "email" }
  }
}
```

Common codes: `VALIDATION_ERROR`, `UNAUTHORIZED`, `FORBIDDEN`, `NOT_FOUND`, `CONFLICT`, `RATE_LIMIT_EXCEEDED`, `INTERNAL_SERVER_ERROR`.

## Auth flow

```
Client                  Gateway                Auth Service
  │ POST /api/v1/auth/login (email, password)             │
  ├──────────────────────►│ ───────────────────────────────►│
  │                       │                                │ bcrypt.verify, JWT mint
  │                       │ ◄───────── { accessToken,      │
  │ ◄──── { accessToken, refreshToken, user } ─────────── │
```

Subsequent calls:

```
Client                  Gateway
  │ GET /api/v1/carts                                    │
  ├──────────────────────►│ verify JWT                     │
  │                       │ forward x-user-id              │
  │                       │ proxy → cart service           │
  │ ◄─────────────────────┤                                │
```

Refresh:

```
Client                  Auth Service
  │ POST /api/v1/auth/refresh (refreshToken)             │
  ├──────────────────────────────────────────────────────►│
  │ ◄───── { accessToken, refreshToken } ─────────────────│
```

On `401` from any request, the frontend's interceptor attempts a single refresh; concurrent failed requests share the same `refreshToken` POST and wait for the new access token.

## Pagination and filters — product list

`GET /api/v1/products?limit=20&page=1&categoryId=...&brandId=...&sort=createdAt:desc&minPrice=10&maxPrice=500`

Response:

```json
{
  "success": true,
  "data": {
    "items": [ { "id": "…", "name": "…", "price": 49.99, "images": ["…"] } ],
    "page": 1,
    "total": 123,
    "limit": 20,
    "hasMore": true
  }
}
```

## Cart → order flow

```
1. POST /api/v1/carts                          → cart created/loaded
2. POST /api/v1/carts/items                    → add product
3. POST /api/v1/orders  { cartId, addressId }  → order created, cart flagged as checked-out
4. POST /api/v1/payments/process { orderId, paymentMethod }
                                               → payment record created, status pending → succeeded/failed via webhook
5. Stripe webhook → POST /api/v1/webhooks/stripe → payment status updated, events published
```

## Webhooks

### Stripe

```
POST /api/v1/webhooks/stripe
Stripe-Signature: t=<ts>,v1=<hex-sha256>

<event JSON>
```

The payment service verifies the HMAC against `STRIPE_WEBHOOK_SECRET`. The raw body is captured before `express.json()` runs. Signature failures return `400`.

### Generic

```
POST /api/v1/webhooks/generic
X-Webhook-Source: <provider>
<event JSON>
```

No signature today (no provider integrated). When a second provider is wired, add a `verifyProviderSignature` middleware analogous to the Stripe path.

## Versioning history

- `v1` — current.
