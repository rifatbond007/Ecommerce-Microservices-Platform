import { Response, NextFunction } from 'express';
import { wishlistsService } from './wishlists.service';
import { AuthenticatedRequest } from '../../middleware';

export class WishlistsController {
  async getWishlists(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const wishlists = await wishlistsService.getWishlists(userId);

      res.status(200).json({
        success: true,
        data: wishlists,
      });
    } catch (error) {
      next(error);
    }
  }

  async getWishlistById(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const { id } = req.params;
      const wishlist = await wishlistsService.getWishlistById(id, userId);

      res.status(200).json({
        success: true,
        data: wishlist,
      });
    } catch (error) {
      next(error);
    }
  }

  async createWishlist(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const wishlist = await wishlistsService.createWishlist(userId, req.body);

      res.status(201).json({
        success: true,
        data: wishlist,
      });
    } catch (error) {
      next(error);
    }
  }

  async updateWishlist(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const { id } = req.params;
      const wishlist = await wishlistsService.updateWishlist(id, userId, req.body);

      res.status(200).json({
        success: true,
        data: wishlist,
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteWishlist(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const { id } = req.params;
      await wishlistsService.deleteWishlist(id, userId);

      res.status(200).json({
        success: true,
        message: 'Wishlist deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  async addItem(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const { id } = req.params;
      const item = await wishlistsService.addItem(id, userId, req.body);

      res.status(201).json({
        success: true,
        data: item,
      });
    } catch (error) {
      next(error);
    }
  }

  async removeItem(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const { id, productId } = req.params;
      const variantId = req.query.variantId as string | undefined;
      await wishlistsService.removeItem(id, productId, userId, variantId);

      res.status(200).json({
        success: true,
        message: 'Item removed from wishlist',
      });
    } catch (error) {
      next(error);
    }
  }
}

export const wishlistsController = new WishlistsController();
