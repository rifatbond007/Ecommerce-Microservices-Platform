import { Response, NextFunction } from 'express';
import { variantsService } from './variants.service';
import type { AuthenticatedRequest } from '../../middleware';

export class VariantsController {
  async getVariantById(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const variant = await variantsService.getVariantById(req.params.id);
      res.status(200).json({
        success: true,
        data: variant,
      });
    } catch (error) {
      next(error);
    }
  }

  async getVariantsByProductId(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const variants = await variantsService.getVariantsByProductId(req.params.productId);
      res.status(200).json({
        success: true,
        data: variants,
      });
    } catch (error) {
      next(error);
    }
  }

  async createVariant(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const variant = await variantsService.createVariant(req.body);
      res.status(201).json({
        success: true,
        data: variant,
      });
    } catch (error) {
      next(error);
    }
  }

  async updateVariant(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const variant = await variantsService.updateVariant(req.params.id, req.body);
      res.status(200).json({
        success: true,
        data: variant,
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteVariant(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      await variantsService.deleteVariant(req.params.id);
      res.status(200).json({
        success: true,
        message: 'Product variant deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }
}

export const variantsController = new VariantsController();
