import crypto from 'crypto';
import { config } from '../config';

/**
 * Inter-service HMAC signing. Used by services/user when it calls other
 * services directly (e.g. user → auth for token verification). The
 * incoming auth endpoint verifies the JWT signature, not the HMAC, but
 * keeping the helper here means future direct calls can sign without
 * pulling it from the gateway package.
 *
 * The algorithm MUST match `services/gateway/src/utils/sign.ts` and
 * `services/<downstream>/src/utils/verify.ts` EXACTLY.
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
  const bodyBytes =
    body == null ? '' : Buffer.isBuffer(body) ? body : Buffer.from(body, 'utf8');
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

export const buildSignedHeaders = (input: SignRequestInput): SignedHeaders => {
  const { signature, timestamp, keyId } = signRequest(input);
  return {
    'x-inter-service-signature': signature,
    'x-inter-service-timestamp': timestamp,
    'x-inter-service-key-id': keyId,
  };
};
