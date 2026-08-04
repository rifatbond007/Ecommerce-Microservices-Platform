import { Response, NextFunction } from 'express';
import { ordersService } from './orders.service';
import { validateQuery, validate } from '../../utils/validate';
import { updateOrderStatusSchema, orderQuerySchema } from './orders.types';
import type { AuthRequest } from '../../middleware';

/** Forward the admin's Bearer token so the gateway can re-verify when
 * the ordersService makes an internal admin call (Bug 3 fix). */
function extractToken(req: AuthRequest): string | undefined {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) return undefined;
  return auth.substring(7);
}

export class OrdersController {
  async getOrders(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const query = validateQuery(orderQuerySchema, req.query);
      const result = await ordersService.findAll(query, req.user!.id, req.ip, extractToken(req));

      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async getOrderById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const result = await ordersService.findById(id, req.user!.id, req.ip, extractToken(req));

      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async updateOrderStatus(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const input = validate(updateOrderStatusSchema, req.body);
      const result = await ordersService.updateStatus(id, input, req.user!.id, req.ip, extractToken(req));

      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async cancelOrder(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const reason = req.body.reason;
      const result = await ordersService.cancel(id, req.user!.id, reason, req.ip, extractToken(req));

      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async getStats(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await ordersService.getStats(req.user!.id, req.ip, extractToken(req));

      res.json(result);
    } catch (error) {
      next(error);
    }
  }
}

export const ordersController = new OrdersController();