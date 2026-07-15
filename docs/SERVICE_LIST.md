# Service catalog

Every service follows the same layout. Endpoints below are the canonical HTTP surface exposed via the gateway at `/api/v1/...`. To browse live docs, see `/docs` on the running gateway (per-service Swagger UIs).

---

## 1. gateway — port 3000

**Responsibility:** reverse proxy, JWT verification, rate limit, CORS. The single source of CORS truth for the platform.

| Endpoint                          | Notes |
|-----------------------------------|-------|
| `GET /health`                     | liveness |
| `GET /api/v1/routes`              | current routing table |
| `GET /docs`                       | list of per-service Swagger UIs |

Anything else under `/api/v1/...` is forwarded per the routing table — see [ARCHITECTURE.md](ARCHITECTURE.md#gateway-routing-table).

---

## 2. auth — port 3001

**Schema:** `auth` · **Auth:** optional (open for register/login/refresh).

| Method | Path                                | Auth | Purpose |
|--------|-------------------------------------|------|---------|
| POST   | `/api/v1/auth/register`             | no   | Create account (auto-promotes `ADMIN_EMAIL` to role `admin`) |
| POST   | `/api/v1/auth/login`                | no   | Issue access + refresh tokens |
| POST   | `/api/v1/auth/refresh`              | no   | Exchange refresh token for new pair |
| POST   | `/api/v1/auth/logout`               | yes  | Revoke session row |
| POST   | `/api/v1/auth/forgot-password`      | no   | Send reset email |
| POST   | `/api/v1/auth/reset-password`       | no   | Consume reset token |
| POST   | `/api/v1/auth/verify-email`         | no   | Consume verification token |
| POST   | `/api/v1/auth/change-password`      | yes  | Update own password |
| GET    | `/api/v1/auth/me`                   | yes  | Current user profile |
| GET    | `/api/v1/auth/seller/status`        | yes  | Seller approval status |
| POST   | `/api/v1/auth/seller/request`       | yes  | Become a seller |
| GET    | `/api/v1/auth/admin/seller-requests`| yes (admin) | List pending seller requests |
| POST   | `/api/v1/auth/admin/seller-requests/:id/approve` | yes (admin) | Approve |
| POST   | `/api/v1/auth/admin/seller-requests/:id/reject`  | yes (admin) | Reject |
| GET    | `/api/v1/auth/users`                | yes (admin) | List users |
| GET    | `/api/v1/auth/users/:userId`        | yes (admin) | Get user |
| PUT    | `/api/v1/auth/users/:userId`        | yes (admin) | Update user (role, status) |
| DELETE | `/api/v1/auth/users/:userId`        | yes (admin) | Delete user |
| GET    | `/api/v1/auth/sessions`             | yes  | List my sessions |
| DELETE | `/api/v1/auth/sessions/:id`         | yes  | Revoke a specific session |

**Events published:** none.
**Events consumed:** none.
**External deps:** Redis (sessions), SMTP for email.

---

## 3. user — port 3002

**Schema:** `user_service` · **Auth:** required for all routes.

| Method | Path                                       | Purpose |
|--------|--------------------------------------------|---------|
| GET    | `/api/v1/users/me`                         | My profile |
| PUT    | `/api/v1/users/me`                         | Update my profile |
| DELETE | `/api/v1/users/me`                         | Delete account |
| GET    | `/api/v1/users/me/addresses`               | List my addresses |
| POST   | `/api/v1/users/me/addresses`               | Add address |
| PUT    | `/api/v1/users/me/addresses/:id`           | Update address |
| DELETE | `/api/v1/users/me/addresses/:id`           | Delete address |
| POST   | `/api/v1/users/me/addresses/:id/default`   | Set as default |
| GET    | `/api/v1/users/me/wishlists`               | List wishlists |
| POST   | `/api/v1/users/me/wishlists`               | Create wishlist |
| POST   | `/api/v1/users/me/wishlists/:id/items`     | Add product to wishlist |
| DELETE | `/api/v1/users/me/wishlists/:id/items/:productId` | Remove |
| GET    | `/api/v1/users/reviews/product/:productId` | Reviews for a product |
| POST   | `/api/v1/users/me/reviews`                 | Create review |
| POST   | `/api/v1/users/me/reviews/:id/helpful`     | Mark helpful |
| GET    | `/api/v1/sellers/status`                   | My seller status |
| POST   | `/api/v1/sellers/request`                  | Become a seller |

**Events published:** none.
**Events consumed:** none (gateway-forwards `x-user-id`).

---

## 4. product — port 3003

**Schema:** `product_service` · **Auth:** optional (admin write actions require admin).

| Method | Path                                       | Auth |
|--------|--------------------------------------------|------|
| GET    | `/api/v1/products`                         | optional |
| POST   | `/api/v1/products`                         | admin |
| GET    | `/api/v1/products/featured`                | optional |
| GET    | `/api/v1/products/:id`                     | optional |
| GET    | `/api/v1/products/slug/:slug`              | optional |
| PUT    | `/api/v1/products/:id`                     | admin |
| DELETE | `/api/v1/products/:id`                     | admin |
| GET    | `/api/v1/categories`                       | optional |
| POST   | `/api/v1/categories`                       | admin |
| GET    | `/api/v1/categories/tree`                  | optional |
| GET    | `/api/v1/categories/:id`                   | optional |
| PUT    | `/api/v1/categories/:id`                   | admin |
| DELETE | `/api/v1/categories/:id`                   | admin |
| GET    | `/api/v1/brands`                           | optional |
| CRUD   | `/api/v1/brands/:id`                       | admin (write) |
| CRUD   | `/api/v1/variants`                         | admin (write) |
| CRUD   | `/api/v1/inventory`                        | admin (write) |
| POST   | `/api/v1/inventory/adjust`                 | admin |
| POST   | `/api/v1/inventory/reserve`                | internal |
| POST   | `/api/v1/inventory/release`                | internal |
| CRUD   | `/api/v1/warehouses`                       | admin (write) |

**Events published:** planned (`product.created`, `product.updated`, `product.deleted`, `product.inventory_changed`) — see [ARCHITECTURE.md](ARCHITECTURE.md#rabbitmq).
**Cache:** Redis-backed product detail + category tree (TTL in `CACHE_TTL_*` envs).

---

## 5. cart — port 3004

**Schema:** `cart_service` · **Auth:** required.

| Method | Path                                | Purpose |
|--------|-------------------------------------|---------|
| GET    | `/api/v1/carts`                     | Get my active cart |
| POST   | `/api/v1/carts/init`                | Initialise a cart (idempotent) |
| DELETE | `/api/v1/carts/:cartId`             | Delete cart |
| DELETE | `/api/v1/carts/:cartId/clear`       | Remove all items |
| POST   | `/api/v1/carts/items`               | Add an item |
| PUT    | `/api/v1/carts/:cartId/items/:itemId` | Update quantity |
| DELETE | `/api/v1/carts/:cartId/items/:itemId` | Remove item |
| POST   | `/api/v1/carts/:cartId/coupon`      | Apply coupon |
| DELETE | `/api/v1/carts/:cartId/coupon`      | Remove coupon |
| GET    | `/api/v1/saved-carts`               | List saved carts |
| POST   | `/api/v1/saved-carts`               | Save current cart |
| POST   | `/api/v1/saved-carts/:id/restore`   | Restore into a new active cart |
| DELETE | `/api/v1/saved-carts/:id`           | Delete a saved cart |

**Events published:** none today.
**Events consumed:** none.

---

## 6. order — port 3005

**Schema:** `order_schema` · **Auth:** required.

| Method | Path                                 | Purpose |
|--------|--------------------------------------|---------|
| GET    | `/api/v1/orders`                     | My orders |
| GET    | `/api/v1/orders/:id`                 | Order detail |
| GET    | `/api/v1/orders/number/:orderNumber` | Lookup by number |
| POST   | `/api/v1/orders`                     | Create order from cart |
| PUT    | `/api/v1/orders/:id/status`          | Update status (admin) |
| POST   | `/api/v1/orders/:id/cancel`          | Cancel order |
| POST   | `/api/v1/orders/:id/return`          | Request return |

**Events published:** planned (`order.created`, `order.status_changed`) — see [ARCHITECTURE.md](ARCHITECTURE.md#rabbitmq).
**Events consumed:** none.

---

## 7. payment — port 3006

**Schema:** `payment_service` · **Auth:** required for `/payments/*`, none for `/webhooks/*` (verified per-provider).

| Method | Path                                       | Auth |
|--------|--------------------------------------------|------|
| POST   | `/api/v1/payments/process`                 | yes  | Process a payment (Stripe when configured, mock provider otherwise) |
| GET    | `/api/v1/payments`                         | yes  | List my payments |
| GET    | `/api/v1/payments/:id`                     | yes  | Payment detail |
| GET    | `/api/v1/payments/order/:orderId`          | yes  | Payment for a specific order |
| POST   | `/api/v1/payments/:id/refund`              | yes  | Request refund |
| POST   | `/api/v1/webhooks/stripe`                  | no — Stripe-Signature HMAC verified |
| POST   | `/api/v1/webhooks/generic`                 | no — provider secret |

**Events published:** planned (`payment.completed`, `payment.failed`, `payment.refunded`).
**Events consumed:** none wired today.

---

## 8. notification — port 3007

**Schema:** `notification_service` · **Auth:** required.

| Method | Path                                | Purpose |
|--------|-------------------------------------|---------|
| GET    | `/api/v1/notifications`             | List my notifications |
| PUT    | `/api/v1/notifications/:id/read`    | Mark one read |
| PUT    | `/api/v1/notifications/read-all`    | Mark all read |
| DELETE | `/api/v1/notifications/:id`         | Delete |
| DELETE | `/api/v1/notifications`             | Clear all |
| GET    | `/api/v1/notifications/preferences` | Channel / category preferences |
| PUT    | `/api/v1/notifications/preferences` | Update preferences |

**Events published:** planned (`notification.email` for retry workers).
**Events consumed:** planned (`order.*`, `payment.*`, `user.registered`).

---

## 9. search — port 3008

**Schema:** `search_service` · **Auth:** optional.

| Method | Path                                | Purpose |
|--------|-------------------------------------|---------|
| GET    | `/api/v1/search/products?q=...`     | Full-text search |
| GET    | `/api/v1/search/suggestions?q=...`  | Typeahead |
| GET    | `/api/v1/search/trending`           | Top searches |
| POST   | `/api/v1/search/click`              | Log a result click |

**Events published:** none.
**Events consumed:** planned (`product.*`) on `product.events`.

---

## 10. admin — port 3009

**Schema:** `admin_service` · **Auth:** required (admin only).

| Method | Path                                | Purpose |
|--------|-------------------------------------|---------|
| GET    | `/api/v1/admin/dashboard/stats`     | Aggregated stats from other services |
| GET    | `/api/v1/admin/dashboard/activity`  | Recent activity |
| GET    | `/api/v1/admin/users`               | List users |
| PUT    | `/api/v1/admin/users/:id`           | Update user |
| DELETE | `/api/v1/admin/users/:id`           | Delete user |
| GET    | `/api/v1/admin/products`            | List products |
| PUT    | `/api/v1/admin/products/:id`        | Update product |
| DELETE | `/api/v1/admin/products/:id`        | Delete product |
| PATCH  | `/api/v1/admin/products/:id/active` | Toggle active flag |
| PATCH  | `/api/v1/admin/products/:id/featured` | Toggle featured flag |
| GET    | `/api/v1/admin/orders`              | List orders |
| PUT    | `/api/v1/admin/orders/:id/status`   | Update status |
| POST   | `/api/v1/admin/orders/:id/cancel`   | Cancel |
| GET    | `/api/v1/admin/settings`            | Public + private settings |
| GET    | `/api/v1/admin/settings/public`     | Public settings |
| PUT    | `/api/v1/admin/settings`            | Update settings |

**Events published:** none.
**Events consumed:** none.

Admin is intentionally thin — it aggregates from auth/user/product/order/payment via authenticated axios calls.
