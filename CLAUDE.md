# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

E-commerce platform built with 10 Express.js microservices and a React + Vite frontend. Each service owns its own PostgreSQL schema, shares Redis for caching/sessions, and communicates via RabbitMQ for async events.

## Commands

### Running Services

```bash
# From root - start all services concurrently
npm run dev:all

# Start individual services
npm run dev:gateway   # port 3000
npm run dev:auth      # port 3001
npm run dev:user      # port 3002
npm run dev:product   # port 3003
npm run dev:cart      # port 3004
npm run dev:order     # port 3005
npm run dev:payment   # port 3006
npm run dev:notification  # port 3007
npm run dev:search    # port 3008
npm run dev:admin     # port 3009

# Or via Makefile
make dev-all
make dev-auth  # any service name
```

### Infrastructure

```bash
make infra-up      # Start PostgreSQL, Redis, RabbitMQ with health checks
make infra-down    # Stop infrastructure
```

### Building, Testing, Linting

```bash
# All workspaces
npm run build    # tsc all services
npm run test     # Jest all services
npm run lint     # ESLint all services

# Single service - from services/<name>/
npm run dev              # ts-node-dev hot-reload
npm run build            # tsc → dist/
npm run test             # Jest
npm run test:watch       # Jest --watch
npm run test:coverage    # Jest --coverage
npm run test -- --testPathPattern="auth.service.test.ts"  # single file
npm run lint             # ESLint
npm run lint:fix         # ESLint --fix

# Prisma
npm run prisma:generate  # generate Prisma client
npm run prisma:migrate   # run migrations
npm run prisma:push      # push schema without migration
```

### Docker

```bash
make docker-build  # Build all 10 Docker images
make docker-up     # Full stack (infra + services)
make docker-down   # Stop containers
```

### Frontend

```bash
cd frontend && npm run dev   # localhost:5173
```

## Architecture

### Services

| Service | Port | DB Schema | Auth |
|---------|------|-----------|------|
| gateway | 3000 | - | - |
| auth | 3001 | auth | No |
| user | 3002 | user_service | Yes |
| product | 3003 | product_service | No |
| cart | 3004 | cart_service | Yes |
| order | 3005 | order_service | Yes |
| payment | 3006 | payment_service | Yes |
| notification | 3007 | notification_service | Yes |
| search | 3008 | search_service | No |
| admin | 3009 | admin_service | Yes |

### Database

Single PostgreSQL instance with separate schemas per service. Init scripts in `infra/postgres/init-scripts/init-schemas.sql`.

### Authentication

JWT access tokens (15min) + refresh tokens (7d). Pass via `Authorization: Bearer <token>` header.

### Error Response Format

```typescript
{ success: false, error: { code: 'VALIDATION_ERROR', message: '...', details?: ... } }
```

Error classes extend `AppError(statusCode, errorCode, message)`.

## Per-Service Structure

```
services/<name>/
├── src/
│   ├── index.ts              # entry point
│   ├── app.ts                # Express app setup
│   ├── config/
│   ├── modules/<feature>/     # self-contained feature modules
│   │   ├── <feature>.controller.ts
│   │   ├── <feature>.service.ts
│   │   ├── <feature>.route.ts
│   │   ├── <feature>.validator.ts  # Zod schemas
│   │   ├── <feature>.middleware.ts
│   │   ├── <feature>.types.ts
│   │   └── index.ts
│   ├── middleware/          # shared middleware
│   ├── repositories/        # data access layer
│   ├── routes/              # main router
│   └── utils/               # logger, errors, jwt, validate, email
├── tests/
└── prisma/schema.prisma
```

Import alias `@/*` maps to `src/`.

## Frontend

React 18, Vite 5, react-router-dom, Zustand, Tailwind CSS, shadcn/ui (Radix), Axios. Vite proxy routes `/api` → `localhost:3000` (gateway).

## Tests

Jest + ts-jest, `tests/` directory, `**/*.test.ts` pattern. Mocks are inline per test file. Each service has `tsconfig.test.json` with `strict: false` for jest.