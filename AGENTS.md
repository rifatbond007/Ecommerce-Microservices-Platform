# AGENTS.md — Codebase Rules

## Build / Lint / Test Commands

### Per-Service Commands (run from service directory)
```bash
npm run dev              # Start with hot-reload
npm run build            # Compile TypeScript to dist/
npm run start            # Run compiled JS
npm run test            # Run Jest tests
npm run test:watch      # Watch mode
npm run test:coverage   # With coverage
npm run test -- --testNamePattern="name"  # Single test
npm run lint            # ESLint
npm run lint:fix        # Fix ESLint issues
npm run prisma:generate
npm run prisma:migrate
```

---

## Code Style Guidelines

### TypeScript (strict mode)
```json
{ "strict": true, "noImplicitAny": true, "strictNullChecks": true }
```

### Import Order
1. Node.js built-in (express)
2. External (prisma, zod)
3. Internal (@ aliases, relative)

### Naming
| Type | Convention | Example |
|------|------------|---------|
| Files | kebab-case | `auth.service.ts` |
| Classes | PascalCase | `AuthController` |
| Functions | camelCase | `getUserById` |
| Constants | UPPER_SNAKE_CASE | `MAX_RETRIES` |
| Interfaces | PascalCase | `UserProfile` |

### Error Handling
```typescript
import { AppError, ValidationError, UnauthorizedError } from '@/utils/errors';
// In controllers: try/catch with next(error)
```

### Validation
Use Zod schemas for input validation.

### Patterns
- **Controller**: Class with async methods, try/catch, `res.json({ success: true, data: ... })`
- **Service**: Class with business logic, throws errors
- **Repository**: Class wrapping Prisma calls
- **Middleware**: Functions that process request

---

## Project Structure

```
services/
├── auth/       # Port 3001
├── user/       # Port 3002
├── product/    # Port 3003
├── cart/       # Port 3004
├── gateway/    # Port 3000
├── order/      # Port 3005
└── admin/      # Port 3009
Frontend/      # Port 5173
```

### Per Service
```
services/<service>/
├── src/
│   ├── index.ts, app.ts
│   ├── config/, middleware/, routes/, utils/
│   └── modules/<feature>/*.controller/service/route/validator
├── tests/, prisma/, package.json
```

### Frontend Structure
```
Frontend/
├── src/
│   ├── app/
│   │   ├── pages/       # Route pages
│   │   ├── components/  # UI components
│   │   ├── store/       # Zustand stores
│   │   └── lib/         # Utilities, API client
│   └── styles/          # CSS files
├── vite.config.ts
└── package.json
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
| /api/v1/admin/* | Admin (3009) | Yes |

---

## Frontend (Vite + React)

### Setup
```bash
cd Frontend
npm install
npm run dev
```

### Key Stack
- **Build**: Vite
- **Routing**: React Router v7
- **State**: Zustand (global), TanStack Query v5 (server)
- **UI**: MUI v7 + Radix UI
- **Forms**: React Hook Form + Zod
- **Styling**: Tailwind CSS v4

### API Client
```typescript
const API_BASE = 'http://localhost:3000/api/v1';
export async function fetchAPI<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...options?.headers },
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
```

### Component Pattern
```typescript
import { useQuery } from '@tanstack/react-query';
import { fetchAPI } from '@/lib/api';

function ProductList() {
  const { data, isLoading } = useQuery({
    queryKey: ['products'],
    queryFn: () => fetchAPI<Product[]>('/products'),
  });
  // ...
}
```

---

## Auto Commit & Push

Trigger: "commit koro", "push koro", "/commit", "/push"

```bash
git status && git diff --stat
git add -A
git commit -m "type(scope): description"
git push origin <branch>
```
- Types: feat, fix, refactor, chore, docs, test
- No push to main/master directly
- Commit messages in English