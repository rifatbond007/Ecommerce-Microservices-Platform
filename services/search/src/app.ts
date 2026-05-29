import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { config } from './config';
import { errorHandler, notFoundHandler } from './middleware';
import routes from './routes';
import { rabbitmqService } from './events/rabbitmq.service';

const app = express();

app.use(helmet());
app.use(cors({ origin: config.cors.origin, credentials: true }));
app.use(morgan(config.nodeEnv === 'production' ? 'combined' : 'dev'));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok', service: 'search-service', timestamp: new Date().toISOString() });
});

app.use('/api/v1', routes);

app.use(notFoundHandler);
app.use(errorHandler);

async function start() {
  try {
    await rabbitmqService.connect();
    await rabbitmqService.consumeProductEvents();
    app.listen(config.port, () => {
      console.log(`Search service running on port ${config.port}`);
    });
  } catch (error) {
    console.error('Failed to start search service:', error);
    process.exit(1);
  }
}

start();

export default app;
