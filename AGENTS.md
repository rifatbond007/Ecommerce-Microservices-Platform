<!-- # AGENTS.md - Development Guidelines

## Project Overview

This is a microservices-based e-commerce platform with four services:
- **auth-service** (`services/auth/`) - Authentication and authorization (Port 3001)
- **user-service** (`services/user/`) - User management, profiles, addresses, reviews, wishlists (Port 3002)
- **product-service** (`services/product/`) - Products, categories, inventory, brands, warehouses (Port 3003)
- **api-gateway** (`services/gateway/`) - API Gateway for routing requests (Port 3000)

## Build, Lint, and Test Commands

### Common Commands (run from any service directory)

```bash
# Development
npm run dev                    # Start with hot reload (ts-node-dev)

# Build & Run
npm run build                  # Compile TypeScript to dist/
npm run start                  # Run production build (node dist/index.js)

# Testing
npm run test                   # Run all tests
npm run test:watch             # Watch mode for tests
npm run test:coverage          # Generate coverage report

# Run a single test file
npm run test -- auth.service.test.ts
npm run test -- --testPathPattern="auth.service"

# Linting
npm run lint                   # Run ESLint
npm run lint:fix               # Auto-fix linting issues

# Database (Prisma)
npm run prisma:generate        # Generate Prisma client
npm run prisma:migrate         # Run database migrations
npm run prisma:push            # Push schema to database
```

### Running Commands in Specific Services

```bash
cd services/auth      && npm run <command>
cd services/user      && npm run <command>
cd services/product   && npm run <command>
cd services/gateway   && npm run <command>
```

## Code Style Guidelines

### General Principles

- Use **TypeScript** with strict mode enabled
- Follow the **Controller-Service-Repository** architectural pattern
- Use **barrel exports** (index.ts files) for clean module imports

### Naming Conventions

| Element | Convention | Example |
|---------|------------|---------|
| Classes | PascalCase | `AuthController`, `ProductsService` |
| Functions/variables | camelCase | `getProductById`, `isActive` |
| Constants | SCREAMING_SNAKE_CASE | `MAX_RETRY_COUNT` |
| Interfaces/Types | PascalCase | `ProductResponse`, `CreateProductInput` |
| Files | kebab-case | `products.controller.ts`, `products.service.ts` |
| Database models | PascalCase | `Product`, `Category`, `Inventory` |

### Import Order

1. Node built-ins
2. External libraries (express, zod, prisma)
3. Internal modules (relative paths)
4. Type imports

```typescript
import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcrypt';
import { productRepository } from '../../repositories';
import { NotFoundError } from '../../utils/errors';
import type { CreateProductInput } from './products.validator';
```

### Response Format

```typescript
// Success
res.status(200).json({ success: true, data: { /* data */ } });

// Created
res.status(201).json({ success: true, data: { /* data */ } });

// Error
res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Error' } });
```

### Error Handling

Use custom error classes from `src/utils/errors.ts`:
- `ValidationError` (400) - Input validation errors
- `UnauthorizedError` (401) - Authentication failures
- `ForbiddenError` (403) - Permission denied
- `NotFoundError` (404) - Resource not found
- `ConflictError` (409) - Duplicate/invalid state
- `InternalServerError` (500) - Server errors

```typescript
// Controllers - pass errors to middleware
try {
  const product = await productsService.getProductById(id);
  res.status(200).json({ success: true, data: product });
} catch (error) {
  next(error);
}

// Services - throw errors
throw new NotFoundError('Product');
throw new ConflictError('SKU already exists');
```

### Validation

Use **Zod** for request validation in validators:

```typescript
import { z } from 'zod';

export const createProductSchema = z.object({
  body: z.object({
    sku: z.string().min(1).max(50),
    name: z.string().min(1).max(255),
    slug: z.string().min(1).max(255),
    categoryId: z.string().uuid(),
    basePrice: z.number().positive(),
  }),
});

export type CreateProductInput = z.infer<typeof createProductSchema>['body'];
```

Apply in routes:
```typescript
import { validate } from '../../utils/validate';
router.post('/', authenticate, requireAdmin, validate(createProductSchema), productsController.createProduct);
```

### Project Structure

```
src/
├── config/           # Environment configuration
├── middleware/       # Express middleware (auth, error, rate-limit)
├── modules/          # Feature modules
│   └── <module>/
│       ├── index.ts           # Barrel export
│       ├── <module>.route.ts  # Express router
│       ├── <module>.controller.ts
│       ├── <module>.service.ts
│       ├── <module>.validator.ts
│       └── <module>.types.ts
├── repositories/     # Database access (Prisma)
├── routes/          # Main router
├── utils/           # Utilities (errors, logger, validate)
├── app.ts           # Express app factory
└── index.ts         # Entry point
```

### Service Pattern

```typescript
export class ProductsService {
  async getProductById(id: string): Promise<ProductResponse> {
    const product = await productRepository.findById(id);
    if (!product) throw new NotFoundError('Product');
    return this.formatProductResponse(product);
  }
}

export const productsService = new ProductsService();
```

### Controller Pattern

```typescript
export class ProductsController {
  async getProductById(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const product = await productsService.getProductById(req.params.id);
      res.status(200).json({ success: true, data: product });
    } catch (error) {
      next(error);
    }
  }
}

export const productsController = new ProductsController();
```

### Testing Guidelines

Follow Jest conventions with mocks:

```typescript
import { describe, it, expect, beforeEach, jest } from '@jest/globals';

jest.mock('../src/repositories/product.repository', () => ({
  productRepository: {
    findById: jest.fn(),
    create: jest.fn(),
  },
}));

describe('ProductsService', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('getProductById', () => {
    it('should return product by id', async () => {
      const { productsService } = await import('../src/modules/products/products.service');
      const { productRepository } = await import('../src/repositories/product.repository');
      (productRepository.findById as jest.Mock).mockResolvedValue({ id: '1', name: 'Test' });
      
      const result = await productsService.getProductById('1');
      expect(result.id).toBe('1');
    });
  });
});
```

### Security Best Practices

- Never log sensitive data (passwords, tokens)
- Validate all user input with Zod
- Use parameterized queries (Prisma handles this)
- Hash passwords with bcrypt (12 rounds)
- Implement proper CORS configuration

### Product-Service API Endpoints

```
Products:
GET    /api/v1/products              - List products (public)
GET    /api/v1/products/featured     - Featured products (public)
GET    /api/v1/products/slug/:slug  - Get by slug (public)
GET    /api/v1/products/:id         - Get by ID (public)
POST   /api/v1/products             - Create (admin)
PUT    /api/v1/products/:id         - Update (admin)
DELETE /api/v1/products/:id         - Delete (admin)

Categories:
GET    /api/v1/categories            - List categories (public)
GET    /api/v1/categories/tree      - Category tree (public)
GET    /api/v1/categories/slug/:slug - Get by slug (public)
GET    /api/v1/categories/:id       - Get by ID (public)
POST   /api/v1/categories           - Create (admin)
PUT    /api/v1/categories/:id       - Update (admin)
DELETE /api/v1/categories/:id       - Delete (admin)

Brands:
GET    /api/v1/brands               - List brands (public)
GET    /api/v1/brands/slug/:slug   - Get by slug (public)
GET    /api/v1/brands/:id          - Get by ID (public)
POST   /api/v1/brands              - Create (admin)
PUT    /api/v1/brands/:id          - Update (admin)
DELETE /api/v1/brands/:id          - Delete (admin)

Inventory:
GET    /api/v1/inventory             - List inventory (admin)
GET    /api/v1/inventory/product/:productId - By product (public)
GET    /api/v1/inventory/variant/:variantId - By variant (public)
GET    /api/v1/inventory/:id       - Get by ID (public)
POST   /api/v1/inventory            - Create (admin)
POST   /api/v1/inventory/:id/adjust - Adjust quantity (admin)
POST   /api/v1/inventory/:id/reserve - Reserve (admin)
POST   /api/v1/inventory/:id/release - Release (admin)
DELETE /api/v1/inventory/:id        - Delete (admin)

Warehouses:
GET    /api/v1/inventory/warehouses/all - List warehouses (admin)
GET    /api/v1/inventory/warehouses/:id - Get by ID (admin)
POST   /api/v1/inventory/warehouses     - Create (admin)
PUT    /api/v1/inventory/warehouses/:id - Update (admin)
DELETE /api/v1/inventory/warehouses/:id - Delete (admin)
``` -->



# AGENTS.md — OpenCode Codebase Rules

## Auto Commit & Push Workflow (Free — No External API)

### Trigger Phrases
যখন user এগুলো বলবে, তখন নিচের steps follow করো:

- "commit koro"
- "commit kore dao"
- "push koro"
- "push kore dao"
- "save koro"
- "/commit"
- "/push"
- "/done"
- "done, commit koro"

---

### Step-by-Step Process

**Step 1 — চেক করো কী পরিবর্তন হয়েছে**
```bash
git status
git diff --cached --stat
git diff --stat
```

**Step 2 — সব changes stage করো**
```bash
git add -A
```

**Step 3 — Diff analyze করো এবং commit message বানাও**

Staged diff দেখে নিজে একটা conventional commit message তৈরি করো:

Format:
```
type(scope): short description

[optional body — max 3 lines, only if complex]
```

Types: `feat` | `fix` | `refactor` | `chore` | `docs` | `test` | `style` | `perf`

Examples:
```
feat(auth): add seller registration with admin approval workflow
fix(user): resolve UUID validation on userId params
refactor(product): allow admins and approved sellers to manage products
chore(env): replace hardcoded admin email with placeholder
```

**Step 4 — Commit করো**
```bash
git commit -m "তোমার generated message এখানে"
```

**Step 5 — Current branch চেক করো তারপর push করো**
```bash
git rev-parse --abbrev-ref HEAD   # branch name জানো
git push origin <branch-name>
```

upstream না থাকলে:
```bash
git push --set-upstream origin <branch-name>
```

---

### Rules
- `main` বা `master`-এ directly push করবে না — সবসময় current branch চেক করো
- কোনো changes না থাকলে user-কে জানাও, commit করো না
- Commit message সবসময় ইংরেজিতে লিখবে
- Push সফল হলে user-কে confirm করো কোন branch-এ গেছে

---

### /review এর পরে
`/review` command শেষ হলে সবসময় এটা যোগ করো:

```
---
✅ Review শেষ। Commit করতে চাইলে বলো: "commit koro"
```