import { interService } from '../lib/inter-service';

/**
 * Rejects every /api/v1 request that lacks a valid gateway or service
 * HMAC signature, so callers that reach this port directly cannot forge
 * x-user-* identity headers. Mounted in app.ts before route auth.
 */
// Provider webhooks arrive unsigned; they are verified by their own
// provider signature in modules/webhooks.
const ALLOWED_PREFIXES = ['/api/v1/webhooks'];

export const verifyInterService = interService.middleware({
  skip: (req) => ALLOWED_PREFIXES.some((p) => req.path.startsWith(p)),
});
