# Database schema

PostgreSQL 16. One database (`ecommerce`), one user (`postgres`). Each service scopes its Prisma client to its own schema via `?schema=<schema>` in `DATABASE_URL`.

Schemas are created at infra bring-up by `infra/postgres/init-scripts/init-schemas.sql`. Prisma then creates the tables during `make setup`.

The per-service Prisma file is the source of truth for column types. This document summarises the relationship graph and key indexes.

## Schema map

| Schema               | Service       | Key models |
|----------------------|---------------|------------|
| `auth`               | auth          | User, Role, UserRole, Session, LoginAttempt |
| `user_service`       | user          | Profile, Address, Wishlist, WishlistItem, Review, ReviewHelpful |
| `product_service`    | product       | Category, Brand, Product, ProductVariant, Inventory, Warehouse |
| `cart_service`       | cart          | Cart, CartItem, SavedCart |
| `order_schema`       | order         | Order, OrderItem, OrderStatusHistory, Shipment, Refund, Return |
| `payment_service`    | payment       | Payment, Refund |
| `notification_service` | notification | NotificationPreference, Notification, NotificationTemplate, EmailQueue |
| `search_service`     | search        | ProductSearchIndex, SearchLog |
| `admin_service`      | admin         | AdminLog, SystemSetting |
| `gateway`            | gateway       | RateLimit, ApiKey, RouteConfig |

## ER overview

```
auth.User ──┬─ auth.Session
            └─ auth.UserRole ──── auth.Role

user_service.Profile ─── auth.User (by user_id, no FK)
user_service.Address ── auth.User
user_service.Wishlist ── WishlistItem ── (product_id, no FK)
user_service.Review ──── ReviewHelpful

product_service.Category ──┬─ Category (parent_id self-FK)
                           └─ Product ──── ProductVariant ── Inventory ──── Warehouse
product_service.Brand ───── Product

cart_service.Cart ───────── CartItem
cart_service.SavedCart

order_schema.Order ──── OrderItem ──── Product (by id, no FK)
                   └─── OrderStatusHistory
                   └─── Shipment
                   └─── Refund
                   └─── Return

payment_service.Payment ──── Refund
payment_service.Payment.order_id → order_schema.Order.id (no FK cross-schema)

notification_service.Notification ─── NotificationPreference
notification_service.NotificationTemplate
notification_service.EmailQueue

search_service.ProductSearchIndex (mirror of product data)
search_service.SearchLog

admin_service.AdminLog (user_id → auth.User.id, no FK)
admin_service.SystemSetting
```

Cross-schema links (e.g., `Order.userId` ↔ `auth.User.id`) are **intentionally not** foreign keys — Postgres can't enforce them across schemas when you only have one user. Application code resolves them.

## Indexes (selected)

| Schema | Table | Index |
|--------|-------|-------|
| auth | users | `idx_users_email`, `idx_users_username`, `idx_users_verification_token`, `idx_users_seller_status` |
| auth | sessions | `idx_sessions_user_id`, `idx_sessions_token_hash`, `idx_sessions_expires_at` |
| auth | login_attempts | `idx_login_attempts_email`, `idx_login_attempts_ip_address`, `idx_login_attempts_attempt_time` |
| user_service | addresses | `idx_addresses_user_id` |
| user_service | reviews | `idx_reviews_product_id`, `idx_reviews_user_id` |
| product_service | products | `idx_products_sku` (unique), `idx_products_slug` (unique), `idx_products_category_id`, `idx_products_brand_id` |
| product_service | inventory | `idx_inventory_variant_id`, `idx_inventory_warehouse_id` |
| order_schema | orders | `idx_orders_user_id`, `idx_orders_status`, `idx_orders_order_number` (unique) |
| payment_service | payments | `idx_payments_order_id`, `idx_payments_status` |
| notification_service | notifications | `idx_notifications_user_id`, `idx_notifications_read_at` |
| search_service | product_search_index | `idx_search_product_id` (unique) |

## Operational notes

- **Don't enable cross-schema foreign keys** even if Postgres would let you. Application-layer integrity is the contract.
- **`prisma db push` is the dev workflow.** No `prisma/migrations/` directory exists. CI mirrors this; never run `prisma migrate dev` in a feature branch without committing the SQL.
- **Backups:** not configured today. See [RUNBOOK.md](RUNBOOK.md).
- **Connection pooling:** out of scope. Each service opens its own PrismaClient pool. Add PgBouncer if a single service starts to saturate the Postgres `max_connections` ceiling.