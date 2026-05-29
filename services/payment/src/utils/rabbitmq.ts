import amqp, { Channel, ChannelModel } from 'amqplib';
import { config } from '../config';
import { logger } from './logger';

let connection: ChannelModel | null = null;
let channel: Channel | null = null;

const EXCHANGE_NAME = 'ecommerce.events';
const EXCHANGE_TYPE = 'topic';

export async function initRabbitMQ(): Promise<void> {
  try {
    connection = await amqp.connect(config.rabbitmq.url);
    channel = await connection.createChannel();

    await channel.assertExchange(EXCHANGE_NAME, EXCHANGE_TYPE, { durable: true });

    const queue = await channel.assertQueue('payment-service-queue', { durable: true });
    await channel.bindQueue(queue.queue, EXCHANGE_NAME, 'order.*');

    logger.info('RabbitMQ connected and queues bound');
  } catch (error) {
    logger.error('Failed to connect to RabbitMQ', { error });
  }
}

export async function publishEvent(routingKey: string, data: unknown): Promise<void> {
  if (!channel) {
    logger.warn(`RabbitMQ not connected, cannot publish ${routingKey}`);
    return;
  }

  try {
    const message = Buffer.from(JSON.stringify({
      data,
      timestamp: new Date().toISOString(),
    }));

    channel.publish(EXCHANGE_NAME, routingKey, message, {
      persistent: true,
      contentType: 'application/json',
    });

    logger.debug(`Published event: ${routingKey}`);
  } catch (error) {
    logger.error(`Failed to publish event ${routingKey}`, { error });
  }
}

export async function consumeEvents(handler: (routingKey: string, data: unknown) => Promise<void>): Promise<void> {
  if (!channel) {
    logger.warn('RabbitMQ not connected, cannot consume events');
    return;
  }

  try {
    const queue = await channel.assertQueue('payment-service-queue', { durable: true });
    await channel.bindQueue(queue.queue, EXCHANGE_NAME, 'order.created');

    await channel.consume(queue.queue, async (msg) => {
      if (!msg) return;

      try {
        const content = JSON.parse(msg.content.toString());
        const routingKey = msg.fields.routingKey;

        logger.debug(`Received event: ${routingKey}`);
        await handler(routingKey, content.data);
        channel!.ack(msg);
      } catch (error) {
        logger.error('Error processing message', { error });
        channel!.nack(msg, false, false);
      }
    });

    logger.info('Started consuming events');
  } catch (error) {
    logger.error('Failed to set up event consumer', { error });
  }
}

export async function closeRabbitMQ(): Promise<void> {
  try {
    if (channel) {
      await channel.close();
      channel = null;
    }
    if (connection) {
      await connection.close();
      connection = null;
    }
    logger.info('RabbitMQ connection closed');
  } catch (error) {
    logger.error('Error closing RabbitMQ connection', { error });
  }
}
