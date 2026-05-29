import rateLimit from 'express-rate-limit';
import { config } from '../config';

export const rateLimitMiddleware = (windowMs?: number, maxRequests?: number) => {
  return rateLimit({
    windowMs: windowMs || config.rateLimit.windowMs,
    max: maxRequests || config.rateLimit.maxRequests,
    message: {
      success: false,
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many requests, please try again later',
      },
    },
    standardHeaders: true,
    legacyHeaders: false,
  });
};
