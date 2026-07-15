// Restore each service's src/app.ts to a clean canonical form, with swagger wired in.
// This undoes the duplicate-imports damage from scripts/add-swagger.sh.
const fs = require('fs');
const path = require('path');

const SERVICES = ['auth', 'user', 'product', 'cart', 'order', 'payment', 'notification', 'search', 'admin'];

function tmpl(imports, corsOrigin, healthMessage, routeMount, after = '') {
  return `import express, { Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
${imports}import routes from './routes';
import { errorHandler, notFoundHandler } from './middleware';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './config/swagger';

export const createApp = (): Express => {
  const app = express();

  app.set('trust proxy', 1);
  app.use(helmet());
  app.use(cors({
    origin: process.env.FRONTEND_URL || '${corsOrigin}',
    credentials: true,
  }));
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  app.get('/health', (_req, res) => {
    res.json({
      success: true,
      message: '${healthMessage}',
      timestamp: new Date().toISOString(),
    });
  });

  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

  ${routeMount}

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
};
${after}`;
}

const FILES = {
  auth:        { cors: 'http://localhost:3001', msg: 'Auth service is healthy',        mount: "app.use('/api/v1/auth', routes);" },
  user:        { cors: 'http://localhost:3001', msg: 'User service is healthy',        mount: "app.use('/api/v1', routes);" },
  product:     { cors: 'http://localhost:3000', msg: 'Product service is healthy',     mount: "app.use('/api/v1', routes);" },
  cart:        { cors: 'http://localhost:3000', msg: 'Cart service is healthy',        mount: "app.use('/api/v1', routes);" },
  order:       { cors: 'http://localhost:3001', msg: 'Order service is healthy',       mount: "app.use('/api/v1', routes);" },
  payment:     { cors: '*',                     msg: 'Payment service is healthy',     mount: "app.use('/api/v1', routes);" },
  notification:{ cors: '*',                     msg: 'Notification service is healthy',mount: "app.use('/api/v1', routes);" },
  // search was special: had morgan + a different shape, and we already simplified app.ts; restore with morgan.
  search:      null, // handled below
  admin:       { cors: 'http://localhost:3000', msg: 'Admin service is healthy',       mount: "app.use('/api/v1/admin', routes);" },
};

for (const svc of SERVICES) {
  const p = path.join(__dirname, '..', 'services', svc, 'src', 'app.ts');
  if (svc === 'search') {
    const body = `import express, { Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { config } from './config';
import { errorHandler, notFoundHandler } from './middleware';
import routes from './routes';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './config/swagger';

const createApp = (): Express => {
  const app = express();

  app.set('trust proxy', 1);
  app.use(helmet());
  app.use(cors({ origin: config.cors.origin, credentials: true }));
  app.use(morgan(config.nodeEnv === 'production' ? 'combined' : 'dev'));
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true }));

  app.get('/health', (_req, res) => {
    res.status(200).json({ status: 'ok', service: config.serviceName, timestamp: new Date().toISOString() });
  });

  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

  app.use('/api/v1', routes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
};

export default createApp();
`;
    fs.writeFileSync(p, body);
    console.log(`restored: ${svc}`);
    continue;
  }
  const f = FILES[svc];
  const body = tmpl('', f.cors, f.msg, f.mount);
  fs.writeFileSync(p, body);
  console.log(`restored: ${svc}`);
}
