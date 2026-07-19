import { Router } from 'express';
import { dashboardController } from './dashboard.controller';
import { authenticate, requireAdmin } from '../../middleware';

const router = Router();

/**
 * @swagger
 * /dashboard/stats:
 *   get:
 *     summary: Get dashboard statistics
 *     tags: [Admin Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard statistics including users, orders, revenue, and products counts
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - admin role required
 */
router.get('/stats', authenticate, requireAdmin, dashboardController.getStats);

/**
 * @swagger
 * /dashboard/activity:
 *   get:
 *     summary: Get recent admin activity feed
 *     tags: [Admin Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Recent admin activity feed
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - admin role required
 */
router.get('/activity', authenticate, requireAdmin, dashboardController.getActivity);

export default router;
