/**
 * Canonical AppError used by ALL services.
 *
 * Signature: AppError(statusCode, errorCode, message[, isOperational])
 *
 * Property names are stable: `statusCode`, `errorCode`, `message`. The error
 * middleware in every service reads these and emits the canonical envelope:
 *   { success: false, error: { code, message, details? } }
 *
 * Optional `details` (Record<string, unknown>) is forwarded as `error.details`.
 */
export class AppError extends Error {
  public details?: Record<string, unknown>;

  constructor(
    public statusCode: number,
    public errorCode: string,
    message: string,
    public isOperational: boolean = true,
    details?: Record<string, unknown>
  ) {
    super(message);
    Object.setPrototypeOf(this, AppError.prototype);
    if (details) this.details = details;
    Error.captureStackTrace(this, this.constructor);
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

export class BadRequestError extends AppError {
  constructor(message: string = 'Bad request') {
    super(400, 'BAD_REQUEST', message);
  }
}

export class RateLimitError extends AppError {
  constructor(message: string = 'Too many requests') {
    super(429, 'RATE_LIMIT_EXCEEDED', message);
  }
}

export class ServiceUnavailableError extends AppError {
  constructor(message: string = 'Service unavailable') {
    super(503, 'SERVICE_UNAVAILABLE', message);
  }
}

export class InternalServerError extends AppError {
  constructor(message: string = 'Internal server error') {
    super(500, 'INTERNAL_SERVER_ERROR', message, false);
  }
}
