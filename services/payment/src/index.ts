import { createApp } from './app';
import { config } from './config';
import { logger } from './utils/logger';
import { prisma } from './repositories';
import { initRabbitMQ, closeRabbitMQ, consumeEvents } from './utils/rabbitmq';
import { paymentsService } from './modules/payments';

const startServer = async () => {
  try {
    await prisma.$connect();
    logger.info('Database connected successfully');

    await initRabbitMQ();

    await consumeEvents(async (routingKey, data) => {
      logger.info(`Processing event: ${routingKey}`, { data });

      if (routingKey === 'order.created') {
        const orderData = data as any;
        logger.info(`Auto-processing payment for order ${orderData.id}`);
        try {
          await paymentsService.processPayment(orderData.userId, {
            orderId: orderData.id,
            paymentMethod: 'auto',
          });
        } catch (error) {
          logger.error(`Failed to auto-process payment for order ${orderData.id}`, { error });
        }
      }
    });

    const app = createApp();

    const server = app.listen(config.port, () => {
      logger.info(`${config.serviceName} is running on port ${config.port}`);
      logger.info(`Environment: ${config.nodeEnv}`);
    });

    const gracefulShutdown = async (signal: string) => {
      logger.info(`Received ${signal}, shutting down gracefully`);

      server.close(async () => {
        logger.info('HTTP server closed');
        await closeRabbitMQ();
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
