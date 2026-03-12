import { Request, Response, NextFunction } from 'express';
import { getRedis } from '../shared/redis/redis.client';
import { config } from '../config';
import { RateLimitError } from '../utils/errors';
import { logger } from '../utils/logger';

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
      const redis = getRedis();
      const key = `rate_limit:${keyGenerator(req)}:${req.path}`;
      const endpoint = req.path;

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
  const key = createRateLimitKey(identifier, endpoint);
  const ttl = await redis.ttl(key);
  
  const current = parseInt((await redis.get(key)) || '0', 10);
  const remaining = Math.max(0, config.rateLimit.maxRequests - current);
  const resetTime = Date.now() + (ttl > 0 ? ttl * 1000 : config.rateLimit.windowMs);

  return { current, remaining, resetTime };
};
