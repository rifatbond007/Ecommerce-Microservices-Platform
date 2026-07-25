import dotenv from 'dotenv';

dotenv.config();

// Fail-fast: refuse to boot in production without a real JWT_SECRET.
// Catches: unset, empty, the literal placeholder string still in some .env
// files, and any new placeholder prefix added by .env.example.
const JWT_PLACEHOLDERS = [
  '__SETME_',
  '__SET_ME_',
  'your-super-secret-jwt-key-change-in-production',
  'your-super-secret-refresh-token-key-change-in-production',
  'your-secret-key',
  'your-super-secret-jwt-key',
  'your-super-secret-refresh-token-key',
];
const isProd = process.env.NODE_ENV === 'production';
const jwtSecret = process.env.JWT_SECRET;
if (
  isProd &&
  (!jwtSecret ||
    JWT_PLACEHOLDERS.some((p) => jwtSecret === p || jwtSecret.startsWith(p)))
) {
  // eslint-disable-next-line no-console
  console.error(
    'FATAL: JWT_SECRET is missing or still a placeholder. ' +
      'Refusing to start in production. Set a real 32+ byte secret (e.g., `openssl rand -base64 48`).'
  );
  process.exit(1);
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
    secret: process.env.JWT_SECRET || '__SET_ME_JWT_SECRET_IN_PROD__',
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
};
