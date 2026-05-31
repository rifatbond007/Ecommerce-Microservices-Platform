-- Create schemas for each microservice
-- Quoted identifiers match schema names used in docker-compose.yml DATABASE_URL
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

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create gateway route_config table
CREATE TABLE IF NOT EXISTS gateway.route_config (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    path VARCHAR(255) NOT NULL,
    method VARCHAR(20) NOT NULL,
    target_service VARCHAR(50) NOT NULL,
    auth_required BOOLEAN DEFAULT false,
    rate_limit INTEGER DEFAULT 100,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create index on route_config
CREATE INDEX IF NOT EXISTS idx_route_config_path_method ON gateway.route_config(path, method);

-- Log successful initialization
DO $$
BEGIN
    RAISE NOTICE 'Database schemas initialized successfully';
END $$;
