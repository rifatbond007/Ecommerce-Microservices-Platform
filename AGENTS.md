# AGENTS.md - Development Guidelines

## Project Overview

This is a microservices-based e-commerce platform with three services:
- **auth-service** (`services/auth/`) - Authentication and authorization
- **api-gateway** (`services/gateway/`) - API Gateway for routing requests
- **user-service** (`services/user/`) - User management, profiles, addresses, reviews, wishlists

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
cd services/auth   && npm run <command>
cd services/gateway && npm run <command>
cd services/user   && npm run <command>
```

## Code Style Guidelines

### General Principles

- Use **TypeScript** with strict mode enabled
- Follow the **Controller-Service-Repository** architectural pattern
- Use **barrel exports** (index.ts files) for clean module imports
- Keep functions small and focused (single responsibility)

### Naming Conventions

| Element | Convention | Example |
|---------|------------|---------|
| Classes | PascalCase | `AuthController`, `UserService` |
| Functions/variables | camelCase | `getUserById`, `isActive` |
| Constants | SCREAMING_SNAKE_CASE | `MAX_RETRY_COUNT` |
| Interfaces/Types | PascalCase | `UserResponse`, `RegisterInput` |
| Files | kebab-case | `auth.controller.ts`, `user.service.ts` |
| Database models | PascalCase | `User`, `Session`, `LoginAttempt` |

### Import Order

1. Node built-ins (fs, path, etc.)
2. External libraries (express, zod, prisma)
3. Internal modules (relative paths for same module, absolute for shared)
4. Type imports

```typescript
// Good
import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { config } from '../../config';
import { userRepository, sessionRepository } from '../../repositories';
import { generateAccessToken } from '../../utils/jwt';
import { UnauthorizedError } from '../../utils/errors';
import type { RegisterInput, AuthResponse } from './auth.types';
```

### Response Format

All API responses should follow this structure:

```typescript
// Success response
res.status(200).json({
  success: true,
  data: { /* response data */ },
});

// Created response
res.status(201).json({
  success: true,
  data: { /* response data */ },
});

// Error response
res.status(400).json({
  success: false,
  error: {
    code: 'VALIDATION_ERROR',
    message: 'Error message',
  },
});
```

### Error Handling

Use custom error classes from `src/utils/errors.ts`:

```typescript
// In controllers - pass errors to middleware
try {
  const result = await authService.register(req.body);
  res.status(201).json({ success: true, data: result });
} catch (error) {
  next(error);
}

// Throwing errors in services
throw new UnauthorizedError('Invalid credentials');
throw new NotFoundError('User');
throw new ConflictError('Email already registered');
```

Available error classes:
- `AppError` (base class)
- `ValidationError` (400)
- `UnauthorizedError` (401)
- `ForbiddenError` (403)
- `NotFoundError` (404)
- `ConflictError` (409)
- `InternalServerError` (500)
- `TokenExpiredError` (401)
- `InvalidTokenError` (401)

### Validation

Use **Zod** for request validation in validators:

```typescript
import { z } from 'zod';

export const registerSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email format'),
    password: z.string().min(8).regex(/[A-Z]/),
    username: z.string().min(3).max(50),
    firstName: z.string().min(1).max(100),
    lastName: z.string().min(1).max(100),
    phone: z.string().optional(),
  }),
});

export type RegisterInput = z.infer<typeof registerSchema>['body'];
```

Apply validation in routes:

```typescript
import { validate } from '../../utils/validate';

router.post('/register', validate(registerSchema), authController.register);
```

### Project Structure

```
src/
├── config/           # Configuration (environment variables)
├── controllers/      # (Not used - use modules/)
├── middleware/       # Express middleware (auth, rate-limit, error)
├── modules/          # Feature modules (auth/, users/, etc.)
│   └── <module>/
│       ├── index.ts          # Barrel export
│       ├── <module>.route.ts # Express router
│       ├── <module>.controller.ts
│       ├── <module>.service.ts
│       ├── <module>.validator.ts
│       └── <module>.types.ts  # TypeScript interfaces
├── repositories/     # Database access (Prisma)
├── routes/          # Main router
├── utils/           # Utilities (errors, logger, jwt, validate)
├── app.ts           # Express app factory
└── index.ts         # Entry point
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
  async register(input: RegisterInput): Promise<AuthResponse> {
    // Validate business logic
    if (await userRepository.existsByEmail(input.email)) {
      throw new ConflictError('Email already registered');
    }
    // Process and return
    return { user, tokens };
  }
}

export const authService = new AuthService();
```

### TypeScript Configuration

The project uses strict TypeScript settings:
- `strict: true`
- `noImplicitAny: true`
- `strictNullChecks: true`
- `noUnusedLocals: true`
- `noUnusedParameters: true`

Always define proper types - avoid `any`.

### Logging

Use the centralized logger from `src/utils/logger`:

```typescript
import { logger } from '../../utils/logger';

logger.info('User registered', { userId: user.id, email: user.email });
logger.error('Failed to process', { error: err.message });
```

### Database (Prisma)

- Use Prisma Client for database operations
- Repository pattern for data access
- Always use parameterized queries (Prisma handles this)

### Testing Guidelines

Follow Jest conventions:

```typescript
import { describe, it, expect, beforeEach, jest } from '@jest/globals';

describe('AuthService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should register a new user', async () => {
      // Test implementation
    });
  });
});
```

### Database Environment

Each service requires a `.env` file with:
```
DATABASE_URL=postgresql://...
REDIS_URL=redis://...
JWT_SECRET=...
JWT_REFRESH_SECRET=...
PORT=3001
NODE_ENV=development
```

### Security Best Practices

- Never log sensitive data (passwords, tokens)
- Use parameterized queries (Prisma default)
- Validate all user input with Zod
- Use rate limiting on auth endpoints
- Hash passwords with bcrypt (12 rounds)
- Implement proper CORS configuration
