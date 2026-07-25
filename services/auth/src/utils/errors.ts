export class AppError extends Error {
  constructor(
    public statusCode: number,
    public errorCode: string,
    message: string,
    public isOperational: boolean = true
  ) {
    super(message);
    Object.setPrototypeOf(this, AppError.prototype);
    Error.captureStackTrace(this, this.constructor);
  }
}

export function isPrismaError(err: unknown): err is { code: string; message: string; meta?: Record<string, unknown> } {
  return (
    typeof err === 'object' &&
    err !== null &&
    'code' in err &&
    typeof (err as any).code === 'string' &&
    (err as any).code.startsWith('P')
  );
}

export function handlePrismaError(err: { code: string; message: string; meta?: Record<string, unknown> }): AppError {
  switch (err.code) {
    case 'P2002': {
      const target = (err.meta?.target as string[])?.join(', ') || 'field';
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

export class ValidationError extends AppError {
  constructor(message: string, public details?: Record<string, unknown>) {
    super(400, 'VALIDATION_ERROR', message);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = 'Unauthorized') {
    super(401, 'UNAUTHORIZED', message);
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = 'Forbidden') {
    super(403, 'FORBIDDEN', message);
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string) {
    super(404, 'NOT_FOUND', `${resource} not found`);
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(409, 'CONFLICT', message);
  }
}

export class InternalServerError extends AppError {
  constructor(message: string = 'Internal server error') {
    super(500, 'INTERNAL_ERROR', message, false);
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
