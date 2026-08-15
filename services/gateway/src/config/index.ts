import dotenv from 'dotenv';

// Force .env to override anything in process.env — under ts-node-dev we've seen
// PORT=3006 and RATE_LIMIT_MAX_REQUESTS=100 injected before config runs (no surface
// found yet, but the symptom is clear: dotenv parsed the right values, but
// process.env retained conflicting values). Override=true keeps .env authoritative.
dotenv.config({ override: true });

const JWT_PLACEHOLDER = 'your-super-secret-jwt-key-change-in-production';
const jwtSecret = process.env.JWT_SECRET || JWT_PLACEHOLDER;

if (process.env.NODE_ENV === 'production' && jwtSecret === JWT_PLACEHOLDER) {
  throw new Error(
    'JWT_SECRET is not set. Refusing to start in production with the default secret — ' +
      'any caller could forge tokens.'
  );
}

if (jwtSecret === JWT_PLACEHOLDER && process.env.NODE_ENV !== 'production') {
  // eslint-disable-next-line no-console
  console.warn(
    '[gateway] WARNING: JWT_SECRET is not set; using the dev placeholder. ' +
      'This is fine for local development but MUST be set in any deployed environment.'
  );
}

// INTER_SERVICE_SECRET — HMAC key shared with every downstream service so
// the gateway can sign requests and downstream services can verify that
// requests reaching their ports originated from the gateway (not an
// attacker forging x-user-id headers on the internal network). See
// services/gateway/src/utils/sign.ts and services/*/src/utils/verify.ts.
const INTER_SERVICE_SECRET_PLACEHOLDER =
  '__SETME_INTER_SERVICE_SECRET_IN_PROD__';
const interServiceSecret =
  process.env.INTER_SERVICE_SECRET || INTER_SERVICE_SECRET_PLACEHOLDER;

if (
  process.env.NODE_ENV === 'production' &&
  interServiceSecret === INTER_SERVICE_SECRET_PLACEHOLDER
) {
  // eslint-disable-next-line no-console
  console.error(
    'FATAL: INTER_SERVICE_SECRET is missing or still a placeholder. ' +
      'Refusing to start in production. Generate one with `openssl rand -base64 48` ' +
      'and share it across all services.'
  );
  process.exit(1);
}

if (
  interServiceSecret === INTER_SERVICE_SECRET_PLACEHOLDER &&
  process.env.NODE_ENV !== 'production'
) {
  // eslint-disable-next-line no-console
  console.warn(
    '[gateway] WARNING: INTER_SERVICE_SECRET is not set; using the dev placeholder. ' +
      'In production, downstream services will reject every proxied request with ' +
      'INTER_SERVICE_SIGNATURE_INVALID. Set the same secret in all 10 services.'
  );
}

export const config = {
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',

  database: {
    url:
      process.env.DATABASE_URL ||
      'postgresql://postgres:postgres@localhost:5433/ecommerce?schema=gateway',
  },

  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD || '',
    url: process.env.REDIS_URL || 'redis://localhost:6379',
  },

  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  },

  proxy: {
    timeoutMs: parseInt(process.env.PROXY_TIMEOUT_MS || '30000', 10),
    proxyTimeoutMs: parseInt(process.env.PROXY_PROXY_TIMEOUT_MS || '30000', 10),
  },

  jwt: {
    secret: jwtSecret,
    expiresIn: process.env.JWT_EXPIRES_IN || '15m',
  },

  services: {
    auth: process.env.AUTH_SERVICE_URL || 'http://localhost:3001',
    user: process.env.USER_SERVICE_URL || 'http://localhost:3002',
    product: process.env.PRODUCT_SERVICE_URL || 'http://localhost:3003',
    cart: process.env.CART_SERVICE_URL || 'http://localhost:3004',
    order: process.env.ORDER_SERVICE_URL || 'http://localhost:3005',
    payment: process.env.PAYMENT_SERVICE_URL || 'http://localhost:3006',
    notification: process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:3007',
    search: process.env.SEARCH_SERVICE_URL || 'http://localhost:3008',
    admin: process.env.ADMIN_SERVICE_URL || 'http://localhost:3009',
  },

  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10),
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
  },

  interService: {
    secret: interServiceSecret,
    keyId: process.env.INTER_SERVICE_KEY_ID || 'v1',
    clockSkewSeconds: parseInt(
      process.env.INTER_SERVICE_CLOCK_SKEW_SECONDS || '60',
      10
    ),
  },
};
