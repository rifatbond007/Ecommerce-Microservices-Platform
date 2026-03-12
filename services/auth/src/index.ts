import { createApp } from './app';
import { config } from './config';
import { logger } from './utils/logger';
import { prisma } from './repositories';

const startServer = async () => {
  try {
    await prisma.$connect();
    logger.info('Database connected successfully');

    const app = createApp();

    const server = app.listen(config.port, () => {
      logger.info(`${config.serviceName} is running on port ${config.port}`);
      logger.info(`Environment: ${config.nodeEnv}`);
    });

    const gracefulShutdown = async (signal: string) => {
      logger.info(`Received ${signal}, shutting down gracefully`);

      server.close(async () => {
        logger.info('HTTP server closed');
        await prisma.$disconnect();
        logger.info('Database connection closed');
        process.exit(0);
      });

      setTimeout(() => {
        logger.error('Forced shutdown after timeout');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
  } catch (error) {
    logger.error('Failed to start server', { error });
    process.exit(1);
  }
};

startServer();
