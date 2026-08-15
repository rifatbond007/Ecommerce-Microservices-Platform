import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { config } from './config';
import routes from './routes';
import {
  errorHandler,
  notFoundHandler,
  verifyInterService,
} from './middleware';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './config/swagger';
import { prisma } from './repositories/prisma.client';
import { createHealthChecks } from './utils/health';

export const createApp = (): Application => {
  const app: Application = express();

  app.set('trust proxy', 1);
  app.use(helmet());

  app.use(
    cors({
      origin: config.cors.origin,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-Id'],
    })
  );

  // Capture raw body bytes for inter-service HMAC verification.
  app.use(
    express.json({
      limit: '1mb',
      verify: (req: any, _res, buf) => {
        req.rawBody = buf.toString('utf8');
      },
    })
  );
  app.use(express.urlencoded({ extended: true }));

  const limiter = rateLimit({
    windowMs: config.rateLimit.windowMs,
    max: config.rateLimit.maxRequests,
    message: {
      success: false,
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many requests, please try again later.',
      },
    },
  });
  app.use('/api', limiter);

  // /live = process-up only (LB restart decisions).
  // /ready = deep check; pings Postgres, returns 503 on failure (LB routing).
  // /health = alias of /ready, kept for existing probes.
  const { liveness, readiness, health } = createHealthChecks({
    serviceName: config.serviceName,
    deps: { prisma },
  });
  app.get('/live', liveness);
  app.get('/ready', readiness);
  app.get('/health', health);

  // @ts-expect-error — swagger-ui-express types lag Express 4.22
  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

  // Gate every /api/v1/* request on a valid inter-service HMAC.
  app.use('/api/v1', verifyInterService, routes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
};
