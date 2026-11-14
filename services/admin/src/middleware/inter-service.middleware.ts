import { interService } from '../lib/inter-service';

/**
 * Rejects every /api/v1 request that lacks a valid gateway or service
 * HMAC signature, so callers that reach this port directly cannot forge
 * x-user-* identity headers. Mounted in app.ts before route auth.
 */
// Loop-break for admin's internal calls (see internal-call.ts).
// SECURITY NOTE: this header is client-controllable and the gateway does not
// strip it, so it bypasses verification. Behaviour is preserved here on
// purpose; removing it belongs in its own change.
export const verifyInterService = interService.middleware({
  skip: (req) => req.header('x-internal-admin-call') === 'true',
});
