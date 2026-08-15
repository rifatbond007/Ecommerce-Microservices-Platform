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

// INTER_SERVICE_SECRET — shared HMAC key used to verify that requests
// reaching this service originated from the gateway (not an attacker
// forging identity headers on the internal network). See
// services/admin/src/utils/verify.ts for the verifier.
const INTER_SERVICE_SECRET_PLACEHOLDER = '__SETME_INTER_SERVICE_SECRET_IN_PROD__';
const interServiceSecret =
  process.env.INTER_SERVICE_SECRET || INTER_SERVICE_SECRET_PLACEHOLDER;

if (isProd && interServiceSecret === INTER_SERVICE_SECRET_PLACEHOLDER) {
  // eslint-disable-next-line no-console
  console.error(
    'FATAL: INTER_SERVICE_SECRET is missing or still a placeholder. ' +
      'Refusing to start in production. The same secret must be set across all ' +
      '10 services + gateway.'
  );
  process.exit(1);
}

if (
  interServiceSecret === INTER_SERVICE_SECRET_PLACEHOLDER &&
  !isProd
) {
  // eslint-disable-next-line no-console
  console.warn(
    '[admin] WARNING: INTER_SERVICE_SECRET is not set; using the dev placeholder. ' +
      'In production, every signed request will be rejected with INTER_SERVICE_SIGNATURE_INVALID.'
  );
}



export const config = {
  port: parseInt(process.env.PORT || '3009', 10),
  serviceName: process.env.SERVICE_NAME || 'admin-service',
  nodeEnv: process.env.NODE_ENV || 'development',

  database: {
    url: process.env.DATABASE_URL || '',
  },

  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
  },

  jwt: {
    secret: process.env.JWT_SECRET || '__SETME_JWT_SECRET_IN_PROD__',
  },

  authService: {
    url: process.env.AUTH_SERVICE_URL || 'http://localhost:3001',
  },

  // The gateway URL is the canonical entry point for inter-service calls
  // because it's the single source of truth for JWT verification and
  // routing. See services/admin/src/modules/{users,orders,products}/*.service.ts
  // for the `x-internal-admin-call` header pattern that uses it.
  gateway: {
    url: process.env.GATEWAY_URL || 'http://localhost:3000',
  },

  userService: {
    url: process.env.USER_SERVICE_URL || 'http://localhost:3002',
  },

  productService: {
    url: process.env.PRODUCT_SERVICE_URL || 'http://localhost:3003',
  },

  orderService: {
    url: process.env.ORDER_SERVICE_URL || 'http://localhost:3005',
  },

  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
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
