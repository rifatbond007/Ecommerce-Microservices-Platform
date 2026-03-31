# Folder Structure

## Root Directory

```
ecommerce-microservices/
├── .env.example                 # Environment template
├── .gitignore
├── package.json                 # Root package.json (scripts only)
├── README.md
├── lerna.json                   # Monorepo config (if using Lerna)
├── turbo.json                   # Turborepo config (if using Turbo)
├── docker-compose.yml           # Root docker-compose (optional)
│
├── infra/                       # Infrastructure configuration
│   ├── docker-compose.yml       # PostgreSQL, Redis, RabbitMQ
│   ├── start-infra.sh           # Startup script
│   └── README.md
│
├── services/                    # All microservices
│   ├── gateway/
│   ├── auth/
│   ├── user/
│   ├── product/
│   ├── cart/
│   ├── order/
│   ├── payment/
│   ├── notification/
│   ├── search/
│   └── admin/
│
├── packages/                    # Shared packages
│   ├── common/                  # Shared types, utilities
│   ├── config/                  # Shared configuration
│   └── events/                  # Shared event definitions
│
└── frontend/                    # React + Vite frontend
    ├── src/
    ├── public/
    ├── package.json
    ├── vite.config.ts
    └── tailwind.config.js
```

---

## Service Folder Structure (Express.js Modular Pattern)

Each service follows a consistent modular architecture:

### auth-service/

```
services/auth/
├── package.json
├── tsconfig.json (or jsconfig.json)
├── .env.example
├── .env
├── src/
│   ├── index.js                 # Entry point
│   ├── app.js                   # Express app setup
│   ├── config/
│   │   └── index.js             # Configuration loader
│   ├── constants/
│   │   └── index.js             # Constants (status codes, etc)
│   │
│   ├── modules/                 # Feature modules
│   │   ├── auth/
│   │   │   ├── auth.controller.js
│   │   │   ├── auth.service.js
│   │   │   ├── auth.route.js
│   │   │   ├── auth.middleware.js
│   │   │   └── index.js         # Module exports
│   │   │
│   │   └── users/
│   │       ├── users.controller.js
│   │       ├── users.service.js
│   │       ├── users.route.js
│   │       └── index.js
│   │
│   ├── shared/                  # Shared functionality
│   │   ├── database/
│   │   │   ├── prisma.client.js
│   │   │   └── prisma.schema.prisma
│   │   │
│   │   ├── redis/
│   │   │   └── redis.client.js
│   │   │
│   │   ├── rabbitmq/
│   │   │   ├── rabbitmq.client.js
│   │   │   ├── publisher.js
│   │   │   └── consumer.js
│   │   │
│   │   ├── middleware/
│   │   │   ├── error.middleware.js
│   │   │   ├── validate.middleware.js
│   │   │   └── auth.middleware.js
│   │   │
│   │   └── utils/
│   │       ├── logger.js
│   │       └── helpers.js
│   │
│   ├── routes/
│   │   └── index.js             # Main router
│   │
│   └── validations/             # Joi validation schemas
│       ├── auth.validation.js
│       └── index.js
│
├── tests/
│   ├── unit/
│   └── integration/
│
└── Dockerfile                   # For production
```

### Detailed Module Structure

```
services/auth/src/modules/auth/
├── auth.controller.js    # Request handlers
├── auth.service.js        # Business logic
├── auth.route.js          # Route definitions
├── auth.middleware.js     # Route-specific middleware
├── auth.validator.js     # Input validation
└── index.js              # Module export
```

**Example: auth.controller.js**
```javascript
class AuthController {
  constructor(authService) {
    this.authService = authService;
  }

  async register(req, res, next) {
    try {
      const { email, password } = req.body;
      const result = await this.authService.register(email, password);
      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  }

  async login(req, res, next) {
    try {
      const { email, password } = req.body;
      const result = await this.authService.login(email, password);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = AuthController;
```

**Example: auth.service.js**
```javascript
class AuthService {
  constructor(prisma, redis, jwt, bcrypt) {
    this.prisma = prisma;
    this.redis = redis;
    this.jwt = jwt;
    this.bcrypt = bcrypt;
  }

  async register(email, password) {
    const passwordHash = await this.bcrypt.hash(password, 10);
    const user = await this.prisma.user.create({
      data: { email, passwordHash }
    });
    // Generate tokens, publish event...
    return { user, tokens };
  }
}

module.exports = AuthService;
```

---

## All Services Structure Summary

```
services/
├── gateway/              # API Gateway (Express Gateway or custom)
├── auth/                 # Authentication
├── user/                 # User management
├── product/              # Product catalog
├── cart/                 # Shopping cart
├── order/                # Order management
├── payment/              # Payment processing
├── notification/        # Notifications
├── search/              # Search service
└── admin/               # Admin dashboard
```

Each service directory follows the same pattern:
- `package.json`
- `src/` (or `src/` with subdirectories)
- `tests/`
- `.env.example`

---

## Packages (Shared)

### packages/common/

```
packages/common/
├── package.json
├── src/
│   ├── types/           # TypeScript interfaces/types
│   │   ├── user.type.js
│   │   ├── product.type.js
│   │   └── index.js
│   │
│   ├── constants/
│   │   ├── http-status.js
│   │   ├── error-codes.js
│   │   └── index.js
│   │
│   ├── utils/
│   │   ├── response.js
│   │   ├── async-handler.js
│   │   └── index.js
│   │
│   └── index.js
└── index.js
```

### packages/config/

```
packages/config/
├── package.json
├── src/
│   ├── database.js
│   ├── redis.js
│   ├── rabbitmq.js
│   └── index.js
└── index.js
```

### packages/events/

```
packages/events/
├── package.json
├── src/
│   ├── events/          # Event definitions
│   │   ├── user.events.js
│   │   ├── order.events.js
│   │   ├── payment.events.js
│   │   └── index.js
│   │
│   ├── exchange.js     # Exchange configuration
│   └── index.js
└── index.js
```

---

## Frontend (React + Vite)

```
frontend/
├── package.json
├── vite.config.ts
├── tailwind.config.js
├── postcss.config.mjs
├── index.html
├── .env.local
├── .env.development
├── .env.production
│
├── public/
│   ├── images/
│   ├── icons/
│   └── favicon.ico
│
├── src/
│   ├── app/                      # Main app directory
│   │   ├── pages/               # Route pages
│   │   │   ├── home-page.tsx
│   │   │   ├── auth/
│   │   │   │   ├── login-page.tsx
│   │   │   │   ├── register-page.tsx
│   │   │   │   └── forgot-password-page.tsx
│   │   │   ├── product-listing-page.tsx
│   │   │   ├── product-detail-page.tsx
│   │   │   ├── search-page.tsx
│   │   │   ├── user/
│   │   │   │   ├── profile-page.tsx
│   │   │   │   ├── account-page.tsx
│   │   │   │   ├── addresses-page.tsx
│   │   │   │   ├── orders-page.tsx
│   │   │   │   ├── order-detail-page.tsx
│   │   │   │   ├── cart-page.tsx
│   │   │   │   ├── checkout-page.tsx
│   │   │   │   ├── wishlists-page.tsx
│   │   │   │   ├── reviews-page.tsx
│   │   │   │   └── become-seller-page.tsx
│   │   │   ├── seller/
│   │   │   │   ├── seller-dashboard-page.tsx
│   │   │   │   ├── seller-products-page.tsx
│   │   │   │   └── seller-product-form-page.tsx
│   │   │   └── admin/
│   │   │       ├── admin-dashboard-page.tsx
│   │   │       ├── admin-users-page.tsx
│   │   │       ├── admin-products-page.tsx
│   │   │       ├── admin-orders-page.tsx
│   │   │       └── admin-seller-requests-page.tsx
│   │   │
│   │   ├── layouts/             # Layout components
│   │   │   ├── root-layout.tsx
│   │   │   └── dashboard-layout.tsx
│   │   │
│   │   ├── routes.tsx          # React Router configuration
│   │   └── App.tsx             # Root component
│   │
│   ├── components/            # Reusable components
│   │   ├── ui/                # Base UI components (Radix/MUI)
│   │   │   ├── button.tsx
│   │   │   ├── input.tsx
│   │   │   ├── card.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── dropdown-menu.tsx
│   │   │   └── ... (all Radix UI primitives)
│   │   │
│   │   ├── layout/            # Layout components
│   │   │   ├── header.tsx
│   │   │   └── footer.tsx
│   │   │
│   │   └── product-card.tsx
│   │
│   ├── store/                 # Zustand stores
│   │   ├── auth-store.ts
│   │   └── cart-store.ts
│   │
│   ├── lib/                   # Utilities
│   │   ├── api.ts             # API client
│   │   ├── mock-data.ts
│   │   └── utils.ts
│   │
│   └── styles/               # Global styles
│       └── globals.css
│
├── guidelines/
│   └── Guidelines.md
│
└── README.md
```

---

## Infrastructure Folder

```
infra/
├── docker-compose.yml      # Main compose file
├── start-infra.sh          # Quick start script
├── stop-infra.sh           # Stop script
├── reset-data.sh           # Reset all data
├── .env                    # Infra-specific env vars
├── postgres/
│   └── init-scripts/       # Database initialization scripts
├── redis/
│   └── redis.conf          # Redis configuration
└── rabbitmq/
    └── definitions.json    # Exchange/queue definitions
```

---

## Complete Tree View

```
ecommerce-microservices/
├── .env.example
├── .gitignore
├── package.json
├── README.md
│
├── infra/
│   ├── docker-compose.yml
│   ├── start-infra.sh
│   ├── .env
│   └── README.md
│
├── services/
│   ├── gateway/
│   │   ├── package.json
│   │   └── src/
│   │       ├── index.js
│   │       ├── config/
│   │       ├── routes/
│   │       └── middleware/
│   │
│   ├── auth/
│   │   ├── package.json
│   │   └── src/
│   │       ├── index.js
│   │       ├── modules/auth/
│   │       ├── shared/
│   │       └── validations/
│   │
│   ├── user/
│   │   ├── package.json
│   │   └── src/
│   │
│   ├── product/
│   │   ├── package.json
│   │   └── src/
│   │
│   ├── cart/
│   │   ├── package.json
│   │   └── src/
│   │
│   ├── order/
│   │   ├── package.json
│   │   └── src/
│   │
│   ├── payment/
│   │   ├── package.json
│   │   └── src/
│   │
│   ├── notification/
│   │   ├── package.json
│   │   └── src/
│   │
│   ├── search/
│   │   ├── package.json
│   │   └── src/
│   │
│   └── admin/
│       ├── package.json
│       └── src/
│
├── packages/
│   ├── common/
│   │   ├── package.json
│   │   └── src/
│   │
│   ├── config/
│   │   ├── package.json
│   │   └── src/
│   │
│   └── events/
│       ├── package.json
│       └── src/
│
└── frontend/
    ├── package.json
    ├── vite.config.ts
    ├── tailwind.config.js
    ├── postcss.config.mjs
    ├── index.html
    ├── .env.local
    ├── public/
    └── src/
        ├── app/
        ├── components/
        ├── store/
        ├── lib/
        └── styles/
```

---

## Key Patterns

### 1. Modular Architecture
Each service uses the `modules/` pattern where each feature is a self-contained module with controller, service, routes, and middleware.

### 2. Shared Packages
Common code lives in `/packages/` and is published to internal npm registry or imported directly via workspace.

### 3. Environment Management
- `.env.example` - Template for all developers
- `.env` - Local development (gitignored)
- `.env.production` - Production (gitignored)

### 4. Database Schema Strategy
Each service has its own Prisma schema file but connects to the same PostgreSQL database with different schema names.
