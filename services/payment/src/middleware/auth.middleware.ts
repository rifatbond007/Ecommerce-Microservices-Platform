import { Request, Response, NextFunction } from 'express';
import axios from 'axios';
import { config } from '../config';
import { UnauthorizedError } from '../utils/errors';
import { buildSignedHeaders } from '../utils/sign';

const ME_PATH = '/api/v1/auth/me';

export interface AuthUser {
  userId: string;
  email: string;
  role: string;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthUser;
}

export const authenticate = async (
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    const userIdHeader = req.headers['x-user-id'] as string;
    const userEmailHeader = req.headers['x-user-email'] as string;
    const userRoleHeader = req.headers['x-user-role'] as string;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);

      const response = await axios.get(`${config.authService.url}${ME_PATH}`, {
        headers: {
          ...buildSignedHeaders({ method: 'GET', path: ME_PATH, body: '' }),
          Authorization: `Bearer ${token}`,
        },
      });

      req.user = {
        userId: response.data.data.id,
        email: response.data.data.email,
        role: response.data.data.role || response.data.data.roles?.[0] || 'user',
      };
    } else if (userIdHeader) {
      req.user = {
        userId: userIdHeader,
        email: userEmailHeader || '',
        role: userRoleHeader || 'user',
      };
    } else {
      throw new UnauthorizedError('No token provided');
    }
    next();
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      next(new UnauthorizedError('Invalid or expired token'));
    } else {
      next(error);
    }
  }
};

export const optionalAuth = async (
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    const userIdHeader = req.headers['x-user-id'] as string;
    const userEmailHeader = req.headers['x-user-email'] as string;
    const userRoleHeader = req.headers['x-user-role'] as string;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);

      const response = await axios.get(`${config.authService.url}${ME_PATH}`, {
        headers: {
          ...buildSignedHeaders({ method: 'GET', path: ME_PATH, body: '' }),
          Authorization: `Bearer ${token}`,
        },
      });

      req.user = {
        userId: response.data.data.id,
        email: response.data.data.email,
        role: response.data.data.role || response.data.data.roles?.[0] || 'user',
      };
    } else if (userIdHeader) {
      req.user = {
        userId: userIdHeader,
        email: userEmailHeader || '',
        role: userRoleHeader || 'user',
      };
    }
  } catch {
    // Ignore errors for optional auth
  }
  next();
};

export const requireAdmin = (
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
) => {
  if (!req.user || req.user.role !== 'admin') {
    return next(new UnauthorizedError('Admin access required'));
  }
  next();
};
