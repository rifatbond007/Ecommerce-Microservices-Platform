import { verifyInterServiceSignature } from '../src/utils/verify';
import { signRequest } from '../src/utils/sign';

jest.mock('axios', () => ({
  get: jest.fn(),
}));

jest.mock('../src/config', () => ({
  config: {
    authService: { url: 'http://auth:3001' },
    interService: {
      secret: 'test-secret-do-not-use-in-prod',
      keyId: 'v1',
      clockSkewSeconds: 60,
    },
  },
}));

const NOW = 1_722_800_123;

describe('inter-service verify helper (order)', () => {
  it('accepts a valid signature for a GET with empty body', () => {
    const { signature, timestamp, keyId } = signRequest({
      method: 'GET',
      path: '/api/v1/orders/abc',
      body: '',
      timestamp: NOW,
      keyId: 'v1',
    });
    expect(() =>
      verifyInterServiceSignature({
        method: 'GET',
        path: '/api/v1/orders/abc',
        body: '',
        signature,
        timestamp,
        keyId,
        now: NOW,
      })
    ).not.toThrow();
  });

  it('accepts a valid signature for a POST with a JSON body', () => {
    const body = '{"cartId":"c1","shippingAddressId":"a1"}';
    const { signature, timestamp, keyId } = signRequest({
      method: 'POST',
      path: '/api/v1/orders',
      body,
      timestamp: NOW,
      keyId: 'v1',
    });
    expect(() =>
      verifyInterServiceSignature({
        method: 'POST',
        path: '/api/v1/orders',
        body,
        signature,
        timestamp,
        keyId,
        now: NOW,
      })
    ).not.toThrow();
  });

  it('throws when signature header is missing', () => {
    expect(() =>
      verifyInterServiceSignature({
        method: 'GET',
        path: '/api/v1/orders/abc',
        body: '',
        signature: undefined,
        timestamp: NOW.toString(),
        keyId: 'v1',
        now: NOW,
      })
    ).toThrow(/missing/i);
  });

  it('throws when timestamp header is missing', () => {
    expect(() =>
      verifyInterServiceSignature({
        method: 'GET',
        path: '/api/v1/orders/abc',
        body: '',
        signature: 'a'.repeat(64),
        timestamp: undefined,
        keyId: 'v1',
        now: NOW,
      })
    ).toThrow(/missing/i);
  });

  it('throws when keyId header is missing', () => {
    expect(() =>
      verifyInterServiceSignature({
        method: 'GET',
        path: '/api/v1/orders/abc',
        body: '',
        signature: 'a'.repeat(64),
        timestamp: NOW.toString(),
        keyId: undefined,
        now: NOW,
      })
    ).toThrow(/missing/i);
  });

  it('throws when timestamp is outside the allowed clock skew', () => {
    expect(() =>
      verifyInterServiceSignature({
        method: 'GET',
        path: '/api/v1/orders/abc',
        body: '',
        signature: 'a'.repeat(64),
        timestamp: (NOW - 999).toString(),
        keyId: 'v1',
        now: NOW,
      })
    ).toThrow(/clock skew/i);
  });

  it('throws when keyId is not recognized', () => {
    expect(() =>
      verifyInterServiceSignature({
        method: 'GET',
        path: '/api/v1/orders/abc',
        body: '',
        signature: 'a'.repeat(64),
        timestamp: NOW.toString(),
        keyId: 'wrong',
        now: NOW,
      })
    ).toThrow(/key id/i);
  });

  it('throws when the signature is forged', () => {
    expect(() =>
      verifyInterServiceSignature({
        method: 'GET',
        path: '/api/v1/orders/abc',
        body: '',
        signature: 'd'.repeat(64),
        timestamp: NOW.toString(),
        keyId: 'v1',
        now: NOW,
      })
    ).toThrow(/invalid/i);
  });

  it('throws when the body has been tampered with', () => {
    const { signature, timestamp, keyId } = signRequest({
      method: 'POST',
      path: '/api/v1/orders',
      body: '{"cartId":"c1"}',
      timestamp: NOW,
      keyId: 'v1',
    });
    expect(() =>
      verifyInterServiceSignature({
        method: 'POST',
        path: '/api/v1/orders',
        body: '{"cartId":"c2"}',
        signature,
        timestamp,
        keyId,
        now: NOW,
      })
    ).toThrow(/invalid/i);
  });

  it('throws when the path has been tampered with', () => {
    const { signature, timestamp, keyId } = signRequest({
      method: 'GET',
      path: '/api/v1/orders/abc',
      body: '',
      timestamp: NOW,
      keyId: 'v1',
    });
    expect(() =>
      verifyInterServiceSignature({
        method: 'GET',
        path: '/api/v1/orders/xyz',
        body: '',
        signature,
        timestamp,
        keyId,
        now: NOW,
      })
    ).toThrow(/invalid/i);
  });
});

import axios from 'axios';
import { authenticate } from '../src/middleware/auth.middleware';

const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('auth middleware outbound /me signing (order)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedAxios.get.mockResolvedValue({
      data: { data: { id: 'u1', email: 'u@example.com', role: 'user' } },
    } as never);
  });

  it('sends x-inter-service-* headers on /me call', async () => {
    const req = {
      headers: { authorization: 'Bearer t' },
    } as never;
    const next = jest.fn();
    await authenticate(req, {} as never, next);

    expect(mockedAxios.get).toHaveBeenCalledTimes(1);
    const [, cfg] = mockedAxios.get.mock.calls[0];
    const h = (cfg as { headers: Record<string, string> }).headers;
    expect(h['x-inter-service-signature']).toMatch(/^[a-f0-9]{64}$/);
    expect(h['x-inter-service-timestamp']).toBeDefined();
    expect(h['x-inter-service-key-id']).toBe('v1');

    expect(() =>
      verifyInterServiceSignature({
        method: 'GET',
        path: '/api/v1/auth/me',
        body: '',
        signature: h['x-inter-service-signature'],
        timestamp: h['x-inter-service-timestamp'],
        keyId: h['x-inter-service-key-id'],
        now: Math.floor(Date.now() / 1000),
      })
    ).not.toThrow();
  });
});
