# Weekly Sprint Plan

## Team Structure

| Team | Members | Services Assigned |
|------|---------|-------------------|
| Team A | 2 developers | Auth, User, Product, Search, Admin |
| Team B | 2 developers | Gateway, Cart, Order, Payment, Notification |

---

## Sprint Overview

| Sprint | Duration | Focus | Team A | Team B |
|--------|----------|-------|--------|--------|
| 1 | Week 1-2 | Infrastructure & Auth | Auth | Gateway |
| 2 | Week 3-4 | Core Domain - Users & Products | User, Product | Cart |
| 3 | Week 5-6 | Order & Payment Flow | Search | Order, Payment |
| 4 | Week 7-8 | Integration & Notifications | Admin | Notification |
| 5 | Week 9-10 | Testing, Polish & Deploy | All | All |

---

## Detailed Sprint Plan

### Sprint 1: Foundation (Weeks 1-2)

#### Week 1: Infrastructure Setup & Gateway

**Team B - API Gateway**
- [ ] Setup Express Gateway project structure
- [ ] Configure routing to all services
- [ ] Implement JWT validation middleware
- [ ] Setup rate limiting
- [ ] Configure CORS for frontend
- [ ] Write unit tests for gateway middleware

**Team A - Auth Service**
- [ ] Setup Express.js project
- [ ] Configure Prisma with auth schema
- [ ] Implement user registration endpoint
- [ ] Implement login endpoint
- [ ] Implement JWT token generation
- [ ] Implement refresh token mechanism
- [ ] Setup Redis session storage
- [ ] Write unit tests for auth logic

**Deliverables:**
- Gateway accessible at localhost:3000
- Auth service running at localhost:3001
- Users can register and login

#### Week 2: Gateway Integration & Auth Refinement

**Team B - API Gateway**
- [ ] Connect Gateway to Auth Service
- [ ] Test auth flow through Gateway
- [ ] Implement logout endpoint
- [ ] Add request logging
- [ ] Error handling and response formatting

**Team A - Auth Service**
- [ ] Implement token refresh endpoint
- [ ] Implement logout (invalidate session)
- [ ] Add email validation
- [ ] Password strength validation
- [ ] Rate limiting on auth endpoints

**Milestone Checkpoint 1:**
- [ ] Users can register/login/logout via Gateway
- [ ] JWT tokens working correctly
- [ ] Gateway properly routes authenticated requests

---

### Sprint 2: Core Domain (Weeks 3-4)

#### Week 3: User & Product Services

**Team A - User Service**
- [ ] Setup Express.js project with Prisma
- [ ] Create user profile endpoints (GET/PUT /me)
- [ ] Implement address management
- [ ] Connect to Auth Service for user validation
- [ ] Write unit tests

**Team A - Product Service**
- [ ] Setup Express.js project with Prisma
- [ ] Create product CRUD endpoints
- [ ] Implement category management
- [ ] Add inventory tracking
- [ ] Write unit tests

**Team B - Cart Service**
- [ ] Setup Express.js project with Prisma
- [ ] Plan cart data model
- [ ] Design cart service architecture

#### Week 4: Cart Service & Service Integration

**Team B - Cart Service**
- [ ] Create cart endpoints (get, add, update, remove items)
- [ ] Implement quantity adjustment
- [ ] Connect to Product Service for price validation
- [ ] Implement Redis caching for active carts
- [ ] Write unit tests

**Team A - User & Product Services**
- [ ] Connect User Service to Gateway
- [ ] Connect Product Service to Gateway
- [ ] Add product search endpoints
- [ ] Implement pagination

**Milestone Checkpoint 2:**
- [ ] User profile management working
- [ ] Product catalog accessible
- [ ] Shopping cart functionality complete
- [ ] All services connected to Gateway

---

### Sprint 3: Order & Payment (Weeks 5-6)

#### Week 5: Order Service

**Team B - Order Service**
- [ ] Setup Express.js project with Prisma
- [ ] Create order from cart workflow
- [ ] Implement order status tracking
- [ ] Create order history endpoints
- [ ] Implement RabbitMQ event publishing (order.created)
- [ ] Write unit tests

#### Week 6: Payment Service

**Team B - Payment Service**
- [ ] Setup Express.js project with Prisma
- [ ] Integrate payment gateway (Stripe)
- [ ] Implement payment processing endpoint
- [ ] Handle payment success/failure events
- [ ] Implement RabbitMQ consumer (order.created)
- [ ] Publish payment.completed event
- [ ] Write unit tests

**Team A - Search Service**
- [ ] Setup Express.js project with Prisma
- [ ] Implement product search endpoint
- [ ] Add filtering and sorting
- [ ] Implement RabbitMQ consumer (product.updated)
- [ ] Write unit tests

**Milestone Checkpoint 3:**
- [ ] Complete order creation flow
- [ ] Payment processing working
- [ ] Search functionality operational
- [ ] Async events flowing through RabbitMQ

---

### Sprint 4: Integration & Notifications (Weeks 7-8)

#### Week 7: Notification Service

**Team B - Notification Service**
- [ ] Setup Express.js project with Prisma
- [ ] Implement email notification (SendGrid)
- [ ] Implement RabbitMQ consumer
- [ ] Create notification preferences
- [ ] Handle order confirmation emails
- [ ] Write unit tests

#### Week 8: Admin Service

**Team A - Admin Service**
- [ ] Setup Express.js project with Prisma
- [ ] Implement admin authentication
- [ ] Create analytics dashboard endpoints
- [ ] User management endpoints
- [ ] Product management endpoints
- [ ] Order management endpoints
- [ ] Write unit tests

**Integration Work (Both Teams)**
- [ ] Connect all services to Gateway
- [ ] End-to-end testing
- [ ] Performance testing

**Milestone Checkpoint 4:**
- [ ] All 10 services running
- [ ] End-to-end purchase flow working
- [ ] Notifications sending
- [ ] Admin dashboard functional

---

### Sprint 5: Testing & Polish (Weeks 9-10)

#### Week 9: Testing Week

**Both Teams**
- [ ] Integration testing
- [ ] End-to-end testing with frontend
- [ ] Load testing
- [ ] Security audit
- [ ] Bug fixes

#### Week 10: Deployment & Documentation

**Both Teams**
- [ ] Production deployment setup
- [ ] Docker configuration for services
- [ ] CI/CD pipeline setup
- [ ] Final documentation
- [ ] Demo and retrospective

**Final Milestone Checkpoint:**
- [ ] All services deployed
- [ ] Frontend connected
- [ ] Production-ready
- [ ] Documentation complete

---

## Dependencies Between Services

```
                    ┌─────────────┐
                    │ Auth Service│
                    │  (Priority) │
                    └──────┬──────┘
                           │
              ┌────────────┼────────────┐
              │            │            │
              ▼            ▼            ▼
       ┌──────────┐ ┌──────────┐ ┌──────────┐
       │   User   │ │ Product  │ │ Gateway  │
       │ Service  │ │ Service  │ │          │
       └────┬─────┘ └────┬─────┘ └────┬─────┘
            │            │            │
            │            │            │
            ▼            ▼            ▼
       ┌──────────┐ ┌──────────┐ ┌──────────┐
       │   Cart   │ │  Search   │ │  Admin   │
       │ Service  │ │ Service  │ │ Service  │
       └────┬─────┘ └──────────┘ └──────────┘
            │
            ▼
       ┌──────────┐ ┌──────────┐
       │  Order   │ │Payment   │
       │ Service  │ │ Service  │
       └────┬─────┘ └────┬─────┘
            │            │
            └─────┬──────┘
                  │
                  ▼
           ┌──────────┐
           │Notification│
           │ Service   │
           └──────────┘
```

**Build Order:**
1. Auth Service (all others depend on it)
2. Gateway (routes to all services)
3. User Service (profile data)
4. Product Service (inventory)
5. Cart Service (depends on Product)
6. Order Service (depends on Cart)
7. Payment Service (depends on Order)
8. Search Service (reads Product data)
9. Notification Service (reacts to events)
10. Admin Service (manages all)

---

## Definition of Done

### Per Service

- [ ] Code complete and peer reviewed
- [ ] Unit tests written (>80% coverage)
- [ ] Integration tests passing
- [ ] Connected to API Gateway
- [ ] Environment variables documented
- [ ] README documentation updated
- [ ] Running locally without errors

### Per Sprint

- [ ] All user stories completed
- [ ] All tests passing
- [ ] No critical bugs
- [ ] Code merged to main branch
- [ ] Demo given to product owner

---

## Milestone Checkpoints

| Milestone | Week | Criteria |
|-----------|------|----------|
| M1: Foundation | 2 | Auth + Gateway working |
| M2: Core Domain | 4 | User, Product, Cart + Gateway |
| M3: Business Flow | 6 | Order, Payment, Search + Events |
| M4: Complete | 8 | All 10 services + Admin + Notifications |
| M5: Production | 10 | Deployed and tested |
