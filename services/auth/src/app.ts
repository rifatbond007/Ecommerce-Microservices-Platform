import express, { Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import routes from './routes';
import { errorHandler, notFoundHandler } from './middleware';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './config/swagger';
import { prisma } from './repositories/prisma.client';
import { createHealthChecks } from './utils/health';
import { config } from './config';

export const createApp = (): Express => {
  const app = express();

  app.set('trust proxy', 1);
  app.use(helmet());
  // CORS — allow the frontend origin (FRONTEND_URL) plus comma-separated
  // extras if set. The auth service should normally be reached via the
  // gateway, but when the gateway is bypassed (dev tooling, e2e tests), this
  // keeps the browser happy.
  app.use(cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true); // same-origin / server-to-server
      const allowed = config.app.frontendUrl
        .split(',')
        .map((o) => o.trim())
        .filter(Boolean);
      if (allowed.includes(origin) || allowed.includes('*')) {
        return callback(null, true);
      }
      return callback(new Error(`Origin not allowed: ${origin}`), false);
    },
    credentials: true,
  }));
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // /live = process-up only (LB restart decisions).
  // /ready = deep check; pings Postgres, returns 503 on failure (LB routing).
  // /health = alias of /ready, kept for existing probes.
  const { liveness, readiness, health } = createHealthChecks({
    serviceName: 'auth',
    deps: { prisma },
  });
  app.get('/live', liveness);
  app.get('/ready', readiness);
  app.get('/health', health);

  // @ts-expect-error — swagger-ui-express types lag Express 4.22
  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

  app.use('/api/v1/auth', routes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
};
