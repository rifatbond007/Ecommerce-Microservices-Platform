import { verifyInterServiceSignature } from '../src/lib/inter-service';

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

import axios from 'axios';
import { authenticate } from '../src/middleware/auth.middleware';

const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('auth middleware outbound /me signing (payment)', () => {
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
