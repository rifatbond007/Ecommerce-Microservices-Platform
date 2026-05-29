import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import type { Mock } from 'jest';

const mockPaymentFindById = jest.fn() as Mock<Promise<any>, [string]>;
const mockPaymentFindByOrderId = jest.fn() as Mock<Promise<any>, [string]>;
const mockPaymentCreate = jest.fn() as Mock<Promise<any>, [any]>;
const mockPaymentUpdate = jest.fn() as Mock<Promise<any>, [string, any]>;

const mockRefundCreate = jest.fn() as Mock<Promise<any>, [any]>;

jest.mock('../src/repositories/payment.repository', () => ({
  paymentRepository: {
    findById: mockPaymentFindById,
    findByOrderId: mockPaymentFindByOrderId,
    create: mockPaymentCreate,
    update: mockPaymentUpdate,
  },
}));

jest.mock('../src/repositories/refund.repository', () => ({
  refundRepository: {
    create: mockRefundCreate,
  },
}));

jest.mock('../src/utils/rabbitmq', () => ({
  publishEvent: jest.fn(() => Promise.resolve()),
}));

jest.mock('axios', () => ({
  get: jest.fn(() => Promise.resolve({ data: { data: { id: 'order-id', total: 100, currency: 'USD' } } })),
}));

describe('PaymentsService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getPaymentById', () => {
    it('should return payment by id', async () => {
      const { paymentsService } = await import('../src/modules/payments/payments.service');

      const mockPayment = {
        id: 'payment-id',
        orderId: 'order-id',
        userId: 'user-id',
        amount: 100,
        currency: 'USD',
        status: 'completed',
        paymentMethod: 'card',
        paymentIntentId: 'pi_123',
        transactionId: 'txn_123',
        metadata: {},
        failureMessage: null,
        paidAt: new Date(),
        failedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        refunds: [],
      };

      mockPaymentFindById.mockResolvedValue(mockPayment);

      const result = await paymentsService.getPaymentById('payment-id');
      expect(result.id).toBe('payment-id');
      expect(result.amount).toBe(100);
    });
  });

  describe('processPayment', () => {
    it('should process payment successfully', async () => {
      const { paymentsService } = await import('../src/modules/payments/payments.service');

      mockPaymentFindByOrderId.mockRejectedValue(new Error('Not found'));
      mockPaymentCreate.mockResolvedValue({
        id: 'payment-id',
        orderId: 'order-id',
        userId: 'user-id',
        amount: 100,
        currency: 'USD',
        status: 'processing',
        paymentMethod: 'card',
        metadata: {},
        refunds: [],
      });
      mockPaymentUpdate.mockResolvedValue({
        id: 'payment-id',
        orderId: 'order-id',
        userId: 'user-id',
        amount: 100,
        currency: 'USD',
        status: 'completed',
        paymentMethod: 'card',
        paymentIntentId: 'pi_123',
        transactionId: 'txn_123',
        metadata: {},
        failureMessage: null,
        paidAt: new Date(),
        failedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        refunds: [],
      });

      const result = await paymentsService.processPayment('user-id', {
        orderId: 'order-id',
        paymentMethod: 'card',
      });

      expect(result.status).toBe('completed');
      expect(mockPaymentCreate).toHaveBeenCalledTimes(1);
      expect(mockPaymentUpdate).toHaveBeenCalledTimes(1);
    });
  });
});
