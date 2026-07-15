import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/errors';
import { logger } from '../utils/logger';

/**
 * Canonical error envelope (matches all other services).
 *    { success: false, error: { code, message, details? } }
 */
export const errorMiddleware = (
  err: Error | AppError,
  req: Request,
  res: Response,
  _next: NextFunction
) => {
  const statusCode = err instanceof AppError ? err.statusCode : 500;
  const code =
    (err instanceof AppError && err.errorCode) || 'INTERNAL_SERVER_ERROR';
  const message = err.message || 'Internal Server Error';
  const details =
    err instanceof AppError && err.details ? err.details : undefined;

  const errorBody: Record<string, unknown> = { code, message };
  if (details) errorBody.details = details;
  if (process.env.NODE_ENV !== 'production' && err.stack) {
    errorBody.stack = err.stack;
  }

  logger.error(`[${req.method}] ${req.path} - ${statusCode}: ${message}`, {
    stack: err.stack,
    body: req.body,
    params: req.params,
    query: req.query,
  });

  res.status(statusCode).json({ success: false, error: errorBody });
};

export const notFoundMiddleware = (
  req: Request,
  _res: Response,
  next: NextFunction
) => {
  next(new AppError(404, 'NOT_FOUND', `Route ${req.originalUrl} not found`));
};
