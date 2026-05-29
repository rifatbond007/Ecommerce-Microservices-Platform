import { notificationRepository } from '../../repositories';
import { NotFoundError } from '../../utils/errors';
import { logger } from '../../utils/logger';
import type { NotificationResponse, CreateNotificationInput } from './notifications.types';

function toResponse(notification: any): NotificationResponse {
  return {
    id: notification.id,
    userId: notification.userId,
    type: notification.type,
    channel: notification.channel,
    title: notification.title,
    content: notification.content,
    data: notification.data as Record<string, unknown>,
    status: notification.status,
    sentAt: notification.sentAt?.toISOString() || null,
    readAt: notification.readAt?.toISOString() || null,
    createdAt: notification.createdAt.toISOString(),
  };
}

export class NotificationsService {
  async getNotifications(userId: string, limit = 20, offset = 0, unreadOnly = false): Promise<{ notifications: NotificationResponse[]; total: number; unread: number }> {
    const [notifications, total, unread] = await Promise.all([
      unreadOnly
        ? notificationRepository.findUnreadByUserId(userId)
        : notificationRepository.findByUserId(userId, limit, offset),
      notificationRepository.countByUserId(userId),
      notificationRepository.countUnreadByUserId(userId),
    ]);

    return { notifications: notifications.map(toResponse), total, unread };
  }

  async markAsRead(userId: string, notificationId: string): Promise<NotificationResponse> {
    const notification = await notificationRepository.findById(notificationId);
    if (!notification || notification.userId !== userId) {
      throw new NotFoundError('Notification');
    }

    const updated = await notificationRepository.markAsRead(notificationId);
    return toResponse(updated);
  }

  async markAllAsRead(userId: string): Promise<{ count: number }> {
    const result = await notificationRepository.markAllAsRead(userId);
    return { count: result.count };
  }

  async deleteNotification(userId: string, notificationId: string): Promise<void> {
    const notification = await notificationRepository.findById(notificationId);
    if (!notification || notification.userId !== userId) {
      throw new NotFoundError('Notification');
    }
    await notificationRepository.delete(notificationId);
  }

  async deleteAll(userId: string): Promise<void> {
    await notificationRepository.deleteAllByUserId(userId);
  }

  async createNotification(input: CreateNotificationInput): Promise<NotificationResponse> {
    const notification = await notificationRepository.create({
      userId: input.userId,
      type: input.type,
      channel: input.channel,
      title: input.title,
      content: input.content,
      data: (input.data || {}) as any,
      status: input.status || 'sent',
      sentAt: new Date(),
    });

    logger.info(`Notification created: ${input.type} for user ${input.userId}`);
    return toResponse(notification);
  }
}

export const notificationsService = new NotificationsService();
