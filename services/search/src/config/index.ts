import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '3008', 10),
  serviceName: process.env.SERVICE_NAME || 'search-service',
  nodeEnv: process.env.NODE_ENV || 'development',

  database: {
    url: process.env.DATABASE_URL || '',
  },

  rabbitmq: {
    url: process.env.RABBITMQ_URL || 'amqp://localhost:5672',
  },

  cors: {
    origin: process.env.CORS_ORIGIN || '*',
  },

  jwt: {
    secret: process.env.JWT_SECRET || 'your-secret-key',
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
