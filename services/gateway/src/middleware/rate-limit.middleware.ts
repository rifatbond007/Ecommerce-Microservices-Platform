import { Request, Response, NextFunction } from 'express';
import { getRedis, isRedisAvailable } from '../shared/redis/redis.client';
import { config } from '../config';
import { RateLimitError } from '../utils/errors';
import { logger } from '../utils/logger';

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const memoryStore = new Map<string, RateLimitEntry>();

const cleanExpiredEntries = () => {
  const now = Date.now();
  for (const [key, entry] of memoryStore.entries()) {
    if (entry.resetTime < now) {
      memoryStore.delete(key);
    }
  }
};

setInterval(cleanExpiredEntries, 60000);

export interface RateLimitOptions {
  windowMs?: number;
  maxRequests?: number;
  keyGenerator?: (req: Request) => string;
}

export const rateLimitMiddleware = (options: RateLimitOptions = {}) => {
  const {
    windowMs = config.rateLimit.windowMs,
    maxRequests = config.rateLimit.maxRequests,
    keyGenerator = (req: Request) => {
      const apiKey = req.headers['x-api-key'] as string;
      if (apiKey) return `api_key:${apiKey}`;
      return `ip:${req.ip}`;
    },
  } = options;

  const windowSeconds = Math.ceil(windowMs / 1000);

  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const key = `rate_limit:${keyGenerator(req)}:${req.path}`;
      const endpoint = req.path;
      const redis = getRedis();
      const useRedis = redis && isRedisAvailable();

      if (useRedis) {
        const current = await redis.get(key);

        if (current !== null) {
          const requestCount = parseInt(current, 10);
          
          if (requestCount >= maxRequests) {
            logger.warn(`Rate limit exceeded for key: ${key}, endpoint: ${endpoint}`);
            throw new RateLimitError(`Too many requests. Limit: ${maxRequests} per ${windowSeconds}s`);
          }

          await redis.incr(key);
        } else {
          await redis.setex(key, windowSeconds, 1);
        }

        const remaining = maxRequests - (parseInt((await redis.get(key)) || '0', 10));
        res.setHeader('X-RateLimit-Limit', maxRequests.toString());
        res.setHeader('X-RateLimit-Remaining', Math.max(0, remaining).toString());
        res.setHeader('X-RateLimit-Reset', (Date.now() + windowMs).toString());
      } else {
        const now = Date.now();
        const entry = memoryStore.get(key);

        if (entry && entry.resetTime > now) {
          if (entry.count >= maxRequests) {
            logger.warn(`Rate limit exceeded (memory) for key: ${key}, endpoint: ${endpoint}`);
            throw new RateLimitError(`Too many requests. Limit: ${maxRequests} per ${windowSeconds}s`);
          }
          entry.count++;
        } else {
          memoryStore.set(key, { count: 1, resetTime: now + windowMs });
        }

        const currentEntry = memoryStore.get(key);
        const remaining = maxRequests - (currentEntry?.count || 0);
        res.setHeader('X-RateLimit-Limit', maxRequests.toString());
        res.setHeader('X-RateLimit-Remaining', Math.max(0, remaining).toString());
        res.setHeader('X-RateLimit-Reset', (Date.now() + windowMs).toString());
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

export const createRateLimitKey = (identifier: string, endpoint: string): string => {
  return `rate_limit:${identifier}:${endpoint}`;
};

export const getRateLimitStatus = async (identifier: string, endpoint: string): Promise<{
  current: number;
  remaining: number;
  resetTime: number;
}> => {
  const redis = getRedis();
  const useRedis = redis && isRedisAvailable();
  const key = createRateLimitKey(identifier, endpoint);

  if (useRedis) {
    const ttl = await redis.ttl(key);
    const current = parseInt((await redis.get(key)) || '0', 10);
    const remaining = Math.max(0, config.rateLimit.maxRequests - current);
    const resetTime = Date.now() + (ttl > 0 ? ttl * 1000 : config.rateLimit.windowMs);

    return { current, remaining, resetTime };
  } else {
    const entry = memoryStore.get(key);
    const current = entry?.count || 0;
    const remaining = Math.max(0, config.rateLimit.maxRequests - current);
    const resetTime = entry?.resetTime || Date.now() + config.rateLimit.windowMs;

    return { current, remaining, resetTime };
  }
};
