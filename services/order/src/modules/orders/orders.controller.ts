import { Response, NextFunction } from 'express';
import { ordersService } from './orders.service';
import type { AuthenticatedRequest, CreateOrderInput, UpdateOrderStatusInput, CreateReturnInput } from './orders.types';

export class OrdersController {
  async getOrders(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const limit = parseInt(req.query.limit as string) || 10;
      const offset = parseInt(req.query.offset as string) || 0;

      const { orders, total } = await ordersService.getOrdersByUserId(userId, limit, offset);

      res.status(200).json({
        success: true,
        data: orders,
        pagination: {
          total,
          limit,
          offset,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async getOrderById(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const { id } = req.params;

      const order = await ordersService.getOrderById(id, userId);

      res.status(200).json({
        success: true,
        data: order,
      });
    } catch (error) {
      next(error);
    }
  }

  async getOrderByNumber(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const { orderNumber } = req.params;

      const order = await ordersService.getOrderByNumber(orderNumber, userId);

      res.status(200).json({
        success: true,
        data: order,
      });
    } catch (error) {
      next(error);
    }
  }

  async createOrder(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const input: CreateOrderInput = req.body;

      const order = await ordersService.createOrder(userId, input);

      res.status(201).json({
        success: true,
        data: order,
      });
    } catch (error) {
      next(error);
    }
  }

  async updateOrderStatus(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const { id } = req.params;
      const input: UpdateOrderStatusInput = req.body;

      const order = await ordersService.updateOrderStatus(id, userId, input);

      res.status(200).json({
        success: true,
        data: order,
      });
    } catch (error) {
      next(error);
    }
  }

  async createReturn(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const { id } = req.params;
      const input: CreateReturnInput = req.body;

      const returnRecord = await ordersService.createReturn(id, userId, input);

      res.status(201).json({
        success: true,
        data: returnRecord,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const ordersController = new OrdersController();
