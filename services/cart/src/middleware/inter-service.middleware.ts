import { Request, Response, NextFunction } from 'express';
import { verifyInterServiceSignature } from '../utils/verify';

/**
 * Middleware that gates every `/api/v1/carts/*` and
 * `/api/v1/saved-carts/*` request on a valid inter-service HMAC, so
 * an attacker who reaches cart-service's port directly cannot forge
 * `x-user-id` / `x-user-email` headers.
 *
 * No allow-list — every cart endpoint is gated. Mounted BEFORE the
 * per-route auth middleware so unsigned requests are rejected before
 * any controller code runs.
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
