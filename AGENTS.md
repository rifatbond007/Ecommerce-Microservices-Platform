# AGENTS.md — Codebase Rules

This file provides guidelines for AI agents working in this e-commerce microservices repository.

---

## Build / Lint / Test Commands

### Per-Service Commands (run from service directory)
```bash
npm run dev              # Start with hot-reload (ts-node-dev)
npm run build            # Compile TypeScript to dist/
npm run start            # Run compiled JS from dist/
npm run test             # Run all Jest tests
npm run test:watch       # Watch mode for tests
npm run test:coverage    # With coverage report
npm run lint             # ESLint with TypeScript support
npm run lint:fix         # Auto-fix ESLint issues
npm run typecheck        # TypeScript type checking
npm run prisma:generate  # Generate Prisma client
npm run prisma:migrate   # Run database migrations
```

### Running Tests
- **Single test file**: `npm run test -- --testPathPattern="auth.service.test.ts"`
- **Single test function**: `npm run test -- --testNamePattern="should authenticate"`
- **Watch single file**: `npm run test -- --testPathPattern="auth" --watch`

---

## Code Style Guidelines

### TypeScript Configuration
Strict mode enabled with: `strict`, `noImplicitAny`, `strictNullChecks`, `noUnusedLocals`, `noUnusedParameters`

### Import Order (top to bottom)
1. Node.js built-in (path, fs, crypto)
2. External packages (express, prisma, zod, jwt)
3. Internal @ aliases (@config, @services, @controllers)
4. Relative imports (../utils, ./services)

### Naming Conventions
| Type | Convention | Example |
|------|------------|---------|
| Files | kebab-case | `auth.service.ts` |
| Classes | PascalCase | `AuthController` |
| Functions | camelCase | `getUserById` |
| Constants | UPPER_SNAKE_CASE | `MAX_RETRIES` |
| Interfaces | PascalCase | `UserProfile` |
| Enums | PascalCase | `OrderStatus` |
| DB Tables | snake_case | `user_profiles` |

### Error Handling
```typescript
import { AppError, ValidationError, UnauthorizedError } from '@/utils/errors';
try {
  // business logic
} catch (error) {
  if (error instanceof AppError) {
    return res.status(error.statusCode).json({ success: false, message: error.message });
  }
  next(error);
}
```

### Validation
Use Zod schemas in `src/validators/` for request validation:
```typescript
import { z } from 'zod';
export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});
```

---

## Code Patterns

### Controller
```typescript
class AuthController {
  async register(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await this.authService.register(req.body);
      res.status(201).json({ success: true, data: result });
    } catch (error) { next(error); }
  }
}
```

### Service
```typescript
class AuthService {
  async register(dto: RegisterDto): Promise<User> {
    const existing = await this.userRepo.findByEmail(dto.email);
    if (existing) throw new ValidationError('Email already exists');
    // business logic...
  }
}
```

### Repository
```typescript
class UserRepository {
  async findByEmail(email: string): Promise<User | null> {
    return prisma.user.findUnique({ where: { email } });
  }
}
```

### Middleware
```typescript
export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) throw new UnauthorizedError('No token provided');
  // verify token...
  next();
};
```

---

## Project Structure

```
services/
├── gateway/     (Port 3000)   # API Gateway, routing, auth
├── auth/        (Port 3001)   # Auth, JWT, sessions, roles
├── user/        (Port 3002)   # Profiles, addresses, reviews
├── product/     (Port 3003)   # Products, categories, inventory
├── cart/        (Port 3004)   # Shopping cart
├── order/       (Port 3005)   # Orders, tracking, returns
├── payment/     (Port 3006)   # Payment processing, refunds, webhooks
└── admin/       (Port 3009)   # Admin dashboard
```

### Per Service Structure
```
services/<service>/
├── src/
│   ├── index.ts, app.ts, config/
│   ├── controllers/, services/, repositories/
│   ├── middleware/, routes/, validators/, utils/, types/
├── tests/, prisma/, package.json
```

---

## Frontend (Next.js)

### Setup
```bash
cd Frontend
npm install
npm run dev
```

### Tech Stack
- **Framework**: Next.js 14 (App Router)
- **UI**: Tailwind CSS + shadcn/ui
- **State**: Zustand, TanStack Query
- **Forms**: React Hook Form + Zod

### Folder Structure
```
Frontend/
├── src/
│   ├── app/                    # App Router pages
│   │   ├── (auth)/             # Auth route group
│   │   ├── (dashboard)/       # Protected routes
│   │   ├── api/                # API routes
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── components/            # Shared components
│   │   ├── ui/                 # shadcn/ui components
│   │   └── ...                 # Feature components
│   ├── lib/                    # Utilities, API client
│   ├── stores/                 # Zustand stores
│   └── types/                  # TypeScript types
├── package.json
└── next.config.js
```

---

## Gateway Routes

| Path | Service | Auth |
|------|---------|------|
| /api/v1/auth/* | Auth (3001) | No |
| /api/v1/users/* | User (3002) | Yes |
| /api/v1/products/* | Product (3003) | No |
| /api/v1/cart/* | Cart (3004) | Yes |
| /api/v1/orders/* | Order (3005) | Yes |
| /api/v1/payments/* | Payment (3006) | Yes |
| /api/v1/admin/* | Admin (3009) | Yes |

### Authentication
- JWT access tokens: 15 min expiry
- Refresh tokens: 7 days expiry
- Pass via `Authorization: Bearer <token>`

---

## Development Workflow

```bash
cd services/<service-name>
cp .env.example .env
npm install
npm run prisma:generate
npm run dev
```

### Feature Creation Order
1. Add route in `src/routes/`
2. Add controller in `src/controllers/`
3. Add service in `src/services/`
4. Add repository in `src/repositories/`
5. Add validator in `src/validators/`
6. Write tests in `tests/`

---

## Auto Commit & Push

Trigger: "commit koro", "push koro", "/commit", "/push"
```bash
git status && git diff --stat
git add -A
git commit -m "type(scope): description"
git push origin <branch>
```
- **Types**: feat, fix, refactor, chore, docs, test
- **Branch**: Never push to main/master directly
- **Messages**: Always in English