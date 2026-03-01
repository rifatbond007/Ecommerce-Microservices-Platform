# System Design Documentation

## 📚 Table of Contents

- [🏗️ High Level Design](#high-level-design)
- [🔩 Low Level Design](#low-level-design)
- [📈 Scalability](#scalability)
- [🔐 Security](#security)
- [📋 API Contracts](#api-contracts)

---

# 🏗️ High Level Design

## Overview

This document outlines the complete system design for a microservices-based e-commerce platform consisting of 10 services. The architecture follows REST principles for synchronous communication and RabbitMQ for asynchronous messaging, with Redis for caching and PostgreSQL for persistent storage.

## Service Architecture

The platform consists of the following microservices:

| Service | Port | Responsibility | Database |
|---------|------|----------------|----------|
| API Gateway | 3000 | Request routing, auth, rate limiting | - |
| Auth Service | 3001 | User authentication, JWT management | auth_service |
| User Service | 3002 | Profile, addresses, reviews | user_service |
| Product Service | 3003 | Catalog, categories, inventory | product_service |
| Cart Service | 3004 | Shopping cart management | cart_service |
| Order Service | 3005 | Order processing, history | order_service |
| Payment Service | 3006 | Payment processing | payment_service |
| Notification Service | 3007 | Email, SMS, push notifications | notification_service |
| Search Service | 3008 | Product search, suggestions | search_service |
| Admin Service | 3009 | Dashboard, analytics, management | admin_service |

## Client to Services Flow

```mermaid
flowchart TB
    subgraph Client["Frontend - Next.js"]
        Web["Web App<br/>localhost:3001"]
        Mobile["Mobile App"]
    end
    
    subgraph CDN["CDN Layer"]
        Static["Static Assets<br/>Images, JS, CSS"]
    end
    
    subgraph Gateway["API Gateway - Port 3000"]
        Auth["Authentication"]
        Rate["Rate Limiting"]
        Route["Routing"]
    end
    
    subgraph Services["Microservices"]
        AuthS["Auth Service<br/>:3001"]
        UserS["User Service<br/>:3002"]
        ProductS["Product Service<br/>:3003"]
        CartS["Cart Service<br/>:3004"]
        OrderS["Order Service<br/>:3005"]
        PaymentS["Payment Service<br/>:3006"]
        NotificationS["Notification Service<br/>:3007"]
        SearchS["Search Service<br/>:3008"]
        AdminS["Admin Service<br/>:3009"]
    end
    
    subgraph Cache["Redis Layer"]
        RC["Redis Cluster<br/>:6379"]
    end
    
    subgraph Queue["RabbitMQ"]
        MQ["Message Broker<br/>:5672"]
    end
    
    subgraph Databases["PostgreSQL"]
        PG1["auth_service DB"]
        PG2["user_service DB"]
        PG3["product_service DB"]
        PG4["cart_service DB"]
        PG5["order_service DB"]
        PG6["payment_service DB"]
        PG7["notification_service DB"]
        PG8["search_service DB"]
        PG9["admin_service DB"]
    end
    
    Web --> CDN
    Mobile --> CDN
    CDN --> Gateway
    
    Gateway --> Auth
    Gateway --> Rate
    Gateway --> Route
    
    Route --> AuthS
    Route --> UserS
    Route --> ProductS
    Route --> CartS
    Route --> OrderS
    Route --> PaymentS
    Route --> NotificationS
    Route --> SearchS
    Route --> AdminS
    
    AuthS -.-> PG1
    UserS -.-> PG2
    ProductS -.-> PG3
    CartS -.-> PG4
    OrderS -.-> PG5
    PaymentS -.-> PG6
    NotificationS -.-> PG7
    SearchS -.-> PG8
    AdminS -.-> PG9
    
    AuthS -.-> RC
    UserS -.-> RC
    ProductS -.-> RC
    CartS -.-> RC
    OrderS -.-> RC
    PaymentS -.-> RC
    NotificationS -.-> RC
    SearchS -.-> RC
    AdminS -.-> RC
    
    AuthS --> MQ
    UserS --> MQ
    ProductS --> MQ
    CartS --> MQ
    OrderS --> MQ
    PaymentS --> MQ
    NotificationS --> MQ
    SearchS --> MQ
    AdminS --> MQ
```

## Synchronous vs Asynchronous Communication

```mermaid
flowchart LR
    subgraph Sync["Synchronous (REST API)"]
        S1["User Login<br/>Auth Service"]
        S2["Get Products<br/>Product Service"]
        S3["Get Cart<br/>Cart Service"]
        S4["Get Order<br/>Order Service"]
    end
    
    subgraph Async["Asynchronous (RabbitMQ)"]
        A1["Order Created<br/>→ Order Service"]
        A2["Payment Complete<br/>→ Order + Notification"]
        A3["Product Updated<br/>→ Search Index"]
        A4["User Registered<br/>→ Notification"]
    end
    
    style Sync fill:#e1f5fe
    style Async fill:#e8f5e8
```

### When to Use Synchronous (REST)

- User-facing operations requiring immediate response
- Query operations (get products, user profile, order status)
- Operations requiring return data
- Simple CRUD operations
- Operations with low latency requirements (<200ms)

### When to Use Asynchronous (RabbitMQ)

- Cross-service updates not requiring immediate confirmation
- Operations that can be processed in background
- High-latency operations (payment processing, notifications)
- Event-driven workflows
- Operations requiring eventual consistency
- Batch processing

## Service Communication Map

```mermaid
flowchart TB
    subgraph Frontend["Next.js Client"]
        FE["Frontend App"]
    end
    
    FE --> Gateway["API Gateway"]
    
    Gateway --> Auth["Auth Service"]
    Gateway --> User["User Service"]
    Gateway --> Product["Product Service"]
    Gateway --> Cart["Cart Service"]
    Gateway --> Order["Order Service"]
    Gateway --> Payment["Payment Service"]
    Gateway --> Search["Search Service"]
    Gateway --> Admin["Admin Service"]
    
    Auth -->|"user.registered"| MQ
    User -->|"user.updated"| MQ
    Product -->|"product.created"| MQ
    Product -->|"product.updated"| MQ
    Product -->|"inventory.low"| MQ
    Cart -->|"cart.checkout"| Order
    Order -->|"order.created"| MQ
    Order -->|"order.completed"| MQ
    Order -->|"order.cancelled"| MQ
    Payment -->|"payment.completed"| MQ
    Payment -->|"payment.failed"| MQ
    
    MQ --> Notification["Notification Service"]
    MQ --> SearchIndex["Search Service"]
    
    Notification -->|"send.email"| Email["Email Provider"]
    Notification -->|"send.sms"| SMS["SMS Provider"]
```

## CDN Strategy for Static Assets

```mermaid
flowchart LR
    subgraph Request["Client Request"]
        Browser["Browser"]
    end
    
    subgraph CDN["CDN Layer"]
        Cloudflare["Cloudflare<br/>or AWS CloudFront"]
        Cache["Edge Cache"]
    end
    
    subgraph Origin["Origin Server"]
        NextJS["Next.js Server<br/>:3000"]
        Static["Static Files<br/>/public"]
    end
    
    Browser -->|"1. Request asset"| Cloudflare
    Cloudflare -->|"2. Check cache"| Cache
    
    Cache -->|"3. HIT"| Browser
    
    Cache -.->|"4. MISS"| NextJS
    NextJS -->|"5. Return asset"| Cloudflare
    Cloudflare -->|"6. Cache & return"| Browser
```

### CDN Implementation

| Asset Type | Cache Strategy | TTL |
|------------|---------------|-----|
| Product Images | Cache-first | 7 days |
| CSS/JS Bundles | Version-based | 1 year |
| User Uploads | No cache | - |
| API Responses | No CDN | - |
| Static Pages | Stale-while-revalidate | 1 hour |

### Static Asset Flow

1. Product images uploaded to cloud storage (S3/Cloudinary)
2. Images served through CDN with cache headers
3. Next.js serves bundled JS/CSS with hash-based filenames
4. Manifest file maps to cached versions

## Redis Caching Layer

```mermaid
flowchart TB
    subgraph Client["Client Request"]
        Req["Request"]
    end
    
    subgraph Cache["Redis Cache"]
        L1["L1: Hot Data<br/>TTL: 1-5 min"]
        L2["L2: Session Data<br/>TTL: 1-24 hours"]
        L3["L3: Computed Data<br/>TTL: 15-60 min"]
    end
    
    subgraph DB["PostgreSQL"]
        DB1["Primary DB"]
    end
    
    Req --> L1
    L1 -->|"Cache Hit"| Req
    L1 -.->|"Cache Miss"| L2
    L2 -.->|"Cache Miss"| L3
    L3 -.->|"Cache Miss"| DB1
```

### Redis Placement by Service

| Service | Cache Keys | TTL | Purpose |
|---------|------------|-----|---------|
| Auth | user:{id}, session:{token} | 5min, 24h | User data, sessions |
| User | profile:{id}, addresses:{id} | 10min | User profiles |
| Product | product:{id}, category:{id} | 15min | Catalog data |
| Cart | cart:{id} | 24h | Shopping cart |
| Order | order:{id}, status:{id} | 1h | Order data |
| Payment | payment:{id}, methods:{id} | 1h | Payment info |
| Search | results:{hash}, suggestions | 5min | Search results |
| Admin | stats:dashboard | 5min | Analytics |

## Complete Data Flows

### Flow 1: User Registers and Logs In

```mermaid
sequenceDiagram
    participant Client as Next.js
    participant Gateway as API Gateway
    participant Auth as Auth Service
    participant User as User Service
    participant Redis as Redis
    participant MQ as RabbitMQ
    participant Notif as Notification

    Note over Client,Notif: Registration Flow
    Client->>Gateway: POST /api/v1/auth/register<br/>{email, password, name}
    Gateway->>Auth: Forward request
    Auth->>Auth: Validate input
    Auth->>Auth: Hash password (bcrypt)
    Auth->>Auth: Generate verification token
    Auth->>Auth: Create user record
    Auth->>Redis: Cache user data
    Auth-->>Gateway: Return user + token
    Gateway-->>Client: Return response
    
    Auth->>MQ: Publish user.registered
    MQ->>User: Create profile
    MQ->>Notif: Send verification email

    Note over Client,Notif: Login Flow
    Client->>Gateway: POST /api/v1/auth/login<br/>{email, password}
    Gateway->>Auth: Forward request
    Auth->>Auth: Find user by email
    Auth->>Auth: Verify password (bcrypt)
    Auth->>Auth: Generate JWT access token
    Auth->>Auth: Generate refresh token
    Auth->>Redis: Store session
    Auth-->>Gateway: Return tokens
    Gateway-->>Client: {accessToken, refreshToken}
    
    Note over Client,Notif: Subsequent Requests
    Client->>Gateway: GET /api/v1/users/me<br/>Authorization: Bearer {token}
    Gateway->>Gateway: Validate JWT
    Gateway->>Auth: Verify token not revoked
    Gateway->>User: Forward with userId
    User->>Redis: Get cached profile
    User-->>Gateway: Return profile
    Gateway-->>Client: Return user data
```

### Flow 2: User Searches and Buys a Product

```mermaid
sequenceDiagram
    participant Client as Next.js
    participant Gateway as API Gateway
    participant Search as Search Service
    participant Product as Product Service
    participant Cart as Cart Service
    participant Order as Order Service
    participant Redis as Redis

    Note over Client,Order: Search Flow
    Client->>Gateway: GET /api/v1/search?q=iphone&page=1
    Gateway->>Search: Forward request
    Search->>Redis: Check cache
    alt Cache Hit
        Redis-->>Search: Return cached results
    else Cache Miss
        Search->>Product: Get products
        Search->>Search: Apply filters & ranking
        Search->>Redis: Cache results
    end
    Search-->>Gateway: Return products
    Gateway-->>Client: Return search results

    Note over Client,Order: View Product
    Client->>Gateway: GET /api/v1/products/:id
    Gateway->>Product: Forward request
    Product->>Redis: Get product cache
    Product-->>Gateway: Return product
    Gateway-->>Client: Return product details

    Note over Client,Order: Add to Cart
    Client->>Gateway: POST /api/v1/cart/items<br/>{productId, quantity}
    Gateway->>Cart: Forward with userId
    Cart->>Cart: Get or create cart
    Cart->>Product: Verify product exists
    Cart->>Cart: Add/update item
    Cart->>Redis: Update cart cache
    Cart-->>Gateway: Return cart
    Gateway-->>Client: Return updated cart

    Note over Client,Order: Checkout
    Client->>Gateway: POST /api/v1/orders<br/>{cartId, addressId}
    Gateway->>Order: Forward request
    Order->>Cart: Get cart items
    Order->>Product: Reserve inventory
    Order->>Order: Create order
    Order-->>Gateway: Return order
    Gateway-->>Client: Return order details
```

### Flow 3: Payment Success → Order Update → Notification

```mermaid
sequenceDiagram
    participant Client as Next.js
    participant Gateway as API Gateway
    participant Order as Order Service
    participant Payment as Payment Service
    participant Product as Product Service
    participant Notification as Notification Service
    participant MQ as RabbitMQ

    Note over Client,Notification: Payment Processing
    Client->>Gateway: POST /api/v1/payments<br/>{orderId, paymentMethod}
    Gateway->>Payment: Forward request
    Payment->>Payment: Create payment record
    Payment->>Payment: Process with payment gateway
    alt Payment Successful
        Payment->>Payment: Update status to completed
        Payment->>MQ: Publish payment.completed
        MQ->>Order: Consume payment.completed
        Order->>Order: Update order status
        Order->>Order: Update fulfillment status
        Order->>Product: Decrement inventory
        Order->>MQ: Publish order.completed
        MQ->>Notification: Consume order.completed
        Notification->>Notification: Send confirmation email
        Payment-->>Gateway: Return success
        Gateway-->>Client: Return payment success
    else Payment Failed
        Payment->>Order: Update order status to failed
        Payment->>MQ: Publish payment.failed
        MQ->>Notification: Send failure notification
        Payment-->>Gateway: Return failure
        Gateway-->>Client: Return error
    end
```

---

# 🔩 Low Level Design

## Service Internal Module Structure

Each service follows a consistent layered architecture:

```
service-name/
├── src/
│   ├── config/           # Configuration files
│   │   └── index.ts
│   ├── controllers/     # HTTP request handlers
│   │   └── *.controller.ts
│   ├── services/        # Business logic
│   │   └── *.service.ts
│   ├── repositories/    # Database operations
│   │   └── *.repository.ts
│   ├── models/          # Database entities
│   │   └── *.model.ts
│   ├── routes/          # Route definitions
│   │   └── index.ts
│   ├── middleware/      # Express middleware
│   │   ├── auth.ts
│   │   ├── validate.ts
│   │   └── error.ts
│   ├── events/          # RabbitMQ event handlers
│   │   └── *.consumer.ts
│   ├── utils/           # Utility functions
│   │   └── *.ts
│   ├── types/           # TypeScript interfaces
│   │   └── index.ts
│   └── app.ts           # Express app setup
├── tests/               # Test files
├── docker-compose.yml   # Local development
├── .env.example         # Environment variables
├── package.json
└── tsconfig.json
```

## Express.js Layer Architecture

```mermaid
flowchart LR
    subgraph Request["Incoming Request"]
        HTTP["HTTP Request"]
    end
    
    subgraph Middleware["Middleware Layer"]
        CORS["CORS"]
        Auth["JWT Auth"]
        Rate["Rate Limit"]
        Validate["Validation"]
    end
    
    subgraph Handler["Handler Layer"]
        Route["Route"]
        Controller["Controller"]
    end
    
    subgraph Logic["Business Logic"]
        Service["Service"]
    end
    
    subgraph Data["Data Layer"]
        Repo["Repository"]
        DB["PostgreSQL"]
        Cache["Redis"]
    end
    
    HTTP --> CORS
    CORS --> Auth
    Auth --> Rate
    Rate --> Validate
    Validate --> Route
    Route --> Controller
    Controller --> Service
    Service --> Repo
    Repo --> DB
    Repo -.-> Cache
```

### Route → Controller → Service → Repository Pattern

```typescript
// routes/order.routes.ts
import { Router } from 'express';
import { OrderController } from '../controllers/order.controller';
import { authMiddleware } from '../middleware/auth';
import { validateRequest } from '../middleware/validate';
import { createOrderSchema } from '../types/order.dto';

const router = Router();
const controller = new OrderController();

router.post('/',
  authMiddleware,
  validateRequest(createOrderSchema),
  controller.createOrder
);

router.get('/:id',
  authMiddleware,
  controller.getOrder
);

router.get('/',
  authMiddleware,
  controller.listOrders
);

export default router;

// controllers/order.controller.ts
class OrderController {
  async createOrder(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user.id;
      const { cartId, shippingAddressId } = req.body;
      
      const service = new OrderService();
      const order = await service.createOrder(userId, cartId, shippingAddressId);
      
      res.status(201).json({
        success: true,
        data: order
      });
    } catch (error) {
      next(error);
    }
  }
}

// services/order.service.ts
class OrderService {
  async createOrder(userId: string, cartId: string, addressId: string) {
    // Business logic
    const cart = await cartRepository.findById(cartId);
    if (!cart || cart.userId !== userId) {
      throw new Error('Cart not found');
    }
    
    const order = await this.buildOrder(cart, addressId);
    await orderRepository.save(order);
    
    await this.publishOrderCreatedEvent(order);
    
    return order;
  }
}

// repositories/order.repository.ts
class OrderRepository {
  async save(order: Order): Promise<Order> {
    const result = await db.query(
      `INSERT INTO orders (...) VALUES (...) RETURNING *`,
      [...values]
    );
    return result.rows[0];
  }
}
```

## Database Query Patterns

### Standard CRUD Repository

```typescript
class BaseRepository<T> {
  protected tableName: string;
  
  async findById(id: string): Promise<T | null> {
    const result = await db.query(
      `SELECT * FROM ${this.tableName} WHERE id = $1`,
      [id]
    );
    return result.rows[0] || null;
  }
  
  async findAll(filters: QueryFilters): Promise<T[]> {
    const { where, values, limit, offset } = this.buildWhereClause(filters);
    const query = `SELECT * FROM ${this.tableName} ${where} LIMIT ${limit} OFFSET ${offset}`;
    const result = await db.query(query, values);
    return result.rows;
  }
  
  async create(data: Partial<T>): Promise<T> {
    const columns = Object.keys(data);
    const values = Object.values(data);
    const placeholders = columns.map((_, i) => `$${i + 1}`).join(', ');
    
    const query = `
      INSERT INTO ${this.tableName} (${columns.join(', ')})
      VALUES (${placeholders})
      RETURNING *
    `;
    const result = await db.query(query, values);
    return result.rows[0];
  }
  
  async update(id: string, data: Partial<T>): Promise<T> {
    const sets = Object.keys(data).map((key, i) => `${key} = $${i + 2}`).join(', ');
    const query = `
      UPDATE ${this.tableName} SET ${sets}, updated_at = NOW()
      WHERE id = $1 RETURNING *
    `;
    const result = await db.query(query, [id, ...Object.values(data)]);
    return result.rows[0];
  }
  
  async delete(id: string): Promise<void> {
    await db.query(`DELETE FROM ${this.tableName} WHERE id = $1`, [id]);
  }
}
```

### Query Builder Pattern

```typescript
class OrderQueryBuilder {
  private query = '';
  private params: any[] = [];
  private paramCount = 0;
  
  select(fields: string[] = ['*']): this {
    this.query = `SELECT ${fields.join(', ')} FROM orders`;
    return this;
  }
  
  where(condition: string, ...params: any[]): this {
    this.query += this.paramCount === 0 ? ' WHERE ' : ' AND ';
    this.query += condition;
    this.params.push(...params);
    this.paramCount += params.length;
    return this;
  }
  
  orderBy(field: string, direction: 'ASC' | 'DESC' = 'ASC'): this {
    this.query += ` ORDER BY ${field} ${direction}`;
    return this;
  }
  
  limit(count: number): this {
    this.query += ` LIMIT ${count}`;
    return this;
  }
  
  offset(count: number): this {
    this.query += ` OFFSET ${count}`;
    return this;
  }
  
  async execute(): Promise<any[]> {
    const result = await db.query(this.query, this.params);
    return result.rows;
  }
}

// Usage
const orders = await new OrderQueryBuilder()
  .select(['id', 'order_number', 'total', 'status'])
  .where('user_id = $1', userId)
  .where('status = $2', 'completed')
  .orderBy('created_at', 'DESC')
  .limit(20)
  .offset(0)
  .execute();
```

## Redis Caching Strategy Per Service

### Cache-Aside Pattern

```typescript
class CacheService {
  private client: Redis;
  
  async getOrSet<T>(
    key: string,
    fn: () => Promise<T>,
    ttl: number = 3600
  ): Promise<T> {
    // Try to get from cache
    const cached = await this.client.get(key);
    if (cached) {
      return JSON.parse(cached);
    }
    
    // Fetch from source
    const data = await fn();
    
    // Store in cache
    await this.client.setex(key, ttl, JSON.stringify(data));
    
    return data;
  }
  
  async invalidatePattern(pattern: string): Promise<void> {
    const keys = await this.client.keys(pattern);
    if (keys.length > 0) {
      await this.client.del(...keys);
    }
  }
}

// Usage in Product Service
class ProductService {
  constructor(
    private productRepo: ProductRepository,
    private cache: CacheService
  ) {}
  
  async getProduct(id: string): Promise<Product> {
    return this.cache.getOrSet(
      `product:${id}`,
      () => this.productRepo.findById(id),
      900 // 15 minutes
    );
  }
  
  async updateProduct(id: string, data: Partial<Product>): Promise<Product> {
    const product = await this.productRepo.update(id, data);
    await this.cache.invalidatePattern(`product:${id}*`);
    return product;
  }
}
```

### Cache Invalidation Strategies

| Strategy | When to Use | Implementation |
|----------|-------------|----------------|
| TTL-based | General caching | Set expiration on write |
| Write-through | Critical data | Update cache on every write |
| Write-behind | Batch updates | Queue updates, batch to cache |
| Event-based | Cross-service data | Invalidate on related events |

## RabbitMQ Event Naming Convention

### Event Format

```
{resource}.{action}
```

Examples:
- `user.registered`
- `product.created`
- `order.completed`
- `payment.failed`

### Exchange and Queue Setup

```typescript
// events/exchange.ts
const EXCHANGES = {
  USER: 'user.events',
  PRODUCT: 'product.events',
  ORDER: 'order.events',
  PAYMENT: 'payment.events',
  NOTIFICATION: 'notification.events'
};

const QUEUES = {
  USER_CREATED: 'notification.user.created',
  ORDER_COMPLETED: 'notification.order.completed',
  PAYMENT_COMPLETED: 'order.payment.completed',
  PRODUCT_UPDATED: 'search.product.updated'
};

// events/user.publisher.ts
class UserEventPublisher {
  async publishUserRegistered(user: User): Promise<void> {
    await channel.publish(
      EXCHANGES.USER,
      'user.registered',
      Buffer.from(JSON.stringify({
        event: 'user.registered',
        data: {
          id: user.id,
          email: user.email,
          name: user.firstName + ' ' + user.lastName
        },
        timestamp: new Date().toISOString()
      }))
    );
  }
}

// events/order.consumer.ts
class OrderEventConsumer {
  async start(): Promise<void> {
    await channel.consume(
      QUEUES.PAYMENT_COMPLETED,
      async (msg) => {
        const event = JSON.parse(msg.content.toString());
        await this.handlePaymentCompleted(event.data);
        channel.ack(msg);
      },
      { noAck: false }
    );
  }
  
  private async handlePaymentCompleted(data: any): Promise<void> {
    await orderService.updateStatus(data.orderId, 'processing');
  }
}
```

## Error Handling Pattern

### Standard Error Class Hierarchy

```typescript
// utils/AppError.ts
class AppError extends Error {
  constructor(
    public statusCode: number,
    public errorCode: string,
    message: string,
    public isOperational: boolean = true
  ) {
    super(message);
    Error.captureStackTrace(this, this.constructor);
  }
}

class ValidationError extends AppError {
  constructor(message: string, public details?: any) {
    super(400, 'VALIDATION_ERROR', message);
  }
}

class UnauthorizedError extends AppError {
  constructor(message: string = 'Unauthorized') {
    super(401, 'UNAUTHORIZED', message);
  }
}

class ForbiddenError extends AppError {
  constructor(message: string = 'Forbidden') {
    super(403, 'FORBIDDEN', message);
  }
}

class NotFoundError extends AppError {
  constructor(resource: string) {
    super(404, 'NOT_FOUND', `${resource} not found`);
  }
}

class ConflictError extends AppError {
  constructor(message: string) {
    super(409, 'CONFLICT', message);
  }
}

class InternalServerError extends AppError {
  constructor(message: string = 'Internal server error') {
    super(500, 'INTERNAL_ERROR', message, false);
  }
}

// Error handling middleware
const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      error: {
        code: err.errorCode,
        message: err.message,
        ...(err.details && { details: err.details })
      }
    });
  }
  
  // Unexpected errors
  console.error('Unexpected error:', err);
  return res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred'
    }
  });
};
```

### Error Response Format

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid email format",
    "details": {
      "field": "email",
      "constraint": "Must be a valid email address"
    }
  }
}
```

## Logging Strategy

### Structured Logging

```typescript
// utils/logger.ts
enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3
}

class Logger {
  private service: string;
  
  constructor(service: string) {
    this.service = service;
  }
  
  private log(level: LogLevel, message: string, meta?: any): void {
    const logEntry = {
      timestamp: new Date().toISOString(),
      level: LogLevel[level],
      service: this.service,
      message,
      ...meta
    };
    
    if (process.env.NODE_ENV === 'production') {
      // Send to logging service (e.g., ELK, Datadog)
      console.log(JSON.stringify(logEntry));
    } else {
      console.log(`[${logEntry.timestamp}] [${level}] [${this.service}] ${message}`, meta || '');
    }
  }
  
  debug(message: string, meta?: any): void {
    this.log(LogLevel.DEBUG, message, meta);
  }
  
  info(message: string, meta?: any): void {
    this.log(LogLevel.INFO, message, meta);
  }
  
  warn(message: string, meta?: any): void {
    this.log(LogLevel.WARN, message, meta);
  }
  
  error(message: string, meta?: any): void {
    this.log(LogLevel.ERROR, message, meta);
  }
}

export const logger = new Logger('order-service');
```

### Request Logging Middleware

```typescript
// middleware/requestLogger.ts
const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info('HTTP Request', {
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
      userAgent: req.get('user-agent')
    });
  });
  
  next();
};
```

## Internal Code Flows

### Flow 1: Creating an Order

```mermaid
flowchart TB
    A["Controller: createOrder"] --> B["Validate cart exists"]
    B --> C["Validate cart belongs to user"]
    C --> D["Get cart items from Cart Service"]
    D --> E["Validate all products available"]
    E --> F["Calculate order totals"]
    F --> G["Reserve inventory"]
    G --> H["Create order record"]
    H --> I["Create order items"]
    I --> J["Publish order.created event"]
    J --> K["Clear cart"]
    K --> L["Return order response"]
    
    style A fill:#e3f2fd
    style L fill:#e8f5e8
```

```typescript
// controllers/order.controller.ts
async createOrder(req: Request, res: Response) {
  const { cartId, shippingAddressId, paymentMethodId } = req.body;
  const userId = req.user.id;
  
  const service = new OrderService();
  const order = await service.createOrder({
    userId,
    cartId,
    shippingAddressId,
    paymentMethodId
  });
  
  res.status(201).json({ success: true, data: order });
}

// services/order.service.ts
class OrderService {
  async createOrder(params: CreateOrderParams): Promise<Order> {
    const { userId, cartId, shippingAddressId, paymentMethodId } = params;
    
    // 1. Get cart
    const cart = await cartService.getCart(cartId);
    if (!cart || cart.userId !== userId) {
      throw new NotFoundError('Cart not found');
    }
    
    if (cart.items.length === 0) {
      throw new ValidationError('Cart is empty');
    }
    
    // 2. Validate inventory and calculate totals
    const orderItems = [];
    let subtotal = 0;
    
    for (const item of cart.items) {
      const product = await productService.getProduct(item.productId);
      if (!product || !product.isActive) {
        throw new ValidationError(`Product ${item.productId} is not available`);
      }
      
      // Check inventory
      const available = await inventoryService.checkAvailability(
        item.productId,
        item.variantId,
        item.quantity
      );
      
      if (!available) {
        throw new ValidationError(`Insufficient inventory for ${product.name}`);
      }
      
      const itemTotal = product.price * item.quantity;
      subtotal += itemTotal;
      
      orderItems.push({
        productId: item.productId,
        variantId: item.variantId,
        quantity: item.quantity,
        unitPrice: product.price,
        totalPrice: itemTotal
      });
    }
    
    // 3. Calculate totals
    const tax = subtotal * TAX_RATE;
    const shipping = await shippingService.calculate(shippingAddressId);
    const discount = await this.calculateDiscount(cart.couponCode, subtotal);
    const total = subtotal + tax + shipping - discount;
    
    // 4. Reserve inventory
    await inventoryService.reserve(orderItems);
    
    // 5. Create order
    const order = await orderRepository.create({
      userId,
      orderNumber: this.generateOrderNumber(),
      status: 'pending',
      fulfillmentStatus: 'unfulfilled',
      financialStatus: 'pending',
      items: orderItems,
      subtotal,
      tax,
      shippingTotal: shipping,
      discountTotal: discount,
      total,
      shippingAddressId,
      billingAddressId: shippingAddressId
    });
    
    // 6. Publish event
    await eventPublisher.publish('order.created', {
      orderId: order.id,
      userId,
      items: orderItems,
      total
    });
    
    // 7. Clear cart
    await cartService.clearCart(cartId);
    
    return order;
  }
}
```

### Flow 2: Processing a Payment

```mermaid
flowchart TB
    A["Controller: processPayment"] --> B["Validate order exists"]
    B --> C["Validate order belongs to user"]
    C --> D["Check order not already paid"]
    D --> E["Create payment record"]
    E --> F["Call payment gateway"]
    
    F --> G{"Gateway Response"}
    
    G -->|"Success"| H["Update payment status"]
    H --> I["Publish payment.completed"]
    I --> J["Update order status"]
    J --> K["Trigger fulfillment"]
    
    G -->|"Failure"| L["Update payment failed"]
    L --> M["Publish payment.failed"]
    M --> N["Release inventory hold"]
    
    style A fill:#e3f2fd
    style K fill:#e8f5e8
    style N fill:#ffebee
```

```typescript
// controllers/payment.controller.ts
async processPayment(req: Request, res: Response) {
  const { orderId, paymentMethodId } = req.body;
  const userId = req.user.id;
  
  const service = new PaymentService();
  const payment = await service.processPayment({
    orderId,
    userId,
    paymentMethodId
  });
  
  res.status(200).json({ success: true, data: payment });
}

// services/payment.service.ts
class PaymentService {
  async processPayment(params: ProcessPaymentParams): Promise<Payment> {
    const { orderId, userId, paymentMethodId } = params;
    
    // 1. Get and validate order
    const order = await orderService.getOrder(orderId);
    if (!order || order.userId !== userId) {
      throw new NotFoundError('Order not found');
    }
    
    if (order.financialStatus === 'paid') {
      throw new ConflictError('Order already paid');
    }
    
    // 2. Get payment method
    const paymentMethod = await this.getPaymentMethod(paymentMethodId);
    if (!paymentMethod || paymentMethod.userId !== userId) {
      throw new ValidationError('Invalid payment method');
    }
    
    // 3. Create payment record
    const payment = await paymentRepository.create({
      orderId,
      userId,
      amount: order.total,
      currency: 'USD',
      method: paymentMethod.type,
      provider: paymentMethod.provider,
      status: 'processing'
    });
    
    try {
      // 4. Process with payment gateway
      const gatewayResponse = await this.processWithGateway({
        amount: order.total,
        currency: 'USD',
        paymentMethodId: paymentMethod.providerPaymentMethodId,
        customerId: userId
      });
      
      // 5. Handle response
      if (gatewayResponse.success) {
        payment.status = 'completed';
        payment.providerTransactionId = gatewayResponse.transactionId;
        await paymentRepository.update(payment.id, payment);
        
        // 6. Publish events
        await eventPublisher.publish('payment.completed', {
          paymentId: payment.id,
          orderId,
          transactionId: gatewayResponse.transactionId
        });
        
        return payment;
      } else {
        throw new Error(gatewayResponse.errorMessage);
      }
    } catch (error) {
      // Handle failure
      payment.status = 'failed';
      payment.errorMessage = error.message;
      await paymentRepository.update(payment.id, payment);
      
      await eventPublisher.publish('payment.failed', {
        paymentId: payment.id,
        orderId,
        reason: error.message
      });
      
      throw error;
    }
  }
}
```

### Flow 3: Sending a Notification

```mermaid
flowchart TB
    A["Event: order.completed"] --> B["Get order details"]
    B --> C["Get user profile"]
    C --> D["Select notification channel"]
    D --> E{"Channel"}
    
    E -->|"Email"| F["Get email template"]
    E -->|"SMS"| G["Get SMS template"]
    E -->|"Push"| H["Get push template"]
    
    F --> I["Render template"]
    G --> I
    H --> I
    
    I --> J["Send via provider"]
    J --> K["Log notification"]
    K --> L["Update status"]
    
    style A fill:#fff3e0
    style L fill:#e8f5e8
```

```typescript
// events/consumers/order.completed.consumer.ts
class OrderCompletedConsumer {
  async handle(message: any): Promise<void> {
    const { orderId, userId } = message.data;
    
    const service = new NotificationService();
    await service.sendOrderConfirmation(orderId, userId);
  }
}

// services/notification.service.ts
class NotificationService {
  async sendOrderConfirmation(orderId: string, userId: string): Promise<void> {
    // 1. Get order details
    const order = await orderService.getOrder(orderId);
    
    // 2. Get user details
    const user = await userService.getUser(userId);
    
    // 3. Prepare template variables
    const variables = {
      userName: user.firstName,
      orderNumber: order.orderNumber,
      total: order.total,
      items: order.items,
      shippingAddress: order.shippingAddress,
      estimatedDelivery: this.calculateDeliveryDate(order)
    };
    
    // 4. Queue email
    await this.queueEmail({
      to: user.email,
      templateId: 'order_confirmation',
      variables,
      priority: 1
    });
    
    // 5. Log notification
    await notificationRepository.create({
      userId,
      type: 'order_confirmation',
      channel: 'email',
      status: 'queued'
    });
  }
  
  private async queueEmail(params: QueueEmailParams): Promise<void> {
    await emailQueue.add('send-email', params, {
      priority: params.priority,
      removeOnComplete: true,
      removeOnFail: 100
    });
  }
}
```

---

# 📈 Scalability

## Current Architecture Bottlenecks

| Component | Bottleneck | Impact | Mitigation |
|-----------|-----------|--------|-------------|
| API Gateway | Single instance | Single point of failure | Horizontal scaling + load balancer |
| Auth Service | Database CPU | Slow logins under load | Read replicas + caching |
| Product Service | Database + Redis | Slow product loads | CDN + read replicas |
| Order Service | Transaction locking | Slow during peak | Sharding + async processing |
| Payment Service | External API | Payment gateway latency | Queue + retry logic |
| RabbitMQ | Single node | Message loss risk | Cluster mode |
| PostgreSQL | Connection limit | Connection exhaustion | Connection pooling |
| Redis | Memory limit | Cache eviction | Cluster mode |

## Horizontal Scaling Plan by Service

```mermaid
flowchart LR
    subgraph Service["Service Type"]
        Stateless["Stateless Services<br/>Scale Horizontally"]
        Stateful["Stateful Services<br/>Scale Carefully"]
    end
    
    Stateless -->|"Can Scale"| Auth
    Stateless -->|"Can Scale"| User
    Stateless -->|"Can Scale"| Search
    Stateless -->|"Can Scale"| Admin
    
    Stateful -->|"Needs Redis"| Cart
    Stateful -->|"Needs Order ID"| Order
    Stateful -->|"Needs DB"| Product
    Stateful -->|"Needs Queue"| Payment
    Stateful -->|"Needs Queue"| Notification
```

### Scaling Strategy by Service

| Service | Instance Type | Scaling Trigger | Max Instances |
|---------|--------------|------------------|---------------|
| API Gateway | Stateless | CPU > 70% | 10 |
| Auth Service | Stateless | Request latency > 200ms | 5 |
| User Service | Stateless | DB CPU > 70% | 5 |
| Product Service | Stateless | Cache hit rate < 80% | 10 |
| Cart Service | Stateful* | Cart operations > 1000/s | 5 |
| Order Service | Stateful* | Order creation > 500/s | 5 |
| Payment Service | Stateless | Payment latency > 2s | 10 |
| Notification Service | Stateless | Queue depth > 10000 | 5 |
| Search Service | Stateless | Search latency > 300ms | 10 |
| Admin Service | Stateless | Report generation time > 30s | 3 |

*Stateful services need sticky sessions or external session storage

## Database Scaling

### Read Replicas Setup

```mermaid
flowchart TB
    subgraph Primary["Primary DB - Write"]
        PG1["PostgreSQL Primary<br/>:5432"]
    end
    
    subgraph Replicas["Read Replicas"]
        PG2["Replica 1<br/>:5433"]
        PG3["Replica 2<br/>:5434"]
        PG4["Replica 3<br/>:5435"]
    end
    
    subgraph App["Application"]
        Router["Read/Write Router"]
    end
    
    App -->|"SELECT"| Router
    Router -->|"Write"| PG1
    Router -->|"Read"| PG2
    Router -->|"Read"| PG3
    Router -->|"Read"| PG4
    
    PG1 -->|"Replicate"| PG2
    PG1 -->|"Replicate"| PG3
    PG1 -->|"Replicate"| PG4
```

### Read/Write Splitting in Node.js

```typescript
// config/database.ts
const poolPrimary = new Pool({
  host: process.env.DB_PRIMARY_HOST,
  port: 5432,
  max: 20
});

const poolRead1 = new Pool({
  host: process.env.DB_READ_1_HOST,
  port: 5433,
  max: 20
});

const poolRead2 = new Pool({
  host: process.env.DB_READ_2_HOST,
  port: 5434,
  max: 20
});

const readPools = [poolRead1, poolRead2];
let readPoolIndex = 0;

// Route queries to appropriate pool
export async function query(text: string, params: any[], isRead: boolean = false) {
  if (isRead) {
    // Round-robin to read replicas
    const pool = readPools[readPoolIndex];
    readPoolIndex = (readPoolIndex + 1) % readPools.length;
    return pool.query(text, params);
  }
  return poolPrimary.query(text, params);
}

// Usage
const users = await query('SELECT * FROM users WHERE id = $1', [id], true);
await query('INSERT INTO users ...', [data], false);
```

### Connection Pooling with PgBouncer

```yaml
# pgbouncer.ini
[databases]
auth_service = host=auth-db port=5432 dbname=auth_service

[pgbouncer]
pool_mode = transaction
max_client_conn = 1000
default_pool_size = 25
min_pool_size = 5
reserve_pool_size = 5
```

## Redis Scaling Strategy

### Redis Cluster Mode

```mermaid
flowchart TB
    subgraph RedisCluster["Redis Cluster"]
        Master1["Master Node 1<br/>:6379"]
        Master2["Master Node 2<br/>:6380"]
        Master3["Master Node 3<br/>:6381"]
        
        Replica1["Replica 1.1"]
        Replica2["Replica 2.1"]
        Replica3["Replica 3.1"]
    end
    
    App1["API Gateway"]
    App2["Auth Service"]
    App3["Product Service"]
    
    App1 --> Master1
    App1 --> Master2
    App1 --> Master3
    
    App2 --> Master1
    App3 --> Master2
    
    Master1 --> Replica1
    Master2 --> Replica2
    Master3 --> Replica3
```

### Redis Scaling Patterns

| Pattern | Use Case | Implementation |
|---------|----------|----------------|
| Vertical Scaling | Startup | Increase instance size |
| Read Replicas | Read-heavy | Add read replicas |
| Redis Cluster | Large datasets | Hash slot partitioning |
| Lua Scripts | Atomic ops | Keep operations simple |
| Pipeline | Batch ops | Reduce round trips |

## RabbitMQ Scaling

### Cluster Setup

```yaml
# docker-compose.rabbitmq.yml
version: '3.8'

services:
  rabbitmq1:
    image: rabbitmq:3-management
    environment:
      RABBITMQ_ERLANG_COOKIE: ${RABBITMQ_COOKIE}
    ports:
      - "5672:5672"
      - "15672:15672"
    volumes:
      - rabbitmq1_data:/var/lib/rabbitmq
  
  rabbitmq2:
    image: rabbitmq:3-management
    environment:
      RABBITMQ_ERLANG_COOKIE: ${RABBITMQ_COOKIE}
    depends_on:
      - rabbitmq1
  
  rabbitmq3:
    image: rabbitmq:3-management
    environment:
      RABBITMQ_ERLANG_COOKIE: ${RABBITMQ_COOKIE}
    depends_on:
      - rabbitmq2

volumes:
  rabbitmq1_data:
```

### Scaling Guidelines

| Scenario | Action | Configuration |
|----------|--------|---------------|
| High message throughput | Add more consumers | Prefetch count: 10-50 |
| Message persistence needed | Enable durable queues | durable: true |
| High availability | Enable clustering | 3+ nodes |
| Large queues | Partition queues | Consistent hashing |

## API Gateway Load Balancing

```mermaid
flowchart TB
    subgraph DNS["DNS / Load Balancer"]
        Cloudflare["Cloudflare<br/>or AWS ALB"]
    end
    
    subgraph GatewayCluster["API Gateway Cluster"]
        GW1["Gateway 1<br/>:3000"]
        GW2["Gateway 2<br/>:3000"]
        GW3["Gateway 3<br/>:3000"]
    end
    
    subgraph Services["Backend Services"]
        S1["Auth :3001"]
        S2["Product :3003"]
        S3["Order :3005"]
    end
    
    Cloudflare --> GW1
    Cloudflare --> GW2
    Cloudflare --> GW3
    
    GW1 --> S1
    GW1 --> S2
    GW1 --> S3
    
    GW2 --> S1
    GW2 --> S2
    GW2 --> S3
    
    GW3 --> S1
    GW3 --> S2
    GW3 --> S3
```

## Which Services to Scale First During High Traffic

### Traffic Spike Priority

| Priority | Service | Reason | Scale Factor |
|----------|---------|--------|--------------|
| 1 | API Gateway | Entry point | 3x |
| 2 | Product Service | Product browsing | 5x |
| 3 | Search Service | Search queries | 5x |
| 4 | Cart Service | Add to cart | 3x |
| 5 | Auth Service | Authentication | 2x |
| 6 | Order Service | Checkout | 2x |
| 7 | Payment Service | Payment processing | 2x |

### Auto-Scaling Configuration

```yaml
# kubernetes/autoscaling.yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: product-service-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: product-service
  minReplicas: 2
  maxReplicas: 20
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 70
    - type: Resource
      resource:
        name: memory
        target:
          type: Utilization
          averageUtilization: 80
  behavior:
    scaleUp:
      stabilizationWindowSeconds: 60
      policies:
        - type: Percent
          value: 100
          periodSeconds: 15
    scaleDown:
      stabilizationWindowSeconds: 300
```

## Flash Sale Traffic Spike Handling

```mermaid
flowchart LR
    subgraph Before["Before Sale"]
        Cache1["Warm Cache"]
        Ready["Services Scaled"]
    end
    
    subgraph During["During Sale"]
        Queue["Request Queue"]
        Throttle["Rate Limiter"]
        Queue2["Priority Queue"]
    end
    
    subgraph After["After Sale"]
        ScaleDown["Scale Down"]
    end
    
    Before --> During --> After
```

### Flash Sale Strategy

| Phase | Action | Implementation |
|-------|--------|----------------|
| Pre-sale | Warm up caches | Load all products into Redis |
| Pre-sale | Pre-scale services | Scale to max 1 hour before |
| Pre-sale | Disable non-essential | Turn off analytics, logging |
| During | Queue requests | Use RabbitMQ for ordering |
| During | Rate limit | Aggressive rate limiting |
| During | Graceful degradation | Disable search, recommendations |
| Post | Scale down | Gradual reduction |
| Post | Clear queues | Process pending orders |

### Queue-Based Ordering

```typescript
// middleware/flashSale.ts
const flashSaleLimiter = rateLimit({
  windowMs: 1000, // 1 second
  max: 10, // 10 requests per second per IP
  message: {
    success: false,
    error: {
      code: 'FLASH_SALE_LIMITED',
      message: 'Too many requests. Please try again.'
    }
  },
  keyGenerator: (req) => req.ip + ':' + req.body.productId
});

// Queue checkout requests
const checkoutQueue = new Queue('checkout', {
  limiter: {
    max: 100, // 100 checkouts per second
    duration: 1000
  }
});

app.post('/api/v1/orders', flashSaleLimiter, async (req, res) => {
  await checkoutQueue.add('process-checkout', {
    userId: req.user.id,
    cartId: req.body.cartId,
    timestamp: Date.now()
  });
  
  res.status(202).json({
    success: true,
    message: 'Order queued for processing'
  });
});
```

## Performance Benchmarks to Target

| Metric | Target | Critical |
|--------|--------|----------|
| API Gateway p99 latency | < 100ms | < 200ms |
| Product listing page | < 300ms | < 500ms |
| Product detail page | < 200ms | < 400ms |
| Search results | < 300ms | < 500ms |
| Add to cart | < 100ms | < 200ms |
| Checkout submit | < 500ms | < 1s |
| Payment processing | < 2s | < 5s |
| Page load (LCP) | < 2.5s | < 4s |
| Availability | 99.9% | 99.5% |
| Error rate | < 0.1% | < 1% |

### Performance Monitoring

```typescript
// middleware/metrics.ts
const metricsMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    
    // Record metrics
    histogram('http_request_duration', duration, {
      method: req.method,
      path: req.route?.path || 'unknown',
      status: res.statusCode.toString()
    });
    
    counter('http_requests_total', 1, {
      method: req.method,
      path: req.route?.path || 'unknown',
      status: res.statusCode.toString()
    });
  });
  
  next();
};
```

---

# 🔐 Security

## JWT Access Token + Refresh Token Complete Flow

```mermaid
sequenceDiagram
    participant Client as Next.js Client
    participant Gateway as API Gateway
    participant Auth as Auth Service
    participant Redis as Redis

    Note over Client,Redis: Initial Login
    Client->>Gateway: POST /auth/login<br/>{email, password}
    Gateway->>Auth: Forward request
    Auth->>Auth: Validate credentials
    Auth->>Auth: Generate access token (15min)
    Auth->>Auth: Generate refresh token (7 days)
    Auth->>Redis: Store refresh token
    Auth-->>Gateway: {accessToken, refreshToken}
    Gateway-->>Client: Return tokens
    
    Note over Client,Redis: Access Token Valid
    Client->>Gateway: GET /products<br/>Authorization: Bearer {accessToken}
    Gateway->>Gateway: Validate JWT signature
    Gateway->>Gateway: Check expiration
    Gateway->>Product: Forward request
    Product-->>Gateway: Return products
    Gateway-->>Client: Return data
    
    Note over Client,Redis: Access Token Expired
    Client->>Gateway: GET /orders<br/>Authorization: Bearer {expiredToken}
    Gateway->>Gateway: Token expired
    
    Gateway-->>Client: 401 Unauthorized<br/>{error: "TOKEN_EXPIRED"}
    
    Note over Client,Redis: Refresh Token
    Client->>Gateway: POST /auth/refresh<br/>{refreshToken}
    Gateway->>Auth: Validate refresh token
    Auth->>Redis: Check token not revoked
    Auth->>Auth: Generate new access token
    Auth->>Auth: Generate new refresh token
    Auth->>Redis: Update refresh token
    Auth-->>Gateway: Return new tokens
    Gateway-->>Client: Return new tokens
    
    Note over Client,Redis: Logout
    Client->>Gateway: POST /auth/logout
    Gateway->>Auth: Invalidate refresh token
    Auth->>Redis: Delete refresh token
    Auth-->>Gateway: Confirm logout
    Gateway-->>Client: Logout successful
```

### Token Implementation

```typescript
// utils/jwt.ts
interface TokenPayload {
  userId: string;
  email: string;
  role: string;
}

const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET!;
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET!;
const ACCESS_TOKEN_EXPIRY = '15m';
const REFRESH_TOKEN_EXPIRY = '7d';

function generateAccessToken(payload: TokenPayload): string {
  return jwt.sign(payload, ACCESS_TOKEN_SECRET, {
    expiresIn: ACCESS_TOKEN_EXPIRY,
    issuer: 'ecommerce-platform'
  });
}

function generateRefreshToken(payload: TokenPayload): string {
  return jwt.sign(payload, REFRESH_TOKEN_SECRET, {
    expiresIn: REFRESH_TOKEN_EXPIRY,
    issuer: 'ecommerce-platform',
    jwtid: crypto.randomUUID() // Unique token ID
  });
}

function verifyAccessToken(token: string): TokenPayload {
  return jwt.verify(token, ACCESS_TOKEN_SECRET) as TokenPayload;
}

function verifyRefreshToken(token: string): TokenPayload {
  return jwt.verify(token, REFRESH_TOKEN_SECRET) as TokenPayload;
}

// Token service
class TokenService {
  async generateTokens(user: User): Promise<TokenPair> {
    const payload: TokenPayload = {
      userId: user.id,
      email: user.email,
      role: user.role
    };
    
    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);
    
    // Store refresh token in Redis
    await redis.setex(
      `refresh_token:${refreshToken.jti}`,
      7 * 24 * 60 * 60, // 7 days
      user.id
    );
    
    return { accessToken, refreshToken };
  }
  
  async refreshTokens(refreshToken: string): Promise<TokenPair> {
    const decoded = verifyRefreshToken(refreshToken);
    
    // Check if token is revoked
    const stored = await redis.get(`refresh_token:${decoded.jti}`);
    if (!stored) {
      throw new UnauthorizedError('Refresh token revoked');
    }
    
    // Get user and generate new tokens
    const user = await userService.getUser(decoded.userId);
    return this.generateTokens(user);
  }
  
  async revokeRefreshToken(refreshToken: string): Promise<void> {
    const decoded = verifyRefreshToken(refreshToken);
    await redis.del(`refresh_token:${decoded.jti}`);
  }
}
```

### Token Response Format

```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": 900,
    "tokenType": "Bearer"
  }
}
```

## API Gateway JWT Validation

```typescript
// middleware/gatewayAuth.ts
const authMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError('No token provided');
    }
    
    const token = authHeader.substring(7);
    
    // Verify token
    const decoded = verifyAccessToken(token);
    
    // Check if token is in blacklist
    const isBlacklisted = await redis.get(`blacklist:${token}`);
    if (isBlacklisted) {
      throw new UnauthorizedError('Token has been revoked');
    }
    
    // Attach user to request
    req.user = decoded;
    
    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'TOKEN_EXPIRED',
          message: 'Access token has expired'
        }
      });
    }
    
    return res.status(401).json({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Invalid token'
      }
    });
  }
};

// Gateway routes with auth
const gatewayRouter = Router();

// Protected routes
gatewayRouter.use('/api/v1/users', authMiddleware);
gatewayRouter.use('/api/v1/orders', authMiddleware);
gatewayRouter.use('/api/v1/cart', authMiddleware);
gatewayRouter.use('/api/v1/payments', authMiddleware);

// Public routes (no auth required)
gatewayRouter.get('/api/v1/products', productProxy);
gatewayRouter.get('/api/v1/search', searchProxy);
gatewayRouter.post('/api/v1/auth/login', authProxy);
gatewayRouter.post('/api/v1/auth/register', authProxy);
```

## Role Based Access Control (RBAC)

### Roles and Permissions

| Role | Permissions |
|------|-------------|
| customer | read:products, read:orders, create:orders, read:cart, update:profile |
| admin | All customer permissions, read:analytics, manage:products, manage:users, manage:orders |
| super_admin | All admin permissions, manage:admins, manage:settings |

### RBAC Implementation

```typescript
// types/rbac.ts
enum Permission {
  // Product permissions
  READ_PRODUCTS = 'read:products',
  CREATE_PRODUCTS = 'create:products',
  UPDATE_PRODUCTS = 'update:products',
  DELETE_PRODUCTS = 'delete:products',
  
  // Order permissions
  READ_ORDERS = 'read:orders',
  CREATE_ORDERS = 'create:orders',
  UPDATE_ORDERS = 'update:orders',
  CANCEL_ORDERS = 'cancel:orders',
  
  // User permissions
  READ_USERS = 'read:users',
  UPDATE_USERS = 'update:users',
  DELETE_USERS = 'delete:users',
  
  // Admin permissions
  READ_ANALYTICS = 'read:analytics',
  MANAGE_SETTINGS = 'manage:settings'
}

const rolePermissions: Record<string, Permission[]> = {
  customer: [
    Permission.READ_PRODUCTS,
    Permission.READ_ORDERS,
    Permission.CREATE_ORDERS,
    Permission.READ_CART,
    Permission.UPDATE_PROFILE
  ],
  admin: [
    Permission.READ_PRODUCTS,
    Permission.CREATE_PRODUCTS,
    Permission.UPDATE_PRODUCTS,
    Permission.READ_ORDERS,
    Permission.UPDATE_ORDERS,
    Permission.READ_USERS,
    Permission.UPDATE_USERS,
    Permission.READ_ANALYTICS
  ],
  super_admin: Object.values(Permission)
};

// Middleware
const requirePermission = (permission: Permission) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const userRole = req.user.role;
    const permissions = rolePermissions[userRole] || [];
    
    if (!permissions.includes(permission)) {
      throw new ForbiddenError('Insufficient permissions');
    }
    
    next();
  };
};

// Usage in routes
router.delete('/products/:id',
  authMiddleware,
  requirePermission(Permission.DELETE_PRODUCTS),
  controller.deleteProduct
);
```

## API Rate Limiting Strategy

```typescript
// middleware/rateLimit.ts
import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import Redis from 'ioredis';

const redisClient = new Redis(process.env.REDIS_URL);

// General API rate limiter
export const generalLimiter = rateLimit({
  store: new RedisStore({
    sendCommand: (...args: string[]) => redisClient.call(...args)
  }),
  windowMs: 60 * 1000, // 1 minute
  max: 100, // 100 requests per minute
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests. Please try again later.'
    }
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Strict limiter for authentication
export const authLimiter = rateLimit({
  store: new RedisStore({
    sendCommand: (...args: string[]) => redisClient.call(...args)
  }),
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts
  skipSuccessfulRequests: true,
  message: {
    success: false,
    error: {
      code: 'LOGIN_LIMIT_EXCEEDED',
      message: 'Too many login attempts. Please try again in 15 minutes.'
    }
  }
});

// Payment rate limiter
export const paymentLimiter = rateLimit({
  store: new RedisStore({
    sendCommand: (...args: string[]) => redisClient.call(...args)
  }),
  windowMs: 60 * 1000,
  max: 10, // 10 payment attempts per minute
  message: {
    success: false,
    error: {
      code: 'PAYMENT_LIMIT_EXCEEDED',
      message: 'Too many payment attempts. Please try again later.'
    }
  }
});

// Apply limiters
app.use('/api/', generalLimiter);
app.use('/api/v1/auth/login', authLimiter);
app.use('/api/v1/auth/register', authLimiter);
app.use('/api/v1/payments', paymentLimiter);
```

## Input Validation and Sanitization

```typescript
// middleware/validate.ts
import { celebrate, Joi, Segments } from 'celebrate';

// Validation schemas
const schemas = {
  [Segments.BODY]: {
    register: Joi.object({
      email: Joi.string().email().required(),
      password: Joi.string().min(8).max(100).required(),
      firstName: Joi.string().max(50).required(),
      lastName: Joi.string().max(50).required(),
      phone: Joi.string().pattern(/^\+?[1-9]\d{1,14}$/)
    }),
    
    login: Joi.object({
      email: Joi.string().email().required(),
      password: Joi.string().required()
    }),
    
    createOrder: Joi.object({
      cartId: Joi.string().uuid().required(),
      shippingAddressId: Joi.string().uuid().required(),
      paymentMethodId: Joi.string().uuid().required()
    })
  },
  
  [Segments.PARAMS]: {
    productId: Joi.object({
      id: Joi.string().uuid().required()
    })
  },
  
  [Segments.QUERY]: {
    pagination: Joi.object({
      page: Joi.number().integer().min(1).default(1),
      limit: Joi.number().integer().min(1).max(100).default(20)
    })
  }
};

// Apply validation
const validateRequest = (schema: any) => celebrate(schema);

export { validateRequest, schemas };
```

## SQL Injection Prevention

```typescript
// Use parameterized queries only
class UserRepository {
  // SAFE - Parameterized query
  async findByEmail(email: string): Promise<User> {
    const result = await db.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );
    return result.rows[0];
  }
  
  // SAFE - Using query builder with parameterization
  async search(filters: SearchFilters): Promise<User[]> {
    const query = new UserQueryBuilder()
      .where('email ILIKE $1', `%${filters.email}%`)
      .where('status = $2', filters.status)
      .limit(10)
      .execute();
    return query;
  }
  
  // UNSAFE - Never do this!
  async unsafeSearch(email: string): Promise<User[]> {
    // DO NOT USE STRING CONCATENATION
    const query = `SELECT * FROM users WHERE email = '${email}'`; // VULNERABLE!
    const result = await db.query(query);
    return result.rows;
  }
}
```

### ORM with Parameterized Queries

```typescript
// Using Prisma (automatically parameterizes queries)
const user = await prisma.user.findUnique({
  where: { email }
});

// Using Knex (parameterized by default)
const user = await db('users')
  .where('email', email)
  .first();
```

## XSS and CSRF Protection

### XSS Prevention

```typescript
// Use helmet middleware
import helmet from 'helmet';

app.use(helmet());

// Configure Content Security Policy
app.use(helmet.contentSecurityPolicy({
  directives: {
    defaultSrc: ["'self'"],
    scriptSrc: ["'self'", "'unsafe-inline'", 'https://cdn.example.com'],
    styleSrc: ["'self'", "'unsafe-inline'"],
    imgSrc: ["'self'", 'data:', 'https://*.cloudfront.net'],
    connectSrc: ["'self'", 'https://api.example.com'],
    fontSrc: ["'self'", 'https://fonts.gstatic.com']
  }
}));

// Sanitize user input
import DOMPurify from 'isomorphic-dompurify';

const sanitizeInput = (input: string): string => {
  return DOMPurify.sanitize(input, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: []
  });
};
```

### CSRF Protection

```typescript
// Using csurf middleware (for traditional SSR)
import csurf from 'csurf';

app.use(csrf({ cookie: true }));

// For API-only, use CSRF token in headers
app.get('/api/csrf-token', (req, res) => {
  res.json({ csrfToken: req.csrfToken() });
});

// Frontend sends CSRF token in requests
axios.defaults.headers.common['X-CSRF-TOKEN'] = csrfToken;

// For stateless APIs, use SameSite cookies
app.use(session({
  cookie: {
    secure: true,
    httpOnly: true,
    sameSite: 'strict'
  }
}));
```

## Payment Security Basics

```typescript
// Payment security checklist

// 1. Never store raw card numbers
interface PaymentMethod {
  id: string;
  type: 'card' | 'bank';
  lastFour: string; // Only store last 4 digits
  brand: string;
  expiryMonth: number;
  expiryYear: number;
  // DO NOT store: full card number, CVV
}

// 2. Use PCI-compliant payment gateway
class PaymentService {
  async processPayment(paymentData: PaymentData): Promise<PaymentResult> {
    // Send only to payment gateway, never store locally
    const result = await stripe.paymentIntents.create({
      amount: paymentData.amount,
      currency: paymentData.currency,
      payment_method: paymentData.paymentMethodId,
      customer: paymentData.customerId,
      confirm: true,
      return_url: process.env.PAYMENT_RETURN_URL
    });
    
    return {
      success: result.status === 'succeeded',
      transactionId: result.id,
      status: result.status
    };
  }
}

// 3. Webhook signature verification
const verifyWebhookSignature = (
  payload: string,
  signature: string,
  secret: string
): boolean => {
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
  
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
};
```

## Sensitive Data Encryption

```typescript
// utils/encryption.ts
import crypto from 'crypto';

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY!; // 32 bytes
const IV_LENGTH = 16;

class EncryptionService {
  // Encrypt sensitive data
  encrypt(text: string): string {
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv('aes-256-cbc', 
      Buffer.from(ENCRYPTION_KEY, 'hex'), 
      iv
    );
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    return iv.toString('hex') + ':' + encrypted;
  }
  
  // Decrypt sensitive data
  decrypt(text: string): string {
    const [ivHex, encryptedText] = text.split(':');
    const iv = Buffer.from(ivHex, 'hex');
    
    const decipher = crypto.createDecipheriv('aes-256-cbc',
      Buffer.from(ENCRYPTION_KEY, 'hex'),
      iv
    );
    
    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }
  
  // Hash sensitive data (one-way)
  hash(data: string): string {
    return crypto
      .createHash('sha256')
      .update(data)
      .digest('hex');
  }
}

// Encrypt PII at rest
const userRepository = {
  async create(userData: CreateUserDTO): Promise<User> {
    const encryption = new EncryptionService();
    
    // Encrypt sensitive fields
    const encryptedData = {
      ...userData,
      ssn: userData.ssn ? encryption.encrypt(userData.ssn) : null,
      taxId: userData.taxId ? encryption.encrypt(userData.taxId) : null
    };
    
    return db.users.create(encryptedData);
  }
};
```

## Environment Variables Security

```bash
# .env.example (DO NOT COMMIT THIS FILE)
# Copy to .env and fill in values

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/db
DB_PASSWORD=secret

# Redis
REDIS_URL=redis://localhost:6379
REDIS_PASSWORD=secret

# JWT
ACCESS_TOKEN_SECRET=your-access-token-secret-min-32-chars
REFRESH_TOKEN_SECRET=your-refresh-token-secret-min-32-chars

# Encryption
ENCRYPTION_KEY=your-32-byte-hex-encryption-key

# External Services
STRIPE_SECRET_KEY=sk_test_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
SENDGRID_API_KEY=SG.xxx

# AWS
AWS_ACCESS_KEY_ID=xxx
AWS_SECRET_ACCESS_KEY=xxx
AWS_REGION=us-east-1

# RabbitMQ
RABBITMQ_URL=amqp://user:password@localhost:5672
```

```typescript
// config/index.ts
import dotenv from 'dotenv';

dotenv.config();

const required = ['DATABASE_URL', 'ACCESS_TOKEN_SECRET', 'REDIS_URL'];

const missing = required.filter(key => !process.env[key]);

if (missing.length > 0) {
  throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
}

export const config = {
  database: {
    url: process.env.DATABASE_URL!,
    pool: {
      min: 2,
      max: 10
    }
  },
  redis: {
    url: process.env.REDIS_URL!,
    password: process.env.REDIS_PASSWORD
  },
  jwt: {
    accessSecret: process.env.ACCESS_TOKEN_SECRET!,
    refreshSecret: process.env.REFRESH_TOKEN_SECRET!,
    accessExpiry: '15m',
    refreshExpiry: '7d'
  },
  encryption: {
    key: process.env.ENCRYPTION_KEY!
  }
};
```

## CORS Configuration

```typescript
// middleware/cors.ts
import cors from 'cors';

const corsOptions = cors({
  origin: (origin: string | undefined, callback:) => {
    const allowedOrigins = [
      'https://www.example.com',
      'https://example.com',
      'http://localhost:3001'   // Frontend development
    ];
    
    // Allow requests with no origin (mobile apps, curl)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-CSRF-Token',
    'X-Requested-With'
  ],
  exposedHeaders: ['X-Total-Count', 'X-Page-Count'],
  credentials: true,
  maxAge: 86400 // 24 hours
});

app.use(cors(corsOptions));
```

## Attack Prevention

### Brute Force Protection

```typescript
// middleware/bruteForce.ts
const failedAttempts = new Map<string, number>();
const LOCKOUT_THRESHOLD = 5;
const LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes

const bruteForceProtection = (req: Request, res: Response, next: NextFunction) => {
  const ip = req.ip;
  const email = req.body.email;
  const key = `${ip}:${email}`;
  
  const attempts = failedAttempts.get(key) || 0;
  
  if (attempts >= LOCKOUT_THRESHOLD) {
    return res.status(429).json({
      success: false,
      error: {
        code: 'ACCOUNT_LOCKED',
        message: 'Too many failed attempts. Please try again later.'
      }
    });
  }
  
  next();
};

const recordFailedAttempt = (ip: string, email: string) => {
  const key = `${ip}:${email}`;
  const attempts = (failedAttempts.get(key) || 0) + 1;
  failedAttempts.set(key, attempts);
  
  // Reset after successful login or lockout
  setTimeout(() => {
    failedAttempts.delete(key);
  }, LOCKOUT_DURATION);
};
```

### DDoS Protection

```mermaid
flowchart TB
    Attack["DDoS Attack<br/>10,000 requests/s"]
    
    subgraph Defense["Defense Layers"]
        CDN["Cloudflare/AWS CloudFront"]
        WAF["Web Application Firewall"]
        Rate["Rate Limiting"]
        Block["Block Malicious IPs"]
    end
    
    Attack --> CDN
    CDN --> WAF
    WAF --> Rate
    Rate --> Block
    
    subgraph Legitimate["Legitimate Traffic"]
        Good["1,000 requests/s"]
    end
    
    Good --> CDN
```

### MITM Prevention

```typescript
// Use HTTPS everywhere
import https from 'https';
import fs from 'fs';

const httpsOptions = {
  key: fs.readFileSync('./ssl/private.key'),
  cert: fs.readFileSync('./ssl/certificate.crt'),
  ca: fs.readFileSync('./ssl/ca_bundle.crt')
};

// Force HTTPS in production
app.use((req: Request, res: Response, next: NextFunction) => {
  if (process.env.NODE_ENV === 'production' && !req.secure) {
    return res.redirect(`https://${req.hostname}${req.url}`);
  }
  next();
});

// Use HSTS
app.use(helmet.hsts({
  maxAge: 31536000, // 1 year
  includeSubDomains: true,
  preload: true
}));
```

---

# 📋 API Contracts

## Standard Request Format

### Request Headers

| Header | Required | Description |
|--------|----------|-------------|
| Content-Type | Yes | application/json |
| Authorization | Conditional | Bearer {accessToken} |
| X-CSRF-Token | Conditional | CSRF token (SSR only) |
| X-Request-ID | No | Client-generated request ID |
| Accept | No | application/json |
| Accept-Language | No | en-US, es, fr, etc. |
| Accept-Encoding | No | gzip, deflate |

### Request Body

```json
{
  "data": {
    "attribute1": "value1",
    "attribute2": 123
  }
}
```

## Standard Response Format

### Success Response

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "attribute": "value"
  },
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 100
  }
}
```

### Paginated Response

```json
{
  "success": true,
  "data": [
    { "id": "1", "name": "Product 1" },
    { "id": "2", "name": "Product 2" }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5,
    "hasNext": true,
    "hasPrev": false
  }
}
```

## Standard Error Response

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": [
      {
        "field": "email",
        "message": "Email is required"
      },
      {
        "field": "password",
        "message": "Password must be at least 8 characters"
      }
    ]
  },
  "requestId": "req-abc123"
}
```

### Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| VALIDATION_ERROR | 400 | Invalid input data |
| UNAUTHORIZED | 401 | Authentication required |
| FORBIDDEN | 403 | Insufficient permissions |
| NOT_FOUND | 404 | Resource not found |
| CONFLICT | 409 | Resource conflict |
| RATE_LIMIT_EXCEEDED | 429 | Too many requests |
| INTERNAL_ERROR | 500 | Server error |
| SERVICE_UNAVAILABLE | 503 | Service temporarily unavailable |

## API Versioning Strategy

- Version included in URL path: `/api/v1/`
- Version header optional: `Accept: application/vnd.ecommerce.v1+json`
- Deprecation policy: 12 months support for old versions
- Current version: v1

## Authentication Header Standard

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Token Response

```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": 900,
    "tokenType": "Bearer"
  }
}
```

## Pagination Standard

### Query Parameters

| Parameter | Default | Max | Description |
|-----------|---------|-----|-------------|
| page | 1 | 1000 | Page number |
| limit | 20 | 100 | Items per page |
| sort | created_at | - | Sort field |
| order | desc | asc/desc | Sort order |

### Example

```
GET /api/v1/products?page=1&limit=20&sort=price&order=asc
```

---

## API Contracts by Service

### 1. API Gateway

#### GET /health

| Attribute | Value |
|-----------|-------|
| Method | GET |
| Endpoint | /health |
| Auth Required | No |
| Headers | - |

**Success Response (200)**

```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "timestamp": "2026-03-02T12:00:00Z",
    "services": {
      "auth": "healthy",
      "user": "healthy",
      "product": "healthy",
      "cart": "healthy",
      "order": "healthy",
      "payment": "healthy",
      "notification": "healthy",
      "search": "healthy",
      "admin": "healthy"
    }
  }
}
```

---

### 2. Auth Service

#### POST /auth/register

| Attribute | Value |
|-----------|-------|
| Method | POST |
| Endpoint | /api/v1/auth/register |
| Auth Required | No |
| Headers | Content-Type: application/json |

**Request Body**

```json
{
  "email": "user@example.com",
  "password": "securePassword123",
  "firstName": "John",
  "lastName": "Doe",
  "phone": "+1234567890"
}
```

**Success Response (201)**

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe"
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
    "expiresIn": 900
  }
}
```

**Error Responses**

| Status | Code | Message |
|--------|------|---------|
| 400 | VALIDATION_ERROR | Invalid input data |
| 409 | EMAIL_EXISTS | Email already registered |

#### POST /auth/login

| Attribute | Value |
|-----------|-------|
| Method | POST |
| Endpoint | /api/v1/auth/login |
| Auth Required | No |
| Headers | Content-Type: application/json |

**Request Body**

```json
{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

**Success Response (200)**

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "customer"
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
    "expiresIn": 900
  }
}
```

**Error Responses**

| Status | Code | Message |
|--------|------|---------|
| 400 | VALIDATION_ERROR | Invalid credentials |
| 401 | INVALID_CREDENTIALS | Email or password incorrect |
| 429 | LOGIN_LIMIT_EXCEEDED | Too many login attempts |

#### POST /auth/refresh

| Attribute | Value |
|-----------|-------|
| Method | POST |
| Endpoint | /api/v1/auth/refresh |
| Auth Required | No |
| Headers | Content-Type: application/json |

**Request Body**

```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

**Success Response (200)**

```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
    "expiresIn": 900
  }
}
```

**Error Responses**

| Status | Code | Message |
|--------|------|---------|
| 401 | TOKEN_EXPIRED | Refresh token expired |
| 401 | INVALID_TOKEN | Invalid refresh token |

#### POST /auth/logout

| Attribute | Value |
|-----------|-------|
| Method | POST |
| Endpoint | /api/v1/auth/logout |
| Auth Required | Yes |
| Headers | Authorization: Bearer {token} |

**Success Response (200)**

```json
{
  "success": true,
  "data": {
    "message": "Logged out successfully"
  }
}
```

---

### 3. User Service

#### GET /users/me

| Attribute | Value |
|-----------|-------|
| Method | GET |
| Endpoint | /api/v1/users/me |
| Auth Required | Yes |
| Headers | Authorization: Bearer {token} |

**Success Response (200)**

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "phone": "+1234567890",
    "avatarUrl": "https://...",
    "dateOfBirth": "1990-01-15",
    "language": "en",
    "currency": "USD",
    "createdAt": "2026-01-01T00:00:00Z"
  }
}
```

#### PUT /users/me

| Attribute | Value |
|-----------|-------|
| Method | PUT |
| Endpoint | /api/v1/users/me |
| Auth Required | Yes |
| Headers | Authorization: Bearer {token} |

**Request Body**

```json
{
  "firstName": "John",
  "lastName": "Updated",
  "phone": "+1234567890",
  "language": "en",
  "currency": "USD"
}
```

**Success Response (200)**

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Updated",
    "phone": "+1234567890"
  }
}
```

#### GET /users/me/addresses

| Attribute | Value |
|-----------|-------|
| Method | GET |
| Endpoint | /api/v1/users/me/addresses |
| Auth Required | Yes |
| Headers | Authorization: Bearer {token} |

**Success Response (200)**

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "type": "shipping",
      "isDefault": true,
      "firstName": "John",
      "lastName": "Doe",
      "addressLine1": "123 Main St",
      "addressLine2": "Apt 4",
      "city": "New York",
      "state": "NY",
      "postalCode": "10001",
      "country": "US",
      "phone": "+1234567890"
    }
  ]
}
```

#### POST /users/me/addresses

| Attribute | Value |
|-----------|-------|
| Method | POST |
| Endpoint | /api/v1/users/me/addresses |
| Auth Required | Yes |
| Headers | Authorization: Bearer {token} |

**Request Body**

```json
{
  "type": "shipping",
  "isDefault": true,
  "firstName": "John",
  "lastName": "Doe",
  "addressLine1": "123 Main St",
  "addressLine2": "Apt 4",
  "city": "New York",
  "state": "NY",
  "postalCode": "10001",
  "country": "US",
  "phone": "+1234567890"
}
```

---

### 4. Product Service

#### GET /products

| Attribute | Value |
|-----------|-------|
| Method | GET |
| Endpoint | /api/v1/products |
| Auth Required | No |
| Query Parameters | page, limit, category, brand, minPrice, maxPrice, sort, order |

**Success Response (200)**

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "iPhone 15 Pro",
      "slug": "iphone-15-pro",
      "description": "Latest iPhone model",
      "basePrice": 999.99,
      "compareAtPrice": 1099.99,
      "images": ["https://..."],
      "category": {
        "id": "uuid",
        "name": "Smartphones"
      },
      "brand": {
        "id": "uuid",
        "name": "Apple"
      },
      "averageRating": 4.5,
      "reviewCount": 100,
      "totalSold": 500,
      "isActive": true,
      "isFeatured": true
    }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5
  }
}
```

#### GET /products/:id

| Attribute | Value |
|-----------|-------|
| Method | GET |
| Endpoint | /api/v1/products/:id |
| Auth Required | No |

**Success Response (200)**

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "sku": "IPHONE15PRO-256-BLK",
    "name": "iPhone 15 Pro",
    "slug": "iphone-15-pro",
    "description": "Detailed description...",
    "basePrice": 999.99,
    "compareAtPrice": 1099.99,
    "costPerItem": 500.00,
    "weight": 200,
    "requiresShipping": true,
    "isTaxable": true,
    "tags": ["smartphone", "apple", "iphone"],
    "images": ["https://..."],
    "videoUrl": null,
    "category": {
      "id": "uuid",
      "name": "Smartphones",
      "slug": "smartphones"
    },
    "brand": {
      "id": "uuid",
      "name": "Apple",
      "slug": "apple"
    },
    "variants": [
      {
        "id": "uuid",
        "name": "256GB - Black",
        "sku": "IPHONE15PRO-256-BLK",
        "price": 999.99,
        "inventoryQuantity": 50,
        "image": "https://..."
      }
    ],
    "options": [
      {
        "name": "Storage",
        "values": ["128GB", "256GB", "512GB"]
      },
      {
        "name": "Color",
        "values": ["Black", "White", "Blue"]
      }
    ],
    "averageRating": 4.5,
    "reviewCount": 100,
    "totalSold": 500,
    "isActive": true,
    "isFeatured": true,
    "createdAt": "2026-01-01T00:00:00Z"
  }
}
```

#### GET /categories

| Attribute | Value |
|-----------|-------|
| Method | GET |
| Endpoint | /api/v1/categories |
| Auth Required | No |

**Success Response (200)**

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "Smartphones",
      "slug": "smartphones",
      "description": "Latest smartphones",
      "imageUrl": "https://...",
      "children": [
        {
          "id": "uuid",
          "name": "Apple",
          "slug": "apple"
        }
      ]
    }
  ]
}
```

---

### 5. Cart Service

#### GET /cart

| Attribute | Value |
|-----------|-------|
| Method | GET |
| Endpoint | /api/v1/cart |
| Auth Required | Yes |
| Headers | Authorization: Bearer {token} |

**Success Response (200)**

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "items": [
      {
        "id": "uuid",
        "productId": "uuid",
        "product": {
          "id": "uuid",
          "name": "iPhone 15 Pro",
          "slug": "iphone-15-pro",
          "image": "https://..."
        },
        "variantId": "uuid",
        "variant": {
          "name": "256GB - Black",
          "sku": "IPHONE15PRO-256-BLK"
        },
        "quantity": 2,
        "unitPrice": 999.99,
        "totalPrice": 1999.98
      }
    ],
    "itemCount": 2,
    "subtotal": 1999.98,
    "taxTotal": 160.00,
    "shippingTotal": 0,
    "discountTotal": 0,
    "total": 2159.98
  }
}
```

#### POST /cart/items

| Attribute | Value |
|-----------|-------|
| Method | POST |
| Endpoint | /api/v1/cart/items |
| Auth Required | Yes |
| Headers | Authorization: Bearer {token} |

**Request Body**

```json
{
  "productId": "uuid",
  "variantId": "uuid",
  "quantity": 2
}
```

**Success Response (200)**

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "items": [...],
    "itemCount": 2,
    "subtotal": 1999.98,
    "total": 2159.98
  }
}
```

#### PUT /cart/items/:id

| Attribute | Value |
|-----------|-------|
| Method | PUT |
| Endpoint | /api/v1/cart/items/:id |
| Auth Required | Yes |

**Request Body**

```json
{
  "quantity": 3
}
```

#### DELETE /cart/items/:id

| Attribute | Value |
|-----------|-------|
| Method | DELETE |
| Endpoint | /api/v1/cart/items/:id |
| Auth Required | Yes |

#### DELETE /cart

| Attribute | Value |
|-----------|-------|
| Method | DELETE |
| Endpoint | /api/v1/cart |
| Auth Required | Yes |

---

### 6. Order Service

#### GET /orders

| Attribute | Value |
|-----------|-------|
| Method | GET |
| Endpoint | /api/v1/orders |
| Auth Required | Yes |
| Query Parameters | page, limit, status, fulfillmentStatus |

**Success Response (200)**

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "orderNumber": "ORD-202603020001",
      "status": "processing",
      "fulfillmentStatus": "unfulfilled",
      "financialStatus": "paid",
      "subtotal": 1999.98,
      "taxTotal": 160.00,
      "shippingTotal": 0,
      "discountTotal": 0,
      "total": 2159.98,
      "itemCount": 2,
      "createdAt": "2026-03-02T10:00:00Z"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 50,
    "totalPages": 3
  }
}
```

#### GET /orders/:id

| Attribute | Value |
|-----------|-------|
| Method | GET |
| Endpoint | /api/v1/orders/:id |
| Auth Required | Yes |

**Success Response (200)**

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "orderNumber": "ORD-202603020001",
    "status": "processing",
    "fulfillmentStatus": "unfulfilled",
    "financialStatus": "paid",
    "items": [
      {
        "id": "uuid",
        "productId": "uuid",
        "productName": "iPhone 15 Pro",
        "variantName": "256GB - Black",
        "sku": "IPHONE15PRO-256-BLK",
        "quantity": 2,
        "unitPrice": 999.99,
        "totalPrice": 1999.98
      }
    ],
    "shippingAddress": {
      "firstName": "John",
      "lastName": "Doe",
      "addressLine1": "123 Main St",
      "city": "New York",
      "state": "NY",
      "postalCode": "10001",
      "country": "US"
    },
    "subtotal": 1999.98,
    "taxTotal": 160.00,
    "shippingTotal": 0,
    "discountTotal": 0,
    "total": 2159.98,
    "trackingNumber": null,
    "carrier": null,
    "createdAt": "2026-03-02T10:00:00Z",
    "updatedAt": "2026-03-02T10:05:00Z"
  }
}
```

#### POST /orders

| Attribute | Value |
|-----------|-------|
| Method | POST |
| Endpoint | /api/v1/orders |
| Auth Required | Yes |

**Request Body**

```json
{
  "cartId": "uuid",
  "shippingAddressId": "uuid",
  "paymentMethodId": "uuid"
}
```

**Success Response (201)**

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "orderNumber": "ORD-202603020001",
    "status": "pending",
    "total": 2159.98,
    "checkoutUrl": "https://checkout.example.com/pay/uuid"
  }
}
```

---

### 7. Payment Service

#### GET /payments/methods

| Attribute | Value |
|-----------|-------|
| Method | GET |
| Endpoint | /api/v1/payments/methods |
| Auth Required | Yes |

**Success Response (200)**

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "type": "card",
      "brand": "visa",
      "lastFour": "4242",
      "expiryMonth": 12,
      "expiryYear": 2027,
      "isDefault": true
    }
  ]
}
```

#### POST /payments/methods

| Attribute | Value |
|-----------|-------|
| Method | POST |
| Endpoint | /api/v1/payments/methods |
| Auth Required | Yes |

**Request Body**

```json
{
  "paymentMethodId": "pm_from_stripe"
}
```

#### POST /payments

| Attribute | Value |
|-----------|-------|
| Method | POST |
| Endpoint | /api/v1/payments |
| Auth Required | Yes |

**Request Body**

```json
{
  "orderId": "uuid",
  "paymentMethodId": "uuid"
}
```

**Success Response (200)**

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "orderId": "uuid",
    "amount": 2159.98,
    "currency": "USD",
    "status": "succeeded",
    "providerTransactionId": "pi_xxx",
    "createdAt": "2026-03-02T10:10:00Z"
  }
}
```

---

### 8. Notification Service

#### GET /notifications

| Attribute | Value |
|-----------|-------|
| Method | GET |
| Endpoint | /api/v1/notifications |
| Auth Required | Yes |
| Query Parameters | page, limit, unreadOnly |

**Success Response (200)**

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "type": "order_confirmation",
      "title": "Order Confirmed",
      "content": "Your order #ORD-202603020001 has been confirmed",
      "isRead": false,
      "createdAt": "2026-03-02T10:10:00Z"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 10,
    "unreadCount": 3
  }
}
```

#### PUT /notifications/:id/read

| Attribute | Value |
|-----------|-------|
| Method | PUT |
| Endpoint | /api/v1/notifications/:id/read |
| Auth Required | Yes |

#### PUT /notifications/read-all

| Attribute | Value |
|-----------|-------|
| Method | PUT |
| Endpoint | /api/v1/notifications/read-all |
| Auth Required | Yes |

---

### 9. Search Service

#### GET /search

| Attribute | Value |
|-----------|-------|
| Method | GET |
| Endpoint | /api/v1/search |
| Auth Required | No |
| Query Parameters | q, page, limit, category, brand, minPrice, maxPrice |

**Success Response (200)**

```json
{
  "success": true,
  "data": {
    "results": [
      {
        "id": "uuid",
        "name": "iPhone 15 Pro",
        "slug": "iphone-15-pro",
        "description": "Latest iPhone model...",
        "price": 999.99,
        "image": "https://...",
        "rating": 4.5,
        "reviewCount": 100,
        "category": "Smartphones",
        "brand": "Apple"
      }
    ],
    "suggestions": ["iphone 15", "iphone 15 pro max"],
    "facets": {
      "category": [
        { "name": "Smartphones", "count": 50 },
        { "name": "Tablets", "count": 30 }
      ],
      "brand": [
        { "name": "Apple", "count": 40 },
        { "name": "Samsung", "count": 35 }
      ],
      "price": [
        { "min": 0, "max": 500, "count": 100 },
        { "min": 500, "max": 1000, "count": 80 }
      ]
    }
  },
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 500,
    "queryTime": 45
  }
}
```

#### GET /search/suggestions

| Attribute | Value |
|-----------|-------|
| Method | GET |
| Endpoint | /api/v1/search/suggestions |
| Query Parameters | q |

**Success Response (200)**

```json
{
  "success": true,
  "data": {
    "suggestions": [
      "iPhone 15 Pro",
      "iPhone 15",
      "iPhone 14"
    ]
  }
}
```

---

### 10. Admin Service

#### GET /admin/analytics/dashboard

| Attribute | Value |
|-----------|-------|
| Method | GET |
| Endpoint | /api/v1/admin/analytics/dashboard |
| Auth Required | Yes (Admin only) |

**Success Response (200)**

```json
{
  "success": true,
  "data": {
    "revenue": {
      "today": 15000.00,
      "yesterday": 12000.00,
      "thisWeek": 85000.00,
      "thisMonth": 350000.00
    },
    "orders": {
      "today": 150,
      "pending": 25,
      "processing": 50,
      "shipped": 75
    },
    "customers": {
      "newToday": 20,
      "total": 10000,
      "activeThisMonth": 5000
    },
    "products": {
      "lowStock": 15,
      "outOfStock": 5,
      "topSelling": [
        { "id": "uuid", "name": "iPhone 15 Pro", "sold": 500 }
      ]
    }
  }
}
```

#### GET /admin/products

| Attribute | Value |
|-----------|-------|
| Method | GET |
| Endpoint | /api/v1/admin/products |
| Auth Required | Yes (Admin only) |

#### POST /admin/products

| Attribute | Value |
|-----------|-------|
| Method | POST |
| Endpoint | /api/v1/admin/products |
| Auth Required | Yes (Admin only) |

**Request Body**

```json
{
  "name": "New Product",
  "description": "Product description",
  "categoryId": "uuid",
  "brandId": "uuid",
  "basePrice": 99.99,
  "sku": "NEW-PROD-001",
  "inventoryQuantity": 100,
  "isActive": true,
  "images": ["https://..."]
}
```

---

## RabbitMQ Event Contracts

### Event Naming Convention

```
{resource}.{action}
```

### Event Catalog

#### User Events

| Event Name | Publisher | Consumer | Payload |
|------------|-----------|----------|---------|
| user.registered | Auth Service | User, Notification | `{ userId, email, name, timestamp }` |
| user.updated | User Service | Search | `{ userId, changes, timestamp }` |
| user.deleted | User Service | Search, Cart | `{ userId, timestamp }` |

#### Product Events

| Event Name | Publisher | Consumer | Payload |
|------------|-----------|----------|---------|
| product.created | Product Service | Search | `{ productId, data, timestamp }` |
| product.updated | Product Service | Search, Cart | `{ productId, changes, timestamp }` |
| product.deleted | Product Service | Search, Cart | `{ productId, timestamp }` |
| inventory.low | Product Service | Notification | `{ productId, variantId, quantity, threshold }` |

#### Cart Events

| Event Name | Publisher | Consumer | Payload |
|------------|-----------|----------|---------|
| cart.checkout | Cart Service | Order | `{ cartId, userId, timestamp }` |

#### Order Events

| Event Name | Publisher | Consumer | Payload |
|------------|-----------|----------|---------|
| order.created | Order Service | Payment, Notification | `{ orderId, userId, total, items, timestamp }` |
| order.completed | Order Service | Notification, Product | `{ orderId, userId, timestamp }` |
| order.cancelled | Order Service | Notification, Product | `{ orderId, reason, timestamp }` |
| order.shipped | Order Service | Notification | `{ orderId, trackingNumber, carrier, timestamp }` |

#### Payment Events

| Event Name | Publisher | Consumer | Payload |
|------------|-----------|----------|---------|
| payment.completed | Payment Service | Order, Notification | `{ paymentId, orderId, transactionId, timestamp }` |
| payment.failed | Payment Service | Order, Notification | `{ paymentId, orderId, reason, timestamp }` |
| payment.refunded | Payment Service | Order, Notification | `{ paymentId, orderId, amount, timestamp }` |

### Event Message Format

```json
{
  "event": "order.completed",
  "data": {
    "orderId": "uuid",
    "userId": "uuid",
    "total": 2159.98,
    "items": [
      {
        "productId": "uuid",
        "quantity": 2,
        "unitPrice": 999.99
      }
    ]
  },
  "metadata": {
    "timestamp": "2026-03-02T10:15:00Z",
    "correlationId": "uuid",
    "version": "1.0"
  }
}
```

### Exchange Configuration

```typescript
const EXCHANGES = {
  USER: {
    name: 'user.events',
    type: 'topic',
    durable: true
  },
  PRODUCT: {
    name: 'product.events',
    type: 'topic',
    durable: true
  },
  CART: {
    name: 'cart.events',
    type: 'topic',
    durable: true
  },
  ORDER: {
    name: 'order.events',
    type: 'topic',
    durable: true
  },
  PAYMENT: {
    name: 'payment.events',
    type: 'topic',
    durable: true
  }
};
```

---

*Last Updated: 2026*
