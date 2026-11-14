import { interService } from '../lib/inter-service';

/**
 * Rejects every /api/v1 request that lacks a valid gateway or service
 * HMAC signature, so callers that reach this port directly cannot forge
 * x-user-* identity headers. Mounted in app.ts before route auth.
 */
// Public auth endpoints may be called without a signature.
// NOTE: this router is mounted at /api/v1/auth, so req.path is relative
// ("/login") and these absolute paths never match. Behaviour is preserved
// here on purpose; the fix belongs in its own change.
const ALLOWED_PATHS = new Set<string>([
  '/api/v1/auth/login',
  '/api/v1/auth/register',
  '/api/v1/auth/refresh',
  '/api/v1/auth/forgot-password',
  '/api/v1/auth/reset-password',
]);

export const verifyInterService = interService.middleware({
  skip: (req) => ALLOWED_PATHS.has(req.path),
});
