import crypto from 'crypto';
import { config } from '../config';

/**
 * Inter-service HMAC signing for the gateway.
 *
 * Every proxied request gets three headers so downstream services can verify
 * the request actually originated from the gateway (not an attacker forging
 * `x-user-id` on the internal network):
 *   - x-inter-service-signature: hex HMAC-SHA256
 *   - x-inter-service-timestamp: unix seconds
 *   - x-inter-service-key-id:    optional rotation id (defaults to "v1")
 *
 * The signature input is the LF-joined string of:
 *   1. HTTP method, uppercased                e.g. "POST"
 *   2. req.originalUrl (path + query)         e.g. "/api/v1/orders/abc?status=shipped"
 *   3. unix epoch seconds, as integer string  e.g. "1722800123"
 *   4. sha256 hex of the raw body bytes (use sha256("") for empty body)
 *
 * Path-string contract: both sides MUST use `req.originalUrl`. Using `req.path`
 * loses the query string and breaks signature verification.
 */
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

export const sha256Hex = (input: string | Buffer): string =>
  crypto.createHash('sha256').update(input).digest('hex');

export const signRequest = ({
  method,
  path,
  body,
  timestamp,
  keyId,
}: SignRequestInput): SignRequestOutput => {
  const ts = (timestamp ?? Math.floor(Date.now() / 1000)).toString();
  const bodyBytes = body == null ? '' : Buffer.isBuffer(body) ? body : Buffer.from(body, 'utf8');
  const bodyDigest = sha256Hex(bodyBytes);
  const input = `${method.toUpperCase()}\n${path}\n${ts}\n${bodyDigest}`;
  const signature = crypto
    .createHmac('sha256', config.interService.secret)
    .update(input)
    .digest('hex');
  return {
    signature,
    timestamp: ts,
    keyId: keyId ?? config.interService.keyId,
  };
};

/**
 * Convenience helper for callers (mostly direct service-to-service callers in
 * payment/order/admin/user). The gateway itself signs inside the proxyReq
 * listener and uses signRequest directly to avoid an axios dependency here.
 */
export const buildSignedHeaders = (input: SignRequestInput): SignedHeaders => {
  const { signature, timestamp, keyId } = signRequest(input);
  return {
    'x-inter-service-signature': signature,
    'x-inter-service-timestamp': timestamp,
    'x-inter-service-key-id': keyId,
  };
};