SERVICES := gateway auth user product cart order payment notification search admin
PORTS    := 3000 3001 3002 3003 3004 3005 3006 3007 3008 3009
INFRA_DIR := infra

.PHONY: help infra-up infra-down infra-status dev dev-all dev-% test test-% lint lint-% build stop clean setup docker-build docker-up docker-down

help: ## Show available targets
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | \
		awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

# Infrastructure
infra-up: ## Start Docker infra (PostgreSQL, Redis, RabbitMQ) with health checks
	cd $(INFRA_DIR) && docker compose up -d postgres redis rabbitmq
	@echo "Waiting for PostgreSQL..."; \
	until docker exec ecommerce-postgres pg_isready -U postgres -q 2>/dev/null; do sleep 2; done
	@echo "Waiting for Redis..."; \
	until docker exec ecommerce-redis redis-cli ping 2>/dev/null | grep -q PONG; do sleep 2; done
	@echo "Waiting for RabbitMQ..."; \
	until docker exec ecommerce-rabbitmq rabbitmq-diagnostics check_running 2>/dev/null | grep -q "is running"; do sleep 2; done
	@echo "Infrastructure ready."
	@echo "  PostgreSQL: localhost:5432 (postgres/postgres)"
	@echo "  Redis:      localhost:6379"
	@echo "  RabbitMQ:   localhost:5672 (guest/guest) | UI: localhost:15672"

infra-down: ## Stop Docker infra
	cd $(INFRA_DIR) && docker compose down

infra-status: ## Show Docker infra container status
	cd $(INFRA_DIR) && docker compose ps

# Service dev
dev-all: ## Start all services concurrently
	npm run dev:all

dev-%: ## Start one service (e.g., make dev-auth, make dev-gateway)
	npm run dev:$(subst dev-,,$@)

# Test
test: ## Run all service tests
	npm run test

test-%: ## Test one service (e.g., make test-auth)
	cd services/$(subst test-,,$@) && npm test

# Lint
lint: ## Lint all services
	npm run lint

lint-%: ## Lint one service (e.g., make lint-auth)
	cd services/$(subst lint-,,$@) && npm run lint

# Build
build: ## Build all services
	npm run build

# Setup
setup: ## Install deps, generate Prisma, push DB schemas for all services
	for svc in $(SERVICES); do \
		cd services/$$svc && npm install && npx prisma generate && npx prisma db push && cd ../..; \
	done

setup-%: ## Setup one service (e.g., make setup-auth)
	cd services/$(subst setup-,,$@) && npm install && npx prisma generate && npx prisma db push

# Cleanup
stop: ## Kill all service processes (keep infra running)
	-pkill -f "ts-node-dev" 2>/dev/null || true; \
	for port in $(PORTS); do fuser -k $$port/tcp 2>/dev/null || true; done

clean: stop infra-down ## Stop everything (services + infra)

# Docker full-stack
docker-build: ## Build Docker images for all services
	for svc in $(SERVICES); do \
		docker build -t ecommerce/$$svc:latest services/$$svc; \
	done

docker-up: infra-up ## Start full stack (infra + services)
	cd $(INFRA_DIR) && docker compose up -d gateway auth user product cart order payment notification search admin

docker-down: ## Stop full stack
	cd $(INFRA_DIR) && docker compose down
