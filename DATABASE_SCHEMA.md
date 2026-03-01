# DATABASE_SCHEMA.md

## Overview

This document outlines the database schemas for each microservice in the e-commerce platform. Each service operates with its own PostgreSQL database/schema, maintaining loose coupling across the architecture.

---

## 1. API Gateway

**Database/Schema:** `api_gateway` (Shared Redis for rate limiting)

### Tables

#### rate_limits

| Column | Data Type | Constraints | Description |
|--------|-----------|-------------|-------------|
| id | SERIAL | PRIMARY KEY | Unique identifier |
| identifier | VARCHAR(255) | NOT NULL, UNIQUE | Client identifier (IP/User ID) |
| endpoint | VARCHAR(500) | NOT NULL | API endpoint being rate-limited |
| request_count | INTEGER | NOT NULL DEFAULT 0 | Number of requests in window |
| window_start | TIMESTAMP | NOT NULL | Start of current rate limit window |
| window_duration | INTEGER | NOT NULL DEFAULT 60 | Window duration in seconds |
| created_at | TIMESTAMP | NOT NULL DEFAULT NOW() | Record creation time |
| updated_at | TIMESTAMP | NOT NULL DEFAULT NOW() | Last update time |

**Indexes:**
- `idx_rate_limits_identifier_endpoint` ON (identifier, endpoint)
- `idx_rate_limits_window_start` ON (window_start)

#### api_keys

| Column | Data Type | Constraints | Description |
|--------|-----------|-------------|-------------|
| id | SERIAL | PRIMARY KEY | Unique identifier |
| key_hash | VARCHAR(255) | NOT NULL, UNIQUE | SHA-256 hash of API key |
| service_name | VARCHAR(100) | NOT NULL | Associated service name |
| permissions | JSONB | NOT NULL DEFAULT '[]' | Array of permitted actions |
| rate_limit | INTEGER | NOT NULL DEFAULT 1000 | Requests per hour |
| is_active | BOOLEAN | NOT NULL DEFAULT true | Key active status |
| expires_at | TIMESTAMP | NULLABLE | Key expiration date |
| last_used_at | TIMESTAMP | NULLABLE | Last usage timestamp |
| created_at | TIMESTAMP | NOT NULL DEFAULT NOW() | Record creation time |

**Indexes:**
- `idx_api_keys_key_hash` ON (key_hash)
- `idx_api_keys_service_name` ON (service_name)

#### route_configs

| Column | Data Type | Constraints | Description |
|--------|-----------|-------------|-------------|
| id | SERIAL | PRIMARY KEY | Unique identifier |
| path | VARCHAR(500) | NOT NULL, UNIQUE | API route path |
| method | VARCHAR(10) | NOT NULL | HTTP method |
| target_service | VARCHAR(100) | NOT NULL | Target microservice |
| target_url | VARCHAR(500) | NOT NULL | Target service URL |
| timeout | INTEGER | NOT NULL DEFAULT 30000 | Request timeout in ms |
| retry_attempts | INTEGER | NOT NULL DEFAULT 3 | Number of retries |
| circuit_breaker_threshold | INTEGER | NOT NULL DEFAULT 5 | Failure threshold |
| auth_required | BOOLEAN | NOT NULL DEFAULT true | Authentication required |
| rate_limit | INTEGER | NULLABLE | Custom rate limit |
| created_at | TIMESTAMP | NOT NULL DEFAULT NOW() | Record creation time |
| updated_at | TIMESTAMP | NOT NULL DEFAULT NOW() | Last update time |

**Indexes:**
- `idx_route_configs_path_method` ON (path, method)

### Redis Cache Keys

| Key Pattern | Type | TTL | Description |
|------------|------|-----|-------------|
| `rate_limit:{identifier}:{endpoint}` | STRING | Window duration | Rate limit counter |
| `circuit_breaker:{service}` | STRING | 30s | Circuit breaker state |
| `service_discovery` | HASH | 60s | Service endpoint cache |

---

## 2. Auth Service

**Database/Schema:** `auth_service`

### Tables

#### users

| Column | Data Type | Constraints | Description |
|--------|-----------|-------------|-------------|
| id | UUID | PRIMARY KEY DEFAULT gen_random_uuid() | Unique user identifier |
| email | VARCHAR(255) | NOT NULL, UNIQUE | User email address |
| password_hash | VARCHAR(255) | NOT NULL | Bcrypt hashed password |
| username | VARCHAR(100) | NOT NULL, UNIQUE | Username |
| first_name | VARCHAR(100) | NOT NULL | First name |
| last_name | VARCHAR(100) | NOT NULL | Last name |
| phone | VARCHAR(20) | NULLABLE | Phone number |
| avatar_url | VARCHAR(500) | NULLABLE | Profile picture URL |
| is_active | BOOLEAN | NOT NULL DEFAULT true | Account active status |
| is_verified | BOOLEAN | NOT NULL DEFAULT false | Email verified status |
| verification_token | VARCHAR(255) | NULLABLE | Email verification token |
| reset_password_token | VARCHAR(255) | NULLABLE | Password reset token |
| reset_password_expires | TIMESTAMP | NULLABLE | Reset token expiration |
| failed_login_attempts | INTEGER | NOT NULL DEFAULT 0 | Failed login count |
| locked_until | TIMESTAMP | NULLABLE | Account lockout until |
| last_login_at | TIMESTAMP | NULLABLE | Last login timestamp |
| created_at | TIMESTAMP | NOT NULL DEFAULT NOW() | Record creation time |
| updated_at | TIMESTAMP | NOT NULL DEFAULT NOW() | Last update time |

**Indexes:**
- `idx_users_email` ON (email)
- `idx_users_username` ON (username)
- `idx_users_verification_token` ON (verification_token)

#### roles

| Column | Data Type | Constraints | Description |
|--------|-----------|-------------|-------------|
| id | SERIAL | PRIMARY KEY | Unique identifier |
| name | VARCHAR(50) | NOT NULL, UNIQUE | Role name |
| description | TEXT | NULLABLE | Role description |
| permissions | JSONB | NOT NULL DEFAULT '[]' | Array of permissions |
| created_at | TIMESTAMP | NOT NULL DEFAULT NOW() | Record creation time |
| updated_at | TIMESTAMP | NOT NULL DEFAULT NOW() | Last update time |

**Indexes:**
- `idx_roles_name` ON (name)

#### user_roles

| Column | Data Type | Constraints | Description |
|--------|-----------|-------------|-------------|
| id | SERIAL | PRIMARY KEY | Unique identifier |
| user_id | UUID | NOT NULL, REFERENCES users(id) ON DELETE CASCADE | User ID |
| role_id | INTEGER | NOT NULL, REFERENCES roles(id) ON DELETE CASCADE | Role ID |
| assigned_at | TIMESTAMP | NOT NULL DEFAULT NOW() | Assignment timestamp |
| assigned_by | UUID | NULLABLE, REFERENCES users(id) | Assigned by user |

**Indexes:**
- `idx_user_roles_user_id` ON (user_id)
- `idx_user_roles_role_id` ON (role_id)
- `UNIQUE(user_id, role_id)` ON (user_id, role_id)

#### sessions

| Column | Data Type | Constraints | Description |
|--------|-----------|-------------|-------------|
| id | UUID | PRIMARY KEY DEFAULT gen_random_uuid() | Unique session identifier |
| user_id | UUID | NOT NULL, REFERENCES users(id) ON DELETE CASCADE | User ID |
| token_hash | VARCHAR(255) | NOT NULL, UNIQUE | Hashed refresh token |
| device_info | JSONB | NULLABLE | Device information |
| ip_address | VARCHAR(45) | NULLABLE | Client IP address |
| user_agent | TEXT | NULLABLE | Client user agent |
| expires_at | TIMESTAMP | NOT NULL | Session expiration |
| created_at | TIMESTAMP | NOT NULL DEFAULT NOW() | Record creation time |
| last_activity_at | TIMESTAMP | NOT NULL DEFAULT NOW() | Last activity timestamp |

**Indexes:**
- `idx_sessions_user_id` ON (user_id)
- `idx_sessions_token_hash` ON (token_hash)
- `idx_sessions_expires_at` ON (expires_at)

#### login_attempts

| Column | Data Type | Constraints | Description |
|--------|-----------|-------------|-------------|
| id | SERIAL | PRIMARY KEY | Unique identifier |
| email | VARCHAR(255) | NOT NULL | Attempted email |
| ip_address | VARCHAR(45) | NOT NULL | Client IP |
| success | BOOLEAN | NOT NULL | Login success status |
| attempt_time | TIMESTAMP | NOT NULL DEFAULT NOW() | Attempt timestamp |
| user_agent | TEXT | NULLABLE | Client user agent |

**Indexes:**
- `idx_login_attempts_email` ON (email)
- `idx_login_attempts_ip_address` ON (ip_address)
- `idx_login_attempts_attempt_time` ON (attempt_time)

### Relationships

- **users** 1:N **user_roles** (One user can have multiple roles)
- **user_roles** N:1 **roles** (Multiple users can have the same role)
- **user_roles** N:1 **users** (Assigned by user reference)
- **sessions** N:1 **users** (One user can have multiple sessions)

### Redis Cache Keys

| Key Pattern | Type | TTL | Description |
|------------|------|-----|-------------|
| `user:{userId}` | HASH | 5min | User profile cache |
| `session:{tokenHash}` | STRING | Session TTL | Active session |
| `email_verify:{token}` | STRING | 24h | Email verification token |
| `password_reset:{token}` | STRING | 1h | Password reset token |
| `role:{roleId}` | HASH | 30min | Role permissions cache |

### Cross-Service Reference Strategy

- Other services reference users by `user_id` (UUID) stored in their own databases
- Auth Service exposes REST/GraphQL endpoints for user validation
- JWT tokens contain user_id claims for stateless authentication
- Event-driven updates via RabbitMQ when user data changes

---

## 3. User Service

**Database/Schema:** `user_service`

### Tables

#### profiles

| Column | Data Type | Constraints | Description |
|--------|-----------|-------------|-------------|
| id | UUID | PRIMARY KEY DEFAULT gen_random_uuid() | Unique profile identifier |
| user_id | UUID | NOT NULL, UNIQUE | Reference to auth_service.users |
| date_of_birth | DATE | NULLABLE | Date of birth |
| gender | VARCHAR(20) | NULLABLE | Gender |
| language | VARCHAR(10) | NOT NULL DEFAULT 'en' | Preferred language |
| timezone | VARCHAR(50) | NOT NULL DEFAULT 'UTC' | User timezone |
| currency | VARCHAR(3) | NOT NULL DEFAULT 'USD' | Preferred currency |
| bio | TEXT | NULLABLE | User biography |
| website | VARCHAR(255) | NULLABLE | Personal website |
| company | VARCHAR(255) | NULLABLE | Company name |
| job_title | VARCHAR(100) | NULLABLE | Job title |
| newsletter_subscribed | BOOLEAN | NOT NULL DEFAULT false | Newsletter subscription |
| notification_preferences | JSONB | NOT NULL DEFAULT '{}' | Notification settings |
| created_at | TIMESTAMP | NOT NULL DEFAULT NOW() | Record creation time |
| updated_at | TIMESTAMP | NOT NULL DEFAULT NOW() | Last update time |

**Indexes:**
- `idx_profiles_user_id` ON (user_id)

#### addresses

| Column | Data Type | Constraints | Description |
|--------|-----------|-------------|-------------|
| id | UUID | PRIMARY KEY DEFAULT gen_random_uuid() | Unique address identifier |
| user_id | UUID | NOT NULL | Reference to auth_service.users |
| type | VARCHAR(20) | NOT NULL DEFAULT 'shipping' | Address type (billing/shipping) |
| is_default | BOOLEAN | NOT NULL DEFAULT false | Default address flag |
| first_name | VARCHAR(100) | NOT NULL | First name |
| last_name | VARCHAR(100) | NOT NULL | Last name |
| company | VARCHAR(255) | NULLABLE | Company name |
| address_line1 | VARCHAR(255) | NOT NULL | Street address |
| address_line2 | VARCHAR(255) | NULLABLE | Apartment, suite, etc. |
| city | VARCHAR(100) | NOT NULL | City |
| state | VARCHAR(100) | NOT NULL | State/Province |
| postal_code | VARCHAR(20) | NOT NULL | Postal code |
| country | VARCHAR(2) | NOT NULL | Country code (ISO 3166-1) |
| phone | VARCHAR(20) | NULLABLE | Contact phone |
| delivery_instructions | TEXT | NULLABLE | Delivery notes |
| created_at | TIMESTAMP | NOT NULL DEFAULT NOW() | Record creation time |
| updated_at | TIMESTAMP | NOT NULL DEFAULT NOW() | Last update time |

**Indexes:**
- `idx_addresses_user_id` ON (user_id)
- `idx_addresses_user_id_type` ON (user_id, type)

#### wishlists

| Column | Data Type | Constraints | Description |
|--------|-----------|-------------|-------------|
| id | UUID | PRIMARY KEY DEFAULT gen_random_uuid() | Unique wishlist identifier |
| user_id | UUID | NOT NULL | Reference to auth_service.users |
| name | VARCHAR(100) | NOT NULL DEFAULT 'My Wishlist' | Wishlist name |
| is_public | BOOLEAN | NOT NULL DEFAULT false | Public visibility |
| created_at | TIMESTAMP | NOT NULL DEFAULT NOW() | Record creation time |
| updated_at | TIMESTAMP | NOT NULL DEFAULT NOW() | Last update time |

**Indexes:**
- `idx_wishlists_user_id` ON (user_id)

#### wishlist_items

| Column | Data Type | Constraints | Description |
|--------|-----------|-------------|-------------|
| id | UUID | PRIMARY KEY DEFAULT gen_random_uuid() | Unique item identifier |
| wishlist_id | UUID | NOT NULL, REFERENCES wishlists(id) ON DELETE CASCADE | Wishlist ID |
| product_id | UUID | NOT NULL | Reference to product_service.products |
| variant_id | UUID | NULLABLE | Reference to product_service.product_variants |
| notes | TEXT | NULLABLE | Item notes |
| priority | INTEGER | NOT NULL DEFAULT 0 | Item priority |
| added_at | TIMESTAMP | NOT NULL DEFAULT NOW() | Added timestamp |

**Indexes:**
- `idx_wishlist_items_wishlist_id` ON (wishlist_id)
- `idx_wishlist_items_product_id` ON (product_id)
- `UNIQUE(wishlist_id, product_id, variant_id)` ON (wishlist_id, product_id, variant_id)

#### reviews

| Column | Data Type | Constraints | Description |
|--------|-----------|-------------|-------------|
| id | UUID | PRIMARY KEY DEFAULT gen_random_uuid() | Unique review identifier |
| user_id | UUID | NOT NULL | Reference to auth_service.users |
| product_id | UUID | NOT NULL | Reference to product_service.products |
| order_id | UUID | NULLABLE | Reference to order_service.orders |
| rating | INTEGER | NOT NULL CHECK (rating >= 1 AND rating <= 5) | Star rating (1-5) |
| title | VARCHAR(255) | NOT NULL | Review title |
| content | TEXT | NOT NULL | Review content |
| images | JSONB | NOT NULL DEFAULT '[]' | Array of image URLs |
| is_verified_purchase | BOOLEAN | NOT NULL DEFAULT false | Verified purchase flag |
| is_approved | BOOLEAN | NOT NULL DEFAULT false | Admin approval status |
| helpful_count | INTEGER | NOT NULL DEFAULT 0 | Helpful votes |
| created_at | TIMESTAMP | NOT NULL DEFAULT NOW() | Record creation time |
| updated_at | TIMESTAMP | NOT NULL DEFAULT NOW() | Last update time |

**Indexes:**
- `idx_reviews_user_id` ON (user_id)
- `idx_reviews_product_id` ON (product_id)
- `idx_reviews_order_id` ON (order_id)
- `idx_reviews_product_rating` ON (product_id, rating)

#### review_helpful

| Column | Data Type | Constraints | Description |
|--------|-----------|-------------|-------------|
| id | SERIAL | PRIMARY KEY | Unique identifier |
| review_id | UUID | NOT NULL, REFERENCES reviews(id) ON DELETE CASCADE | Review ID |
| user_id | UUID | NOT NULL | User who voted |
| created_at | TIMESTAMP | NOT NULL DEFAULT NOW() | Vote timestamp |

**Indexes:**
- `UNIQUE(review_id, user_id)` ON (review_id, user_id)

### Relationships

- **profiles** 1:1 **auth_service.users** (One profile per user)
- **addresses** N:1 **auth_service.users** (One user can have multiple addresses)
- **wishlists** N:1 **auth_service.users** (One user can have multiple wishlists)
- **wishlist_items** N:1 **wishlists** (One wishlist can have multiple items)
- **reviews** N:1 **auth_service.users** (One user can write multiple reviews)
- **reviews** N:1 **product_service.products** (One product can have multiple reviews)
- **review_helpful** N:1 **reviews** (One review can have multiple helpful votes)

### Redis Cache Keys

| Key Pattern | Type | TTL | Description |
|------------|------|-----|-------------|
| `profile:{userId}` | HASH | 10min | User profile cache |
| `addresses:{userId}` | LIST | 5min | User addresses |
| `wishlist:{wishlistId}` | HASH | 5min | Wishlist with items |
| `review:{reviewId}` | HASH | 10min | Review with user info |

### Cross-Service Reference Strategy

- Store only `user_id` (UUID) from auth_service
- Store `product_id` (UUID) references to product_service
- Store `order_id` (UUID) references to order_service
- Use event-driven updates when referenced entities change

---

## 4. Product Service

**Database/Schema:** `product_service`

### Tables

#### categories

| Column | Data Type | Constraints | Description |
|--------|-----------|-------------|-------------|
| id | UUID | PRIMARY KEY DEFAULT gen_random_uuid() | Unique category identifier |
| parent_id | UUID | NULLABLE, REFERENCES categories(id) ON DELETE SET NULL | Parent category |
| name | VARCHAR(100) | NOT NULL | Category name |
| slug | VARCHAR(100) | NOT NULL, UNIQUE | URL-friendly slug |
| description | TEXT | NULLABLE | Category description |
| image_url | VARCHAR(500) | NULLABLE | Category image |
| display_order | INTEGER | NOT NULL DEFAULT 0 | Sort order |
| is_active | BOOLEAN | NOT NULL DEFAULT true | Active status |
| created_at | TIMESTAMP | NOT NULL DEFAULT NOW() | Record creation time |
| updated_at | TIMESTAMP | NOT NULL DEFAULT NOW() | Last update time |

**Indexes:**
- `idx_categories_slug` ON (slug)
- `idx_categories_parent_id` ON (parent_id)

#### brands

| Column | Data Type | Constraints | Description |
|--------|-----------|-------------|-------------|
| id | UUID | PRIMARY KEY DEFAULT gen_random_uuid() | Unique brand identifier |
| name | VARCHAR(100) | NOT NULL, UNIQUE | Brand name |
| slug | VARCHAR(100) | NOT NULL, UNIQUE | URL-friendly slug |
| description | TEXT | NULLABLE | Brand description |
| logo_url | VARCHAR(500) | NULLABLE | Brand logo |
| website | VARCHAR(255) | NULLABLE | Brand website |
| is_active | BOOLEAN | NOT NULL DEFAULT true | Active status |
| created_at | TIMESTAMP | NOT NULL DEFAULT NOW() | Record creation time |
| updated_at | TIMESTAMP | NOT NULL DEFAULT NOW() | Last update time |

**Indexes:**
- `idx_brands_slug` ON (slug)

#### products

| Column | Data Type | Constraints | Description |
|--------|-----------|-------------|-------------|
| id | UUID | PRIMARY KEY DEFAULT gen_random_uuid() | Unique product identifier |
| sku | VARCHAR(50) | NOT NULL, UNIQUE | Stock keeping unit |
| name | VARCHAR(255) | NOT NULL | Product name |
| slug | VARCHAR(255) | NOT NULL, UNIQUE | URL-friendly slug |
| description | TEXT | NULLABLE | Product description |
| category_id | UUID | NOT NULL, REFERENCES categories(id) | Category ID |
| brand_id | UUID | NULLABLE, REFERENCES brands(id) | Brand ID |
| base_price | DECIMAL(12, 2) | NOT NULL | Base price |
| compare_at_price | DECIMAL(12, 2) | NULLABLE | Compare at price (for discounts) |
| cost_per_item | DECIMAL(12, 2) | NULLABLE | Cost per item |
| weight | DECIMAL(10, 2) | NULLABLE | Weight in grams |
| requires_shipping | BOOLEAN | NOT NULL DEFAULT true | Shipping required |
| is_taxable | BOOLEAN | NOT NULL DEFAULT true | Tax applicable |
| tax_rate | DECIMAL(5, 4) | NULLABLE | Tax rate percentage |
| tags | JSONB | NOT NULL DEFAULT '[]' | Product tags |
| images | JSONB | NOT NULL DEFAULT '[]' | Product images |
| video_url | VARCHAR(500) | NULLABLE | Product video URL |
| meta_title | VARCHAR(70) | NULLABLE | SEO title |
| meta_description | VARCHAR(160) | NULLABLE | SEO description |
| total_sold | INTEGER | NOT NULL DEFAULT 0 | Units sold |
| total_revenue | DECIMAL(14, 2) | NOT NULL DEFAULT 0 | Total revenue |
| average_rating | DECIMAL(3, 2) | NOT NULL DEFAULT 0 | Average review rating |
| review_count | INTEGER | NOT NULL DEFAULT 0 | Number of reviews |
| is_active | BOOLEAN | NOT NULL DEFAULT true | Active status |
| is_featured | BOOLEAN | NOT NULL DEFAULT false | Featured product |
| created_at | TIMESTAMP | NOT NULL DEFAULT NOW() | Record creation time |
| updated_at | TIMESTAMP | NOT NULL DEFAULT NOW() | Last update time |

**Indexes:**
- `idx_products_sku` ON (sku)
- `idx_products_slug` ON (slug)
- `idx_products_category_id` ON (category_id)
- `idx_products_brand_id` ON (brand_id)
- `idx_products_is_active` ON (is_active)
- `idx_products_is_featured` ON (is_featured)
- `idx_products_base_price` ON (base_price)
- `idx_products_name` ON (name) – Full-text search

#### product_variants

| Column | Data Type | Constraints | Description |
|--------|-----------|-------------|-------------|
| id | UUID | PRIMARY KEY DEFAULT gen_random_uuid() | Unique variant identifier |
| product_id | UUID | NOT NULL, REFERENCES products(id) ON DELETE CASCADE | Product ID |
| sku | VARCHAR(50) | NOT NULL, UNIQUE | Variant SKU |
| name | VARCHAR(255) | NOT NULL | Variant name (e.g., "Blue / Large") |
| price | DECIMAL(12, 2) | NOT NULL | Variant price |
| compare_at_price | DECIMAL(12, 2) | NULLABLE | Compare at price |
| cost_per_item | DECIMAL(12, 2) | NULLABLE | Cost per item |
| inventory_quantity | INTEGER | NOT NULL DEFAULT 0 | Stock quantity |
| inventory_policy | VARCHAR(20) | NOT NULL DEFAULT 'deny' | 'deny' or 'continue' |
| weight | DECIMAL(10, 2) | NULLABLE | Weight in grams |
| barcode | VARCHAR(50) | NULLABLE | Barcode/UPC |
| image_id | UUID | NULLABLE | Reference to product_images |
| is_active | BOOLEAN | NOT NULL DEFAULT true | Active status |
| created_at | TIMESTAMP | NOT NULL DEFAULT NOW() | Record creation time |
| updated_at | TIMESTAMP | NOT NULL DEFAULT NOW() | Last update time |

**Indexes:**
- `idx_product_variants_sku` ON (sku)
- `idx_product_variants_product_id` ON (product_id)
- `idx_product_variants_is_active` ON (is_active)

#### product_images

| Column | Data Type | Constraints | Description |
|--------|-----------|-------------|-------------|
| id | UUID | PRIMARY KEY DEFAULT gen_random_uuid() | Unique image identifier |
| product_id | UUID | NOT NULL, REFERENCES products(id) ON DELETE CASCADE | Product ID |
| variant_id | UUID | NULLABLE, REFERENCES product_variants(id) ON DELETE CASCADE | Variant ID |
| url | VARCHAR(500) | NOT NULL | Image URL |
| alt_text | VARCHAR(255) | NULLABLE | Alt text |
| position | INTEGER | NOT NULL DEFAULT 0 | Display order |
| created_at | TIMESTAMP | NOT NULL DEFAULT NOW() | Record creation time |

**Indexes:**
- `idx_product_images_product_id` ON (product_id)
- `idx_product_images_variant_id` ON (variant_id)

#### product_options

| Column | Data Type | Constraints | Description |
|--------|-----------|-------------|-------------|
| id | UUID | PRIMARY KEY DEFAULT gen_random_uuid() | Unique option identifier |
| product_id | UUID | NOT NULL, REFERENCES products(id) ON DELETE CASCADE | Product ID |
| name | VARCHAR(100) | NOT NULL | Option name (e.g., "Size", "Color") |
| position | INTEGER | NOT NULL DEFAULT 0 | Display order |
| created_at | TIMESTAMP | NOT NULL DEFAULT NOW() | Record creation time |

**Indexes:**
- `idx_product_options_product_id` ON (product_id)

#### product_option_values

| Column | Data Type | Constraints | Description |
|--------|-----------|-------------|-------------|
| id | UUID | PRIMARY KEY DEFAULT gen_random_uuid() | Unique value identifier |
| option_id | UUID | NOT NULL, REFERENCES product_options(id) ON DELETE CASCADE | Option ID |
| value | VARCHAR(100) | NOT NULL | Value (e.g., "Blue", "Large") |
| position | INTEGER | NOT NULL DEFAULT 0 | Display order |
| created_at | TIMESTAMP | NOT NULL DEFAULT NOW() | Record creation time |

**Indexes:**
- `idx_product_option_values_option_id` ON (option_id)

#### product_variant_options

| Column | Data Type | Constraints | Description |
|--------|-----------|-------------|-------------|
| id | UUID | PRIMARY KEY DEFAULT gen_random_uuid() | Unique identifier |
| variant_id | UUID | NOT NULL, REFERENCES product_variants(id) ON DELETE CASCADE | Variant ID |
| option_id | UUID | NOT NULL, REFERENCES product_options(id) ON DELETE CASCADE | Option ID |
| option_value_id | UUID | NOT NULL, REFERENCES product_option_values(id) ON DELETE CASCADE | Value ID |
| created_at | TIMESTAMP | NOT NULL DEFAULT NOW() | Record creation time |

**Indexes:**
- `idx_product_variant_options_variant_id` ON (variant_id)
- `UNIQUE(variant_id, option_id)` ON (variant_id, option_id)

#### inventories

| Column | Data Type | Constraints | Description |
|--------|-----------|-------------|-------------|
| id | UUID | PRIMARY KEY DEFAULT gen_random_uuid() | Unique inventory identifier |
| product_id | UUID | NOT NULL, REFERENCES products(id) ON DELETE CASCADE | Product ID |
| variant_id | UUID | NULLABLE, REFERENCES product_variants(id) ON DELETE CASCADE | Variant ID |
| warehouse_id | UUID | NOT NULL | Warehouse ID |
| quantity | INTEGER | NOT NULL DEFAULT 0 | Available quantity |
| reserved_quantity | INTEGER | NOT NULL DEFAULT 0 | Reserved quantity |
| reorder_point | INTEGER | NOT NULL DEFAULT 10 | Reorder threshold |
| reorder_quantity | INTEGER | NULLABLE | Suggested reorder amount |
| last_restocked_at | TIMESTAMP | NULLABLE | Last restock timestamp |
| created_at | TIMESTAMP | NOT NULL DEFAULT NOW() | Record creation time |
| updated_at | TIMESTAMP | NOT NULL DEFAULT NOW() | Last update time |

**Indexes:**
- `idx_inventories_product_id` ON (product_id)
- `idx_inventories_variant_id` ON (variant_id)
- `idx_inventories_warehouse_id` ON (warehouse_id)

#### warehouses

| Column | Data Type | Constraints | Description |
|--------|-----------|-------------|-------------|
| id | UUID | PRIMARY KEY DEFAULT gen_random_uuid() | Unique warehouse identifier |
| name | VARCHAR(100) | NOT NULL | Warehouse name |
| code | VARCHAR(20) | NOT NULL, UNIQUE | Warehouse code |
| address_line1 | VARCHAR(255) | NOT NULL | Street address |
| address_line2 | VARCHAR(255) | NULLABLE | Address line 2 |
| city | VARCHAR(100) | NOT NULL | City |
| state | VARCHAR(100) | NOT NULL | State/Province |
| postal_code | VARCHAR(20) | NOT NULL | Postal code |
| country | VARCHAR(2) | NOT NULL | Country code |
| is_active | BOOLEAN | NOT NULL DEFAULT true | Active status |
| created_at | TIMESTAMP | NOT NULL DEFAULT NOW() | Record creation time |
| updated_at | TIMESTAMP | NOT NULL DEFAULT NOW() | Last update time |

**Indexes:**
- `idx_warehouses_code` ON (code)

### Relationships

- **products** N:1 **categories** (Many products in one category)
- **products** N:1 **brands** (Many products from one brand)
- **categories** 1:N **categories** (Self-referential for subcategories)
- **product_variants** N:1 **products** (Many variants per product)
- **product_images** N:1 **products** (Many images per product)
- **product_images** N:1 **product_variants** (Optional variant image)
- **product_options** N:1 **products** (Many options per product)
- **product_option_values** N:1 **product_options** (Many values per option)
- **product_variant_options** N:1 **product_variants** (Links variants to option values)
- **inventories** N:1 **products** (Inventory per product)
- **inventories** N:1 **product_variants** (Optional variant inventory)
- **inventories** N:1 **warehouses** (Inventory per warehouse)

### Redis Cache Keys

| Key Pattern | Type | TTL | Description |
|------------|------|-----|-------------|
| `product:{productId}` | HASH | 10min | Product details |
| `product:slug:{slug}` | STRING | 10min | Product by slug |
| `category:{categoryId}` | HASH | 30min | Category with children |
| `brand:{brandId}` | HASH | 30min | Brand details |
| `product:inventory:{productId}:{warehouseId}` | STRING | 5min | Inventory level |
| `product:search:{queryHash}` | HASH | 5min | Search results |
| `product:featured` | SET | 15min | Featured product IDs |
| `product:new_arrivals` | LIST | 15min | New arrival products |

### Cross-Service Reference Strategy

- Store `category_id` (UUID) for categories
- Store `brand_id` (UUID) for brands
- Cart/Order services store `product_id` and `variant_id`
- User service stores `product_id` for wishlists and reviews
- Search service maintains denormalized product index

---

## 5. Cart Service

**Database/Schema:** `cart_service`

### Tables

#### carts

| Column | Data Type | Constraints | Description |
|--------|-----------|-------------|-------------|
| id | UUID | PRIMARY KEY DEFAULT gen_random_uuid() | Unique cart identifier |
| session_id | UUID | NULLABLE | Anonymous session ID |
| user_id | UUID | NULLABLE, REFERENCES auth_service.users(id) | Authenticated user |
| currency | VARCHAR(3) | NOT NULL DEFAULT 'USD' | Cart currency |
| subtotal | DECIMAL(12, 2) | NOT NULL DEFAULT 0 | Items subtotal |
| tax_total | DECIMAL(12, 2) | NOT NULL DEFAULT 0 | Tax amount |
| shipping_total | DECIMAL(12, 2) | NOT NULL DEFAULT 0 | Shipping amount |
| discount_total | DECIMAL(12, 2) | NOT NULL DEFAULT 0 | Discount amount |
| total | DECIMAL(12, 2) | NOT NULL DEFAULT 0 | Grand total |
| coupon_code | VARCHAR(50) | NULLABLE | Applied coupon |
| created_at | TIMESTAMP | NOT NULL DEFAULT NOW() | Record creation time |
| updated_at | TIMESTAMP | NOT NULL DEFAULT NOW() | Last update time |

**Indexes:**
- `idx_carts_session_id` ON (session_id)
- `idx_carts_user_id` ON (user_id)
- `idx_carts_updated_at` ON (updated_at)

#### cart_items

| Column | Data Type | Constraints | Description |
|--------|-----------|-------------|-------------|
| id | UUID | PRIMARY KEY DEFAULT gen_random_uuid() | Unique item identifier |
| cart_id | UUID | NOT NULL, REFERENCES carts(id) ON DELETE CASCADE | Cart ID |
| product_id | UUID | NOT NULL | Reference to product_service.products |
| variant_id | UUID | NULLABLE | Reference to product_service.product_variants |
| quantity | INTEGER | NOT NULL | Item quantity |
| unit_price | DECIMAL(12, 2) | NOT NULL | Price at add time |
| total_price | DECIMAL(12, 2) | NOT NULL | Line total |
| created_at | TIMESTAMP | NOT NULL DEFAULT NOW() | Record creation time |
| updated_at | TIMESTAMP | NOT NULL DEFAULT NOW() | Last update time |

**Indexes:**
- `idx_cart_items_cart_id` ON (cart_id)
- `idx_cart_items_product_id` ON (product_id)
- `idx_cart_items_variant_id` ON (variant_id)

#### saved_carts

| Column | Data Type | Constraints | Description |
|--------|-----------|-------------|-------------|
| id | UUID | PRIMARY KEY DEFAULT gen_random_uuid() | Unique saved cart identifier |
| user_id | UUID | NOT NULL, REFERENCES auth_service.users(id) | User ID |
| name | VARCHAR(100) | NOT NULL | Cart name |
| items | JSONB | NOT NULL DEFAULT '[]' | Serialized cart items |
| original_cart_id | UUID | NULLABLE | Original cart reference |
| created_at | TIMESTAMP | NOT NULL DEFAULT NOW() | Record creation time |
| updated_at | TIMESTAMP | NOT NULL DEFAULT NOW() | Last update time |

**Indexes:**
- `idx_saved_carts_user_id` ON (user_id)

### Relationships

- **carts** 1:1 **auth_service.users** (Optional user association)
- **cart_items** N:1 **carts** (Many items per cart)
- **saved_carts** N:1 **auth_service.users** (One user can have multiple saved carts)

### Redis Cache Keys

| Key Pattern | Type | TTL | Description |
|------------|------|-----|-------------|
| `cart:{cartId}` | HASH | 24h | Active cart data |
| `cart:session:{sessionId}` | STRING | 24h | Cart by session |
| `cart:user:{userId}` | STRING | 24h | User's active cart |
| `cart:lock:{cartId}` | STRING | 10s | Cart edit lock |

### Cross-Service Reference Strategy

- Store `product_id` (UUID) and `variant_id` (UUID) references to product_service
- User reference via `user_id` to auth_service
- Use RabbitMQ to sync cart changes with order_service

---

## 6. Order Service

**Database/Schema:** `order_service`

### Tables

#### orders

| Column | Data Type | Constraints | Description |
|--------|-----------|-------------|-------------|
| id | UUID | PRIMARY KEY DEFAULT gen_random_uuid() | Unique order identifier |
| order_number | VARCHAR(20) | NOT NULL, UNIQUE | Human-readable order number |
| user_id | UUID | NOT NULL | Reference to auth_service.users |
| cart_id | UUID | NULLABLE | Reference to cart_service.carts |
| status | VARCHAR(30) | NOT NULL DEFAULT 'pending' | Order status |
| fulfillment_status | VARCHAR(30) | NOT NULL DEFAULT 'unfulfilled' | Fulfillment status |
| financial_status | VARCHAR(30) | NOT NULL DEFAULT 'pending' | Payment status |
| currency | VARCHAR(3) | NOT NULL DEFAULT 'USD' | Order currency |
| subtotal | DECIMAL(12, 2) | NOT NULL | Items subtotal |
| tax_total | DECIMAL(12, 2) | NOT NULL DEFAULT 0 | Tax amount |
| shipping_total | DECIMAL(12, 2) | NOT NULL DEFAULT 0 | Shipping amount |
| discount_total | DECIMAL(12, 2) | NOT NULL DEFAULT 0 | Discount amount |
| total | DECIMAL(12, 2) | NOT NULL | Grand total |
| shipping_address_id | UUID | NOT NULL | Reference to user_service.addresses |
| billing_address_id | UUID | NOT NULL | Reference to user_service.addresses |
| shipping_method | VARCHAR(50) | NULLABLE | Shipping method |
| shipping_tracking_number | VARCHAR(100) | NULLABLE | Tracking number |
| shipping_carrier | VARCHAR(50) | NULLABLE | Shipping carrier |
| notes | TEXT | NULLABLE | Order notes |
| tags | JSONB | NOT NULL DEFAULT '[]' | Order tags |
| created_at | TIMESTAMP | NOT NULL DEFAULT NOW() | Record creation time |
| updated_at | TIMESTAMP | NOT NULL DEFAULT NOW() | Last update time |
| completed_at | TIMESTAMP | NULLABLE | Completion timestamp |
| cancelled_at | TIMESTAMP | NULLABLE | Cancellation timestamp |

**Indexes:**
- `idx_orders_order_number` ON (order_number)
- `idx_orders_user_id` ON (user_id)
- `idx_orders_status` ON (status)
- `idx_orders_fulfillment_status` ON (fulfillment_status)
- `idx_orders_financial_status` ON (financial_status)
- `idx_orders_created_at` ON (created_at)

#### order_items

| Column | Data Type | Constraints | Description |
|--------|-----------|-------------|-------------|
| id | UUID | PRIMARY KEY DEFAULT gen_random_uuid() | Unique item identifier |
| order_id | UUID | NOT NULL, REFERENCES orders(id) ON DELETE CASCADE | Order ID |
| product_id | UUID | NOT NULL | Reference to product_service.products |
| variant_id | UUID | NULLABLE | Reference to product_service.product_variants |
| sku | VARCHAR(50) | NOT NULL | Product SKU at time of order |
| name | VARCHAR(255) | NOT NULL | Product name at time of order |
| quantity | INTEGER | NOT NULL | Item quantity |
| unit_price | DECIMAL(12, 2) | NOT NULL | Price at time of order |
| total_price | DECIMAL(12, 2) | NOT NULL | Line total |
| tax_amount | DECIMAL(12, 2) | NOT NULL DEFAULT 0 | Tax amount |
| discount_amount | DECIMAL(12, 2) | NOT NULL DEFAULT 0 | Discount amount |
| created_at | TIMESTAMP | NOT NULL DEFAULT NOW() | Record creation time |

**Indexes:**
- `idx_order_items_order_id` ON (order_id)
- `idx_order_items_product_id` ON (product_id)

#### order_status_history

| Column | Data Type | Constraints | Description |
|--------|-----------|-------------|-------------|
| id | UUID | PRIMARY KEY DEFAULT gen_random_uuid() | Unique history identifier |
| order_id | UUID | NOT NULL, REFERENCES orders(id) ON DELETE CASCADE | Order ID |
| status | VARCHAR(30) | NOT NULL | Previous status |
| new_status | VARCHAR(30) | NOT NULL | New status |
| note | TEXT | NULLABLE | Status change note |
| changed_by | UUID | NULLABLE | User who changed status |
| created_at | TIMESTAMP | NOT NULL DEFAULT NOW() | Record creation time |

**Indexes:**
- `idx_order_status_history_order_id` ON (order_id)

#### shipments

| Column | Data Type | Constraints | Description |
|--------|-----------|-------------|-------------|
| id | UUID | PRIMARY KEY DEFAULT gen_random_uuid() | Unique shipment identifier |
| order_id | UUID | NOT NULL, REFERENCES orders(id) ON DELETE CASCADE | Order ID |
| tracking_number | VARCHAR(100) | NULLABLE | Carrier tracking number |
| carrier | VARCHAR(50) | NULLABLE | Shipping carrier |
| service | VARCHAR(50) | NULLABLE | Shipping service |
| status | VARCHAR(30) | NOT NULL DEFAULT 'pending' | Shipment status |
| shipped_at | TIMESTAMP | NULLABLE | Shipment timestamp |
| delivered_at | TIMESTAMP | NULLABLE | Delivery timestamp |
| created_at | TIMESTAMP | NOT NULL DEFAULT NOW() | Record creation time |
| updated_at | TIMESTAMP | NOT NULL DEFAULT NOW() | Last update time |

**Indexes:**
- `idx_shipments_order_id` ON (order_id)
- `idx_shipments_tracking_number` ON (tracking_number)

#### refunds

| Column | Data Type | Constraints | Description |
|--------|-----------|-------------|-------------|
| id | UUID | PRIMARY KEY DEFAULT gen_random_uuid() | Unique refund identifier |
| order_id | UUID | NOT NULL, REFERENCES orders(id) ON DELETE CASCADE | Order ID |
| payment_id | UUID | NULLABLE | Reference to payment_service.payments |
| amount | DECIMAL(12, 2) | NOT NULL | Refund amount |
| reason | TEXT | NULLABLE | Refund reason |
| status | VARCHAR(20) | NOT NULL DEFAULT 'pending' | Refund status |
| processed_at | TIMESTAMP | NULLABLE | Processing timestamp |
| created_at | TIMESTAMP | NOT NULL DEFAULT NOW() | Record creation time |
| updated_at | TIMESTAMP | NOT NULL DEFAULT NOW() | Last update time |

**Indexes:**
- `idx_refunds_order_id` ON (order_id)
- `idx_refunds_payment_id` ON (payment_id)

#### returns

| Column | Data Type | Constraints | Description |
|--------|-----------|-------------|-------------|
| id | UUID | PRIMARY KEY DEFAULT gen_random_uuid() | Unique return identifier |
| order_id | UUID | NOT NULL, REFERENCES orders(id) ON DELETE CASCADE | Order ID |
| order_item_id | UUID | NOT NULL | Reference to order_items |
| quantity | INTEGER | NOT NULL | Return quantity |
| reason | TEXT | NOT NULL | Return reason |
| status | VARCHAR(20) | NOT NULL DEFAULT 'requested' | Return status |
| refund_amount | DECIMAL(12, 2) | NULLABLE | Refund amount |
| resolved_at | TIMESTAMP | NULLABLE | Resolution timestamp |
| created_at | TIMESTAMP | NOT NULL DEFAULT NOW() | Record creation time |
| updated_at | TIMESTAMP | NOT NULL DEFAULT NOW() | Last update time |

**Indexes:**
- `idx_returns_order_id` ON (order_id)
- `idx_returns_status` ON (status)

### Relationships

- **orders** N:1 **auth_service.users** (Many orders per user)
- **orders** N:1 **cart_service.carts** (One cart per order)
- **orders** N:1 **user_service.addresses** (Shipping and billing)
- **order_items** N:1 **orders** (Many items per order)
- **order_status_history** N:1 **orders** (History per order)
- **shipments** N:1 **orders** (Many shipments per order)
- **refunds** N:1 **orders** (Many refunds per order)
- **returns** N:1 **orders** (Many returns per order)

### Redis Cache Keys

| Key Pattern | Type | TTL | Description |
|------------|------|-----|-------------|
| `order:{orderId}` | HASH | 1h | Order details |
| `order:number:{orderNumber}` | STRING | 1h | Order by number |
| `orders:user:{userId}` | LIST | 10min | User order list |
| `order:status:{orderId}` | STRING | 30min | Order status cache |

### Cross-Service Reference Strategy

- Store `user_id` (UUID) references to auth_service
- Store `cart_id` (UUID) reference to cart_service
- Store `address_id` (UUID) references to user_service.addresses
- Store `product_id` and `variant_id` to product_service
- Store `payment_id` reference to payment_service.payments

---

## 7. Payment Service

**Database/Schema:** `payment_service`

### Tables

#### payments

| Column | Data Type | Constraints | Description |
|--------|-----------|-------------|-------------|
| id | UUID | PRIMARY KEY DEFAULT gen_random_uuid() | Unique payment identifier |
| order_id | UUID | NOT NULL | Reference to order_service.orders |
| user_id | UUID | NOT NULL | Reference to auth_service.users |
| amount | DECIMAL(12, 2) | NOT NULL | Payment amount |
| currency | VARCHAR(3) | NOT NULL DEFAULT 'USD' | Payment currency |
| method | VARCHAR(50) | NOT NULL | Payment method |
| provider | VARCHAR(50) | NOT NULL | Payment provider |
| provider_transaction_id | VARCHAR(255) | NULLABLE | Provider transaction ID |
| status | VARCHAR(30) | NOT NULL DEFAULT 'pending' | Payment status |
| metadata | JSONB | NULLABLE | Additional payment data |
| processed_at | TIMESTAMP | NULLABLE | Processing timestamp |
| created_at | TIMESTAMP | NOT NULL DEFAULT NOW() | Record creation time |
| updated_at | TIMESTAMP | NOT NULL DEFAULT NOW() | Last update time |

**Indexes:**
- `idx_payments_order_id` ON (order_id)
- `idx_payments_user_id` ON (user_id)
- `idx_payments_provider_transaction_id` ON (provider_transaction_id)
- `idx_payments_status` ON (status)

#### payment_methods

| Column | Data Type | Constraints | Description |
|--------|-----------|-------------|-------------|
| id | UUID | PRIMARY KEY DEFAULT gen_random_uuid() | Unique payment method ID |
| user_id | UUID | NOT NULL, REFERENCES auth_service.users(id) | User ID |
| type | VARCHAR(50) | NOT NULL | Payment method type |
| provider | VARCHAR(50) | NOT NULL | Payment provider |
| provider_payment_method_id | VARCHAR(255) | NULLABLE | Provider method ID |
| is_default | BOOLEAN | NOT NULL DEFAULT false | Default payment method |
| last_four | VARCHAR(4) | NULLABLE | Last 4 digits |
| brand | VARCHAR(20) | NULLABLE | Card brand |
| expiry_month | INTEGER | NULLABLE | Expiry month |
| expiry_year | INTEGER | NULLABLE | Expiry year |
| created_at | TIMESTAMP | NOT NULL DEFAULT NOW() | Record creation time |
| updated_at | TIMESTAMP | NOT NULL DEFAULT NOW() | Last update time |

**Indexes:**
- `idx_payment_methods_user_id` ON (user_id)
- `idx_payment_methods_provider_payment_method_id` ON (provider_payment_method_id)

#### transactions

| Column | Data Type | Constraints | Description |
|--------|-----------|-------------|-------------|
| id | UUID | PRIMARY KEY DEFAULT gen_random_uuid() | Unique transaction identifier |
| payment_id | UUID | NOT NULL, REFERENCES payments(id) ON DELETE CASCADE | Payment ID |
| type | VARCHAR(30) | NOT NULL | Transaction type |
| amount | DECIMAL(12, 2) | NOT NULL | Transaction amount |
| currency | VARCHAR(3) | NOT NULL DEFAULT 'USD' | Transaction currency |
| status | VARCHAR(30) | NOT NULL | Transaction status |
| response_code | VARCHAR(10) | NULLABLE | Provider response code |
| response_message | TEXT | NULLABLE | Provider response |
| gateway_transaction_id | VARCHAR(255) | NULLABLE | Gateway transaction ID |
| created_at | TIMESTAMP | NOT NULL DEFAULT NOW() | Record creation time |

**Indexes:**
- `idx_transactions_payment_id` ON (payment_id)
- `idx_transactions_gateway_transaction_id` ON (gateway_transaction_id)

#### invoices

| Column | Data Type | Constraints | Description |
|--------|-----------|-------------|-------------|
| id | UUID | PRIMARY KEY DEFAULT gen_random_uuid() | Unique invoice identifier |
| invoice_number | VARCHAR(20) | NOT NULL, UNIQUE | Human-readable invoice number |
| order_id | UUID | NOT NULL | Reference to order_service.orders |
| user_id | UUID | NOT NULL | Reference to auth_service.users |
| amount | DECIMAL(12, 2) | NOT NULL | Invoice amount |
| tax_amount | DECIMAL(12, 2) | NOT NULL DEFAULT 0 | Tax amount |
| total | DECIMAL(12, 2) | NOT NULL | Total amount |
| status | VARCHAR(20) | NOT NULL DEFAULT 'pending' | Invoice status |
| due_date | DATE | NULLABLE | Payment due date |
| paid_at | TIMESTAMP | NULLABLE | Payment timestamp |
| created_at | TIMESTAMP | NOT NULL DEFAULT NOW() | Record creation time |

**Indexes:**
- `idx_invoices_invoice_number` ON (invoice_number)
- `idx_invoices_order_id` ON (order_id)
- `idx_invoices_user_id` ON (user_id)

### Relationships

- **payments** N:1 **order_service.orders** (Many payments per order)
- **payments** N:1 **auth_service.users** (Many payments per user)
- **payment_methods** N:1 **auth_service.users** (Many payment methods per user)
- **transactions** N:1 **payments** (Many transactions per payment)
- **invoices** N:1 **order_service.orders** (One invoice per order)
- **invoices** N:1 **auth_service.users** (One user per invoice)

### Redis Cache Keys

| Key Pattern | Type | TTL | Description |
|------------|------|-----|-------------|
| `payment:{paymentId}` | HASH | 1h | Payment details |
| `payment:order:{orderId}` | STRING | 30min | Payment by order |
| `payment:methods:{userId}` | LIST | 10min | User payment methods |

### Cross-Service Reference Strategy

- Store `order_id` (UUID) reference to order_service.orders
- Store `user_id` (UUID) reference to auth_service.users
- Use RabbitMQ to receive order created events
- Publish payment completed/failed events to RabbitMQ

---

## 8. Notification Service

**Database/Schema:** `notification_service`

### Tables

#### notification_templates

| Column | Data Type | Constraints | Description |
|--------|-----------|-------------|-------------|
| id | UUID | PRIMARY KEY DEFAULT gen_random_uuid() | Unique template identifier |
| name | VARCHAR(100) | NOT NULL, UNIQUE | Template name |
| type | VARCHAR(20) | NOT NULL | Notification type |
| channel | VARCHAR(20) | NOT NULL | Delivery channel |
| subject | VARCHAR(255) | NULLABLE | Email subject/SMS title |
| content | TEXT | NOT NULL | Notification content |
| variables | JSONB | NOT NULL DEFAULT '[]' | Available template variables |
| is_active | BOOLEAN | NOT NULL DEFAULT true | Active status |
| created_at | TIMESTAMP | NOT NULL DEFAULT NOW() | Record creation time |
| updated_at | TIMESTAMP | NOT NULL DEFAULT NOW() | Last update time |

**Indexes:**
- `idx_notification_templates_name` ON (name)
- `idx_notification_templates_type_channel` ON (type, channel)

#### notifications

| Column | Data Type | Constraints | Description |
|--------|-----------|-------------|-------------|
| id | UUID | PRIMARY KEY DEFAULT gen_random_uuid() | Unique notification identifier |
| user_id | UUID | NOT NULL | Recipient user ID |
| type | VARCHAR(20) | NOT NULL | Notification type |
| channel | VARCHAR(20) | NOT NULL | Delivery channel |
| title | VARCHAR(255) | NOT NULL | Notification title |
| content | TEXT | NOT NULL | Notification content |
| data | JSONB | NULLABLE | Additional data |
| status | VARCHAR(20) | NOT NULL DEFAULT 'pending' | Delivery status |
| sent_at | TIMESTAMP | NULLABLE | Sent timestamp |
| delivered_at | TIMESTAMP | NULLABLE | Delivered timestamp |
| read_at | TIMESTAMP | NULLABLE | Read timestamp |
| created_at | TIMESTAMP | NOT NULL DEFAULT NOW() | Record creation time |

**Indexes:**
- `idx_notifications_user_id` ON (user_id)
- `idx_notifications_status` ON (status)
- `idx_notifications_type` ON (type)
- `idx_notifications_created_at` ON (created_at)

#### email_queue

| Column | Data Type | Constraints | Description |
|--------|-----------|-------------|-------------|
| id | UUID | PRIMARY KEY DEFAULT gen_random_uuid() | Unique email queue ID |
| to_email | VARCHAR(255) | NOT NULL | Recipient email |
| to_name | VARCHAR(255) | NULLABLE | Recipient name |
| from_email | VARCHAR(255) | NOT NULL | Sender email |
| from_name | VARCHAR(255) | NULLABLE | Sender name |
| subject | VARCHAR(255) | NOT NULL | Email subject |
| body | TEXT | NOT NULL | Email body |
| template_id | UUID | NULLABLE | Template reference |
| variables | JSONB | NULLABLE | Template variables |
| priority | INTEGER | NOT NULL DEFAULT 5 | Priority (1=high, 10=low) |
| retry_count | INTEGER | NOT NULL DEFAULT 0 | Number of retries |
| max_retries | INTEGER | NOT NULL DEFAULT 3 | Maximum retries |
| status | VARCHAR(20) | NOT NULL DEFAULT 'pending' | Queue status |
| scheduled_at | TIMESTAMP | NULLABLE | Scheduled send time |
| sent_at | TIMESTAMP | NULLABLE | Sent timestamp |
| error_message | TEXT | NULLABLE | Error message if failed |
| created_at | TIMESTAMP | NOT NULL DEFAULT NOW() | Record creation time |
| updated_at | TIMESTAMP | NOT NULL DEFAULT NOW() | Last update time |

**Indexes:**
- `idx_email_queue_status` ON (status)
- `idx_email_queue_scheduled_at` ON (scheduled_at)
- `idx_email_queue_priority` ON (priority)

#### sms_queue

| Column | Data Type | Constraints | Description |
|--------|-----------|-------------|-------------|
| id | UUID | PRIMARY KEY DEFAULT gen_random_uuid() | Unique SMS queue ID |
| to_phone | VARCHAR(20) | NOT NULL | Recipient phone |
| message | VARCHAR(1600) | NOT NULL | SMS message content |
| template_id | UUID | NULLABLE | Template reference |
| variables | JSONB | NULLABLE | Template variables |
| priority | INTEGER | NOT NULL DEFAULT 5 | Priority |
| retry_count | INTEGER | NOT NULL DEFAULT 0 | Number of retries |
| max_retries | INTEGER | NOT NULL DEFAULT 3 | Maximum retries |
| status | VARCHAR(20) | NOT NULL DEFAULT 'pending' | Queue status |
| sent_at | TIMESTAMP | NULLABLE | Sent timestamp |
| error_message | TEXT | NULLABLE | Error message if failed |
| created_at | TIMESTAMP | NOT NULL DEFAULT NOW() | Record creation time |
| updated_at | TIMESTAMP | NOT NULL DEFAULT NOW() | Last update time |

**Indexes:**
- `idx_sms_queue_status` ON (status)

#### push_subscriptions

| Column | Data Type | Constraints | Description |
|--------|-----------|-------------|-------------|
| id | UUID | PRIMARY KEY DEFAULT gen_random_uuid() | Unique subscription ID |
| user_id | UUID | NOT NULL | User ID |
| endpoint | VARCHAR(500) | NOT NULL | Push endpoint URL |
| p256dh | VARCHAR(255) | NOT NULL | P-256 DH key |
| auth | VARCHAR(255) | NOT NULL | Auth secret |
| is_active | BOOLEAN | NOT NULL DEFAULT true | Active status |
| created_at | TIMESTAMP | NOT NULL DEFAULT NOW() | Record creation time |
| updated_at | TIMESTAMP | NOT NULL DEFAULT NOW() | Last update time |

**Indexes:**
- `idx_push_subscriptions_user_id` ON (user_id)
- `idx_push_subscriptions_endpoint` ON (endpoint)

### Relationships

- **notifications** 1:1 **auth_service.users** (Recipient)
- **notification_templates** 1:N **email_queue** (Template usage)
- **notification_templates** 1:N **sms_queue** (Template usage)
- **push_subscriptions** N:1 **auth_service.users** (User subscriptions)

### Redis Cache Keys

| Key Pattern | Type | TTL | Description |
|------------|------|-----|-------------|
| `notification:unread:{userId}` | COUNT | 1h | Unread notification count |
| `notification:prefs:{userId}` | HASH | 24h | User notification preferences |
| `email:template:{templateId}` | HASH | 30min | Cached template |

### Cross-Service Reference Strategy

- Store `user_id` (UUID) references to auth_service
- Services send notifications via RabbitMQ events
- Notification service consumes events and delivers

---

## 9. Search Service

**Database/Schema:** `search_service`

### Tables

#### search_logs

| Column | Data Type | Constraints | Description |
|--------|-----------|-------------|-------------|
| id | UUID | PRIMARY KEY DEFAULT gen_random_uuid() | Unique log identifier |
| user_id | UUID | NULLABLE | User who searched |
| query | VARCHAR(500) | NOT NULL | Search query |
| filters | JSONB | NULLABLE | Applied filters |
| results_count | INTEGER | NOT NULL | Number of results |
| clicked_product_id | UUID | NULLABLE | Product clicked |
| session_id | UUID | NULLABLE | Anonymous session |
| response_time_ms | INTEGER | NOT NULL | Search response time |
| created_at | TIMESTAMP | NOT NULL DEFAULT NOW() | Search timestamp |

**Indexes:**
- `idx_search_logs_user_id` ON (user_id)
- `idx_search_logs_query` ON (query)
- `idx_search_logs_created_at` ON (created_at)

#### search_synonyms

| Column | Data Type | Constraints | Description |
|--------|-----------|-------------|-------------|
| id | UUID | PRIMARY KEY DEFAULT gen_random_uuid() | Unique synonym identifier |
| term | VARCHAR(100) | NOT NULL, UNIQUE | Original term |
| synonyms | JSONB | NOT NULL | Array of synonyms |
| created_at | TIMESTAMP | NOT NULL DEFAULT NOW() | Record creation time |
| updated_at | TIMESTAMP | NOT NULL DEFAULT NOW() | Last update time |

**Indexes:**
- `idx_search_synonyms_term` ON (term)

#### search_facets

| Column | Data Type | Constraints | Description |
|--------|-----------|-------------|-------------|
| id | UUID | PRIMARY KEY DEFAULT gen_random_uuid() | Unique facet identifier |
| name | VARCHAR(50) | NOT NULL | Facet name |
| field | VARCHAR(100) | NOT NULL | Faceted field |
| display_name | VARCHAR(100) | NOT NULL | Display name |
| is_active | BOOLEAN | NOT NULL DEFAULT true | Active status |
| sort_order | INTEGER | NOT NULL DEFAULT 0 | Display order |
| created_at | TIMESTAMP | NOT NULL DEFAULT NOW() | Record creation time |

**Indexes:**
- `idx_search_facets_field` ON (field)

### Redis Cache Keys

| Key Pattern | Type | TTL | Description |
|------------|------|-----|-------------|
| `search:results:{queryHash}` | HASH | 5min | Cached search results |
| `search:suggest:{prefix}` | LIST | 1h | Search suggestions |
| `search:trending` | LIST | 15min | Trending searches |

### Note on Search Implementation

Search service primarily uses Elasticsearch/OpenSearch for product search. The PostgreSQL tables above are for:
- Search analytics/logging
- Synonym management
- Facet configuration

### Cross-Service Reference Strategy

- Stores `product_id` (UUID) references to product_service
- Maintains denormalized product data in search index
- Receives product updates via RabbitMQ events

---

## 10. Admin Service

**Database/Schema:** `admin_service`

### Tables

#### admin_users

| Column | Data Type | Constraints | Description |
|--------|-----------|-------------|-------------|
| id | UUID | PRIMARY KEY DEFAULT gen_random_uuid() | Unique admin user ID |
| user_id | UUID | NOT NULL, UNIQUE | Reference to auth_service.users |
| role | VARCHAR(50) | NOT NULL DEFAULT 'staff' | Admin role |
| department | VARCHAR(100) | NULLABLE | Department |
| permissions | JSONB | NOT NULL DEFAULT '[]' | Specific permissions |
| is_super_admin | BOOLEAN | NOT NULL DEFAULT false | Super admin flag |
| created_at | TIMESTAMP | NOT NULL DEFAULT NOW() | Record creation time |
| updated_at | TIMESTAMP | NOT NULL DEFAULT NOW() | Last update time |

**Indexes:**
- `idx_admin_users_user_id` ON (user_id)
- `idx_admin_users_role` ON (role)

#### audit_logs

| Column | Data Type | Constraints | Description |
|--------|-----------|-------------|-------------|
| id | UUID | PRIMARY KEY DEFAULT gen_random_uuid() | Unique audit log ID |
| user_id | UUID | NULLABLE | Admin user who performed action |
| action | VARCHAR(100) | NOT NULL | Action performed |
| resource_type | VARCHAR(50) | NOT NULL | Resource type |
| resource_id | UUID | NULLABLE | Resource ID |
| changes | JSONB | NULLABLE | Data changes |
| ip_address | VARCHAR(45) | NULLABLE | Admin IP |
| user_agent | TEXT | NULLABLE | Admin user agent |
| created_at | TIMESTAMP | NOT NULL DEFAULT NOW() | Record creation time |

**Indexes:**
- `idx_audit_logs_user_id` ON (user_id)
- `idx_audit_logs_action` ON (action)
- `idx_audit_logs_resource_type_resource_id` ON (resource_type, resource_id)
- `idx_audit_logs_created_at` ON (created_at)

#### admin_settings

| Column | Data Type | Constraints | Description |
|--------|-----------|-------------|-------------|
| id | UUID | PRIMARY KEY DEFAULT gen_random_uuid() | Unique setting ID |
| key | VARCHAR(100) | NOT NULL, UNIQUE | Setting key |
| value | JSONB | NOT NULL | Setting value |
| description | TEXT | NULLABLE | Setting description |
| category | VARCHAR(50) NOT NULL DEFAULT 'general' | Setting category |
| is_public | BOOLEAN | NOT NULL DEFAULT false | Public visibility |
| created_at | TIMESTAMP | NOT NULL DEFAULT NOW() | Record creation time |
| updated_at | TIMESTAMP | NOT NULL DEFAULT NOW() | Last update time |

**Indexes:**
- `idx_admin_settings_key` ON (key)
- `idx_admin_settings_category` ON (category)

#### reports

| Column | Data Type | Constraints | Description |
|--------|-----------|-------------|-------------|
| id | UUID | PRIMARY KEY DEFAULT gen_random_uuid() | Unique report ID |
| name | VARCHAR(100) | NOT NULL | Report name |
| type | VARCHAR(50) | NOT NULL | Report type |
| config | JSONB | NOT NULL | Report configuration |
| schedule | JSONB | NULLABLE | Report schedule |
| last_generated_at | TIMESTAMP | NULLABLE | Last generation time |
| created_by | UUID | NOT NULL | Report creator |
| created_at | TIMESTAMP | NOT NULL DEFAULT NOW() | Record creation time |
| updated_at | TIMESTAMP | NOT NULL DEFAULT NOW() | Last update time |

**Indexes:**
- `idx_reports_type` ON (type)
- `idx_reports_created_by` ON (created_by)

#### webhooks

| Column | Data Type | Constraints | Description |
|--------|-----------|-------------|-------------|
| id | UUID | PRIMARY KEY DEFAULT gen_random_uuid() | Unique webhook ID |
| name | VARCHAR(100) | NOT NULL | Webhook name |
| url | VARCHAR(500) | NOT NULL | Webhook URL |
| events | JSONB | NOT NULL | Subscribed events |
| secret | VARCHAR(255) | NOT NULL | Webhook secret |
| is_active | BOOLEAN | NOT NULL DEFAULT true | Active status |
| last_triggered_at | TIMESTAMP | NULLABLE | Last trigger time |
| failure_count | INTEGER | NOT NULL DEFAULT 0 | Consecutive failures |
| created_at | TIMESTAMP | NOT NULL DEFAULT NOW() | Record creation time |
| updated_at | TIMESTAMP | NOT NULL DEFAULT NOW() | Last update time |

**Indexes:**
- `idx_webhooks_is_active` ON (is_active)

### Relationships

- **admin_users** 1:1 **auth_service.users** (Admin is also a user)
- **audit_logs** N:1 **admin_users** (Admin actions tracked)
- **reports** N:1 **admin_users** (Reports created by admins)
- **webhooks** 1:N **webhook_deliveries** (Many deliveries per webhook)

### Redis Cache Keys

| Key Pattern | Type | TTL | Description |
|------------|------|-----|-------------|
| `admin:settings:{key}` | STRING | 30min | Cached settings |
| `admin:stats:dashboard` | HASH | 5min | Dashboard stats |
| `admin:permissions:{userId}` | SET | 1h | User permissions cache |

### Cross-Service Reference Strategy

- Stores `user_id` (UUID) references to auth_service
- Reads data from all service databases for reporting
- Uses RabbitMQ to receive cross-service events for webhooks

---

## Cross-Service Data Reference Strategy Summary

### Pattern 1: ID-Based References
Each service stores only the UUID primary keys of related entities from other services:
- `user_id` references auth_service.users
- `product_id` references product_service.products
- `order_id` references order_service.orders

### Pattern 2: Event-Driven Updates
Services publish domain events to RabbitMQ:
- Order Service publishes `order.created`, `order.completed`, `order.cancelled`
- Payment Service publishes `payment.completed`, `payment.failed`
- Product Service publishes `product.updated`, `product.created`

### Pattern 3: API-Based Lookups
For read operations requiring cross-service data:
- Services call REST APIs of other services
- API Gateway handles service-to-service authentication
- Response caching via Redis reduces API calls

### Pattern 4: Denormalized Data
Search Service maintains its own product index:
- Receives product updates via RabbitMQ
- Stores product data optimized for search queries
- Provides fast, full-text search without impacting product_service

### Pattern 5: CQRS (Command Query Responsibility Segregation)
- Write operations go to authoritative service databases
- Read operations can query denormalized read models
- Search service acts as a read model for products

---

## Redis Usage Summary by Service

| Service | Cache Keys | Purpose |
|---------|------------|---------|
| API Gateway | Rate limits, Service discovery | Request limiting, Load balancing |
| Auth Service | User profiles, Sessions, Tokens | Authentication, Authorization |
| User Service | Profiles, Addresses, Reviews | User data caching |
| Product Service | Products, Categories, Inventory | Catalog browsing |
| Cart Service | Active carts | Cart operations |
| Order Service | Orders, Status | Order tracking |
| Payment Service | Payments, Methods | Payment processing |
| Notification Service | Preferences, Templates | Delivery optimization |
| Search Service | Results, Suggestions | Search performance |
| Admin Service | Settings, Stats | Admin dashboard |

---

*Last Updated: 2026*
