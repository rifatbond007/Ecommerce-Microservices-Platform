import type { Request } from 'express';
import { UnauthorizedError } from '@ecommerce/common';
import { buildSignedHeaders, createInterServiceMiddleware } from '../src';

const config = { secret: 'test-secret', keyId: 'v1', clockSkewSeconds: 60 };

const makeReq = (headers: Record<string, string>, extra: Partial<Request> = {}) =>
  ({
    method: 'POST',
    originalUrl: '/api/v1/orders?x=1',
    path: '/api/v1/orders',
    rawBody: '{"a":1}',
    header: (name: string) => headers[name.toLowerCase()],
    ...extra,
  }) as unknown as Request;

describe('createInterServiceMiddleware', () => {
  it('passes a correctly signed request', () => {
    const headers = buildSignedHeaders(config, {
      method: 'POST',
      path: '/api/v1/orders?x=1',
      body: '{"a":1}',
    });
    const next = jest.fn();
    createInterServiceMiddleware(config)(makeReq(headers), {} as never, next);
    expect(next).toHaveBeenCalledWith();
  });

  it('rejects an unsigned request with UnauthorizedError', () => {
    const next = jest.fn();
    createInterServiceMiddleware(config)(makeReq({}), {} as never, next);
    expect(next.mock.calls[0][0]).toBeInstanceOf(UnauthorizedError);
  });

  it('lets a skipped request through unsigned', () => {
    const next = jest.fn();
    const mw = createInterServiceMiddleware(config, {
      skip: (req) => req.path.startsWith('/api/v1/orders'),
    });
    mw(makeReq({}), {} as never, next);
    expect(next).toHaveBeenCalledWith();
  });
});
