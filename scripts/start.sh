#!/bin/bash
echo "Starting all services..."

cd services/auth && npm run dev &
cd services/user && npm run dev &
cd services/product && npm run dev &
cd services/cart && npm run dev &
cd services/order && npm run dev &
cd services/payment && npm run dev &
cd services/notification && npm run dev &
cd services/search && npm run dev &
cd services/admin && npm run dev &
cd services/gateway && npm run dev &

echo "All services started!"
echo "Gateway:  http://localhost:3000"
echo "Auth:     http://localhost:3001"
echo "User:     http://localhost:3002"
echo "Product:  http://localhost:3003"
echo "Cart:     http://localhost:3004"
echo "Order:    http://localhost:3005"
echo "Payment:  http://localhost:3006"
echo "Notif:    http://localhost:3007"
echo "Search:   http://localhost:3008"
echo "Admin:    http://localhost:3009"

wait