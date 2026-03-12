import { createApp } from './app';
import { config } from './config';
import { logger } from './utils/logger';
import { initRedis, closeRedis } from './shared/redis/redis.client';
import { closePrisma } from './shared/prisma/prisma.client';

const startServer = async (): Promise<void> => {
  try {
    logger.info('Starting API Gateway...');

    initRedis();

    const app = createApp();

    const server = app.listen(config.port, () => {
      logger.info(`
╔═══════════════════════════════════════════════════════════╗
║                   API GATEWAY STARTED                       ║
╠═══════════════════════════════════════════════════════════╣
║  Environment: ${config.nodeEnv.padEnd(47)}║
║  Port: ${config.port.toString().padEnd(51)}║
║  Rate Limit: ${config.rateLimit.maxRequests}/min${' '.repeat(36)}║
╚═══════════════════════════════════════════════════════════╝
      `);
    });

    const gracefulShutdown = async (signal: string): Promise<void> => {
      logger.info(`\n${signal} received. Starting graceful shutdown...`);
      
      server.close(async () => {
        logger.info('HTTP server closed');
        
        try {
          await closeRedis();
          await closePrisma();
          logger.info('All connections closed');
          process.exit(0);
        } catch (error) {
          logger.error('Error during shutdown:', error);
          process.exit(1);
        }
      });

      setTimeout(() => {
        logger.error('Forced shutdown after timeout');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    process.on('unhandledRejection', (reason) => {
      logger.error('Unhandled Rejection:', reason);
    });

    process.on('uncaughtException', (error) => {
      logger.error('Uncaught Exception:', error);
      process.exit(1);
    });

  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
