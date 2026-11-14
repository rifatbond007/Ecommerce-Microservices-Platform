import crypto from 'crypto';
import { UnauthorizedError } from '@ecommerce/common';

/**
 * Inter-service HMAC signing.
 *
 * The gateway signs every proxied request and services call each other with
 * signed requests. Receivers verify before trusting x-user-* headers.
 *
 * Signature input is the LF-joined string of:
 *   1. HTTP method, uppercased                e.g. "POST"
 *   2. req.originalUrl (path + query)         e.g. "/api/v1/orders/abc?status=shipped"
 *   3. unix epoch seconds, as integer string  e.g. "1722800123"
 *   4. sha256 hex of the raw body bytes       (sha256("") for an empty body)
 *
 * Path contract: sender and receiver MUST both use the full originalUrl,
 * including the query string.
 */
export interface InterServiceConfig {
  secret: string;
  keyId: string;
  clockSkewSeconds: number;
}

export const SIGNATURE_HEADER = 'x-inter-service-signature';
export const TIMESTAMP_HEADER = 'x-inter-service-timestamp';
export const KEY_ID_HEADER = 'x-inter-service-key-id';

export interface SignedHeaders {
  'x-inter-service-signature': string;
  'x-inter-service-timestamp': string;
  'x-inter-service-key-id': string;
}

export interface SignRequestInput {
  method: string;
  path: string;
  body?: string | Buffer | null;
  timestamp?: number;
  keyId?: string;
}

export interface SignRequestOutput {
  signature: string;
  timestamp: string;
  keyId: string;
}

export interface VerifyInput {
  method: string;
  path: string;
  body: string | Buffer;
  signature: string | undefined;
  timestamp: string | undefined;
  keyId: string | undefined;
  now?: number;
}

export const sha256Hex = (input: string | Buffer): string =>
  crypto.createHash('sha256').update(input).digest('hex');

const toBytes = (body: string | Buffer | null | undefined): string | Buffer =>
  body == null ? '' : Buffer.isBuffer(body) ? body : Buffer.from(body, 'utf8');

const hmac = (secret: string, method: string, path: string, ts: string, body: string | Buffer) =>
  crypto
    .createHmac('sha256', secret)
    .update(`${method.toUpperCase()}\n${path}\n${ts}\n${sha256Hex(body)}`)
    .digest('hex');

export function signRequest(
  config: InterServiceConfig,
  { method, path, body, timestamp, keyId }: SignRequestInput
): SignRequestOutput {
  const ts = (timestamp ?? Math.floor(Date.now() / 1000)).toString();
  return {
    signature: hmac(config.secret, method, path, ts, toBytes(body)),
    timestamp: ts,
    keyId: keyId ?? config.keyId,
  };
}

export function buildSignedHeaders(
  config: InterServiceConfig,
  input: SignRequestInput
): SignedHeaders {
  const { signature, timestamp, keyId } = signRequest(config, input);
  return {
    [SIGNATURE_HEADER]: signature,
    [TIMESTAMP_HEADER]: timestamp,
    [KEY_ID_HEADER]: keyId,
  } as SignedHeaders;
}

/** Throws UnauthorizedError unless the signature is valid, fresh and for a known key. */
export function verifyInterServiceSignature(
  config: InterServiceConfig,
  { method, path, body, signature, timestamp, keyId, now }: VerifyInput
): void {
  if (!signature || !timestamp || !keyId) {
    throw new UnauthorizedError('Inter-service signature missing. This endpoint is gateway-only.');
  }

  const ts = Number.parseInt(timestamp, 10);
  if (!Number.isFinite(ts) || ts <= 0) {
    throw new UnauthorizedError('Inter-service timestamp is not a valid integer.');
  }

  const current = now ?? Math.floor(Date.now() / 1000);
  const skew = Math.max(1, config.clockSkewSeconds);
  if (Math.abs(current - ts) > skew) {
    throw new UnauthorizedError('Inter-service timestamp is outside the allowed clock skew.');
  }

  if (keyId !== config.keyId) {
    throw new UnauthorizedError('Inter-service key id is not recognized.');
  }

  const expected = hmac(config.secret, method, path, String(ts), toBytes(body));
  const sigBuf = Buffer.from(signature, 'hex');
  const expectedBuf = Buffer.from(expected, 'hex');
  if (sigBuf.length === 0 || sigBuf.length !== expectedBuf.length) {
    throw new UnauthorizedError('Inter-service signature is invalid.');
  }
  if (!crypto.timingSafeEqual(sigBuf, expectedBuf)) {
    throw new UnauthorizedError('Inter-service signature is invalid.');
  }
}
