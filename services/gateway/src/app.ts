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
import { prisma } from './shared/prisma/prisma.client';
import { isRedisAvailable } from './shared/redis/redis.client';

export const createApp = (): Application => {
  const app = express();

  app.set('trust proxy', 1);
  app.use(helmet());

  // CORS — single source of truth at the gateway.
  // We wrap the default `cors` middleware so that a rejected origin returns
  // the canonical error envelope (and logs the offending origin) instead of
  // the library's opaque "Not allowed by CORS" 403. The wrapper still defers
  // to the real middleware for allowed origins.
  app.use(
    cors({
      origin: (origin, callback) => {
        // Same-origin / curl / server-to-server requests have no Origin header
        // — always allow them.
        if (!origin) return callback(null, true);

        const allowed = config.cors.origin;
        const allowedOrigins = Array.isArray(allowed)
          ? allowed
          : allowed.split(',').map((o) => o.trim()).filter(Boolean);

        if (allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
          return callback(null, true);
        }

        // Rejected — log it and surface a helpful message instead of the
        // generic "Not allowed by CORS" string.
        logger.warn(`CORS: rejected origin "${origin}". Allowed: ${allowedOrigins.join(', ')}`);
        return callback(new Error(`Origin not allowed: ${origin}`), false);
      },
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
  // Probes Postgres + Redis so k8s/lb probes reflect real readiness.
  app.get('/health', async (_req: Request, res: Response) => {
    const checks: Record<string, { ok: boolean; latencyMs?: number; error?: string }> = {};
    const startedAt = Date.now();

    try {
      await prisma.$queryRaw`SELECT 1`;
      checks.database = { ok: true, latencyMs: Date.now() - startedAt };
    } catch (err) {
      checks.database = {
        ok: false,
        latencyMs: Date.now() - startedAt,
        error: err instanceof Error ? err.message : String(err),
      };
    }

    checks.redis = { ok: isRedisAvailable() };

    const allOk = Object.values(checks).every((c) => c.ok);
    res.status(allOk ? 200 : 503).json({
      status: allOk ? 'ok' : 'degraded',
      service: 'gateway',
      uptime: process.uptime(),
      checks,
    });
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
