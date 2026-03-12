import Redis from 'ioredis';
import { config } from '../../config';
import { logger } from '../../utils/logger';

let redis: Redis | null = null;
let redisAvailable = false;

export const initRedis = (): Redis | null => {
  if (redis) return redis;

  try {
    redis = new Redis({
      host: config.redis.host,
      port: config.redis.port,
      password: config.redis.password || undefined,
      retryStrategy: (times) => {
        if (times > 3) {
          redisAvailable = false;
          logger.warn('Redis unavailable, using in-memory fallback');
          return null;
        }
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
      maxRetriesPerRequest: 1,
      connectTimeout: 3000,
    });

    redis.on('connect', () => {
      redisAvailable = true;
      logger.info('Redis connected successfully');
    });

    redis.on('error', (err) => {
      redisAvailable = false;
      logger.warn('Redis connection error, using in-memory fallback:', err.message);
    });

    return redis;
  } catch (err) {
    logger.warn('Failed to initialize Redis, using in-memory fallback');
    return null;
  }
};

export const getRedis = (): Redis | null => {
  if (!redis) {
    return initRedis();
  }
  return redis;
};

export const isRedisAvailable = (): boolean => {
  return redisAvailable;
};

export const closeRedis = async (): Promise<void> => {
  if (redis) {
    await redis.quit();
    redis = null;
    redisAvailable = false;
    logger.info('Redis connection closed');
  }
};
