import express, { Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import routes from './routes';
import { errorHandler, notFoundHandler } from './middleware';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './config/swagger';
import prisma from './repositories/prisma.client';
import { createHealthChecks } from './utils/health';

export const createApp = (): Express => {
  const app = express();

  app.set('trust proxy', 1);
  app.use(helmet());
  app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  }));
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // /live = process-up only (LB restart decisions).
  // /ready = deep check; pings Postgres, returns 503 on failure (LB routing).
  // /health = alias of /ready, kept for existing probes.
  const { liveness, readiness, health } = createHealthChecks({
    serviceName: 'admin',
    deps: { prisma },
  });
  app.get('/live', liveness);
  app.get('/ready', readiness);
  app.get('/health', health);

  // @ts-expect-error — swagger-ui-express types lag Express 4.22
  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

  app.use('/api/v1/admin', routes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
};
