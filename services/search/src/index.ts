import { createApp } from './app';
import { config } from './config';
import { logger } from './utils/logger';
import { prisma } from './repositories/prisma.client';
import { rabbitmqService } from './events/rabbitmq.service';

const startServer = async () => {
  try {
    await prisma.$connect();

    // RabbitMQ is best-effort: search still works without it (queries return
    // cached/stale index; publishers retry on their own).
    try {
      await rabbitmqService.connect();
      if (rabbitmqService.isConnected()) {
        await rabbitmqService.consumeProductEvents();
      }
    } catch (mqErr) {
      logger.warn('Starting without RabbitMQ; index updates will be polled', {
        error: mqErr,
      });
    }

    const app = createApp();
    const server = app.listen(config.port, () => {
      logger.info(`${config.serviceName} is running on port ${config.port}`);
      logger.info(`Environment: ${config.nodeEnv}`);
    });

    const gracefulShutdown = async (signal: string) => {
      logger.info(`Received ${signal}, shutting down gracefully`);
      server.close(async () => {
        try {
          await rabbitmqService.close();
          await prisma.$disconnect();
        } catch (e) {
          logger.error('Error closing connections', { error: e });
        }
        logger.info('HTTP server closed');
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