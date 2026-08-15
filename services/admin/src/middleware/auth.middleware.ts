import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import axios from 'axios';
import { config } from '../config';
import { logger } from '../utils/logger';
import { UnauthorizedError, ForbiddenError } from '../utils/errors';
import { buildSignedHeaders } from '../utils/sign';

const ME_PATH = '/api/v1/auth/me';

export interface AuthUser {
  id: string;
  email: string;
  role: string;
  sellerStatus?: string;
}

export interface AuthRequest extends Request {
  user?: AuthUser;
}

/**
 * Auth middleware. Trust order (mirrors gateway contract):
 *   1. Gateway-forwarded identity headers (x-user-id/x-user-email/x-user-role):
 *      the gateway has already verified the JWT, so we trust these verbatim
 *      and round-trip to /api/v1/auth/me to enrich with sellerStatus.
 *   2. Authorization: Bearer <jwt>: verify locally with JWT_SECRET. Used
 *      for direct admin-service calls (e.g. internal scripts, e2e).
 *
 * This avoids the bug from the original middleware, which called
 * `/api/v1/auth/users/${userId}` — a route that never existed in the
 * auth service. Every gateway-routed admin request hit that branch and
 * 401'd.
 */
export const authenticate = async (req: AuthRequest, _res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    const userIdHeader = req.headers['x-user-id'] as string | undefined;
    const userEmailHeader = req.headers['x-user-email'] as string | undefined;
    const userRoleHeader = req.headers['x-user-role'] as string | undefined;

    if (!userIdHeader && !authHeader) {
      throw new UnauthorizedError('No authentication credentials provided');
    }

    // Path 1: gateway-forwarded identity. Trust the headers (the gateway
    // has verified the JWT) and enrich with sellerStatus via /auth/me so
    // role-gated admin routes still work without round-tripping the JWT.
    if (userIdHeader) {
      req.user = {
        id: userIdHeader,
        email: userEmailHeader || '',
        role: userRoleHeader || 'user',
        sellerStatus: 'NONE',
      };

      if (authHeader && authHeader.startsWith('Bearer ')) {
        try {
          const response = await axios.get(
            `${config.authService.url}${ME_PATH}`,
            {
              headers: {
                ...buildSignedHeaders({ method: 'GET', path: ME_PATH, body: '' }),
                Authorization: authHeader,
              },
              timeout: 3000,
            }
          );
          const data = response.data?.data;
          if (data) {
            req.user = {
              id: data.id || userIdHeader,
              email: data.email || userEmailHeader || '',
              role: data.role || userRoleHeader || 'user',
              sellerStatus: data.sellerStatus || 'NONE',
            };
          }
        } catch (error) {
          // Enrichment is best-effort — we already have a verified id
          // from the gateway. Log and continue.
          logger.warn('Failed to enrich user from /auth/me (continuing with header identity)', {
            userId: userIdHeader,
            error: error instanceof Error ? error.message : String(error),
          });
        }
      }
      return next();
    }

    // Path 2: direct call with Bearer token (no gateway headers). Verify
    // locally with our own JWT_SECRET.
    if (authHeader) {
      const token = authHeader.startsWith('Bearer ') ? authHeader.substring(7) : authHeader.split(' ')[1];
      if (!token) {
        throw new UnauthorizedError('No token provided');
      }

      try {
        const decoded = jwt.verify(token, config.jwt.secret) as AuthUser;
        req.user = decoded;
      } catch {
        throw new UnauthorizedError('Invalid token');
      }
      return next();
    }

    throw new UnauthorizedError('No authentication credentials provided');
  } catch (error) {
    next(error);
  }
};

export const requireAdmin = (req: AuthRequest, _res: Response, next: NextFunction) => {
  if (!req.user || req.user.role !== 'admin') {
    return next(new ForbiddenError('Admin access required'));
  }
  next();
};

export const requireSuperAdmin = (req: AuthRequest, _res: Response, next: NextFunction) => {
  if (!req.user || req.user.role !== 'super_admin') {
    return next(new ForbiddenError('Super admin access required'));
  }
  next();
};
