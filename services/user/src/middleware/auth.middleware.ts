import { Request, Response, NextFunction } from 'express';
import axios from 'axios';
import { config } from '../config';
import { UnauthorizedError } from '../utils/errors';

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
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError('No token provided');
    }

    const token = authHeader.substring(7);

    const response = await axios.get(`${config.authService.url}/api/v1/auth/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

      req.user = {
        userId: response.data.data.id,
        email: response.data.data.email,
        role: response.data.data.roles?.[0] || 'user',
      };
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
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);

      const response = await axios.get(`${config.authService.url}/api/v1/auth/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

    req.user = {
      userId: response.data.data.id,
      email: response.data.data.email,
      role: response.data.data.roles?.[0] || 'user',
    };
    }
  } catch {
    // Ignore errors for optional auth
  }
  next();
};

export const requireAdmin = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  if (!req.user || req.user.role !== 'admin') {
    return next(new UnauthorizedError('Admin access required'));
  }
  next();
};
