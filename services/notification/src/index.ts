import { createApp } from './app';
import { config } from './config';
import { logger } from './utils/logger';
import { prisma } from './repositories';
import { initRabbitMQ, closeRabbitMQ, consumeEvents } from './utils/rabbitmq';
import { sendEmail, buildOrderConfirmationHtml, buildWelcomeEmailHtml, buildOrderStatusHtml } from './utils/email';
import { notificationsService } from './modules/notifications';
import { preferenceRepository } from './repositories';

const startServer = async () => {
  try {
    await prisma.$connect();
    logger.info('Database connected successfully');

    await initRabbitMQ();

    consumeEvents([
      { routingKey: 'order.created', queue: 'notification-order-created' },
      { routingKey: 'order.status_changed', queue: 'notification-order-status' },
      { routingKey: 'payment.completed', queue: 'notification-payment-completed' },
      { routingKey: 'payment.failed', queue: 'notification-payment-failed' },
      { routingKey: 'user.registered', queue: 'notification-user-registered' },
    ], async (routingKey, data: any) => {
      logger.info(`Processing event: ${routingKey}`);

      try {
        switch (routingKey) {
          case 'order.created': {
            const prefs = await preferenceRepository.findByUserId(data.userId);
            if (prefs && !prefs.emailEnabled) break;

            const html = buildOrderConfirmationHtml(data);
            await notificationsService.createNotification({
              userId: data.userId,
              type: 'order_confirmation',
              channel: 'email',
              title: `Order #${data.orderNumber} Confirmed`,
              content: `Your order ${data.orderNumber} has been placed successfully.`,
              data: { orderId: data.id, orderNumber: data.orderNumber },
            });

            if (data.userEmail) {
              await sendEmail({
                to: data.userEmail,
                subject: `Order #${data.orderNumber} Confirmed`,
                html,
              }).catch((err) => logger.error('Failed to send order confirmation email', { error: err }));
            }
            break;
          }

          case 'order.status_changed': {
            const prefs = await preferenceRepository.findByUserId(data.userId);
            if (prefs && !prefs.emailEnabled) break;

            await notificationsService.createNotification({
              userId: data.userId,
              type: 'order_status',
              channel: 'email',
              title: `Order #${data.orderNumber} Update`,
              content: `Your order ${data.orderNumber} status changed to ${data.status}.`,
              data: { orderId: data.id, orderNumber: data.orderNumber, status: data.status },
            });

            if (data.userEmail) {
              const html = buildOrderStatusHtml(data);
              await sendEmail({
                to: data.userEmail,
                subject: `Order #${data.orderNumber} - ${data.status}`,
                html,
              }).catch((err) => logger.error('Failed to send status update email', { error: err }));
            }
            break;
          }

          case 'payment.completed': {
            const prefs = await preferenceRepository.findByUserId(data.userId);
            if (prefs && !prefs.emailEnabled) break;

            await notificationsService.createNotification({
              userId: data.userId,
              type: 'payment_receipt',
              channel: 'email',
              title: 'Payment Receipt',
              content: `Payment of ${data.currency} ${data.amount} completed. Transaction: ${data.transactionId}`,
              data: { paymentId: data.paymentId, transactionId: data.transactionId },
            });
            break;
          }

          case 'payment.failed': {
            await notificationsService.createNotification({
              userId: data.userId,
              type: 'payment_failed',
              channel: 'in_app',
              title: 'Payment Failed',
              content: data.failureMessage || 'Your payment could not be processed.',
              data: { paymentId: data.paymentId },
            });
            break;
          }

          case 'user.registered': {
            const prefs = await preferenceRepository.findByUserId(data.userId);
            if (prefs && !prefs.emailEnabled) break;

            const html = buildWelcomeEmailHtml(data.username || 'User');
            await notificationsService.createNotification({
              userId: data.userId,
              type: 'welcome',
              channel: 'email',
              title: 'Welcome to E-Commerce!',
              content: 'Thank you for creating an account.',
              data: { userId: data.userId },
            });

            if (data.email) {
              await sendEmail({
                to: data.email,
                subject: 'Welcome to E-Commerce!',
                html,
              }).catch((err) => logger.error('Failed to send welcome email', { error: err }));
            }
            break;
          }

          default:
            logger.debug(`Unhandled event type: ${routingKey}`);
        }
      } catch (error) {
        logger.error(`Failed to process event ${routingKey}`, { error, data });
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
