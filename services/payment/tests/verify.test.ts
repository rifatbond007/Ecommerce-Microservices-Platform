import { verifyInterServiceSignature } from '../src/utils/verify';
import { signRequest } from '../src/utils/sign';

jest.mock('../src/config', () => ({
  config: {
    interService: {
      secret: 'test-secret-do-not-use-in-prod',
      keyId: 'v1',
      clockSkewSeconds: 60,
    },
  },
}));

const NOW = 1_722_800_123;

describe('inter-service verify helper (payment)', () => {
  it('accepts a valid signature for a GET with empty body', () => {
    const { signature, timestamp, keyId } = signRequest({
      method: 'GET',
      path: '/api/v1/payments/abc',
      body: '',
      timestamp: NOW,
      keyId: 'v1',
    });
    expect(() =>
      verifyInterServiceSignature({
        method: 'GET',
        path: '/api/v1/payments/abc',
        body: '',
        signature,
        timestamp,
        keyId,
        now: NOW,
      })
    ).not.toThrow();
  });

  it('accepts a valid signature for a POST with a JSON body', () => {
    const body = '{"orderId":"o1","paymentMethod":"card"}';
    const { signature, timestamp, keyId } = signRequest({
      method: 'POST',
      path: '/api/v1/payments',
      body,
      timestamp: NOW,
      keyId: 'v1',
    });
    expect(() =>
      verifyInterServiceSignature({
        method: 'POST',
        path: '/api/v1/payments',
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
        path: '/api/v1/payments/abc',
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
        path: '/api/v1/payments/abc',
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
        path: '/api/v1/payments/abc',
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
        path: '/api/v1/payments/abc',
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
        path: '/api/v1/payments/abc',
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
        path: '/api/v1/payments/abc',
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
      path: '/api/v1/payments',
      body: '{"orderId":"o1"}',
      timestamp: NOW,
      keyId: 'v1',
    });
    expect(() =>
      verifyInterServiceSignature({
        method: 'POST',
        path: '/api/v1/payments',
        body: '{"orderId":"o2"}',
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
      path: '/api/v1/payments/abc',
      body: '',
      timestamp: NOW,
      keyId: 'v1',
    });
    expect(() =>
      verifyInterServiceSignature({
        method: 'GET',
        path: '/api/v1/payments/xyz',
        body: '',
        signature,
        timestamp,
        keyId,
        now: NOW,
      })
    ).toThrow(/invalid/i);
  });
});
