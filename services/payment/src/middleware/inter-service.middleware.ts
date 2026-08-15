import { Request, Response, NextFunction } from 'express';
import { verifyInterServiceSignature } from '../utils/verify';

/**
 * Middleware that gates every `/api/v1/payments/*` request on a valid
 * inter-service HMAC, so an attacker who reaches payment-service's
 * port directly cannot forge `x-user-id` / `x-user-email` headers.
 *
 * Allow-list: `/api/v1/webhooks/*` (Stripe — verified separately via
 * `stripe-signature` header, see services/payment/src/modules/webhooks/).
 *
 * Mount order in `app.ts`:
 *   - webhooksRoutes  mounted at /api/v1/webhooks BEFORE this middleware
 *     so Stripe can hit /stripe without an HMAC.
 *   - express.json mounted AFTER webhooks so the webhook raw-body
 *     middleware (rawBodyJson) can capture bytes before parsing.
 *   - this middleware then gates /api/v1/payments/*.
 *
 * Requires `express.json({ verify: (req, _res, buf) => { req.rawBody = buf.toString() } })`
 * upstream so the raw body is preserved for signature recomputation.
 */
const ALLOWED_PREFIXES = ['/api/v1/webhooks'];

export const verifyInterService = (
  req: Request,
  _res: Response,
  next: NextFunction
): void => {
  try {
    if (ALLOWED_PREFIXES.some((p) => req.path.startsWith(p))) {
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
