import { buildSignedHeaders, sha256Hex, signRequest, verifyInterServiceSignature } from '../src';

const config = { secret: 'test-secret-do-not-use-in-prod', keyId: 'v1', clockSkewSeconds: 60 };
const NOW = 1_722_800_123;

const signed = (method: string, path: string, body = '') =>
  signRequest(config, { method, path, body, timestamp: NOW, keyId: 'v1' });

const verify = (overrides: Partial<Parameters<typeof verifyInterServiceSignature>[1]> = {}) => {
  const base = signed('GET', '/api/v1/orders/abc');
  return () =>
    verifyInterServiceSignature(config, {
      method: 'GET',
      path: '/api/v1/orders/abc',
      body: '',
      ...base,
      now: NOW,
      ...overrides,
    });
};

describe('inter-service signature', () => {
  it('accepts a valid signature for a GET with an empty body', () => {
    expect(verify()).not.toThrow();
  });

  it('accepts a valid signature for a POST with a JSON body', () => {
    const body = '{"cartId":"c1","shippingAddressId":"a1"}';
    const s = signed('POST', '/api/v1/orders', body);
    expect(() =>
      verifyInterServiceSignature(config, {
        method: 'POST',
        path: '/api/v1/orders',
        body,
        ...s,
        now: NOW,
      })
    ).not.toThrow();
  });

  it('accepts a Buffer body identical to the signed string', () => {
    const body = '{"a":1}';
    const s = signed('PUT', '/api/v1/x', body);
    expect(() =>
      verifyInterServiceSignature(config, {
        method: 'PUT',
        path: '/api/v1/x',
        body: Buffer.from(body),
        ...s,
        now: NOW,
      })
    ).not.toThrow();
  });

  it('rejects a missing signature', () => {
    expect(verify({ signature: undefined })).toThrow('signature missing');
  });

  it('rejects a missing timestamp', () => {
    expect(verify({ timestamp: undefined })).toThrow('signature missing');
  });

  it('rejects a missing key id', () => {
    expect(verify({ keyId: undefined })).toThrow('signature missing');
  });

  it('rejects a non-integer timestamp', () => {
    expect(verify({ timestamp: 'abc' })).toThrow('not a valid integer');
  });

  it('accepts a timestamp exactly at the clock-skew boundary', () => {
    expect(verify({ now: NOW + 60 })).not.toThrow();
  });

  it('hashes bodies with canonical sha256', () => {
    expect(sha256Hex('abc')).toBe(
      'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad'
    );
  });

  it('rejects a timestamp outside the clock skew', () => {
    expect(verify({ now: NOW + 61 })).toThrow('clock skew');
  });

  it('rejects an unknown key id', () => {
    expect(verify({ keyId: 'v2' })).toThrow('key id');
  });

  it('rejects a forged signature', () => {
    expect(verify({ signature: 'a'.repeat(64) })).toThrow('signature is invalid');
  });

  it('rejects a signature of the wrong length without throwing a TypeError', () => {
    expect(verify({ signature: 'abcd' })).toThrow('signature is invalid');
  });

  it('rejects a tampered body', () => {
    expect(verify({ body: '{"evil":true}' })).toThrow('signature is invalid');
  });

  it('rejects a tampered path, including the query string', () => {
    expect(verify({ path: '/api/v1/orders/abc?admin=1' })).toThrow('signature is invalid');
  });

  it('rejects a different method', () => {
    expect(verify({ method: 'DELETE' })).toThrow('signature is invalid');
  });

  it('builds the three x-inter-service-* headers', () => {
    const headers = buildSignedHeaders(config, { method: 'GET', path: '/api/v1/auth/me', body: '' });
    expect(headers['x-inter-service-signature']).toMatch(/^[0-9a-f]{64}$/);
    expect(headers['x-inter-service-timestamp']).toMatch(/^\d+$/);
    expect(headers['x-inter-service-key-id']).toBe('v1');
  });
});
