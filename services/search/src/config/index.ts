import dotenv from 'dotenv';

// Force .env to override anything in process.env. Same fix as the gateway,
// auth, and the rest of the services — see PUKU.md "ts-node-dev env-collision
// gotcha".
dotenv.config({ override: true });


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
  port: parseInt(process.env.PORT || '3008', 10),
  serviceName: process.env.SERVICE_NAME || 'search-service',
  nodeEnv: process.env.NODE_ENV || 'development',

  database: {
    url: process.env.DATABASE_URL || '',
  },

  rabbitmq: {
    url: process.env.RABBITMQ_URL || 'amqp://localhost:5672',
    exchange: process.env.RABBITMQ_EXCHANGE || 'product.events',
    queue: process.env.RABBITMQ_QUEUE || 'search.product.index',
    routingKey: process.env.RABBITMQ_ROUTING_KEY || 'product.*',
  },

  cache: {
    suggestionsTtlSeconds: parseInt(process.env.CACHE_TTL_SUGGESTIONS || '120', 10),
  },

  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  },

  jwt: {
    secret: process.env.JWT_SECRET || '__SETME_JWT_SECRET_IN_PROD__',
  },

  authService: {
    url: process.env.AUTH_SERVICE_URL || 'http://localhost:3001',
  },

  productService: {
    url: process.env.PRODUCT_SERVICE_URL || 'http://localhost:3003',
  },

  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
  },

  logging: {
    level: process.env.LOG_LEVEL || 'info',
  },
};
