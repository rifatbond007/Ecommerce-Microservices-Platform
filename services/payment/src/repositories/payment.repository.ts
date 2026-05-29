import { Prisma } from '@prisma/client';
import prisma from './prisma.client';
import { NotFoundError } from '../utils/errors';

export class PaymentRepository {
  async findById(paymentId: string) {
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: { refunds: true },
    });
    if (!payment) {
      throw new NotFoundError('Payment');
    }
    return payment;
  }

  async findByOrderId(orderId: string) {
    const payment = await prisma.payment.findFirst({
      where: { orderId },
      include: { refunds: true },
    });
    if (!payment) {
      throw new NotFoundError('Payment');
    }
    return payment;
  }

  async findByPaymentIntentId(paymentIntentId: string) {
    return prisma.payment.findFirst({
      where: { paymentIntentId },
      include: { refunds: true },
    });
  }

  async findByUserId(userId: string, limit = 10, offset = 0) {
    return prisma.payment.findMany({
      where: { userId },
      include: { refunds: true },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    });
  }

  async countByUserId(userId: string) {
    return prisma.payment.count({
      where: { userId },
    });
  }

  async create(data: Prisma.PaymentCreateInput) {
    return prisma.payment.create({ data });
  }

  async update(paymentId: string, data: Prisma.PaymentUpdateInput) {
    const payment = await prisma.payment.update({
      where: { id: paymentId },
      data,
      include: { refunds: true },
    });
    return payment;
  }

  async updateByPaymentIntentId(paymentIntentId: string, data: Prisma.PaymentUpdateInput) {
    const payment = await prisma.payment.findFirst({
      where: { paymentIntentId },
    });
    if (!payment) {
      throw new NotFoundError('Payment');
    }
    return prisma.payment.update({
      where: { id: payment.id },
      data,
      include: { refunds: true },
    });
  }
}

export const paymentRepository = new PaymentRepository();
