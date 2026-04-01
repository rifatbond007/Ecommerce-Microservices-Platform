#!/bin/bash
echo "Stopping all services..."
pkill -f "ts-node-dev"
for port in 3000 3001 3002 3003 3004 3005 3009 5173; do
  fuser -k ${port}/tcp 2>/dev/null
done
echo "All services stopped!"