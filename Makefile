SERVICES := gateway auth user product cart order payment notification search admin
INFRA_DIR := infra
FRONTEND_DIR := frontend
SHELL   := /bin/bash
.DEFAULT_GOAL := help

.PHONY: help infra-up infra-down infra-status dev dev-all dev-% \
        test test-% api-test lint lint-% build build-% install-% stop clean \
        setup setup-% docker-build-all docker-build-% \
        docker-build-frontend docker-up docker-down

help: ## Show available targets
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | \
		awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

# ── Infrastructure ──────────────────────────────────────────────

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

# ── Service dev ──────────────────────────────────────────────────

dev-all: ## Start all services concurrently
	npm run dev:all

dev-%: ## Start one service (e.g., make dev-auth, make dev-frontend)
	$(eval _svc := $(subst dev-,,$@))
	@$(if $(filter $(_svc),frontend),cd $(FRONTEND_DIR) && npm run dev,$(if $(filter $(_svc),$(SERVICES)),npm run dev:$(_svc),echo "Unknown: $(_svc). Valid: $(SERVICES) frontend" && exit 1))

# ── Setup & Install ──────────────────────────────────────────────

setup: ## Install deps, generate Prisma, push DB schemas for all services
	@for svc in $(SERVICES); do \
		$(MAKE) setup-$$svc || exit 1; \
	done

setup-%: ## Setup one service (e.g., make setup-auth)
	$(eval _svc := $(subst setup-,,$@))
	@$(if $(filter $(_svc),$(SERVICES)),,echo "Unknown: $(_svc). Valid: $(SERVICES)" && exit 1)
	@echo "=== Setting up $(_svc) ==="
	@if [ ! -f services/$(_svc)/.env ] && [ -f services/$(_svc)/.env.example ]; then \
		cp services/$(_svc)/.env.example services/$(_svc)/.env; \
		echo "  Created .env from .env.example"; \
	fi
	(cd services/$(_svc) && npm install && npx prisma generate && npx prisma db push)

install-%: ## Install deps for one service (e.g., make install-auth)
	$(eval _svc := $(subst install-,,$@))
	@$(if $(filter $(_svc),$(SERVICES)),,echo "Unknown: $(_svc). Valid: $(SERVICES)" && exit 1)
	cd services/$(_svc) && npm install

# ── Test ─────────────────────────────────────────────────────────

test: ## Run all service unit tests (via npm workspaces)
	npm run test --workspaces --if-present

test-%: ## Test one service (e.g., make test-auth)

api-test: ## Test all live API endpoints through the gateway (requires infra + services up)
	bash scripts/api-test.sh
	$(eval _svc := $(subst test-,,$@))
	@$(if $(filter $(_svc),$(SERVICES)),,echo "Unknown: $(_svc). Valid: $(SERVICES)" && exit 1)
	npm run test --workspace=services/$(_svc)

# ── Lint ─────────────────────────────────────────────────────────

lint: ## Lint all services (via npm workspaces)
	npm run lint --workspaces --if-present

lint-%: ## Lint one service (e.g., make lint-auth)
	$(eval _svc := $(subst lint-,,$@))
	@$(if $(filter $(_svc),$(SERVICES)),,echo "Unknown: $(_svc). Valid: $(SERVICES)" && exit 1)
	npm run lint --workspace=services/$(_svc)

# ── Build ────────────────────────────────────────────────────────

build: ## Build (tsc) all services
	npm run build --workspaces --if-present

build-%: ## Build one service (e.g., make build-auth)
	$(eval _svc := $(subst build-,,$@))
	@$(if $(filter $(_svc),$(SERVICES)),,echo "Unknown: $(_svc). Valid: $(SERVICES)" && exit 1)
	npm run build --workspace=services/$(_svc)

# ── Docker ───────────────────────────────────────────────────────

DOCKER_TAG ?= latest

docker-build-all: ## Build Docker images for all services + frontend. Override tag: DOCKER_TAG=v1.0
	@set -e; \
	for svc in $(SERVICES); do \
		echo "=== Building ecommerce/$$svc:$(DOCKER_TAG) ==="; \
		docker build -t ecommerce/$$svc:$(DOCKER_TAG) services/$$svc; \
	done; \
	echo "=== Building ecommerce/frontend:$(DOCKER_TAG) ==="; \
	docker build -t ecommerce/frontend:$(DOCKER_TAG) $(FRONTEND_DIR); \
	echo "All images built."

docker-build-%: ## Build one service Docker image (e.g., make docker-build-auth)
	$(eval _svc := $(subst docker-build-,,$@))
	@$(if $(filter $(_svc),$(SERVICES)),,echo "Unknown: $(_svc). Valid: $(SERVICES)" && exit 1)
	docker build -t ecommerce/$(_svc):$(DOCKER_TAG) services/$(_svc)

docker-build-frontend: ## Build frontend Docker image
	docker build -t ecommerce/frontend:$(DOCKER_TAG) $(FRONTEND_DIR)

docker-up: infra-up ## Start full stack (infra + all services)
	cd $(INFRA_DIR) && docker compose up -d

docker-down: ## Stop full stack (infra + services)
	cd $(INFRA_DIR) && docker compose down --remove-orphans

# ── Cleanup ──────────────────────────────────────────────────────

stop: ## Kill all service processes (keep infra running)
	@echo "Stopping service processes..."
	-pkill -f "ts-node-dev" 2>/dev/null || true
	@echo "Done."

clean: stop infra-down ## Stop everything (services + infra)
