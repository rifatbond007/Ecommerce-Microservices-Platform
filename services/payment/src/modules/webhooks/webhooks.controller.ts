import { Request, Response, NextFunction } from 'express';
import { paymentsService } from '../payments/payments.service';
import { logger } from '../../utils/logger';

export class WebhooksController {
  async handleStripeWebhook(req: Request, res: Response, _next: NextFunction) {
    try {
      const payload = req.body;

      logger.info('Received Stripe webhook', { type: payload.type });

      await paymentsService.handlePaymentWebhook(payload);

      res.status(200).json({ received: true });
    } catch (error) {
      logger.error('Stripe webhook processing failed', { error });
      res.status(400).json({ success: false, message: 'Webhook processing failed' });
    }
  }

  async handleGenericWebhook(req: Request, res: Response, next: NextFunction) {
    try {
      const payload = req.body;
      logger.info('Received generic webhook', { type: payload.type });

      await paymentsService.handlePaymentWebhook(payload);

      res.status(200).json({ received: true });
    } catch (error) {
      next(error);
    }
  }
}

export const webhooksController = new WebhooksController();
