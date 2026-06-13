import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import axios from 'axios';
import { config } from '../config';
import { UnauthorizedError, ForbiddenError } from '../utils/errors';

export interface AuthUser {
  id: string;
  email: string;
  role: string;
  sellerStatus?: string;
}

export interface AuthRequest extends Request {
  user?: AuthUser;
}

export const authenticate = async (req: AuthRequest, _res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    const userId = req.headers['x-user-id'];

    if (!userId && !authHeader) {
      throw new UnauthorizedError('No authentication credentials provided');
    }

    if (userId) {
      try {
        const response = await axios.get(`${config.authService.url}/api/v1/auth/users/${userId}`, {
          headers: { 'x-user-id': userId as string },
        });
        req.user = response.data.data;
      } catch {
        throw new UnauthorizedError('Invalid user ID');
      }
    } else if (authHeader) {
      const token = authHeader.split(' ')[1];
      if (!token) {
        throw new UnauthorizedError('No token provided');
      }

      try {
        const decoded = jwt.verify(token, config.jwt.secret) as AuthUser;
        req.user = decoded;
      } catch {
        throw new UnauthorizedError('Invalid token');
      }
    }

    next();
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
