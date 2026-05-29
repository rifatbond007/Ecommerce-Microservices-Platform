import { Response, NextFunction } from 'express';
import { paymentsService } from './payments.service';
import { AuthenticatedRequest } from '../../middleware';
import type { ProcessPaymentInput, RefundInput } from './payments.types';

export class PaymentsController {
  async getPaymentById(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const payment = await paymentsService.getPaymentById(id);
      res.status(200).json({ success: true, data: payment });
    } catch (error) {
      next(error);
    }
  }

  async getPaymentByOrderId(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { orderId } = req.params;
      const payment = await paymentsService.getPaymentByOrderId(orderId);
      res.status(200).json({ success: true, data: payment });
    } catch (error) {
      next(error);
    }
  }

  async getMyPayments(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const limit = parseInt(req.query.limit as string) || 10;
      const offset = parseInt(req.query.offset as string) || 0;

      const result = await paymentsService.getPaymentsByUser(userId, limit, offset);
      res.status(200).json({
        success: true,
        data: result.payments,
        pagination: { total: result.total, limit, offset },
      });
    } catch (error) {
      next(error);
    }
  }

  async processPayment(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const input: ProcessPaymentInput = req.body;
      const payment = await paymentsService.processPayment(userId, input);
      res.status(201).json({ success: true, data: payment });
    } catch (error) {
      next(error);
    }
  }

  async refundPayment(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const { id } = req.params;
      const input: RefundInput = req.body;
      const payment = await paymentsService.refundPayment(userId, id, input);
      res.status(200).json({ success: true, data: payment });
    } catch (error) {
      next(error);
    }
  }
}

export const paymentsController = new PaymentsController();
