import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/errors';
import { logger } from '../utils/logger';

export interface ErrorResponse {
  success: boolean;
  message: string;
  code?: string;
  statusCode: number;
  stack?: string;
}

export const errorMiddleware = (
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const statusCode = err instanceof AppError ? err.statusCode : 500;
  const message = err.message || 'Internal Server Error';
  const code = err instanceof AppError ? err.code : 'INTERNAL_ERROR';

  const errorResponse: ErrorResponse = {
    success: false,
    message,
    code,
    statusCode,
  };

  if (process.env.NODE_ENV !== 'production') {
    errorResponse.stack = err.stack;
  }

  logger.error(`[${req.method}] ${req.path} - ${statusCode}: ${message}`, {
    stack: err.stack,
    body: req.body,
    params: req.params,
    query: req.query,
  });

  res.status(statusCode).json(errorResponse);
};

export const notFoundMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const error = new AppError(`Route ${req.originalUrl} not found`, 404, 'NOT_FOUND');
  next(error);
};
