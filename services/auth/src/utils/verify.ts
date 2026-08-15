import crypto from 'crypto';
import { config } from '../config';
import { sha256Hex } from './sign';
import { UnauthorizedError } from './errors';

/**
 * Inter-service signature verification. Every downstream service runs
 * this (via the `verifyInterService` middleware) BEFORE honouring
 * `x-user-id` / `x-user-email` / `x-user-role` headers, so an attacker
 * reaching this service port directly cannot forge identity.
 *
 * The algorithm MUST match `services/gateway/src/utils/sign.ts` exactly.
 *
 * On any failure, throws `UnauthorizedError` with code
 * `INTER_SERVICE_SIGNATURE_INVALID` so the global error middleware
 * emits the canonical envelope.
 */
export interface VerifyInput {
  method: string;
  path: string;
  body: string | Buffer;
  signature: string | undefined;
  timestamp: string | undefined;
  keyId: string | undefined;
  /** Injectable for tests. Defaults to `Math.floor(Date.now() / 1000)`. */
  now?: number;
}

export const verifyInterServiceSignature = ({
  method,
  path,
  body,
  signature,
  timestamp,
  keyId,
  now,
}: VerifyInput): void => {
  if (!signature || !timestamp || !keyId) {
    throw new UnauthorizedError(
      'Inter-service signature missing. This endpoint is gateway-only.'
    );
  }

  const ts = Number.parseInt(timestamp, 10);
  if (!Number.isFinite(ts) || ts <= 0) {
    throw new UnauthorizedError('Inter-service timestamp is not a valid integer.');
  }

  const current = now ?? Math.floor(Date.now() / 1000);
  const skew = Math.max(1, config.interService.clockSkewSeconds);
  if (Math.abs(current - ts) > skew) {
    throw new UnauthorizedError('Inter-service timestamp is outside the allowed clock skew.');
  }

  // Refuse to verify if the key id is not the one we have configured.
  // We don't yet support rotation via a "keyIds" map; refusing unknowns
  // means a misconfigured caller is rejected loudly instead of silently.
  if (keyId !== config.interService.keyId) {
    throw new UnauthorizedError('Inter-service key id is not recognized.');
  }

  const bodyBytes = Buffer.isBuffer(body) ? body : Buffer.from(body ?? '', 'utf8');
  const bodyDigest = sha256Hex(bodyBytes);
  const input = `${method.toUpperCase()}\n${path}\n${ts}\n${bodyDigest}`;
  const expected = crypto
    .createHmac('sha256', config.interService.secret)
    .update(input)
    .digest('hex');

  // Pre-check length to avoid timingSafeEqual throwing on mismatched sizes.
  const sigBuf = Buffer.from(signature, 'hex');
  const expectedBuf = Buffer.from(expected, 'hex');
  if (sigBuf.length !== expectedBuf.length || sigBuf.length === 0) {
    throw new UnauthorizedError('Inter-service signature is invalid.');
  }

  if (!crypto.timingSafeEqual(sigBuf, expectedBuf)) {
    throw new UnauthorizedError('Inter-service signature is invalid.');
  }
};
