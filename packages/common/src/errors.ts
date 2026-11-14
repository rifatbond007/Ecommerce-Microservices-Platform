/**
 * Canonical error classes for every service.
 *
 * Error middleware turns these into the shared envelope:
 *   { success: false, error: { code, message, details? } }
 */
export class AppError extends Error {
  public readonly details?: Record<string, unknown>;

  constructor(
    public readonly statusCode: number,
    public readonly errorCode: string,
    message: string,
    public readonly isOperational: boolean = true,
    details?: Record<string, unknown>
  ) {
    super(message);
    if (details) this.details = details;
    Object.setPrototypeOf(this, new.target.prototype);
    Error.captureStackTrace(this, this.constructor);
  }
}

export class BadRequestError extends AppError {
  constructor(message: string = 'Bad request') {
    super(400, 'BAD_REQUEST', message);
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(400, 'VALIDATION_ERROR', message, true, details);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = 'Unauthorized') {
    super(401, 'UNAUTHORIZED', message);
  }
}

export class TokenExpiredError extends AppError {
  constructor() {
    super(401, 'TOKEN_EXPIRED', 'Token has expired');
  }
}

export class InvalidTokenError extends AppError {
  constructor() {
    super(401, 'INVALID_TOKEN', 'Invalid token');
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = 'Forbidden') {
    super(403, 'FORBIDDEN', message);
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string = 'Resource') {
    super(404, 'NOT_FOUND', `${resource} not found`);
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(409, 'CONFLICT', message);
  }
}

export class RateLimitError extends AppError {
  constructor(message: string = 'Too many requests') {
    super(429, 'RATE_LIMIT_EXCEEDED', message);
  }
}

export class InternalServerError extends AppError {
  constructor(message: string = 'Internal server error') {
    super(500, 'INTERNAL_ERROR', message, false);
  }
}

export class ServiceUnavailableError extends AppError {
  constructor(message: string = 'Service unavailable') {
    super(503, 'SERVICE_UNAVAILABLE', message);
  }
}

export interface PrismaLikeError {
  code: string;
  message: string;
  meta?: Record<string, unknown>;
}

/** Duck-typed so this package never depends on a generated Prisma client. */
export function isPrismaError(err: unknown): err is PrismaLikeError {
  return (
    typeof err === 'object' &&
    err !== null &&
    'code' in err &&
    typeof (err as { code: unknown }).code === 'string' &&
    (err as { code: string }).code.startsWith('P')
  );
}

export function handlePrismaError(err: PrismaLikeError): AppError {
  switch (err.code) {
    case 'P2002': {
      const target = (err.meta?.target as string[] | undefined)?.join(', ') || 'field';
      return new ConflictError(`A record with that ${target} already exists`);
    }
    case 'P2025':
      return new NotFoundError('Record');
    case 'P2003':
      return new AppError(400, 'FOREIGN_KEY_ERROR', 'Related record not found');
    case 'P1000':
    case 'P1001':
    case 'P1002':
      return new AppError(503, 'DATABASE_UNAVAILABLE', 'Database is temporarily unavailable');
    default:
      return new AppError(500, 'DATABASE_ERROR', `Database error: ${err.message}`);
  }
}
