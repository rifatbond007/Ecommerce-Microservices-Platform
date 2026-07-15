import crypto from 'crypto';
import { config } from '../../config';
import { logger } from '../../utils/logger';
import { ValidationError } from '../../utils/errors';
import { paymentsService } from '../payments/payments.service';
import type { StripeWebhookEvent, GenericWebhookEvent } from './webhooks.types';

export class WebhooksService {
  /**
   * Verify a Stripe webhook signature using the configured webhook secret.
   * Throws ValidationError if the signature is invalid or the secret is not configured.
   */
  verifyStripeSignature(rawBody: Buffer, signatureHeader: string | undefined): void {
    const secret = config.stripe?.webhookSecret;
    if (!secret) {
      logger.warn('STRIPE_WEBHOOK_SECRET not configured; skipping signature verification');
      return;
    }
    if (!signatureHeader) {
      throw new ValidationError('Missing Stripe-Signature header');
    }

    const elements = signatureHeader.split(',').reduce<Record<string, string>>((acc, part) => {
      const [k, v] = part.split('=');
      if (k && v) acc[k] = v;
      return acc;
    }, {});

    const timestamp = elements.t;
    const expected = elements.v1;
    if (!timestamp || !expected) {
      throw new ValidationError('Malformed Stripe-Signature header');
    }

    const signedPayload = `${timestamp}.${rawBody.toString('utf8')}`;
    const computed = crypto.createHmac('sha256', secret).update(signedPayload).digest('hex');

    if (!crypto.timingSafeEqual(Buffer.from(computed), Buffer.from(expected))) {
      throw new ValidationError('Invalid Stripe webhook signature');
    }
  }

  async processStripeEvent(event: StripeWebhookEvent): Promise<void> {
    logger.info('Processing Stripe webhook event', { type: event.type, id: event.id });
    await paymentsService.handlePaymentWebhook({ type: event.type, data: event.data });
  }

  async processGenericEvent(event: GenericWebhookEvent): Promise<void> {
    logger.info('Processing generic webhook event', { type: event.type, source: event.source });
    await paymentsService.handlePaymentWebhook({ type: event.type, data: { object: event.data } });
  }
}

export const webhooksService = new WebhooksService();
