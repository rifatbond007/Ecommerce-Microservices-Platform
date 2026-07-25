import { Response, NextFunction } from 'express';
import { prisma } from '../../repositories/prisma.client';
import { AuthenticatedRequest } from '../../middleware';

type Period = 'day' | 'week' | 'month' | 'year';

function periodStart(period: Period): Date {
  const now = new Date();
  switch (period) {
    case 'day': return new Date(now.getTime() - 24 * 60 * 60 * 1000);
    case 'week': return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    case 'month': return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    case 'year': return new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
  }
}

export class AdminController {
  /** GET /users/admin/stats?period=week — used by the admin dashboard. */
  async getUserStats(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const period = (req.query.period as Period) || 'week';
      const since = periodStart(period);

      const [total, fresh] = await Promise.all([
        prisma.profile.count(),
        prisma.profile.count({ where: { createdAt: { gte: since } } }),
      ]);

      res.status(200).json({
        success: true,
        data: { total, new: fresh },
      });
    } catch (error) {
      next(error);
    }
  }
}

export const adminController = new AdminController();
