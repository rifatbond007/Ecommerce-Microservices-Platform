#!/bin/bash

# Start Infrastructure for E-commerce Microservices Platform
set -e

echo "Starting infrastructure services..."

# Start docker-compose
docker-compose up -d

# Wait for PostgreSQL
echo "Waiting for PostgreSQL..."
until docker exec ecommerce-postgres pg_isready -U postgres -q; do
  sleep 2
done

# Wait for Redis
echo "Waiting for Redis..."
until docker exec ecommerce-redis redis-cli ping | grep -q PONG; do
  sleep 2
done

# Wait for RabbitMQ
echo "Waiting for RabbitMQ..."
until docker exec ecommerce-rabbitmq rabbitmq-diagnostics check_running | grep -q "is running"; do
  sleep 2
done

echo "======================================"
echo "Infrastructure is ready!"
echo "======================================"
echo "PostgreSQL:  localhost:5432"
echo "  User: postgres"
echo "  Password: postgres"
echo "  Database: ecommerce"
echo ""
echo "Redis:       localhost:6379"
echo ""
echo "RabbitMQ:    localhost:5672"
echo "Management:  localhost:15672"
echo "  User: guest"
echo "  Password: guest"
echo "======================================"