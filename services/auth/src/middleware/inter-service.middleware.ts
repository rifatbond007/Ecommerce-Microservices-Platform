import { Request, Response, NextFunction } from 'express';
import { verifyInterServiceSignature } from '../utils/verify';

/**
 * Middleware that gates every `/api/v1/auth/*` request on a valid
 * inter-service HMAC, so an attacker who reaches auth-service's port
 * directly cannot forge `x-user-id` / `x-user-email` headers.
 *
 * Allow-list: public auth endpoints reachable when the gateway is
 * bypassed (dev / e2e / curl). Mounted BEFORE the per-route auth
 * middleware so unsigned requests are rejected before any controller
 * code runs.
 *
 * Requires `express.json({ verify: (req, _res, buf) => { req.rawBody = buf.toString() } })`
 * upstream so the raw body is preserved for signature recomputation.
 */
const ALLOWED_PATHS = new Set<string>([
  '/api/v1/auth/login',
  '/api/v1/auth/register',
  '/api/v1/auth/refresh',
  '/api/v1/auth/forgot-password',
  '/api/v1/auth/reset-password',
]);

export const verifyInterService = (
  req: Request,
  _res: Response,
  next: NextFunction
): void => {
  try {
    if (ALLOWED_PATHS.has(req.path)) {
      next();
      return;
    }

    const rawBody =
      (req as Request & { rawBody?: string | Buffer }).rawBody ?? '';

    verifyInterServiceSignature({
      method: req.method,
      path: req.originalUrl,
      body: rawBody,
      signature: req.header('x-inter-service-signature'),
      timestamp: req.header('x-inter-service-timestamp'),
      keyId: req.header('x-inter-service-key-id'),
    });

    next();
  } catch (error) {
    next(error);
  }
};
