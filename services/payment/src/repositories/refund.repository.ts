import { Prisma } from '@prisma/payment';
import prisma from './prisma.client';
import { NotFoundError } from '../utils/errors';

export class RefundRepository {
  async findById(refundId: string) {
    const refund = await prisma.refund.findUnique({
      where: { id: refundId },
      include: { payment: true },
    });
    if (!refund) {
      throw new NotFoundError('Refund');
    }
    return refund;
  }

  async findByPaymentId(paymentId: string) {
    return prisma.refund.findMany({
      where: { paymentId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(data: Prisma.RefundCreateInput) {
    return prisma.refund.create({ data, include: { payment: true } });
  }

  async update(refundId: string, data: Prisma.RefundUpdateInput) {
    const refund = await prisma.refund.update({
      where: { id: refundId },
      data,
      include: { payment: true },
    });
    return refund;
  }
}

export const refundRepository = new RefundRepository();
