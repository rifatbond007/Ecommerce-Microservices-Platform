import { Response, NextFunction } from 'express';
import { usersService } from './users.service';
import { validateQuery, validate } from '../../utils/validate';
import { updateUserSchema, userQuerySchema } from './users.types';
import type { AuthRequest } from '../../middleware';

/**
 * Helper: extract the admin's Bearer token from the inbound request so
 * we can forward it to the gateway when the usersService makes an
 * internal admin call. The gateway already has x-user-id headers, but
 * forwarding the token lets the source service re-verify if it wants to
 * (defence-in-depth).
 */
function extractToken(req: AuthRequest): string | undefined {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) return undefined;
  return auth.substring(7);
}

export class UsersController {
  async getUsers(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const query = validateQuery(userQuerySchema, req.query);
      const result = await usersService.findAll(query, req.user!.id, req.ip, extractToken(req));

      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async getUserById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const result = await usersService.findById(id, req.user!.id, req.ip, extractToken(req));

      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async updateUser(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const input = validate(updateUserSchema, req.body);
      const result = await usersService.update(id, input, req.user!.id, req.ip, extractToken(req));

      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async deleteUser(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const result = await usersService.delete(id, req.user!.id, req.ip, extractToken(req));

      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async getUserAddresses(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const result = await usersService.getAddresses(id, req.user!.id, req.ip, extractToken(req));

      res.json(result);
    } catch (error) {
      next(error);
    }
  }
}

export const usersController = new UsersController();