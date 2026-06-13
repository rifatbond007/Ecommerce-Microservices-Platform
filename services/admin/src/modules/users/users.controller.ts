import { Response, NextFunction } from 'express';
import { usersService } from './users.service';
import { validateQuery, validate } from '../../utils/validate';
import { updateUserSchema, userQuerySchema } from './users.types';
import type { AuthRequest } from '../../middleware';

export class UsersController {
  async getUsers(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const query = validateQuery(userQuerySchema, req.query);
      const result = await usersService.findAll(query, req.user!.id, req.ip);
      
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async getUserById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const result = await usersService.findById(id, req.user!.id, req.ip);
      
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async updateUser(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const input = validate(updateUserSchema, req.body);
      const result = await usersService.update(id, input, req.user!.id, req.ip);
      
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async deleteUser(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const result = await usersService.delete(id, req.user!.id, req.ip);
      
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async getUserAddresses(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const result = await usersService.getAddresses(id, req.user!.id, req.ip);
      
      res.json(result);
    } catch (error) {
      next(error);
    }
  }
}

export const usersController = new UsersController();
