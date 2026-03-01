# Service List

---

## 1. API Gateway

| Property | Value |
|----------|-------|
| **Service Name** | api-gateway |
| **Port** | 3000 |
| **Database Schema** | N/A (routes only) |
| **Responsibility** | Request routing, authentication, rate limiting, CORS |

### API Endpoints

| Method | Route | Upstream | Auth |
|-------|-------|----------|------|
| * | /api/auth/* | Auth Service (3001) | varies |
| * | /api/users/* | User Service (3002) | Yes |
| * | /api/products/* | Product Service (3003) | varies |
| * | /api/cart/* | Cart Service (3004) | Yes |
| * | /api/orders/* | Order Service (3005) | Yes |
| * | /api/payments/* | Payment Service (3006) | Yes |
| * | /api/search/* | Search Service (3008) | No |
| * | /api/admin/* | Admin Service (3009) | Yes (Admin) |

### RabbitMQ Events

| Type | Exchange | Routing Key |
|------|----------|-------------|
| Consumes | N/A | Routes HTTP only |

### Dependencies

- All backend services (upstream)

---

## 2. Auth Service

| Property | Value |
|----------|-------|
| **Service Name** | auth-service |
| **Port** | 3001 |
| **Database Schema** | auth |
| **Responsibility** | User authentication, JWT/refresh token issuance, session management |

### Database Schema: auth

```sql
-- users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) DEFAULT 'user',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- sessions table (Redis recommended)
-- stores refresh tokens with expiration
```

### API Endpoints

| Method | Route | Description | Auth |
|-------|-------|-------------|------|
| POST | /auth/register | Register new user | No |
| POST | /auth/login | Login user | No |
| POST | /auth/refresh | Refresh access token | No |
| POST | /auth/logout | Logout user | Yes |
| GET | /auth/verify | Verify token validity | Yes |
| GET | /auth/me | Get current user | Yes |

### RabbitMQ Events

| Type | Event | Description |
|------|-------|-------------|
| Publishes | user.registered | When new user registers |
| Publishes | user.logged_in | When user logs in |
| Publishes | user.logged_out | When user logs out |

### Dependencies

- PostgreSQL (auth schema)
- Redis (session storage)

---

## 3. User Service

| Property | Value |
|----------|-------|
| **Service Name** | user-service |
| **Port** | 3002 |
| **Database Schema** | user |
| **Responsibility** | User profile management, addresses, preferences |

### Database Schema: user

```sql
-- profiles table
CREATE TABLE profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    phone VARCHAR(20),
    avatar_url VARCHAR(500),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- addresses table
CREATE TABLE addresses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    address_type VARCHAR(20), -- 'shipping', 'billing'
    street VARCHAR(255),
    city VARCHAR(100),
    state VARCHAR(100),
    postal_code VARCHAR(20),
    country VARCHAR(100) DEFAULT 'USA',
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

### API Endpoints

| Method | Route | Description | Auth |
|-------|-------|-------------|------|
| GET | /users/me | Get current user profile | Yes |
| PUT | /users/me | Update profile | Yes |
| GET | /users/me/addresses | List addresses | Yes |
| POST | /users/me/addresses | Add address | Yes |
| PUT | /users/me/addresses/:id | Update address | Yes |
| DELETE | /users/me/addresses/:id | Delete address | Yes |

### RabbitMQ Events

| Type | Event | Description |
|------|-------|-------------|
| Consumes | user.registered | Create profile for new user |
| Publishes | user.profile.updated | When profile changes |

### Dependencies

- Auth Service (validate tokens)

---

## 4. Product Service

| Property | Value |
|----------|-------|
| **Service Name** | product-service |
| **Port** | 3003 |
| **Database Schema** | product |
| **Responsibility** | Product catalog, categories, inventory management |

### Database Schema: product

```sql
-- categories table
CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    parent_id UUID REFERENCES categories(id),
    created_at TIMESTAMP DEFAULT NOW()
);

-- products table
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    compare_price DECIMAL(10,2),
    category_id UUID REFERENCES categories(id),
    images TEXT[], -- array of image URLs
    sku VARCHAR(100) UNIQUE,
    inventory_quantity INT DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- product_variants table
CREATE TABLE product_variants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES products(id),
    name VARCHAR(255),
    sku VARCHAR(100),
    price DECIMAL(10,2),
    inventory_quantity INT DEFAULT 0,
    attributes JSONB, -- {color: "red", size: "M"}
    created_at TIMESTAMP DEFAULT NOW()
);
```

### API Endpoints

| Method | Route | Description | Auth |
|-------|-------|-------------|------|
| GET | /products | List products (paginated) | No |
| GET | /products/:id | Get product details | No |
| GET | /products/slug/:slug | Get product by slug | No |
| GET | /products/search | Search products | No |
| POST | /products | Create product | Yes (Admin) |
| PUT | /products/:id | Update product | Yes (Admin) |
| DELETE | /products/:id | Delete product | Yes (Admin) |
| GET | /categories | List categories | No |
| POST | /categories | Create category | Yes (Admin) |

### RabbitMQ Events

| Type | Event | Description |
|------|-------|-------------|
| Publishes | product.created | New product added |
| Publishes | product.updated | Product modified |
| Publishes | product.deleted | Product removed |
| Publishes | product.inventory_changed | Stock level changed |

### Dependencies

- None (core service)

---

## 5. Cart Service

| Property | Value |
|----------|-------|
| **Service Name** | cart-service |
| **Port** | 3004 |
| **Database Schema** | cart |
| **Responsibility** | Shopping cart management, item quantity, pricing |

### Database Schema: cart

```sql
-- carts table
CREATE TABLE carts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    status VARCHAR(20) DEFAULT 'active', -- 'active', 'converted'
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- cart_items table
CREATE TABLE cart_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cart_id UUID NOT NULL REFERENCES carts(id),
    product_id UUID NOT NULL,
    variant_id UUID,
    quantity INT NOT NULL DEFAULT 1,
    price DECIMAL(10,2) NOT NULL, -- price at time of adding
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

### API Endpoints

| Method | Route | Description | Auth |
|-------|-------|-------------|------|
| GET | /cart | Get current user's cart | Yes |
| POST | /cart/items | Add item to cart | Yes |
| PUT | /cart/items/:id | Update item quantity | Yes |
| DELETE | /cart/items/:id | Remove item from cart | Yes |
| DELETE | /cart | Clear cart | Yes |
| POST | /cart/checkout | Convert cart to order | Yes |

### RabbitMQ Events

| Type | Event | Description |
|------|-------|-------------|
| Consumes | product.price_changed | Update item price |
| Consumes | product.inventory_changed | Validate availability |
| Publishes | cart.updated | Cart modified |

### Dependencies

- Product Service (validate products/prices)
- Order Service (convert to order)

---

## 6. Order Service

| Property | Value |
|----------|-------|
| **Service Name** | order-service |
| **Port** | 3005 |
| **Database Schema** | order |
| **Responsibility** | Order creation, status tracking, history |

### Database Schema: order

```sql
-- orders table
CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_number VARCHAR(50) UNIQUE NOT NULL,
    user_id UUID NOT NULL,
    status VARCHAR(30) DEFAULT 'pending', -- pending, confirmed, processing, shipped, delivered, cancelled
    subtotal DECIMAL(10,2) NOT NULL,
    tax DECIMAL(10,2) DEFAULT 0,
    shipping_cost DECIMAL(10,2) DEFAULT 0,
    total DECIMAL(10,2) NOT NULL,
    shipping_address JSONB,
    billing_address JSONB,
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- order_items table
CREATE TABLE order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(id),
    product_id UUID NOT NULL,
    variant_id UUID,
    product_name VARCHAR(255) NOT NULL,
    quantity INT NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    total_price DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- order_status_history table
CREATE TABLE order_status_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(id),
    status VARCHAR(30) NOT NULL,
    note TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);
```

### API Endpoints

| Method | Route | Description | Auth |
|-------|-------|-------------|------|
| GET | /orders | List user orders | Yes |
| GET | /orders/:id | Get order details | Yes |
| POST | /orders | Create new order | Yes |
| PUT | /orders/:id/status | Update order status | Yes (Admin) |
| GET | /orders/:id/tracking | Get tracking info | Yes |

### RabbitMQ Events

| Type | Event | Description |
|------|-------|-------------|
| Publishes | order.created | New order placed |
| Publishes | order.status_changed | Order status updated |
| Publishes | order.cancelled | Order cancelled |
| Consumes | payment.completed | Payment successful |
| Consumes | payment.failed | Payment failed |

### Dependencies

- Cart Service (create order from cart)
- Product Service (validate products)
- Payment Service (payment status)
- Notification Service (send confirmation)

---

## 7. Payment Service

| Property | Value |
|----------|-------|
| **Service Name** | payment-service |
| **Port** | 3006 |
| **Database Schema** | payment |
| **Responsibility** | Payment processing, transaction management |

### Database Schema: payment

```sql
-- payments table
CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL,
    user_id UUID NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(10) DEFAULT 'USD',
    status VARCHAR(30) DEFAULT 'pending', -- pending, processing, completed, failed, refunded
    payment_method VARCHAR(50), -- stripe, paypal
    payment_intent_id VARCHAR(255), -- gateway reference
    transaction_id VARCHAR(255),
    metadata JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- refunds table
CREATE TABLE refunds (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payment_id UUID NOT NULL REFERENCES payments(id),
    amount DECIMAL(10,2) NOT NULL,
    reason TEXT,
    status VARCHAR(30) DEFAULT 'pending',
    refund_id VARCHAR(255),
    created_at TIMESTAMP DEFAULT NOW()
);
```

### API Endpoints

| Method | Route | Description | Auth |
|-------|-------|-------------|------|
| POST | /payments/process | Process payment | Yes |
| GET | /payments/:orderId | Get payment by order | Yes |
| GET | /payments/:id | Get payment details | Yes |
| POST | /payments/:id/refund | Request refund | Yes |
| POST | /webhooks/stripe | Stripe webhook handler | No |

### RabbitMQ Events

| Type | Event | Description |
|------|-------|-------------|
| Consumes | order.created | Process payment for new order |
| Publishes | payment.completed | Payment successful |
| Publishes | payment.failed | Payment failed |
| Publishes | payment.refunded | Refund processed |

### Dependencies

- Order Service (update order status)
- Notification Service (send receipt)

---

## 8. Notification Service

| Property | Value |
|----------|-------|
| **Service Name** | notification-service |
| **Port** | 3007 |
| **Database Schema** | notification |
| **Responsibility** | Email, SMS, push notifications |

### Database Schema: notification

```sql
-- notification_preferences table
CREATE TABLE notification_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE NOT NULL,
    email_enabled BOOLEAN DEFAULT true,
    sms_enabled BOOLEAN DEFAULT false,
    push_enabled BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- notifications table
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    type VARCHAR(30) NOT NULL, -- order_confirmation, payment_receipt, etc
    channel VARCHAR(20) NOT NULL, -- email, sms, push
    subject TEXT,
    message TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'pending', -- pending, sent, failed
    sent_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);
```

### API Endpoints

| Method | Route | Description | Auth |
|-------|-------|-------------|------|
| GET | /notifications | List user notifications | Yes |
| PUT | /notifications/preferences | Update preferences | Yes |
| GET | /notifications/preferences | Get preferences | Yes |

### RabbitMQ Events

| Type | Event | Description |
|------|-------|-------------|
| Consumes | order.created | Send order confirmation |
| Consumes | order.status_changed | Send status update |
| Consumes | payment.completed | Send payment receipt |
| Consumes | payment.failed | Send payment failure notice |
| Consumes | user.registered | Send welcome email |

### Dependencies

- All services (consumes events)

---

## 9. Search Service

| Property | Value |
|----------|-------|
| **Service Name** | search-service |
| **Port** | 3008 |
| **Database Schema** | search |
| **Responsibility** | Product search, filtering, suggestions |

### Database Schema: search

```sql
-- search_logs table
CREATE TABLE search_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID,
    query VARCHAR(255) NOT NULL,
    filters JSONB,
    results_count INT,
    clicked_product_id UUID,
    created_at TIMESTAMP DEFAULT NOW()
);

-- product_search_index (PostgreSQL full-text search)
-- Using pg_search extension
```

### API Endpoints

| Method | Route | Description | Auth |
|-------|-------|-------------|------|
| GET | /search/products | Search products | No |
| GET | /search/suggestions | Get search suggestions | No |
| GET | /search/trending | Get trending searches | No |

### RabbitMQ Events

| Type | Event | Description |
|------|-------|-------------|
| Consumes | product.created | Index new product |
| Consumes | product.updated | Update product index |
| Consumes | product.deleted | Remove from index |

### Dependencies

- Product Service (read products for indexing)

---

## 10. Admin Service

| Property | Value |
|----------|-------|
| **Service Name** | admin-service |
| **Port** | 3009 |
| **Database Schema** | admin |
| **Responsibility** | Admin dashboard, analytics, user/product management |

### Database Schema: admin

```sql
-- admin_users table
CREATE TABLE admin_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    permissions JSONB DEFAULT '[]',
    created_at TIMESTAMP DEFAULT NOW()
);

-- For analytics, views into other schemas
-- Use foreign data wrappers or read replicas
```

### API Endpoints

| Method | Route | Description | Auth |
|-------|-------|-------------|------|
| GET | /admin/analytics/overview | Dashboard overview | Yes (Admin) |
| GET | /admin/analytics/sales | Sales analytics | Yes (Admin) |
| GET | /admin/analytics/users | User analytics | Yes (Admin) |
| GET | /admin/users | List all users | Yes (Admin) |
| PUT | /admin/users/:id | Update user | Yes (Admin) |
| GET | /admin/products | List all products | Yes (Admin) |
| PUT | /admin/products/:id | Update product | Yes (Admin) |
| GET | /admin/orders | List all orders | Yes (Admin) |
| PUT | /admin/orders/:id/status | Update order | Yes (Admin) |

### RabbitMQ Events

| Type | Event | Description |
|------|-------|-------------|
| Consumes | order.created | Track new orders |
| Consumes | payment.completed | Track revenue |

### Dependencies

- All services (read access)
