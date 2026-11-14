import type { Request, Response, NextFunction, RequestHandler } from 'express';
import {
  InterServiceConfig,
  KEY_ID_HEADER,
  SIGNATURE_HEADER,
  TIMESTAMP_HEADER,
  verifyInterServiceSignature,
} from './signature';

export interface InterServiceMiddlewareOptions {
  /**
   * Return true to let a request through unsigned (e.g. provider webhooks).
   * Every exemption is a hole in the trust chain — keep the list minimal.
   */
  skip?: (req: Request) => boolean;
}

/**
 * Rejects any request that does not carry a valid gateway/service signature.
 *
 * Requires `express.json({ verify: (req, _res, buf) => { req.rawBody = buf.toString() } })`
 * upstream so the raw body is available for signature recomputation.
 */
export function createInterServiceMiddleware(
  config: InterServiceConfig,
  { skip }: InterServiceMiddlewareOptions = {}
): RequestHandler {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      if (skip?.(req)) {
        next();
        return;
      }
      verifyInterServiceSignature(config, {
        method: req.method,
        path: req.originalUrl,
        body: (req as Request & { rawBody?: string | Buffer }).rawBody ?? '',
        signature: req.header(SIGNATURE_HEADER),
        timestamp: req.header(TIMESTAMP_HEADER),
        keyId: req.header(KEY_ID_HEADER),
      });
      next();
    } catch (error) {
      next(error);
    }
  };
}
