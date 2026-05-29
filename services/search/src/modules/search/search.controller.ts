import { Request, Response, NextFunction } from 'express';
import { searchService } from './search.service';
import { AuthenticatedRequest } from '../../middleware';

export class SearchController {
  async search(req: Request, res: Response, next: NextFunction) {
    try {
      const q = (req.query.q as string) || '';
      const category = req.query.category as string | undefined;
      const minPrice = req.query.minPrice ? parseFloat(req.query.minPrice as string) : undefined;
      const maxPrice = req.query.maxPrice ? parseFloat(req.query.maxPrice as string) : undefined;
      const limit = parseInt(req.query.limit as string) || 20;
      const offset = parseInt(req.query.offset as string) || 0;
      const userId = (req as AuthenticatedRequest).user?.userId;

      const result = await searchService.search(q, { category, minPrice, maxPrice, limit, offset, userId });

      res.status(200).json({
        success: true,
        data: result.results,
        pagination: { total: result.total, limit, offset },
        meta: { categories: result.categories },
      });
    } catch (error) {
      next(error);
    }
  }

  async getSuggestions(req: Request, res: Response, next: NextFunction) {
    try {
      const q = (req.query.q as string) || '';
      const limit = parseInt(req.query.limit as string) || 5;

      const result = await searchService.getSuggestions(q, limit);

      res.status(200).json({ success: true, data: result.suggestions });
    } catch (error) {
      next(error);
    }
  }

  async getTrending(req: Request, res: Response, next: NextFunction) {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const result = await searchService.getTrending(limit);
      res.status(200).json({ success: true, data: result.trending });
    } catch (error) {
      next(error);
    }
  }

  async logClick(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { productId, logId } = req.body;
      await searchService.logClick(productId, logId);
      res.status(200).json({ success: true });
    } catch (error) {
      next(error);
    }
  }
}

export const searchController = new SearchController();
