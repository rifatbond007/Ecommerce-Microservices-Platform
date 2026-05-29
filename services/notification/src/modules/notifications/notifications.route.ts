import { Router } from 'express';
import { notificationsController } from './notifications.controller';
import { authenticate } from '../../middleware';
import { validateParams } from '../../utils/validate';
import { notificationIdSchema } from './notifications.validator';

const router = Router();

router.get('/', authenticate, notificationsController.getNotifications);

router.put('/:id/read', authenticate, validateParams(notificationIdSchema), notificationsController.markAsRead);

router.put('/read-all', authenticate, notificationsController.markAllAsRead);

router.delete('/:id', authenticate, validateParams(notificationIdSchema), notificationsController.deleteNotification);

router.delete('/', authenticate, notificationsController.deleteAll);

export default router;
