import express, { Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import routes from './routes';
import webhooksRoutes from './modules/webhooks/webhooks.route';
import { errorHandler, notFoundHandler } from './middleware';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './config/swagger';
import { config } from './config';

export const createApp = (): Express => {
  const app = express();

  app.set('trust proxy', 1);
  app.use(helmet());
  app.use(
    cors({
      origin: config.cors.origin,
      credentials: true,
    })
  );

  app.get('/health', (_req, res) => {
    res.json({
      success: true,
      message: 'Payment service is healthy',
      timestamp: new Date().toISOString(),
    });
  });

  // Webhooks must NOT be parsed by express.json() — Stripe signature
  // verification needs the raw body. Mounted at /api/v1/webhooks on the
  // gateway, and the inner rawBodyJson middleware captures the bytes.
  app.use('/api/v1/webhooks', webhooksRoutes);

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // @ts-expect-error — swagger-ui-express types lag Express 4.22
  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

  app.use('/api/v1', routes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
};