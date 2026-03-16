import { Response, NextFunction } from 'express';
import { cartsService } from './carts.service';
import type { AuthenticatedRequest } from './carts.types';

export class CartsController {
  async getCart(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      const sessionId = req.headers['x-session-id'] as string | undefined;
      
      const cart = await cartsService.getCart(sessionId, userId);
      res.status(200).json({ success: true, data: cart });
    } catch (error) {
      next(error);
    }
  }

  async getOrCreateCart(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      const sessionId = req.headers['x-session-id'] as string | undefined;
      
      const cart = await cartsService.getOrCreateCart(sessionId, userId);
      res.status(200).json({ success: true, data: cart });
    } catch (error) {
      next(error);
    }
  }

  async addItem(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { cartId, productId, variantId, quantity, unitPrice } = req.body;
      const cart = await cartsService.addItem(cartId, productId, variantId, quantity, unitPrice);
      res.status(200).json({ success: true, data: cart });
    } catch (error) {
      next(error);
    }
  }

  async updateItem(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { cartId, itemId } = req.params;
      const { quantity, unitPrice } = req.body;
      const cart = await cartsService.updateItem(cartId, itemId, quantity, unitPrice);
      res.status(200).json({ success: true, data: cart });
    } catch (error) {
      next(error);
    }
  }

  async removeItem(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { cartId, itemId } = req.params;
      const cart = await cartsService.removeItem(cartId, itemId);
      res.status(200).json({ success: true, data: cart });
    } catch (error) {
      next(error);
    }
  }

  async clearCart(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { cartId } = req.params;
      const cart = await cartsService.clearCart(cartId);
      res.status(200).json({ success: true, data: cart });
    } catch (error) {
      next(error);
    }
  }

  async applyCoupon(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { cartId } = req.params;
      const { couponCode } = req.body;
      const cart = await cartsService.applyCoupon(cartId, couponCode);
      res.status(200).json({ success: true, data: cart });
    } catch (error) {
      next(error);
    }
  }

  async removeCoupon(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { cartId } = req.params;
      const cart = await cartsService.removeCoupon(cartId);
      res.status(200).json({ success: true, data: cart });
    } catch (error) {
      next(error);
    }
  }

  async deleteCart(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { cartId } = req.params;
      await cartsService.deleteCart(cartId);
      res.status(204).json({ success: true });
    } catch (error) {
      next(error);
    }
  }
}

export const cartsController = new CartsController();
