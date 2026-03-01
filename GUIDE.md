# Welcome to the Team! 🎉

Hey there, future code wizard! We're absolutely thrilled to have you join us on this exciting e-commerce journey. This project is the result of hard work from some amazing people, and now you're going to help make it even better!

Take a deep breath, grab your favorite drink ☕, and let's get you settled in. This GUIDE.md is your friendly companion to help you navigate through our microservices universe.

---

## What Is This Project? 🚀

This is a **full-featured e-commerce platform** built with modern technologies:

- **10 microservices** working together like a well-oiled machine
- **Node.js + Express.js** powering fast and scalable APIs
- **Next.js** delivering a snappy frontend experience
- **PostgreSQL** for reliable data storage
- **Redis** for lightning-fast caching
- **RabbitMQ** handling smooth asynchronous communication

In plain English: it's an online store where users can browse products, add them to a cart, place orders, and make payments — all powered by independent services that talk to each other!

---

## 📚 Start Here — Reading Sequence

Ready to dive in? Here's the recommended order to read our documentation. We've marked them with estimated reading times so you can plan accordingly:

### Step-by-Step Guide

| # | File | Why Read It | What You'll Learn | Time |
|---|------|-------------|-------------------|------|
| 1 | **GUIDE.md** (you're here!) | Start your journey here! | Project overview and how to get started | 5 min |
| 2 | **ARCHITECTURE.md** | Understand the big picture | How all 10 services connect and communicate | 15 min |
| 3 | **FOLDER_STRUCTURE.md** | Know where things live | How the codebase is organized | 10 min |
| 4 | **INFRASTRUCTURE.md** | Set up your local environment | Docker, PostgreSQL, Redis, RabbitMQ setup | 15 min |
| 5 | **DATABASE_SCHEMA.md** | Understand the data | Database tables and relationships | 20 min |
| 6 | **SERVICE_LIST.md** | Deep dive into each service | What each service does in detail | 15 min |
| 7 | **SYSTEM_DESIGN.md** | Technical deep dive | Security, scalability, API contracts | 45 min |
| 8 | **AI_INTEGRATION.md** | Optional but exciting! | AI features and implementation | 15 min |
| 9 | **WEEKLY_SPRINT_PLAN.md** | See the roadmap | What's coming and when | 10 min |

---

## Based on Your Role 👷

Not everyone needs to read everything! Here's a tailored path based on what you'll be working on:

### 👶 New Developer (Fresh Graduate / First Job)

| Order | File | Notes |
|-------|------|-------|
| 1 | GUIDE.md | You're here! Welcome! |
| 2 | FOLDER_STRUCTURE.md | Get familiar with the layout |
| 3 | ARCHITECTURE.md | Understand how things work |
| 4 | INFRASTRUCTURE.md | Set up your local environment |
| 5 | SERVICE_LIST.md | Learn about each service |
| 6 | Quick Start below | Actually run the project! |

### 💻 Backend Developer

| Order | File | Notes |
|-------|------|-------|
| 1 | ARCHITECTURE.md | Service communication patterns |
| 2 | SERVICE_LIST.md | Your services in detail |
| 3 | DATABASE_SCHEMA.md | Data models you'll work with |
| 4 | SYSTEM_DESIGN.md | Security, API contracts |
| 5 | INFRASTRUCTURE.md | Environment setup |

### 🎨 Frontend Developer

| Order | File | Notes |
|-------|------|-------|
| 1 | ARCHITECTURE.md | API Gateway flow |
| 2 | SYSTEM_DESIGN.md | API contracts section |
| 3 | SERVICE_LIST.md | Frontend-facing services |
| 4 | Quick Start | Run the frontend |

### 🛠️ DevOps / Infrastructure

| Order | File | Notes |
|-------|------|-------|
| 1 | INFRASTRUCTURE.md | Docker & infrastructure |
| 2 | ARCHITECTURE.md | Service communication |
| 3 | SYSTEM_DESIGN.md | Scalability section |
| 4 | AI_INTEGRATION.md | If using AI services |

---

## ⚡ Quick Start

Let's get you up and running locally! Follow these steps:

### Prerequisites

Make sure you have these installed on your machine:

| Tool | Version | How to Check |
|------|---------|--------------|
| **Node.js** | 20 LTS | `node --version` |
| **npm** | 10.x | `npm --version` |
| **Docker** | 24.x | `docker --version` |
| **Docker Compose** | 2.24.x | `docker-compose --version` |
| **Git** | Latest | `git --version` |

### Steps to Run

#### 1. Clone the Repository

```bash
git clone <repository-url>
cd ecommerce-microservices
```

#### 2. Start Infrastructure Services

We need PostgreSQL, Redis, and RabbitMQ running:

```bash
# Navigate to infra folder
cd infra

# Start all infrastructure services
docker-compose up -d

# Verify services are running
docker-compose ps
```

You should see:
- PostgreSQL running on port `5432`
- Redis running on port `6379`
- RabbitMQ running on ports `5672` (AMQP) and `15672` (Management UI)

#### 3. Set Up Environment Variables

```bash
# Copy the example environment file
cp .env.example .env

# Edit .env with your local values
# (Check INFRASTRUCTURE.md for details)
```

#### 4. Install Dependencies

```bash
# Root dependencies
npm install

# For each service (example for auth service)
cd services/auth
npm install
```

Or if using a monorepo tool:

```bash
# With npm workspaces
npm install

# Or with Turborepo
npm run build
```

#### 5. Run Database Migrations

```bash
# Run migrations for each service
cd services/auth
npx prisma migrate dev

# Repeat for other services...
```

#### 6. Start the Services

**Option A: Start individually (recommended for development)**

```bash
# Terminal 1 - Auth Service
cd services/auth
npm run dev

# Terminal 2 - User Service
cd services/user
npm run dev

# Terminal 3 - Product Service
cd services/product
npm run dev

# ...and so on
```

**Option B: Start with Docker**

```bash
# Build and run all services
docker-compose -f docker-compose.services.yml up --build
```

#### 7. Start the Frontend

```bash
cd frontend
npm install
npm run dev
```

#### 8. Verify Everything Works

| Service | URL |
|---------|-----|
| Frontend | http://localhost:3000 |
| API Gateway | http://localhost:3001 |
| RabbitMQ Management | http://localhost:15672 |
| PostgreSQL | localhost:5432 |
| Redis | localhost:6379 |

---

## ✅ Before You Code — Checklist

Hey, wait! Before you write your first line of code, please complete this checklist:

- [ ] **Read GUIDE.md** — You're doing this now! ✓
- [ ] **Read ARCHITUCTURE.md** — Understand the big picture
- [ ] **Read FOLDER_STRUCTURE.md** — Know where files go
- [ ] **Check INFRASTRUCTURE.md** — Set up Docker/DB
- [ ] **Clone and setup local environment** — Get the project running
- [ ] **Meet the team** — Say hi in the team chat!
- [ ] **Pick a starter issue** — Look for issues labeled `good-first-issue`
- [ ] **Understand the coding style** — Check for linter/formatter config

---

## 🤝 Contribution Guidelines

We love contributions! Here's how to make your first PR shine:

### 1. Create a Branch

```bash
# Make sure you're on main
git checkout main

# Pull latest changes
git pull origin main

# Create a new branch
git checkout -b feature/your-feature-name
# OR
git checkout -b fix/bug-description
```

**Branch Naming Convention:**

| Type | Example |
|------|---------|
| Feature | `feature/add-user-avatars` |
| Bug Fix | `fix/cart-item-quantity` |
| Documentation | `docs/api-endpoints` |
| Refactor | `refactor/auth-service-cleanup` |

### 2. Make Your Changes

- Write clean, readable code
- Follow the existing code style
- Add comments when necessary (but not for everything!)
- Test your changes locally

### 3. Commit Your Changes

**Commit Message Format:**

```
<type>(<scope>): <subject>

[optional body]

[optional footer]
```

**Examples:**

```bash
# Good commit messages
git commit -m "feat(auth): add refresh token endpoint"
git commit -m "fix(cart): resolve quantity update bug"
git commit -m "docs(readme): update installation steps"

# Bad commit messages ❌
git commit -m "fixed stuff"
git commit -m "asdfgh"
```

**Type Legend:**

| Type | Description |
|------|-------------|
| `feat` | New feature |
| `fix` | Bug fix |
| `docs` | Documentation changes |
| `style` | Code style (formatting) |
| `refactor` | Code refactoring |
| `test` | Adding tests |
| `chore` | Maintenance tasks |

### 4. Raise a Pull Request

1. **Push your branch:**
   ```bash
   git push origin feature/your-feature-name
   ```

2. **Create PR on GitHub:**
   - Click "Compare & pull request"
   - Fill in the PR template
   - Link any related issues

3. **PR Title Format:**
   ```
   [FEATURE] Add user avatar upload
   [FIX] Cart quantity not updating
   [DOCS] Update API documentation
   ```

4. **Description Should Include:**
   - What does this PR do?
   - Why is it needed?
   - How was it tested?
   - Screenshots (if UI changes)

---

## 📞 Need Help?

Don't struggle in silence! Here's where to get help:

| Question | Where to Ask |
|----------|--------------|
| Project setup | Team chat / Slack |
| Architecture | ARCHITECTURE.md |
| Database | DATABASE_SCHEMA.md |
| API endpoints | SYSTEM_DESIGN.md |
| Bugs/Issues | GitHub Issues |
| General questions | Your team lead |

---

## 🎉 You're All Set!

Congratulations! You made it through the onboarding. Now you're ready to:

- ✅ Understand the project structure
- ✅ Run the application locally
- ✅ Make your first contribution

Remember: every expert was once a beginner. Don't be afraid to ask questions, make mistakes, and learn along the way.

**Happy coding!** 💻✨

---

*Last Updated: 2026*
