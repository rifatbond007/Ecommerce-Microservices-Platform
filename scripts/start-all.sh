#!/bin/bash
# without docker compose file
echo "Starting all services..."

cd services/auth && npm run dev &
cd services/user && npm run dev &
cd services/product && npm run dev &
cd services/gateway && npm run dev &

echo "All services started!"
echo "Gateway: http://localhost:3000"
echo "Auth: http://localhost:3001"
echo "User: http://localhost:3002"
echo "Product: http://localhost:3003"

wait
