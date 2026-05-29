import { Prisma } from '@prisma/client';
import prisma from './prisma.client';

export class NotificationRepository {
  async findById(id: string) {
    return prisma.notification.findUnique({ where: { id } });
  }

  async findByUserId(userId: string, limit = 20, offset = 0) {
    return prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    });
  }

  async countByUserId(userId: string) {
    return prisma.notification.count({ where: { userId } });
  }

  async countUnreadByUserId(userId: string) {
    return prisma.notification.count({
      where: { userId, readAt: null },
    });
  }

  async findUnreadByUserId(userId: string) {
    return prisma.notification.findMany({
      where: { userId, readAt: null },
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(data: Prisma.NotificationCreateInput) {
    return prisma.notification.create({ data });
  }

  async markAsRead(id: string) {
    return prisma.notification.update({
      where: { id },
      data: { readAt: new Date() },
    });
  }

  async markAllAsRead(userId: string) {
    return prisma.notification.updateMany({
      where: { userId, readAt: null },
      data: { readAt: new Date() },
    });
  }

  async delete(id: string) {
    return prisma.notification.delete({ where: { id } });
  }

  async deleteAllByUserId(userId: string) {
    return prisma.notification.deleteMany({ where: { userId } });
  }
}

export const notificationRepository = new NotificationRepository();
