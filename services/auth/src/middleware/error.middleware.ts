import { Request, Response, NextFunction } from 'express';
import { AppError, isPrismaError, handlePrismaError } from '../utils/errors';
import { logger } from '../utils/logger';

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
) => {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      error: {
        code: err.errorCode,
        message: err.message,
        ...((err as any).details && { details: (err as any).details }),
      },
    });
  }

  // CORS rejection — surface a structured 403 instead of the library's
  // opaque body. Mirrors the gateway's error unwrap so the client sees
  // the same envelope shape regardless of which layer rejected the origin.
  if (err instanceof Error && err.message.startsWith('Origin not allowed:')) {
    return res.status(403).json({
      success: false,
      error: {
        code: 'FORBIDDEN_ORIGIN',
        message: err.message,
      },
    });
  }

  if (isPrismaError(err)) {
    const appError = handlePrismaError(err);
    logger.error('Database error', {
      code: err.code,
      message: err.message,
      path: req.path,
      method: req.method,
    });
    return res.status(appError.statusCode).json({
      success: false,
      error: {
        code: appError.errorCode,
        message: appError.message,
      },
    });
  }

  logger.error('Unexpected error', {
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
  });

  const isDev = process.env.NODE_ENV === 'development' || !process.env.NODE_ENV;
  return res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: isDev ? err.message : 'An unexpected error occurred',
    },
  });
};

export const notFoundHandler = (req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: `Route ${req.method} ${req.path} not found`,
    },
  });
};
