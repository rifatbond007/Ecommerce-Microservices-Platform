import { Response, NextFunction } from 'express';
import { categoriesService } from './categories.service';
import type { AuthenticatedRequest } from '../../middleware';

export class CategoriesController {
  async getCategories(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const includeInactive = req.query.includeInactive === 'true';
      const categories = await categoriesService.getAllCategories(includeInactive);
      res.status(200).json({
        success: true,
        data: categories,
      });
    } catch (error) {
      next(error);
    }
  }

  async getCategoryTree(_req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const tree = await categoriesService.getCategoryTree();
      res.status(200).json({
        success: true,
        data: tree,
      });
    } catch (error) {
      next(error);
    }
  }

  async getCategoryById(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const category = await categoriesService.getCategoryById(req.params.id);
      res.status(200).json({
        success: true,
        data: category,
      });
    } catch (error) {
      next(error);
    }
  }

  async getCategoryBySlug(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const category = await categoriesService.getCategoryBySlug(req.params.slug);
      res.status(200).json({
        success: true,
        data: category,
      });
    } catch (error) {
      next(error);
    }
  }

  async createCategory(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const category = await categoriesService.createCategory(req.body);
      res.status(201).json({
        success: true,
        data: category,
      });
    } catch (error) {
      next(error);
    }
  }

  async updateCategory(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const category = await categoriesService.updateCategory(req.params.id, req.body);
      res.status(200).json({
        success: true,
        data: category,
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteCategory(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      await categoriesService.deleteCategory(req.params.id);
      res.status(200).json({
        success: true,
        message: 'Category deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }
}

export const categoriesController = new CategoriesController();
