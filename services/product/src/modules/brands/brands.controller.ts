import { Response, NextFunction } from 'express';
import { brandsService } from './brands.service';
import type { AuthenticatedRequest } from '../../middleware';

export class BrandsController {
  async getBrands(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const includeInactive = req.query.includeInactive === 'true';
      const brands = await brandsService.getAllBrands(includeInactive);
      res.status(200).json({
        success: true,
        data: brands,
      });
    } catch (error) {
      next(error);
    }
  }

  async getBrandById(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const brand = await brandsService.getBrandById(req.params.id);
      res.status(200).json({
        success: true,
        data: brand,
      });
    } catch (error) {
      next(error);
    }
  }

  async getBrandBySlug(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const brand = await brandsService.getBrandBySlug(req.params.slug);
      res.status(200).json({
        success: true,
        data: brand,
      });
    } catch (error) {
      next(error);
    }
  }

  async createBrand(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const brand = await brandsService.createBrand(req.body);
      res.status(201).json({
        success: true,
        data: brand,
      });
    } catch (error) {
      next(error);
    }
  }

  async updateBrand(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const brand = await brandsService.updateBrand(req.params.id, req.body);
      res.status(200).json({
        success: true,
        data: brand,
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteBrand(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      await brandsService.deleteBrand(req.params.id);
      res.status(200).json({
        success: true,
        message: 'Brand deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }
}

export const brandsController = new BrandsController();
