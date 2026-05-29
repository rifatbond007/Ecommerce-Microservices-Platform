import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import type { Mock } from 'jest';

const mockNotificationFindById = jest.fn() as Mock<Promise<any>, [string]>;
const mockNotificationFindByUserId = jest.fn() as Mock<Promise<any[]>, [string, number, number]>;
const mockNotificationCountByUserId = jest.fn() as Mock<Promise<number>, [string]>;
const mockNotificationCountUnread = jest.fn() as Mock<Promise<number>, [string]>;
const mockNotificationCreate = jest.fn() as Mock<Promise<any>, [any]>;
const mockNotificationMarkAsRead = jest.fn() as Mock<Promise<any>, [string]>;

jest.mock('../src/repositories/notification.repository', () => ({
  notificationRepository: {
    findById: mockNotificationFindById,
    findByUserId: mockNotificationFindByUserId,
    countByUserId: mockNotificationCountByUserId,
    countUnreadByUserId: mockNotificationCountUnread,
    create: mockNotificationCreate,
    markAsRead: mockNotificationMarkAsRead,
  },
}));

describe('NotificationsService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getNotifications', () => {
    it('should return notifications list with count', async () => {
      const { notificationsService } = await import('../src/modules/notifications/notifications.service');

      mockNotificationFindByUserId.mockResolvedValue([
        {
          id: 'notif-1',
          userId: 'user-1',
          type: 'order_confirmation',
          channel: 'email',
          title: 'Order Confirmed',
          content: 'Your order has been placed.',
          data: {},
          status: 'sent',
          sentAt: new Date(),
          readAt: null,
          createdAt: new Date(),
        },
      ]);
      mockNotificationCountByUserId.mockResolvedValue(1);
      mockNotificationCountUnread.mockResolvedValue(1);

      const result = await notificationsService.getNotifications('user-1');

      expect(result.notifications).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.unread).toBe(1);
      expect(result.notifications[0].title).toBe('Order Confirmed');
    });
  });

  describe('createNotification', () => {
    it('should create and return a notification', async () => {
      const { notificationsService } = await import('../src/modules/notifications/notifications.service');

      const now = new Date();
      mockNotificationCreate.mockResolvedValue({
        id: 'notif-1',
        userId: 'user-1',
        type: 'welcome',
        channel: 'email',
        title: 'Welcome!',
        content: 'Welcome to our platform.',
        data: {},
        status: 'sent',
        sentAt: now,
        readAt: null,
        createdAt: now,
      });

      const result = await notificationsService.createNotification({
        userId: 'user-1',
        type: 'welcome',
        channel: 'email',
        title: 'Welcome!',
        content: 'Welcome to our platform.',
      });

      expect(result.title).toBe('Welcome!');
      expect(result.status).toBe('sent');
    });
  });
});
