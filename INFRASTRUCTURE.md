# Infrastructure Documentation

## Technology Stack

### Core Technologies

| Category | Technology | Version | Purpose |
|----------|------------|---------|---------|
| Runtime | Node.js | 20 LTS | JavaScript runtime for all microservices |
| Framework | Express.js | 4.18.x | Web framework for REST APIs |
| Frontend | Next.js | 14.x | React framework with SSR/SSG |
| Database | PostgreSQL | 16 | Primary relational database |
| Cache | Redis | 7.2 | In-memory cache and session storage |
| Message Broker | RabbitMQ | 3.12 | Asynchronous event communication |
| API Gateway | Express Gateway | 1.17.x | API routing and management |

### Supporting Tools

| Category | Technology | Version |
|----------|------------|---------|
| Package Manager | npm | 10.x |
| Containerization | Docker | 24.x |
| Container Orchestration | Docker Compose | 2.24.x |
| Authentication | JWT | jsonwebtoken 9.x |
| Validation | Joi | 17.x |
| ORM | Prisma | 5.x |
| HTTP Client | Axios | 1.6.x |
| Environment Config | dotenv | 16.x |

---

## Docker Compose Setup

Create a file named `infra/docker-compose.yml` in your project root:

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:16
    container_name: ecommerce_postgres
    environment:
      POSTGRES_USER: ecommerce
      POSTGRES_PASSWORD: ecommerce_dev_password
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ecommerce"]
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7.2-alpine
    container_name: ecommerce_redis
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    command: redis-server --appendonly yes
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5

  rabbitmq:
    image: rabbitmq:3.12-management-alpine
    container_name: ecommerce_rabbitmq
    environment:
      RABBITMQ_DEFAULT_USER: ecommerce
      RABBITMQ_DEFAULT_PASS: ecommerce_dev_password
    ports:
      - "5672:5672"
      - "15672:15672"
    volumes:
      - rabbitmq_data:/var/lib/rabbitmq
    healthcheck:
      test: ["CMD", "rabbitmq-diagnostics", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5

volumes:
  postgres_data:
  redis_data:
  rabbitmq_data:
```

---

## Local Development Environment Setup

### Prerequisites

Ensure the following are installed on your machine:

1. **Node.js 20 LTS** - [Download](https://nodejs.org/)
2. **Docker Desktop** - [Download](https://www.docker.com/products/docker-desktop)
3. **Git** - [Download](https://git-scm.com/)

### Step-by-Step Setup

#### 1. Clone and Navigate to Project

```bash
git clone <repository-url>
cd ecommerce-microservices
```

#### 2. Start Infrastructure Services

```bash
# Navigate to infra directory
cd infra

# Start all infrastructure services
docker-compose up -d

# Verify services are running
docker-compose ps
```

Expected output:
```
NAME                IMAGE               COMMAND              SERVICE
ecommerce_postgres  postgres:16         "docker-entrypoint.s…"   postgres
ecommerce_redis     redis:7.2-alpine    "redis-server --app…"   redis
ecommerce_rabbitmq  rabbitmq:3.12-m…    "docker-entrypoint.s…"   rabbitmq
```

#### 3. Verify Infrastructure Services

```bash
# Check PostgreSQL
docker exec -it ecommerce_postgres psql -U ecommerce -c "SELECT version();"

# Check Redis
docker exec -it ecommerce_redis redis-cli ping

# Check RabbitMQ (management UI at http://localhost:15672)
docker exec -it ecommerce_rabbitmq rabbitmq-diagnostics ping
```

#### 4. Setup Each Service

```bash
# Navigate back to root
cd ..

# For each service, install dependencies and setup database
cd services/auth
npm install
cp .env.example .env
npx prisma generate
npx prisma db push

# Repeat for each service...
```

#### 5. Start Development Servers

```bash
# Option 1: Start all services manually (one terminal per service)
cd services/gateway && npm run dev
cd services/auth && npm run dev
cd services/user && npm run dev
# ... etc

# Option 2: Use concurrently to run multiple services
npm install -g concurrently
cd services/gateway && npm run dev
# (In separate terminals for each service)
```

---

## Environment Variables Structure

### Root .env (Shared Configuration)

Create a `.env` file in the project root:

```env
# ===================
# SHARED CONFIGURATION
# ===================

# Node Environment
NODE_ENV=development

# Infrastructure Hosts
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_USER=ecommerce
POSTGRES_PASSWORD=ecommerce_dev_password

REDIS_HOST=localhost
REDIS_PORT=6379

RABBITMQ_HOST=localhost
RABBITMQ_PORT=5672
RABBITMQ_USER=ecommerce
RABBITMQ_PASSWORD=ecommerce_dev_password
RABBITMQ_MANAGEMENT_PORT=15672

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_REFRESH_SECRET=your-super-secret-refresh-token-key-change-in-production
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:3000
```

### Service-Specific .env Files

Each service should have its own `.env` file with service-specific variables.

#### Auth Service (.env)

```env
# Service Configuration
PORT=3001
SERVICE_NAME=auth-service
DATABASE_SCHEMA=auth

# PostgreSQL
DATABASE_URL=postgresql://ecommerce:ecommerce_dev_password@localhost:5432/ecommerce

# Redis
REDIS_URL=redis://localhost:6379

# JWT (same across all services)
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_REFRESH_SECRET=your-super-secret-refresh-token-key-change-in-production
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
```

#### User Service (.env)

```env
PORT=3002
SERVICE_NAME=user-service
DATABASE_SCHEMA=user
DATABASE_URL=postgresql://ecommerce:ecommerce_dev_password@localhost:5432/ecommerce
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-super-secret-jwt-key-change-in-production
```

#### Product Service (.env)

```env
PORT=3003
SERVICE_NAME=product-service
DATABASE_SCHEMA=product
DATABASE_URL=postgresql://ecommerce:ecommerce_dev_password@localhost:5432/ecommerce
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-super-secret-jwt-key-change-in-production
```

#### Cart Service (.env)

```env
PORT=3004
SERVICE_NAME=cart-service
DATABASE_SCHEMA=cart
DATABASE_URL=postgresql://ecommerce:ecommerce_dev_password@localhost:5432/ecommerce
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-super-secret-jwt-key-change-in-production
```

#### Order Service (.env)

```env
PORT=3005
SERVICE_NAME=order-service
DATABASE_SCHEMA=order
DATABASE_URL=postgresql://ecommerce:ecommerce_dev_password@localhost:5432/ecommerce
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-super-secret-jwt-key-change-in-production
```

#### Payment Service (.env)

```env
PORT=3006
SERVICE_NAME=payment-service
DATABASE_SCHEMA=payment
DATABASE_URL=postgresql://ecommerce:ecommerce_dev_password@localhost:5432/ecommerce
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-super-secret-jwt-key-change-in-production

# Payment Gateway Configuration (example: Stripe)
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
```

#### Notification Service (.env)

```env
PORT=3007
SERVICE_NAME=notification-service
DATABASE_SCHEMA=notification
DATABASE_URL=postgresql://ecommerce:ecommerce_dev_password@localhost:5432/ecommerce
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-super-secret-jwt-key-change-in-production

# Email Configuration (example: SendGrid)
SENDGRID_API_KEY=SG.your_sendgrid_api_key
FROM_EMAIL=noreply@yourdomain.com
```

#### Search Service (.env)

```env
PORT=3008
SERVICE_NAME=search-service
DATABASE_SCHEMA=search
DATABASE_URL=postgresql://ecommerce:ecommerce_dev_password@localhost:5432/ecommerce
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-super-secret-jwt-key-change-in-production
```

#### Admin Service (.env)

```env
PORT=3009
SERVICE_NAME=admin-service
DATABASE_SCHEMA=admin
DATABASE_URL=postgresql://ecommerce:ecommerce_dev_password@localhost:5432/ecommerce
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-super-secret-jwt-key-change-in-production
```

#### API Gateway (.env)

```env
PORT=3000
SERVICE_NAME=api-gateway

# JWT Validation
JWT_SECRET=your-super-secret-jwt-key-change-in-production

# Upstream Services
AUTH_SERVICE_URL=http://localhost:3001
USER_SERVICE_URL=http://localhost:3002
PRODUCT_SERVICE_URL=http://localhost:3003
CART_SERVICE_URL=http://localhost:3004
ORDER_SERVICE_URL=http://localhost:3005
PAYMENT_SERVICE_URL=http://localhost:3006
NOTIFICATION_SERVICE_URL=http://localhost:3007
SEARCH_SERVICE_URL=http://localhost:3008
ADMIN_SERVICE_URL=http://localhost:3009

# Frontend
FRONTEND_URL=http://localhost:3000
```

#### Frontend (.env.local)

```env
# Next.js Configuration
NEXT_PUBLIC_API_GATEWAY_URL=http://localhost:3000

# Authentication
NEXT_PUBLIC_AUTH_TOKEN_KEY=auth_token
NEXT_PUBLIC_REFRESH_TOKEN_KEY=refresh_token
```

---

## Running Infrastructure with Single Command

### Quick Start

Create a script `start-infra.sh` in the `infra` folder:

```bash
#!/bin/bash

echo "🚀 Starting E-Commerce Infrastructure Services..."

# Change to infra directory
cd "$(dirname "$0")"

# Start Docker Compose
docker-compose up -d

# Wait for services to be healthy
echo "⏳ Waiting for services to be ready..."

# Check PostgreSQL
until docker exec ecommerce_postgres pg_isready -U ecommerce > /dev/null 2>&1; do
    echo "  ⏳ Waiting for PostgreSQL..."
    sleep 2
done
echo "  ✅ PostgreSQL is ready"

# Check Redis
until docker exec ecommerce_redis redis-cli ping > /dev/null 2>&1; do
    echo "  ⏳ Waiting for Redis..."
    sleep 2
done
echo "  ✅ Redis is ready"

# Check RabbitMQ
until docker exec ecommerce_rabbitmq rabbitmq-diagnostics ping > /dev/null 2>&1; do
    echo "  ⏳ Waiting for RabbitMQ..."
    sleep 2
done
echo "  ✅ RabbitMQ is ready"

echo ""
echo "🎉 All infrastructure services are running!"
echo ""
echo "Service URLs:"
echo "  PostgreSQL:  localhost:5432"
echo "  Redis:       localhost:6379"
echo "  RabbitMQ:    localhost:5672 (AMQP)"
echo "  RabbitMQ UI: localhost:15672"
echo ""
echo "To stop: docker-compose down"
echo "To view logs: docker-compose logs -f"
```

Make it executable:

```bash
chmod +x infra/start-infra.sh
```

### Usage

```bash
# Start all infrastructure
./infra/start-infra.sh

# Or simply
cd infra && docker-compose up -d
```

---

## Additional Commands

### Viewing Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f postgres
docker-compose logs -f redis
docker-compose logs -f rabbitmq
```

### Stopping Services

```bash
cd infra
docker-compose down

# Remove volumes (data will be lost)
docker-compose down -v
```

### Resetting Data

```bash
# Stop and remove volumes
docker-compose down -v

# Start fresh
docker-compose up -d
```

### Database Connection String Format

```
postgresql://[user]:[password]@[host]:[port]/[database]
```

Example for this project:
```
postgresql://ecommerce:ecommerce_dev_password@localhost:5432/ecommerce
```

---

## Development Workflow

1. **Start Infrastructure**: `./infra/start-infra.sh`
2. **Setup Each Service**:
   - Navigate to service directory
   - Run `npm install`
   - Copy `.env.example` to `.env`
   - Run `npx prisma generate`
   - Run `npx prisma db push` (creates schema)
3. **Start Services**: `npm run dev` in each service directory
4. **Start Frontend**: `cd frontend && npm run dev`

---

## Production Notes

For production deployment:

1. Change all default passwords in `docker-compose.yml`
2. Use environment-specific `.env.production` files
3. Enable SSL/TLS for PostgreSQL and RabbitMQ
4. Use production-grade Redis (Redis Cluster or managed service)
5. Set up proper backup strategies for PostgreSQL
6. Use container orchestration (Kubernetes) for scaling
7. Implement logging and monitoring (ELK stack, Prometheus, Grafana)
