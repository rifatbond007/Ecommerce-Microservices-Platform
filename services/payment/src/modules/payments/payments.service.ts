import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import { config } from '../../config';
import { paymentRepository, refundRepository } from '../../repositories';
import { NotFoundError, ValidationError, ConflictError } from '../../utils/errors';
import { logger } from '../../utils/logger';
import { publishEvent } from '../../utils/rabbitmq';
import type { ProcessPaymentInput, RefundInput, PaymentResponse, RefundResponse } from './payments.types';

function toPaymentResponse(payment: any): PaymentResponse {
  return {
    id: payment.id,
    orderId: payment.orderId,
    userId: payment.userId,
    amount: Number(payment.amount),
    currency: payment.currency,
    status: payment.status,
    paymentMethod: payment.paymentMethod,
    paymentIntentId: payment.paymentIntentId,
    transactionId: payment.transactionId,
    metadata: payment.metadata as Record<string, unknown>,
    failureMessage: payment.failureMessage,
    paidAt: payment.paidAt?.toISOString() || null,
    failedAt: payment.failedAt?.toISOString() || null,
    createdAt: payment.createdAt.toISOString(),
    updatedAt: payment.updatedAt.toISOString(),
    refunds: payment.refunds?.map(toRefundResponse),
  };
}

function toRefundResponse(refund: any): RefundResponse {
  return {
    id: refund.id,
    paymentId: refund.paymentId,
    amount: Number(refund.amount),
    currency: refund.currency,
    reason: refund.reason,
    status: refund.status,
    refundId: refund.refundId,
    refundedAt: refund.refundedAt?.toISOString() || null,
    createdAt: refund.createdAt.toISOString(),
  };
}

export class PaymentsService {
  async getPaymentById(paymentId: string): Promise<PaymentResponse> {
    const payment = await paymentRepository.findById(paymentId);
    return toPaymentResponse(payment);
  }

  async getPaymentByOrderId(orderId: string): Promise<PaymentResponse> {
    const payment = await paymentRepository.findByOrderId(orderId);
    return toPaymentResponse(payment);
  }

  async getPaymentsByUser(userId: string, limit = 10, offset = 0): Promise<{ payments: PaymentResponse[]; total: number }> {
    const [payments, total] = await Promise.all([
      paymentRepository.findByUserId(userId, limit, offset),
      paymentRepository.countByUserId(userId),
    ]);
    return { payments: payments.map(toPaymentResponse), total };
  }

  async processPayment(userId: string, input: ProcessPaymentInput): Promise<PaymentResponse> {
    let existingPayment;
    try {
      existingPayment = await paymentRepository.findByOrderId(input.orderId);
    } catch {
      existingPayment = null;
    }

    if (existingPayment && existingPayment.status === 'completed') {
      throw new ConflictError('Payment already completed for this order');
    }

    if (existingPayment && existingPayment.status === 'processing') {
      throw new ConflictError('Payment is already being processed for this order');
    }

    try {
      const orderResponse = await axios.get(`${config.orderService.url}/api/v1/orders/${input.orderId}`, {
        headers: { 'x-user-id': userId, 'x-user-role': 'user' },
      });
      const order = orderResponse.data.data;

      if (!order) {
        throw new NotFoundError('Order');
      }

      const amount = Number(order.total);
      const currency = order.currency || 'USD';

      if (existingPayment) {
        const updated = await paymentRepository.update(existingPayment.id, {
          status: 'processing',
          paymentMethod: input.paymentMethod,
          metadata: { ...(existingPayment.metadata as Record<string, unknown>), ...input },
        });
        return toPaymentResponse(updated);
      }

      const payment = await paymentRepository.create({
        orderId: input.orderId,
        userId,
        amount,
        currency,
        status: 'processing',
        paymentMethod: input.paymentMethod,
        metadata: input as unknown as Record<string, unknown> as any,
      });

      try {
        const paymentIntentId = `pi_${uuidv4().replace(/-/g, '')}`;
        const transactionId = `txn_${uuidv4().replace(/-/g, '')}`;

        const completed = await paymentRepository.update(payment.id, {
          status: 'completed',
          paymentIntentId,
          transactionId,
          paidAt: new Date(),
        });

        await publishEvent('payment.completed', {
          paymentId: completed.id,
          orderId: completed.orderId,
          userId,
          amount: Number(completed.amount),
          currency: completed.currency,
          transactionId,
          timestamp: new Date().toISOString(),
        });

        logger.info(`Payment completed for order ${input.orderId}, payment ${completed.id}`);
        return toPaymentResponse(completed);
      } catch (error) {
        const failed = await paymentRepository.update(payment.id, {
          status: 'failed',
          failureMessage: error instanceof Error ? error.message : 'Payment processing failed',
          failedAt: new Date(),
        });

        await publishEvent('payment.failed', {
          paymentId: failed.id,
          orderId: failed.orderId,
          userId,
          amount: Number(failed.amount),
          currency: failed.currency,
          failureMessage: failed.failureMessage,
          timestamp: new Date().toISOString(),
        });

        logger.error(`Payment failed for order ${input.orderId}`, { error });
        return toPaymentResponse(failed);
      }
    } catch (error) {
      if (error instanceof NotFoundError || error instanceof ConflictError) {
        throw error;
      }
      logger.error('Failed to process payment', { error });
      throw new ValidationError('Failed to process payment');
    }
  }

  async refundPayment(_userId: string, paymentId: string, input: RefundInput): Promise<PaymentResponse> {
    const payment = await paymentRepository.findById(paymentId);

    if (payment.status !== 'completed' && payment.status !== 'partially_refunded') {
      throw new ValidationError('Payment must be completed to issue a refund');
    }

    const totalRefunded = payment.refunds
      .filter((r: any) => r.status === 'completed')
      .reduce((sum: number, r: any) => sum + Number(r.amount), 0);

    const remaining = Number(payment.amount) - totalRefunded;
    const refundAmount = input.amount || remaining;

    if (refundAmount > remaining) {
      throw new ValidationError(`Refund amount exceeds remaining balance of ${remaining}`);
    }

    const refund = await refundRepository.create({
      payment: { connect: { id: payment.id } },
      amount: refundAmount,
      reason: input.reason,
      status: 'completed',
      refundId: `rf_${uuidv4().replace(/-/g, '')}`,
      refundedAt: new Date(),
    });

    const newTotalRefunded = totalRefunded + refundAmount;
    const newPaymentStatus = newTotalRefunded >= Number(payment.amount) ? 'refunded' : 'partially_refunded';

    const updated = await paymentRepository.update(payment.id, { status: newPaymentStatus });

    await publishEvent('payment.refunded', {
      paymentId: updated.id,
      refundId: refund.id,
      orderId: updated.orderId,
      amount: refundAmount,
      timestamp: new Date().toISOString(),
    });

    logger.info(`Refund completed for payment ${paymentId}, amount ${refundAmount}`);
    return toPaymentResponse(updated);
  }

  async handlePaymentWebhook(payload: any): Promise<void> {
    const eventType = payload.type;
    const data = payload.data?.object;

    logger.info(`Processing webhook event: ${eventType}`);

    switch (eventType) {
      case 'payment_intent.succeeded': {
        const paymentIntentId = data.id;
        const payment = await paymentRepository.findByPaymentIntentId(paymentIntentId);
        if (payment && payment.status === 'processing') {
          await paymentRepository.update(payment.id, {
            status: 'completed',
            paidAt: new Date(),
            transactionId: data.latest_charge || undefined,
          });
          await publishEvent('payment.completed', {
            paymentId: payment.id,
            orderId: payment.orderId,
            timestamp: new Date().toISOString(),
          });
        }
        break;
      }

      case 'payment_intent.payment_failed': {
        const paymentIntentId = data.id;
        const payment = await paymentRepository.findByPaymentIntentId(paymentIntentId);
        if (payment) {
          await paymentRepository.update(payment.id, {
            status: 'failed',
            failedAt: new Date(),
            failureMessage: data.last_payment_error?.message || 'Payment failed',
          });
          await publishEvent('payment.failed', {
            paymentId: payment.id,
            orderId: payment.orderId,
            timestamp: new Date().toISOString(),
          });
        }
        break;
      }

      default:
        logger.debug(`Unhandled webhook event type: ${eventType}`);
    }
  }
}

export const paymentsService = new PaymentsService();
