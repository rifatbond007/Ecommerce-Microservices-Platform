import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import routes from './routes';
import { errorMiddleware, notFoundMiddleware, rateLimitMiddleware } from './middleware';
import { logger } from './utils/logger';
import { config } from './config';

export const createApp = (): Application => {
  const app = express();

  app.use(helmet());

  app.use(cors({
    origin: process.env.CORS_ORIGIN || '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key'],
  }));

  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));

  app.use(rateLimitMiddleware({
    windowMs: config.rateLimit.windowMs,
    maxRequests: config.rateLimit.maxRequests,
  }));

  app.use(routes);

  app.use(notFoundMiddleware);
  app.use(errorMiddleware);

  return app;
};
