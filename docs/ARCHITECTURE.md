# Architecture Documentation

## Microservices Overview

This e-commerce platform consists of 10 microservices, each responsible for a specific domain:

| # | Service | Responsibility | Port |
|---|---------|----------------|------|
| 1 | API Gateway | Request routing, authentication, rate limiting | 3000 |
| 2 | Auth Service | User authentication, JWT/refresh token management | 3001 |
| 3 | User Service | User profile management, addresses | 3002 |
| 4 | Product Service | Product catalog, categories, inventory | 3003 |
| 5 | Cart Service | Shopping cart management | 3004 |
| 6 | Order Service | Order processing, order history | 3005 |
| 7 | Payment Service | Payment processing, transactions | 3006 |
| 8 | Notification Service | Email, SMS, push notifications | 3007 |
| 9 | Search Service | Product search, filtering, suggestions | 3008 |
| 10 | Admin Service | Admin dashboard, analytics, management | 3009 |

---

## Service Communication Diagram

### Synchronous Communication (REST API)

```
┌─────────────────────────────────────────────────────────────────────────┐
│                              FRONTEND (Next.js)                          │
│                              localhost:3001                              │
└─────────────────────────────────┬───────────────────────────────────────┘
                                  │
                                  │ HTTPS/REST
                                  ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                          API GATEWAY (Port 3000)                         │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐    │
│  │   /auth/*   │  │   /users/*  │  │ /products/* │  │   /cart/*   │    │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘    │
└─────────┼────────────────┼────────────────┼────────────────┼────────────┘
          │                │                │                │
          ▼                ▼                ▼                ▼
    ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐
    │  Auth    │    │  User    │    │ Product  │    │  Cart    │
    │ :3001    │    │ :3002    │    │ :3003    │    │ :3004    │
    └──────────┘    └──────────┘    └──────────┘    └──────────┘
```

### Asynchronous Communication (RabbitMQ Events)

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        RABBITMQ MESSAGE BROKER                          │
│                     Exchange: ecommerce.events (topic)                  │
└─────────────────────────────────┬───────────────────────────────────────┘
                                  │
    ┌─────────────────────────────┼─────────────────────────────┐
    │                             │                             │
    ▼                             ▼                             ▼
┌─────────────┐            ┌─────────────┐            ┌─────────────┐
│   Order     │            │  Payment    │            │Notification │
│  Service    │───────────▶│  Service    │───────────▶│  Service    │
│  (Producer) │   event    │  (Consumer) │   event    │ (Consumer)  │
└─────────────┘            └─────────────┘            └─────────────┘
        │
        │ event
        ▼
┌─────────────┐
│   Search    │
│  Service    │
│ (Consumer)  │
└─────────────┘
```

### Communication Patterns

| Pattern | Use Case | Implementation |
|---------|----------|----------------|
| Request-Response | Client to Gateway to Service | REST over HTTP |
| Service-to-Service | Cross-service queries | REST over HTTP via Gateway |
| Event-Driven | Async workflows | RabbitMQ pub/sub |

---

## Database Per Service Strategy

### Architecture

- **Single PostgreSQL Instance**: One database server
- **Multiple Schemas**: Each service owns its own schema
- **Schema Isolation**: Services cannot access other service schemas directly

```
┌────────────────────────────────────────────────────────────────┐
│                     PostgreSQL (Port 5432)                     │
│                        Database: ecommerce                      │
├──────────┬──────────┬──────────┬──────────┬──────────────────┤
│  auth    │   user   │ product  │   cart   │      order       │
│  schema  │  schema  │  schema  │  schema  │      schema      │
├──────────┼──────────┼──────────┼──────────┼──────────────────┤
│ users    │ profiles │ products │  items   │    orders        │
│ sessions │ addresses│ categories│        │ order_items      │
│          │          │ inventory │        │    payments       │
└──────────┴──────────┴──────────┴──────────┴──────────────────┘
```

### Prisma Schema Configuration

Each service configures Prisma with its schema:

```prisma
// auth-service/prisma/schema.prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  schemas  = ["auth"]
}

// user-service/prisma/schema.prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  schemas  = ["user"]
}
```

---

## API Gateway Routing Plan

### Route Configuration

| Method | Path | Upstream Service | Auth Required |
|--------|------|------------------|---------------|
| POST | /api/v1/auth/login | Auth Service (3001) | No |
| POST | /api/v1/auth/register | Auth Service (3001) | No |
| POST | /api/v1/auth/refresh | Auth Service (3001) | No |
| POST | /api/v1/auth/logout | Auth Service (3001) | Yes |
| GET | /api/v1/users/me | User Service (3002) | Yes |
| PUT | /api/v1/users/me | User Service (3002) | Yes |
| GET | /api/v1/users/me/addresses | User Service (3002) | Yes |
| POST | /api/v1/users/me/addresses | User Service (3002) | Yes |
| GET | /api/v1/products | Product Service (3003) | No |
| GET | /api/v1/products/:id | Product Service (3003) | No |
| GET | /api/v1/products/search | Search Service (3008) | No |
| GET | /api/v1/cart | Cart Service (3004) | Yes |
| POST | /api/v1/cart/items | Cart Service (3004) | Yes |
| PUT | /api/v1/cart/items/:id | Cart Service (3004) | Yes |
| DELETE | /api/v1/cart/items/:id | Cart Service (3004) | Yes |
| POST | /api/v1/orders | Order Service (3005) | Yes |
| GET | /api/v1/orders | Order Service (3005) | Yes |
| GET | /api/v1/orders/:id | Order Service (3005) | Yes |
| POST | /api/v1/payments/process | Payment Service (3006) | Yes |
| GET | /api/v1/payments/:orderId | Payment Service (3006) | Yes |
| GET | /api/v1/admin/analytics | Admin Service (3009) | Yes (Admin) |

### Gateway Middleware Pipeline

```
Request → Rate Limit → CORS → Auth Check → Route → Upstream Service
```

1. **Rate Limiting**: 100 requests/minute per IP
2. **CORS**: Allow frontend origin
3. **Authentication**: Validate JWT token
4. **Routing**: Forward to appropriate service

---

## Frontend to Gateway Communication Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         NEXT.JS FRONTEND (3001)                         │
│                                                                          │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐                 │
│  │   Pages     │    │ Components  │    │   Hooks    │                 │
│  │  /login     │    │  AuthForm   │    │ useAuth()  │                 │
│  │  /products  │    │ ProductCard │    │ useCart()  │                 │
│  │  /cart      │    │  CartItem   │    │useProducts │                 │
│  └──────┬──────┘    └──────┬──────┘    └──────┬──────┘                 │
│         │                  │                  │                         │
│         └──────────────────┼──────────────────┘                         │
│                            ▼                                            │
│                   ┌──────────────┐                                       │
│                   │ API Client   │                                       │
│                   │  (axios)     │                                       │
│                   └──────┬───────┘                                       │
└───────────────────────────┼─────────────────────────────────────────────┘
                            │ fetch('/api/auth/login', ...)
                            ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                      API GATEWAY (localhost:3000)                        │
│                                                                          │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐              │
│  │ Rate Limiter │    │  Auth Check  │    │   Router    │              │
│  └──────────────┘    └──────────────┘    └──────────────┘              │
└───────────────────────────┬─────────────────────────────────────────────┘
                            │ Forward to Auth Service
                            ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                     AUTH SERVICE (localhost:3001)                       │
│                                                                          │
│  1. Validate credentials                                                │
│  2. Generate JWT + Refresh Token                                       │
│  3. Store session in Redis                                             │
│  4. Return tokens to Gateway                                           │
└─────────────────────────────────────────────────────────────────────────┘
```

### Token Storage Flow

1. **Login Success**: Gateway returns JWT + Refresh Token
2. **Frontend Storage**: 
   - JWT: Memory (React state) + localStorage backup
   - Refresh Token: httpOnly cookie (recommended) or localStorage
3. **Subsequent Requests**: Include JWT in Authorization header

---

## JWT Authentication Flow

### Authentication Sequence

```
┌─────────────────────────────────────────────────────────────────────────┐
│                              USER                                       │
└─────────────────────────────┬───────────────────────────────────────────┘
                              │ 1. Login (email/password)
                              ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         FRONTEND                                        │
│                          axios.post('/api/auth/login', {email, password})│
└─────────────────────────────┬───────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                                                             │
│                   Rate Limit → Forward API GATEWAY to AUTH                          │
└─────────────────────────────┬───────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                       AUTH SERVICE                                      │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  │
│  │ Validate    │  │   Check     │  │  Generate   │  │   Store     │  │
│  │ Credentials │─▶│  User Exists│─▶│    Tokens   │─▶│   Session   │  │
│  └─────────────┘  └─────────────┘  └─────────────┘  └──────┬──────┘  │
└─────────────────────────────┬───────────────────────────────┼─────────┘
                              │                               │
                              │ JWT + Refresh Token          │ Redis
                              ▼                               ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         FRONTEND                                        │
│                                                                          │
│  - Store JWT in memory/localStorage                                     │
│  - Store Refresh Token in httpOnly cookie                              │
│  - Include JWT in subsequent request headers                           │
└─────────────────────────────┬───────────────────────────────────────────┘
                              │ 2. Subsequent Request
                              │ Authorization: Bearer <jwt_token>
                              ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                        API GATEWAY                                      │
│                   Extract JWT → Validate Signature                     │
└─────────────────────────────┬───────────────────────────────────────────┘
                              │ Valid
                              ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                      TARGET SERVICE                                      │
│           Extract userId from JWT → Process request                     │
└─────────────────────────────────────────────────────────────────────────┘
```

### Token Refresh Flow

```
┌─────────────┐    JWT Expired    ┌─────────────┐
│   Frontend  │──────────────────▶│ API Gateway │
└─────────────┘                   └──────┬──────┘
                                         │
                                         │ 401 Unauthorized
                                         ▼
┌─────────────┐    Refresh Token   ┌─────────────┐
│   Frontend  │◀───────────────────│ API Gateway │
└─────────────┘                   └──────┬──────┘
                                         │
                                         │ Forward with refresh token
                                         ▼
┌─────────────────────────────────────────────────────────────┐
│                         AUTH SERVICE                          │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │  Validate   │  │   Check     │  │  Generate   │         │
│  │Refresh Token│─▶│   Session   │─▶│    New JWT  │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
└────────────────────────────┬────────────────────────────────┘
                             │ New JWT
                             ▼
┌─────────────────────────────────────────────────────────────┐
│                         FRONTEND                            │
│              Retry original request with new JWT            │
└─────────────────────────────────────────────────────────────┘
```

### JWT Structure

```json
{
  "header": {
    "alg": "HS256",
    "typ": "JWT"
  },
  "payload": {
    "sub": "user-uuid",
    "email": "user@example.com",
    "role": "user|admin",
    "iat": 1700000000,
    "exp": 1700000900
  },
  "signature": "..."
}
```

### Security Best Practices

1. **Short-lived JWT**: 15 minutes expiration
2. **Long-lived Refresh Token**: 7 days expiration
3. **Store in httpOnly cookies** for refresh token
4. **HTTPS only** in production
5. **Implement token blacklist** for logout
6. **Rate limit** auth endpoints
