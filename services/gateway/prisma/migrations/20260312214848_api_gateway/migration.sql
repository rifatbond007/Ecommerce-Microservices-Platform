-- CreateTable
CREATE TABLE "rate_limits" (
    "id" SERIAL NOT NULL,
    "identifier" VARCHAR(255) NOT NULL,
    "endpoint" VARCHAR(500) NOT NULL,
    "request_count" INTEGER NOT NULL DEFAULT 0,
    "window_start" TIMESTAMP(3) NOT NULL,
    "window_duration" INTEGER NOT NULL DEFAULT 60,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rate_limits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "api_keys" (
    "id" SERIAL NOT NULL,
    "key_hash" VARCHAR(255) NOT NULL,
    "service_name" VARCHAR(100) NOT NULL,
    "permissions" JSONB NOT NULL DEFAULT '[]',
    "rate_limit" INTEGER NOT NULL DEFAULT 1000,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "expires_at" TIMESTAMP(3),
    "last_used_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "api_keys_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "route_configs" (
    "id" SERIAL NOT NULL,
    "path" VARCHAR(500) NOT NULL,
    "method" VARCHAR(10) NOT NULL,
    "target_service" VARCHAR(100) NOT NULL,
    "target_url" VARCHAR(500) NOT NULL,
    "timeout" INTEGER NOT NULL DEFAULT 30000,
    "retry_attempts" INTEGER NOT NULL DEFAULT 3,
    "circuit_breaker_threshold" INTEGER NOT NULL DEFAULT 5,
    "auth_required" BOOLEAN NOT NULL DEFAULT true,
    "rate_limit" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "route_configs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_rate_limits_identifier_endpoint" ON "rate_limits"("identifier", "endpoint");

-- CreateIndex
CREATE INDEX "idx_rate_limits_window_start" ON "rate_limits"("window_start");

-- CreateIndex
CREATE UNIQUE INDEX "api_keys_key_hash_key" ON "api_keys"("key_hash");

-- CreateIndex
CREATE INDEX "idx_api_keys_key_hash" ON "api_keys"("key_hash");

-- CreateIndex
CREATE INDEX "idx_api_keys_service_name" ON "api_keys"("service_name");

-- CreateIndex
CREATE UNIQUE INDEX "route_configs_path_key" ON "route_configs"("path");

-- CreateIndex
CREATE INDEX "idx_route_configs_path_method" ON "route_configs"("path", "method");
