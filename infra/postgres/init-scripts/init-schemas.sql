-- Create schemas for each microservice.
-- Quoted identifiers match schema names used in docker-compose.yml DATABASE_URL
-- and per-service prisma.schema (datasource db) — single source of truth.
CREATE SCHEMA IF NOT EXISTS auth;
CREATE SCHEMA IF NOT EXISTS "user_service";
CREATE SCHEMA IF NOT EXISTS product_service;
CREATE SCHEMA IF NOT EXISTS cart_service;
CREATE SCHEMA IF NOT EXISTS order_schema;
CREATE SCHEMA IF NOT EXISTS payment_service;
CREATE SCHEMA IF NOT EXISTS notification_service;
CREATE SCHEMA IF NOT EXISTS search_service;
CREATE SCHEMA IF NOT EXISTS admin_service;
CREATE SCHEMA IF NOT EXISTS gateway;

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Prisma manages the gateway tables (RouteConfig, RateLimit, ApiKey).
-- Tables for other services are created/managed by `npx prisma db push` during
-- `make setup`. This script only ensures the schemas exist before that runs.

-- Log successful initialization
DO $$
BEGIN
    RAISE NOTICE 'Database schemas initialized successfully';
END $$;
