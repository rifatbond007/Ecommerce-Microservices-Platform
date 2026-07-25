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
  port: parseInt(process.env.PORT || '3006', 10),
  serviceName: process.env.SERVICE_NAME || 'payment-service',
  nodeEnv: process.env.NODE_ENV || 'development',

  database: {
    url: process.env.DATABASE_URL || '',
  },

  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
  },

  rabbitmq: {
    url: process.env.RABBITMQ_URL || 'amqp://localhost:5672',
    exchange: process.env.RABBITMQ_EXCHANGE || 'ecommerce.events',
  },

  jwt: {
    secret: process.env.JWT_SECRET || '__SETME_JWT_SECRET_IN_PROD__',
  },

  authService: {
    url: process.env.AUTH_SERVICE_URL || 'http://localhost:3001',
  },

  orderService: {
    url: process.env.ORDER_SERVICE_URL || 'http://localhost:3005',
  },

  notificationService: {
    url: process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:3007',
  },

  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY || '',
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || '',
    publishableKey: process.env.STRIPE_PUBLISHABLE_KEY || '',
  },

  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
  },

  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  },

  logging: {
    level: process.env.LOG_LEVEL || 'info',
  },
};
