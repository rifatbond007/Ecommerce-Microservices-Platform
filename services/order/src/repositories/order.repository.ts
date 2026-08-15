import { Prisma } from '@prisma/order';
import prisma from './prisma.client';
import { NotFoundError } from '../utils/errors';

export class OrderRepository {
  async findById(orderId: string) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: true,
        statusHistory: {
          orderBy: { createdAt: 'desc' },
        },
        shipments: true,
        refunds: true,
        returns: true,
      },
    });
    if (!order) {
      throw new NotFoundError('Order');
    }
    return order;
  }

  async findByOrderNumber(orderNumber: string) {
    const order = await prisma.order.findUnique({
      where: { orderNumber },
      include: {
        items: true,
        statusHistory: {
          orderBy: { createdAt: 'desc' },
        },
        shipments: true,
        refunds: true,
        returns: true,
      },
    });
    if (!order) {
      throw new NotFoundError('Order');
    }
    return order;
  }

  async findByUserId(userId: string, limit = 10, offset = 0) {
    return prisma.order.findMany({
      where: { userId },
      include: {
        items: true,
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    });
  }

  async countByUserId(userId: string) {
    return prisma.order.count({
      where: { userId },
    });
  }

  async create(data: Prisma.OrderCreateInput) {
    return prisma.order.create({
      data,
      include: {
        items: true,
      },
    });
  }

  async update(orderId: string, data: Prisma.OrderUpdateInput) {
    return prisma.order.update({
      where: { id: orderId },
      data,
      include: {
        items: true,
      },
    });
  }

  async updateStatus(orderId: string, status: string, changedBy?: string) {
    const order = await this.findById(orderId);
    
    const result = await prisma.$transaction([
      prisma.order.update({
        where: { id: orderId },
        data: { status },
      }),
      prisma.orderStatusHistory.create({
        data: {
          orderId,
          status: order.status,
          newStatus: status,
          changedBy,
        },
      }),
    ]);

    return result[0];
  }

  async addStatusHistory(orderId: string, status: string, newStatus: string, note?: string, changedBy?: string) {
    return prisma.orderStatusHistory.create({
      data: {
        orderId,
        status,
        newStatus,
        note,
        changedBy,
      },
    });
  }

  async createShipment(orderId: string, data: Prisma.ShipmentCreateInput) {
    return prisma.shipment.create({
      data: {
        ...data,
        order: { connect: { id: orderId } },
      },
    });
  }

  async createRefund(orderId: string, data: Prisma.RefundCreateInput) {
    return prisma.refund.create({
      data: {
        ...data,
        order: { connect: { id: orderId } },
      },
    });
  }

  async createReturn(orderId: string, orderItemId: string, quantity: number, reason: string) {
    return prisma.return.create({
      data: {
        orderId,
        orderItemId,
        quantity,
        reason,
      },
    });
  }

  async updateReturn(returnId: string, data: Prisma.ReturnUpdateInput) {
    return prisma.return.update({
      where: { id: returnId },
      data,
    });
  }
}

export const orderRepository = new OrderRepository();
