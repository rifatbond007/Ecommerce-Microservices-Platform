import { createApp } from './app';
import { config } from './config';
import { logger } from './utils/logger';
import { prisma } from './repositories/prisma.client';

const startServer = async () => {
  try {
    await prisma.$connect();
    const app = createApp();
    const server = app.listen(config.port, () => {
      logger.info(`${config.serviceName} is running on port ${config.port}`, {
        environment: config.nodeEnv,
      });
    });

    const shutdown = (signal: string) => {
      logger.info(`Received ${signal}, shutting down gracefully`);
      server.close(async () => {
        try {
          await prisma.$disconnect();
        } catch (e) {
          logger.error('Prisma disconnect error', { error: e });
        }
        logger.info('HTTP server closed');
        process.exit(0);
      });
      setTimeout(() => {
        logger.error('Forced shutdown after timeout');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
  } catch (error) {
    logger.error('Failed to start server', { error });
    process.exit(1);
  }
};

startServer();
