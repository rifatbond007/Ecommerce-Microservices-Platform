#!/bin/bash
# without docker compose file
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
cd frontend && npm run dev &

echo "All services started!"
echo "Frontend: http://localhost:3000"
echo "Gateway: http://localhost:8000"
echo "Auth: http://localhost:8001"
echo "User: http://localhost:8002"
echo "Product: http://localhost:8003"
echo "Cart: http://localhost:8004"
echo "Order: http://localhost:8005"
echo "Payment: http://localhost:8006"
echo "Notification: http://localhost:8007"
echo "Search: http://localhost:8008"
echo "Admin: http://localhost:8009"

wait
