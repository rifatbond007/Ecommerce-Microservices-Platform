import { Response, NextFunction } from 'express';
import { notificationsService } from './notifications.service';
import { AuthenticatedRequest } from '../../middleware';

export class NotificationsController {
  async getNotifications(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const limit = parseInt(req.query.limit as string) || 20;
      const offset = parseInt(req.query.offset as string) || 0;
      const unreadOnly = req.query.unreadOnly === 'true';

      const result = await notificationsService.getNotifications(userId, limit, offset, unreadOnly);

      res.status(200).json({
        success: true,
        data: result.notifications,
        pagination: { total: result.total, limit, offset },
        meta: { unread: result.unread },
      });
    } catch (error) {
      next(error);
    }
  }

  async markAsRead(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const { id } = req.params;

      const notification = await notificationsService.markAsRead(userId, id);

      res.status(200).json({ success: true, data: notification });
    } catch (error) {
      next(error);
    }
  }

  async markAllAsRead(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;

      const result = await notificationsService.markAllAsRead(userId);

      res.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  async deleteNotification(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const { id } = req.params;

      await notificationsService.deleteNotification(userId, id);

      res.status(200).json({ success: true, message: 'Notification deleted' });
    } catch (error) {
      next(error);
    }
  }

  async deleteAll(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;

      await notificationsService.deleteAll(userId);

      res.status(200).json({ success: true, message: 'All notifications deleted' });
    } catch (error) {
      next(error);
    }
  }
}

export const notificationsController = new NotificationsController();
