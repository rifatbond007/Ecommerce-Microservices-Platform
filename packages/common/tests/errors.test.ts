import {
  AppError,
  ConflictError,
  NotFoundError,
  ValidationError,
  handlePrismaError,
  isPrismaError,
} from '../src';

describe('error classes', () => {
  it('keeps the subclass in instanceof checks', () => {
    const err = new NotFoundError('Order');
    expect(err).toBeInstanceOf(NotFoundError);
    expect(err).toBeInstanceOf(AppError);
    expect(err).toBeInstanceOf(Error);
  });

  it('sets status, code and message', () => {
    const err = new NotFoundError('Order');
    expect(err.statusCode).toBe(404);
    expect(err.errorCode).toBe('NOT_FOUND');
    expect(err.message).toBe('Order not found');
  });

  it('defaults the NotFound resource name', () => {
    expect(new NotFoundError().message).toBe('Resource not found');
  });

  it('carries validation details', () => {
    const err = new ValidationError('Validation failed', { errors: [{ field: 'email' }] });
    expect(err.statusCode).toBe(400);
    expect(err.details).toEqual({ errors: [{ field: 'email' }] });
  });
});

describe('prisma error mapping', () => {
  it('recognises prisma error codes', () => {
    expect(isPrismaError({ code: 'P2002', message: 'x' })).toBe(true);
    expect(isPrismaError({ code: 'ECONNREFUSED', message: 'x' })).toBe(false);
    expect(isPrismaError(null)).toBe(false);
  });

  it('maps a unique violation to a conflict', () => {
    const err = handlePrismaError({ code: 'P2002', message: 'x', meta: { target: ['email'] } });
    expect(err).toBeInstanceOf(ConflictError);
    expect(err.message).toBe('A record with that email already exists');
  });

  it('maps a missing record to not found', () => {
    expect(handlePrismaError({ code: 'P2025', message: 'x' })).toBeInstanceOf(NotFoundError);
  });

  it('maps connection errors to 503', () => {
    expect(handlePrismaError({ code: 'P1001', message: 'x' }).statusCode).toBe(503);
  });
});
