import { interService } from '../lib/inter-service';

/**
 * Rejects every /api/v1 request that lacks a valid gateway or service
 * HMAC signature, so callers that reach this port directly cannot forge
 * x-user-* identity headers. Mounted in app.ts before route auth.
 */
export const verifyInterService = interService.middleware();
