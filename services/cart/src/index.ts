import app from './app';
import { config } from './config';
import { logger } from './utils/logger';

const server = app.listen(config.port, () => {
  logger.info(`${config.serviceName} is running on port ${config.port}`, {
    environment: config.nodeEnv,
  });
});

const shutdown = () => {
  logger.info('Shutting down gracefully...');
  server.close(() => {
    logger.info('HTTP server closed');
    process.exit(0);
  });
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
