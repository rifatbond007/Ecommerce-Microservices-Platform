import { Request, Response, NextFunction } from 'express';
import { verifyInterServiceSignature } from '../utils/verify';

/**
 * Middleware that gates every `/api/v1/admin/*` request on a valid
 * inter-service HMAC, so an attacker who reaches admin-service's port
 * directly cannot forge `x-user-id` / `x-user-email` headers.
 *
 * Loop-break: the admin service's users/orders/products services call
 * the gateway with `x-internal-admin-call: true` (PR #9). The
 * `internalAdminCallGuard` short-circuits those before they reach this
 * middleware, so it never sees them. We also skip here as a defence in
 * depth in case the loop-break guard is bypassed.
 *
 * Mount order in `app.ts`:
 *   1. internalAdminCallGuard  (loop-break, runs first)
 *   2. verifyInterService      (this file)
 *   3. routes
 *
 * Requires `express.json({ verify: (req, _res, buf) => { req.rawBody = buf.toString() } })`
 * upstream so the raw body is preserved for signature recomputation.
 */
export const verifyInterService = (
  req: Request,
  _res: Response,
  next: NextFunction
): void => {
  try {
    // Defence-in-depth: if a request somehow carries the internal-admin-call
    // loop-break header but reached us anyway (e.g. guard was disabled),
    // don't double-gate it. internalAdminCallGuard should have handled it.
    if (req.header('x-internal-admin-call') === 'true') {
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
