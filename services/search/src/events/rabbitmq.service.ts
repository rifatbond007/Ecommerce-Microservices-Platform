import amqplib, { Channel, ChannelModel } from 'amqplib';
import { config } from '../config';
import { logger } from '../utils/logger';
import { searchService } from '../modules/search';

class RabbitMQService {
  private connection: ChannelModel | null = null;
  private channel: Channel | null = null;
  private connected = false;

  isConnected(): boolean {
    return this.connected;
  }

  async connect(): Promise<void> {
    if (!config.rabbitmq.url) {
      logger.warn('RabbitMQ URL not configured; skipping connection');
      return;
    }
    try {
      this.connection = await amqplib.connect(config.rabbitmq.url);
      this.connection.on('close', () => {
        logger.warn('RabbitMQ connection closed');
        this.connected = false;
      });
      this.connection.on('error', (err) => {
        logger.error('RabbitMQ connection error', { error: err });
      });

      this.channel = await this.connection.createChannel();
      await this.channel.assertExchange(config.rabbitmq.exchange, 'topic', { durable: true });
      const q = await this.channel.assertQueue(config.rabbitmq.queue, { durable: true });
      await this.channel.bindQueue(q.queue, config.rabbitmq.exchange, config.rabbitmq.routingKey);
      this.connected = true;
      logger.info(
        `Connected to RabbitMQ — exchange=${config.rabbitmq.exchange} queue=${q.queue} routingKey=${config.rabbitmq.routingKey}`
      );
    } catch (error) {
      logger.error('Failed to connect to RabbitMQ', { error });
      throw error;
    }
  }

  async consumeProductEvents(): Promise<void> {
    if (!this.channel) {
      logger.warn('Cannot consume product events: channel not initialised');
      return;
    }
    const q = await this.channel.assertQueue(config.rabbitmq.queue, { durable: true });
    await this.channel.consume(q.queue, async (msg) => {
      if (!msg) return;
      const routingKey = msg.fields.routingKey;
      try {
        const content = JSON.parse(msg.content.toString());
        switch (routingKey) {
          case 'product.created':
          case 'product.updated':
          case 'product.inventory_changed':
            await searchService.reindexProduct(content);
            break;
          case 'product.deleted':
            await searchService.removeProduct(content.id || content.productId);
            break;
          default:
            logger.warn(`Unhandled routing key: ${routingKey}`);
        }
        this.channel!.ack(msg);
      } catch (error) {
        logger.error('Error processing product event', { error, routingKey });
        // DLQ-ready: send to dead-letter rather than infinite-requeue.
        this.channel!.nack(msg, false, false);
      }
    });
  }

  async close(): Promise<void> {
    try {
      await this.channel?.close();
      await this.connection?.close();
    } catch {
      // Ignore close errors
    }
    this.connected = false;
  }
}

export const rabbitmqService = new RabbitMQService();