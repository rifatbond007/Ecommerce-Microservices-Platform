import { Request, Response, NextFunction } from 'express';
import { webhooksService } from './webhooks.service';
import { ValidationError } from '../../utils/errors';

/**
 * Captures the raw request body so Stripe signature verification can be done later.
 * Mount BEFORE express.json() for the webhook routes only.
 */
export function rawBodyJson(req: Request, _res: Response, next: NextFunction): void {
  const chunks: Buffer[] = [];
  req.on('data', (chunk: Buffer) => chunks.push(chunk));
  req.on('end', () => {
    const raw = Buffer.concat(chunks);
    (req as Request & { rawBody?: Buffer }).rawBody = raw;
    try {
      req.body = raw.length ? JSON.parse(raw.toString('utf8')) : {};
    } catch {
      next(new ValidationError('Invalid JSON body'));
      return;
    }
    next();
  });
  req.on('error', next);
}

/**
 * Verifies Stripe signature if a secret is configured. Mounted on the /stripe route only.
 */
export function verifyStripeSignature(req: Request, _res: Response, next: NextFunction): void {
  try {
    const raw = (req as Request & { rawBody?: Buffer }).rawBody;
    if (!raw) {
      next(new ValidationError('Missing raw body for signature verification'));
      return;
    }
    const signature = req.header('stripe-signature');
    webhooksService.verifyStripeSignature(raw, signature);
    next();
  } catch (err) {
    next(err);
  }
}
