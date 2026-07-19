#!/usr/bin/env bash
# scripts/dev.sh — bring up the full e-commerce stack natively (no Docker).
#
# Usage:
#   bash scripts/dev.sh           # start everything
#   bash scripts/dev.sh stop      # stop everything started by this script
#   bash scripts/dev.sh status    # report what's running
#
# Requires: Node 20+, npm 10+, and locally-installed Postgres + Redis.
# RabbitMQ is optional — only the search service uses it (consumes
# product.events). If rabbitmqctl isn't on PATH, the script will print
# a warning and continue.
#
# Install hints:
#   Debian/Ubuntu:  sudo apt install postgresql redis-server rabbitmq-server
#   macOS:          brew install postgresql@16 redis rabbitmq
#
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

PID_DIR="$ROOT_DIR/logs/dev-pids"
LOG_DIR="$ROOT_DIR/logs"
mkdir -p "$PID_DIR" "$LOG_DIR"

SERVICES=(gateway auth user product cart order payment notification search admin)

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; BLUE='\033[0;34m'; NC='\033[0m'
info()  { printf "${BLUE}[dev]${NC} %s\n" "$*"; }
ok()    { printf "${GREEN}[dev]${NC} %s\n" "$*"; }
warn()  { printf "${YELLOW}[dev]${NC} %s\n" "$*"; }
fail()  { printf "${RED}[dev]${NC} %s\n" "$*"; }

# ── Pre-flight ─────────────────────────────────────────────────
preflight() {
  info "Pre-flight checks"

  if ! command -v node >/dev/null 2>&1; then fail "node not found"; exit 1; fi
  if ! command -v npm >/dev/null 2>&1; then fail "npm not found"; exit 1; fi

  local node_major; node_major=$(node -v | sed 's/^v//;s/\..*//')
  local npm_major;  npm_major=$(npm -v | sed 's/\..*//')
  if [ "${node_major:-0}" -lt 20 ]; then warn "Node $node_major detected — engines requires >=20"; fi
  if [ "${npm_major:-0}" -lt 10 ]; then warn "npm $npm_major detected — engines requires >=10"; fi

  for bin in psql redis-cli; do
    if ! command -v "$bin" >/dev/null 2>&1; then
      fail "Missing: $bin. Install Postgres + Redis natively (see header comments)."
      exit 1
    fi
  done

  if ! command -v rabbitmqctl >/dev/null 2>&1; then
    warn "rabbitmqctl not on PATH — search service will start but RabbitMQ won't connect."
  fi
}

# ── Infra: Postgres ────────────────────────────────────────────
pg_running() { pg_isready -q -h localhost -p 5432 2>/dev/null; }

start_postgres() {
  if pg_running; then ok "Postgres already running on :5432"; return; fi

  info "Starting Postgres..."
  if command -v pg_ctlcluster >/dev/null 2>&1; then
    sudo pg_ctlcluster $(ls /etc/postgresql 2>/dev/null | head -1) main start 2>/dev/null \
      || pg_ctlcluster $(ls /etc/postgresql 2>/dev/null | head -1) main start
  elif command -v brew >/dev/null 2>&1 && brew services list 2>/dev/null | grep -q postgresql; then
    brew services start postgresql
  elif command -v postgres >/dev/null 2>&1; then
    pg_ctl -D "$HOME/Library/Application Support/Postgres" -l "$LOG_DIR/postgres.log" start \
      || (mkdir -p "$HOME/Library/Application Support/Postgres" && \
          initdb -D "$HOME/Library/Application Support/Postgres" -U $USER >/dev/null && \
          pg_ctl -D "$HOME/Library/Application Support/Postgres" -l "$LOG_DIR/postgres.log" start)
  else
    fail "Couldn't auto-start Postgres. Start it manually and re-run."
    exit 1
  fi

  for _ in $(seq 1 30); do pg_running && break; sleep 1; done
  pg_running || { fail "Postgres didn't come up"; exit 1; }
  ok "Postgres up on :5432"
}

ensure_db_and_schemas() {
  info "Ensuring 'ecommerce' database and per-service schemas exist"
  PGPASSWORD=postgres psql -h localhost -U postgres -d postgres -tc \
    "SELECT 1 FROM pg_database WHERE datname='ecommerce'" 2>/dev/null | grep -q 1 \
    || PGPASSWORD=postgres createdb -h localhost -U postgres ecommerce

  PGPASSWORD=postgres psql -h localhost -U postgres -d ecommerce \
    -f "$ROOT_DIR/infra/postgres/init-scripts/init-schemas.sql" >/dev/null
  ok "Schemas initialized"
}

# ── Infra: Redis ───────────────────────────────────────────────
redis_running() { redis-cli -h localhost -p 6379 ping 2>/dev/null | grep -q PONG; }

start_redis() {
  if redis_running; then ok "Redis already running on :6379"; return; fi

  info "Starting Redis..."
  if command -v systemctl >/dev/null 2>&1; then
    sudo systemctl start redis-server 2>/dev/null || redis-server --daemonize yes --port 6379
  elif command -v brew >/dev/null 2>&1; then
    brew services start redis
  elif command -v redis-server >/dev/null 2>&1; then
    redis-server --daemonize yes --port 6379
  else
    fail "Couldn't auto-start Redis. Start it manually and re-run."
    exit 1
  fi

  for _ in $(seq 1 15); do redis_running && break; sleep 1; done
  redis_running || { fail "Redis didn't come up"; exit 1; }
  ok "Redis up on :6379"
}

# ── Infra: RabbitMQ (optional) ─────────────────────────────────
start_rabbitmq() {
  if ! command -v rabbitmqctl >/dev/null 2>&1; then
    warn "Skipping RabbitMQ (rabbitmqctl not installed)"
    return
  fi
  if rabbitmqctl status >/dev/null 2>&1; then ok "RabbitMQ already running"; return; fi

  info "Starting RabbitMQ..."
  if command -v systemctl >/dev/null 2>&1; then
    sudo systemctl start rabbitmq-server
  elif command -v brew >/dev/null 2>&1; then
    brew services start rabbitmq
  fi
  rabbitmqctl await_startup --timeout 30 2>/dev/null && ok "RabbitMQ up" \
    || warn "RabbitMQ didn't come up — search service may log connection errors (non-fatal)"
}

# ── Service setup (deps + Prisma) ──────────────────────────────
setup_services() {
  info "Installing deps + generating Prisma clients + pushing schemas (one shot per service)"

  if [ ! -d "$ROOT_DIR/node_modules/concurrently" ]; then
    (cd "$ROOT_DIR" && npm install --no-audit --no-fund)
  fi

  local schema_for_svc=""
  schema_for_svc() {
    case "$1" in
      gateway) echo gateway ;;
      auth) echo auth ;;
      user) echo user_service ;;
      product) echo product_service ;;
      cart) echo cart_service ;;
      order) echo order_schema ;;
      payment) echo payment_service ;;
      notification) echo notification_service ;;
      search) echo search_service ;;
      admin) echo admin_service ;;
    esac
  }

  for svc in "${SERVICES[@]}"; do
    info "  setup $svc"
    local svc_dir="$ROOT_DIR/services/$svc"
    [ -f "$svc_dir/.env.example" ] && [ ! -f "$svc_dir/.env" ] && cp "$svc_dir/.env.example" "$svc_dir/.env"

    local schema; schema=$(schema_for_svc "$svc")
    DATABASE_URL="postgresql://postgres:postgres@localhost:5432/ecommerce?schema=${schema}" \
      bash -c "cd '$svc_dir' && \
        ([ -d node_modules ] || npm install --no-audit --no-fund) && \
        npx prisma generate && \
        DATABASE_URL='postgresql://postgres:postgres@localhost:5432/ecommerce?schema=${schema}' npx prisma db push --accept-data-loss"
  done
  ok "All services prepared"
}

# ── Start services + frontend ──────────────────────────────────
start_services() {
  info "Starting all services via root concurrently (logs -> logs/dev-*.log)"

  local svc_pids=()
  for svc in "${SERVICES[@]}"; do
    (
      cd "$ROOT_DIR"
      local schema=""
      case "$svc" in
        gateway) schema=gateway ;;
        auth) schema=auth ;;
        user) schema=user_service ;;
        product) schema=product_service ;;
        cart) schema=cart_service ;;
        order) schema=order_schema ;;
        payment) schema=payment_service ;;
        notification) schema=notification_service ;;
        search) schema=search_service ;;
        admin) schema=admin_service ;;
      esac
      DATABASE_URL="postgresql://postgres:postgres@localhost:5432/ecommerce?schema=${schema}" \
      REDIS_URL="redis://localhost:6379" \
      NODE_ENV=development \
        setsid npx ts-node-dev --respawn --transpile-only "services/$svc/src/index.ts" \
          >"$LOG_DIR/dev-$svc.log" 2>&1 &
      echo $! > "$PID_DIR/$svc.pid"
    )
  done

  # Frontend
  if [ ! -d "$ROOT_DIR/frontend/node_modules" ]; then
    info "Installing frontend deps"
    (cd "$ROOT_DIR/frontend" && npm install --no-audit --no-fund)
  fi
  (cd "$ROOT_DIR/frontend" && setsid npm run dev >"$LOG_DIR/dev-frontend.log" 2>&1 &
   echo $! > "$PID_DIR/frontend.pid")

  info "Waiting for gateway on :3000..."
  for _ in $(seq 1 60); do
    if curl -fs http://localhost:3000/health >/dev/null 2>&1; then break; fi
    sleep 1
  done
  curl -fs http://localhost:3000/health >/dev/null 2>&1 && ok "Gateway healthy on :3000" \
    || warn "Gateway didn't respond in 60s — check $LOG_DIR/dev-gateway.log"
}

# ── Stop / status ───────────────────────────────────────────────
stop_all() {
  info "Stopping services started by this script"
  shopt -s nullglob
  for f in "$PID_DIR"/*.pid; do
    [ -f "$f" ] || continue
    local pid; pid=$(cat "$f")
    if kill -0 "$pid" 2>/dev/null; then
      pkill -P "$pid" 2>/dev/null || true
      kill "$pid" 2>/dev/null || true
    fi
    rm -f "$f"
  done
  shopt -u nullglob
  pkill -f "ts-node-dev" 2>/dev/null || true
  pkill -f "vite" 2>/dev/null || true
  ok "Stopped"
}

status() {
  printf "${BLUE}Service PIDs:${NC}\n"
  shopt -s nullglob
  for f in "$PID_DIR"/*.pid; do
    [ -f "$f" ] || continue
    local name; name=$(basename "$f" .pid)
    local pid; pid=$(cat "$f")
    if kill -0 "$pid" 2>/dev/null; then
      printf "  ${GREEN}●${NC} %-12s pid=%s\n" "$name" "$pid"
    else
      printf "  ${RED}●${NC} %-12s (dead)\n" "$name"
    fi
  done
  shopt -u nullglob
  echo
  for p in 3000 3001 3002 3003 3004 3005 3006 3007 3008 3009 5173; do
    curl -fs -o /dev/null http://localhost:$p 2>/dev/null \
      && printf "  ${GREEN}●${NC} :%s responding\n" "$p" \
      || printf "  ${YELLOW}○${NC} :%s not responding\n" "$p"
  done
}

# ── Entrypoint ─────────────────────────────────────────────────
case "${1:-start}" in
  start)
    preflight
    start_postgres
    ensure_db_and_schemas
    start_redis
    start_rabbitmq
    setup_services
    start_services
    echo
    ok "Stack is up."
    echo "  Gateway:    http://localhost:3000  (health: GET /health)"
    echo "  Frontend:   http://localhost:5173"
    echo "  API smoke:  bash scripts/api-test.sh"
    echo "  Logs:       $LOG_DIR/dev-*.log"
    echo "  Stop:       bash scripts/dev.sh stop"
    echo
    ;;
  stop)   stop_all ;;
  status) status ;;
  *) echo "Usage: $0 {start|stop|status}"; exit 1 ;;
esac
