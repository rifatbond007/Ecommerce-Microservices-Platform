import { Response, NextFunction } from 'express';
import { dashboardService } from './dashboard.service';
import { validateQuery } from '../../utils/validate';
import { dashboardStatsSchema } from './dashboard.types';
import type { AuthRequest } from '../../middleware';

export class DashboardController {
  async getStats(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { period } = validateQuery(dashboardStatsSchema, req.query);
      const stats = await dashboardService.getStats(period);
      
      res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      next(error);
    }
  }

  async getActivity(_req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await dashboardService.getStats('week');
      
      res.json({
        success: true,
        data: result.recentActivity,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const dashboardController = new DashboardController();
