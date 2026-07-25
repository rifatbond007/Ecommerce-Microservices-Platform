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

/**
 * Aggregate order revenue in JS — Order.total is stored as Decimal
 * and Prisma can't `SUM` Decimal directly. For dashboard "revenue in
 * the last N days" this is fine; volumes are bounded by the period.
 */
async function sumRevenueSince(since: Date): Promise<number> {
  const orders = await prisma.order.findMany({
    where: { createdAt: { gte: since } },
    select: { total: true },
  });
  return orders.reduce((acc: number, o: { total: unknown }) => acc + Number(o.total), 0);
}

export class AdminController {
  /** GET /orders/admin/stats?period=week — used by the admin dashboard. */
  async getOrderStats(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const period = (req.query.period as Period) || 'week';
      const since = periodStart(period);

      const [total, fresh, revenue] = await Promise.all([
        prisma.order.count(),
        prisma.order.count({ where: { createdAt: { gte: since } } }),
        sumRevenueSince(since),
      ]);

      res.status(200).json({
        success: true,
        data: { total, new: fresh, revenue },
      });
    } catch (error) {
      next(error);
    }
  }
}

export const adminController = new AdminController();
