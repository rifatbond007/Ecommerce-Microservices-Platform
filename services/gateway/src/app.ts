import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { randomUUID } from 'crypto';
import routes from './routes';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './config/swagger';
import { errorMiddleware, notFoundMiddleware, rateLimitMiddleware } from './middleware';
import { logger } from './utils/logger';
import { config } from './config';

export const createApp = (): Application => {
  const app = express();

  app.set('trust proxy', 1);
  app.use(helmet());

  // CORS — single source of truth at the gateway.
  app.use(
    cors({
      origin: config.cors.origin,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key', 'X-Request-Id'],
      exposedHeaders: ['X-Request-Id', 'X-RateLimit-Limit', 'X-RateLimit-Remaining'],
      credentials: true,
    })
  );

  // Request-id — propagated to downstream services for tracing.
  app.use((req: Request, res: Response, next) => {
    const incoming = req.headers['x-request-id'];
    const id =
      typeof incoming === 'string' && incoming.length > 0 ? incoming : randomUUID();
    (req as Request & { id: string }).id = id;
    res.setHeader('X-Request-Id', id);
    next();
  });

  app.use(
    express.json({
      limit: '10mb',
      verify: (req: any, _res, buf) => {
        req.rawBody = buf.toString();
      },
    })
  );
  app.use(express.urlencoded({ extended: true }));

  // /health is exempt from rate-limit so container healthchecks stay cheap.
  app.get('/health', (_req: Request, res: Response) => {
    res.json({ status: 'ok', service: config.services ? 'gateway' : 'gateway', uptime: process.uptime() });
  });

  app.use(
    rateLimitMiddleware({
      windowMs: config.rateLimit.windowMs,
      maxRequests: config.rateLimit.maxRequests,
    })
  );

  // @ts-expect-error — swagger-ui-express types lag Express 4.22
  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

  app.use(routes);

  app.use(notFoundMiddleware);
  app.use(errorMiddleware);

  return app;
};
