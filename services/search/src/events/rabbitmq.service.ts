import amqplib from 'amqplib';
import { config } from '../config';
import { logger } from '../utils/logger';
import { searchService } from '../modules/search';

class RabbitMQService {
  private connection: amqplib.ChannelModel | null = null;
  private channel: amqplib.Channel | null = null;

  async connect() {
    if (!config.rabbitmq.url) {
      logger.warn('RabbitMQ URL not configured; skipping connection');
      return;
    }
    try {
      this.connection = await amqplib.connect(config.rabbitmq.url);
      this.channel = await this.connection.createChannel();
      await this.channel.assertExchange('product.events', 'topic', { durable: true });
      const q = await this.channel.assertQueue('search.product.index', { durable: true });
      await this.channel.bindQueue(q.queue, 'product.events', 'product.*');
      logger.info('Connected to RabbitMQ');
    } catch (error) {
      logger.error('Failed to connect to RabbitMQ:', error);
      throw error;
    }
  }

  async consumeProductEvents() {
    if (!this.channel) return;
    const q = await this.channel.assertQueue('search.product.index', { durable: true });
    await this.channel.consume(q.queue, async (msg) => {
      if (!msg) return;
      try {
        const content = JSON.parse(msg.content.toString());
        const routingKey = msg.fields.routingKey;

        switch (routingKey) {
          case 'product.created':
          case 'product.updated':
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
        logger.error('Error processing product event:', error);
        this.channel!.nack(msg, false, false);
      }
    });
  }

  async close() {
    try {
      await this.channel?.close();
      await this.connection?.close();
    } catch {
      // Ignore close errors
    }
  }
}

export const rabbitmqService = new RabbitMQService();
