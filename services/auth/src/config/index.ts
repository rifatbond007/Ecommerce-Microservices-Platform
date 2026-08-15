import dotenv from 'dotenv';

// Force .env to override service settings that may be inherited from a stale
// ts-node-dev process, but preserve NODE_ENV because test runners and process
// managers use it to describe the current runtime environment.
const runtimeNodeEnv = process.env.NODE_ENV;
dotenv.config({ override: true });
if (runtimeNodeEnv) {
  process.env.NODE_ENV = runtimeNodeEnv;
}


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
// services/auth/src/utils/verify.ts for the verifier.
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
    '[auth] WARNING: INTER_SERVICE_SECRET is not set; using the dev placeholder. ' +
      'In production, every signed request will be rejected with INTER_SERVICE_SIGNATURE_INVALID.'
  );
}


// Same guard for the refresh-token secret (auth service only).
const jwtRefreshSecret = process.env.JWT_REFRESH_SECRET;
if (
  isProd &&
  (!jwtRefreshSecret ||
    JWT_PLACEHOLDERS.some(
      (p) => jwtRefreshSecret === p || jwtRefreshSecret.startsWith(p)
    ))
) {
  // eslint-disable-next-line no-console
  console.error(
    'FATAL: JWT_REFRESH_SECRET is missing or still a placeholder. ' +
      'Refusing to start in production.'
  );
  process.exit(1);
}



export const config = {
  port: parseInt(process.env.PORT || '3001', 10),
  serviceName: process.env.SERVICE_NAME || 'auth-service',
  nodeEnv: process.env.NODE_ENV || 'development',

  database: {
    url: process.env.DATABASE_URL || '',
  },

  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
  },

  jwt: {
    secret: process.env.JWT_SECRET || '__SETME_JWT_SECRET_IN_PROD__',
    refreshSecret: process.env.JWT_REFRESH_SECRET || '__SETME_JWT_REFRESH_SECRET_IN_PROD__',
    expiresIn: process.env.JWT_EXPIRES_IN || '15m',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
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

  logging: {
    level: process.env.LOG_LEVEL || 'info',
  },

  bcrypt: {
    saltRounds: 12,
  },

  security: {
    maxFailedLoginAttempts: 5,
    lockoutDurationMinutes: 30,
  },

  email: {
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT || '587', 10),
    secure: process.env.EMAIL_SECURE === 'true',
    user: process.env.EMAIL_USER || '',
    pass: process.env.EMAIL_PASS || '',
    from: process.env.EMAIL_FROM || '',
  },

  app: {
    url: process.env.APP_URL || 'http://localhost:3000',
    frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
  },

  admin: {
    email: process.env.ADMIN_EMAIL || '',
  },
};
