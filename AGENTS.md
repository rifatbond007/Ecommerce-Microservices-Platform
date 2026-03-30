# AGENTS.md — OpenCode Codebase Rules

## Build / Lint / Test Commands

### Per-Service Commands (run from service directory)

```bash
# Development
npm run dev                    # Start with hot-reload (ts-node-dev)

# Build
npm run build                 # Compile TypeScript to dist/
npm run start                 # Run compiled JS from dist/

# Testing
npm run test                  # Run Jest tests
npm run test:watch            # Run tests in watch mode
npm run test:coverage         # Run tests with coverage
npm run test -- --testNamePattern="test name"  # Run single test

# Linting
npm run lint                  # Run ESLint
npm run lint:fix              # Fix ESLint issues

# Database
npm run prisma:generate       # Generate Prisma client
npm run prisma:migrate        # Run migrations
npm run prisma:push           # Push schema to DB
```

### Root Commands

```bash
# Install all services
cd services/<service> && npm install

# Run infrastructure
cd infra && docker-compose up -d
```

---

## Code Style Guidelines

### TypeScript Configuration

All services use `tsconfig.json` with strict mode:

```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true
  }
}
```

### Path Aliases

Use path aliases defined in tsconfig.json:

```typescript
// Instead of relative imports
import { authService } from '@services/auth';
import { config } from '@config';
import { logger } from '@utils/logger';
```

### Import Organization

Order imports as follows:

1. Node.js built-in (express, etc.)
2. External libraries (prisma, zod, etc.)
3. Internal modules (relative paths, @ aliases)

```typescript
import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { authService } from '@modules/auth';
import { config } from '@/config';
```

### Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| Files | kebab-case | `auth.service.ts`, `user-middleware.ts` |
| Classes | PascalCase | `AuthController`, `CartsService` |
| Functions | camelCase | `getUserById`, `createProduct` |
| Constants | UPPER_SNAKE_CASE | `MAX_RETRY_COUNT`, `DEFAULT_PAGE_SIZE` |
| Interfaces | PascalCase | `UserProfile`, `CartItem` |
| Types | PascalCase | `AuthResponse`, `CreateProductInput` |

### Error Handling

Use custom error classes from `@utils/errors.ts`:

```typescript
import { 
  AppError, 
  ValidationError, 
  UnauthorizedError, 
  NotFoundError, 
  ConflictError 
} from '@/utils/errors';

// In controllers - always use try/catch with next(error)
async register(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await authService.register(req.body);
    res.status(201).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}
```

### Validation

Use Zod for input validation:

```typescript
import { z } from 'zod';

export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(100),
  firstName: z.string().min(1).max(50),
  lastName: z.string().min(1).max(50),
});
```

### Controller Pattern

```typescript
export class AuthController {
  async register(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await authService.register(req.body);
      res.status(201).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }
}

export const authController = new AuthController();
```

### Service Pattern

```typescript
export class AuthService {
  async register(data: RegisterInput) {
    const existingUser = await userRepository.findByEmail(data.email);
    if (existingUser) {
      throw new ConflictError('Email already registered');
    }
    // ... implementation
  }
}

export const authService = new AuthService();
```

### Repository Pattern

```typescript
export class UserRepository {
  async findByEmail(email: string) {
    return prisma.user.findUnique({ where: { email } });
  }
}

export const userRepository = new UserRepository();
```

### Middleware Pattern

```typescript
export const authenticate = (req: Request, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    throw new UnauthorizedError('No token provided');
  }
  // ... verify and attach user
  next();
};
```

### Testing Patterns

Follow the auth service test pattern:

```typescript
import { describe, it, expect, beforeEach, jest } from '@jest/globals';

// Mock dependencies
jest.mock('../src/repositories/user.repository', () => ({
  userRepository: {
    findByEmail: mockFindByEmail,
  },
}));

describe('AuthService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should login successfully', async () => {
    // Arrange
    mockFindByEmail.mockResolvedValue({ ... });
    
    // Act
    const result = await authService.login({ ... });
    
    // Assert
    expect(result).toHaveProperty('tokens');
  });
});
```

---

## Project Structure

```
services/
├── auth/           # Auth Service (port 3001)
├── user/           # User Service (port 3002)
├── product/        # Product Service (port 3003)
├── cart/           # Cart Service (port 3004)
├── gateway/        # API Gateway (port 3000)
├── order/          # Order Service (NOT IMPLEMENTED - port 3005)
├── payment/        # Payment Service (NOT IMPLEMENTED - port 3006)
├── notification/   # Notification Service (NOT IMPLEMENTED - port 3007)
├── search/         # Search Service (NOT IMPLEMENTED - port 3008)
└── admin/          # Admin Service (NOT IMPLEMENTED - port 3009)
```

### Service Structure (per service)

```
services/<service>/
├── src/
│   ├── index.ts              # Entry point
│   ├── app.ts                # Express app
│   ├── config/               # Configuration
│   ├── modules/              # Feature modules
│   │   └── <feature>/
│   │       ├── *.controller.ts
│   │       ├── *.service.ts
│   │       ├── *.route.ts
│   │       ├── *.validator.ts
│   │       └── index.ts
│   ├── middleware/           # Shared middleware
│   ├── repositories/         # Database repositories
│   ├── routes/               # Route aggregation
│   └── utils/                # Utilities (errors, logger, validate)
├── tests/                    # Test files
├── prisma/                   # Prisma schema
└── package.json
```

---

## Gateway Routes

The gateway proxies requests to services:

| Path | Service | Auth Required |
|------|---------|---------------|
| /api/v1/auth/* | Auth (3001) | No |
| /api/v1/users/* | User (3002) | Yes |
| /api/v1/products/* | Product (3003) | No |
| /api/v1/cart/* | Cart (3004) | Yes |
| /api/v1/orders/* | Order (3005) | Yes |
| /api/v1/payments/* | Payment (3006) | Yes |
| /api/v1/search/* | Search (3008) | No |
| /api/v1/admin/* | Admin (3009) | Yes |

---

## Known Issues

### 1. Missing Services
Order, Payment, Notification, Search, and Admin services are documented but not implemented.

> **Note**: The cart service and user service issues have been FIXED:
> - Cart routes now have `authenticate` middleware
> - Cart/User/Product services support `x-user-id` header from gateway
> - User service routes updated to `/users/me/*` to match gateway expectations

---

## Auto Commit & Push Workflow

### Trigger Phrases
When user says:
- "commit koro", "commit kore dao"
- "push koro", "push kore dao"
- "save koro"
- "/commit", "/push", "/done"

### Step-by-Step

**Step 1** - Check changes:
```bash
git status
git diff --stat
```

**Step 2** - Stage all changes:
```bash
git add -A
```

**Step 3** - Create commit (conventional format):
```
type(scope): short description
```
Types: `feat` | `fix` | `refactor` | `chore` | `docs` | `test`

**Step 4** - Commit:
```bash
git commit -m "your message"
```

**Step 5** - Push:
```bash
git push origin <branch-name>
```

### Rules
- Don't push directly to main/master - always check current branch
- No changes = don't commit
- Commit messages in English

---
