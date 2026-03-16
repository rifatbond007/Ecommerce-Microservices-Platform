import { Response, NextFunction } from 'express';
import { savedCartsService } from './saved-carts.service';
import type { AuthenticatedRequest } from '../carts/carts.types';

export class SavedCartsController {
  async getSavedCarts(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const carts = await savedCartsService.getSavedCarts(userId);
      res.status(200).json({ success: true, data: carts });
    } catch (error) {
      next(error);
    }
  }

  async getSavedCartById(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const { id } = req.params;
      const cart = await savedCartsService.getSavedCartById(id, userId);
      res.status(200).json({ success: true, data: cart });
    } catch (error) {
      next(error);
    }
  }

  async createSavedCart(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const { name, items, originalCartId } = req.body;
      const cart = await savedCartsService.createSavedCart(userId, name, items, originalCartId);
      res.status(201).json({ success: true, data: cart });
    } catch (error) {
      next(error);
    }
  }

  async updateSavedCart(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const { id } = req.params;
      const { name, items } = req.body;
      const cart = await savedCartsService.updateSavedCart(id, userId, name, items);
      res.status(200).json({ success: true, data: cart });
    } catch (error) {
      next(error);
    }
  }

  async deleteSavedCart(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const { id } = req.params;
      await savedCartsService.deleteSavedCart(id, userId);
      res.status(204).json({ success: true });
    } catch (error) {
      next(error);
    }
  }
}

export const savedCartsController = new SavedCartsController();
