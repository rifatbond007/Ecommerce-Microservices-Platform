import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/errors';
import { logger } from '../utils/logger';

/**
 * Canonical error envelope (matches all other services).
 *    { success: false, error: { code, message, details? } }
 *
 * Special case: the `cors` middleware throws a plain Error with message
 * starting with "Origin not allowed:" when a request is rejected. We unwrap
 * that here so the client gets a 403 with a structured payload instead of
 * the library's opaque HTML-ish 403 body.
 */
export const errorMiddleware = (
  err: Error | AppError,
  req: Request,
  res: Response,
  _next: NextFunction
) => {
  let statusCode: number;
  let code: string;
  let message: string;
  let details: unknown;

  if (err instanceof AppError) {
    statusCode = err.statusCode;
    code = err.errorCode || 'INTERNAL_SERVER_ERROR';
    message = err.message || 'Internal Server Error';
    details = err.details;
  } else if (
    err instanceof Error &&
    err.message.startsWith('Origin not allowed:')
  ) {
    statusCode = 403;
    code = 'FORBIDDEN_ORIGIN';
    message = err.message;
  } else {
    statusCode = 500;
    code = 'INTERNAL_SERVER_ERROR';
    message = err.message || 'Internal Server Error';
  }

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
