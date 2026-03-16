#!/bin/bash

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

echo "========================================"
echo "Running tests for all services..."
echo "========================================"

echo ""
echo ">>> Running auth-service tests..."
cd "$PROJECT_DIR/services/auth" && npm test

echo ""
echo ">>> Running user-service tests..."
cd "$PROJECT_DIR/services/user" && npm test

echo ""
echo ">>> Running product-service tests..."
cd "$PROJECT_DIR/services/product" && npm test

echo ""
echo ">>> Running gateway-service tests..."
cd "$PROJECT_DIR/services/gateway" && npm test

echo ""
echo "========================================"
echo "All tests completed!"
echo "========================================"
