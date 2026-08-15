import crypto from 'crypto';
import { config } from '../config';
import { sha256Hex } from './sign';
import { UnauthorizedError } from './errors';

/**
 * Inter-service signature verification. Runs via the
 * `verifyInterService` middleware on every `/api/v1/admin/*` request
 * that doesn't carry the `x-internal-admin-call: true` loop-break
 * header (PR #9). See services/admin/src/middleware/inter-service.middleware.ts.
 *
 * Algorithm MUST match `services/gateway/src/utils/sign.ts`.
 */
export interface VerifyInput {
  method: string;
  path: string;
  body: string | Buffer;
  signature: string | undefined;
  timestamp: string | undefined;
  keyId: string | undefined;
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

  const sigBuf = Buffer.from(signature, 'hex');
  const expectedBuf = Buffer.from(expected, 'hex');
  if (sigBuf.length !== expectedBuf.length || sigBuf.length === 0) {
    throw new UnauthorizedError('Inter-service signature is invalid.');
  }

  if (!crypto.timingSafeEqual(sigBuf, expectedBuf)) {
    throw new UnauthorizedError('Inter-service signature is invalid.');
  }
};
