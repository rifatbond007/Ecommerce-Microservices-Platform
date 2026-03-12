# E-Commerce Microservices Platform

A full-featured e-commerce platform built with 10 microservices using Node.js, Express.js, Next.js, PostgreSQL, Redis, and RabbitMQ.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                         Frontend (Next.js)                          │
│                           localhost:3001                            │
└─────────────────────────────────────┬───────────────────────────────┘
                                      │ HTTPS/REST
                                      ▼
┌─────────────────────────────────────────────────────────────────────┐
│                        API Gateway (Port 3000)                      │
│               Rate Limiting │ CORS │ JWT Auth │ Routing             │
└─────────────────────────────────────┬───────────────────────────────┘
                                      │
         ┌────────────┬──────────────┼──────────────┬─────────────┐
         ▼            ▼              ▼              ▼             ▼
        ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌──────────┐
        │  Auth   │ │  User   │ │ Product │ │  Cart   │ │  Order   │
        │  :3001  │ │  :3002  │ │  :3003  │ │  :3004  │ │  :3005   │
        └─────────┘ └─────────┘ └─────────┘ └─────────┘ └──────────┘
```

---

## Services

| # | Service | Port | Database Schema | Description |
|---|---------|------|----------------|-------------|
| 1 | API Gateway | 3000 | - | Request routing, authentication, rate limiting |
| 2 | Auth Service | 3001 | auth | User authentication, JWT/refresh token management |
| 3 | User Service | 3002 | user_service | User profile management, addresses, reviews |
| 4 | Product Service | 3003 | product_service | Product catalog, categories, inventory |
| 5 | Cart Service | 3004 | cart_service | Shopping cart management |
| 6 | Order Service | 3005 | order_service | Order processing, order history |
| 7 | Payment Service | 3006 | payment_service | Payment processing, transactions |
| 8 | Notification Service | 3007 | notification_service | Email, SMS, push notifications |
| 9 | Search Service | 3008 | search_service | Product search, filtering, suggestions |
| 10 | Admin Service | 3009 | admin_service | Admin dashboard, analytics, management |

---

## Tech Stack

| Category | Technology |
|----------|------------|
| Runtime | Node.js 20 LTS |
| Backend Framework | Express.js |
| Frontend | Next.js 14 |
| Database | PostgreSQL 16 |
| Cache | Redis 7.2 |
| Message Broker | RabbitMQ 3.12 |
| ORM | Prisma 5.x |
| Authentication | JWT |

---

## Project Structure

```
ecommerce-microservices/
├── services/              # All microservices
│   ├── auth/           # Auth Service (TypeScript, Prisma)
│   ├── user/          # User Service (TypeScript, Prisma)
│   ├── product/       # Product Service
│   ├── cart/          # Cart Service
│   ├── order/         # Order Service
│   ├── payment/      # Payment Service
│   ├── notification/  # Notification Service
│   ├── search/        # Search Service
│   └── admin/         # Admin Service
├── frontend/           # Next.js frontend
├── infra/              # Infrastructure (Docker Compose)
├── docs/              # Detailed documentation
└── README.md          # This file
```

---

## Quick Start

### Prerequisites

| Tool | Version | Command |
|------|--------|---------|
| Node.js | 20 LTS | `node --version` |
| npm | 10.x | `npm --version` |
| Docker | 24.x | `docker --version` |
| Docker Compose | 2.24.x | `docker-compose --version` |

### 1. Start Infrastructure

```bash
cd infra
docker-compose up -d
```

### 2. Setup Services

```bash
# Each service needs:
cd services/<service-name>
cp .env.example .env
npm install
npx prisma generate
npx prisma db push
npm run dev
```

### 3. Service URLs

| Service | URL |
|--------|-----|
| Frontend | http://localhost:3001 |
| API Gateway | http://localhost:3000 |
| RabbitMQ Management | http://localhost:15672 |
| PostgreSQL | localhost:5432 |
| Redis | localhost:6379 |

---

## Implemented Services

### Auth Service (`services/auth`)

- User registration/login
- JWT access tokens (15min) + refresh tokens (7 days)
- Session management
- Password reset flow
- Email verification

**API Endpoints:**
| Method | Endpoint | Auth |
|--------|----------|------|
| POST | `/api/v1/auth/register` | No |
| POST | `/api/v1/auth/login` | No |
| POST | `/api/v1/auth/refresh` | No |
| POST | `/api/v1/auth/logout` | Yes |
| GET | `/api/v1/auth/me` | Yes |

### User Service (`services/user`)

- Profile management
- Address management (shipping/billing)
- Wishlists
- Product reviews

**API Endpoints:**
| Method | Endpoint | Auth |
|--------|----------|------|
| GET/POST/PUT | `/api/v1/profiles` | Yes |
| GET/POST/PUT/DELETE | `/api/v1/addresses/:id` | Yes |
| GET/POST | `/api/v1/wishlists` | Yes |
| GET/POST | `/api/v1/reviews` | Yes |

---

## Documentation

| Document | Description |
|----------|-------------|
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | Service communication, database per service strategy |
| [docs/FOLDER_STRUCTURE.md](docs/FOLDER_STRUCTURE.md) | Project structure, code patterns |
| [docs/SERVICE_LIST.md](docs/SERVICE_LIST.md) | Detailed service information |
| [docs/DATABASE_SCHEMA.md](docs/DATABASE_SCHEMA.md) | Database tables and relationships |
| [docs/INFRASTRUCTURE.md](docs/INFRASTRUCTURE.md) | Docker, environment setup |
| [docs/SYSTEM_DESIGN.md](docs/SYSTEM_DESIGN.md) | Security, scalability, API contracts |

---

## Contribution Guidelines

### Branch Naming

| Type | Example |
|------|---------|
| Feature | `feature/add-user-avatars` |
| Bug Fix | `fix/cart-item-quantity` |
| Documentation | `docs/api-endpoints` |
| Refactor | `refactor/auth-service-cleanup` |

### Commit Message Format

```
<type>(<scope>): <subject>

# Examples:
feat(auth): add refresh token endpoint
fix(cart): resolve quantity update bug
docs(readme): update installation steps
```

**Types:** `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`

---

## License

MIT
