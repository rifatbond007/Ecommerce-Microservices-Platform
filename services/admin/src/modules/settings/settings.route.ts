import { Router } from 'express';
import { settingsController } from './settings.controller';
import { authenticate, requireAdmin } from '../../middleware';

const router = Router();

/**
 * @swagger
 * /settings:
 *   get:
 *     summary: Get all settings
 *     tags: [Admin Settings]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of all settings
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - admin role required
 */
router.get('/', authenticate, requireAdmin, settingsController.getSettings);

/**
 * @swagger
 * /settings/public:
 *   get:
 *     summary: Get public settings
 *     tags: [Admin Settings]
 *     responses:
 *       200:
 *         description: List of public settings
 */
router.get('/public', settingsController.getPublicSettings);

/**
 * @swagger
 * /settings/{key}:
 *   get:
 *     summary: Get setting by key
 *     tags: [Admin Settings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: key
 *         required: true
 *         schema:
 *           type: string
 *         description: Setting key
 *     responses:
 *       200:
 *         description: Setting details
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - admin role required
 *       404:
 *         description: Setting not found
 */
router.get('/:key', authenticate, requireAdmin, settingsController.getSetting);

/**
 * @swagger
 * /settings:
 *   put:
 *     summary: Update setting
 *     tags: [Admin Settings]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - key
 *               - value
 *             properties:
 *               key:
 *                 type: string
 *               value:
 *                 type: string
 *               description:
 *                 type: string
 *     responses:
 *       200:
 *         description: Setting updated successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - admin role required
 */
router.put('/', authenticate, requireAdmin, settingsController.updateSetting);

/**
 * @swagger
 * /settings/{key}:
 *   delete:
 *     summary: Delete setting
 *     tags: [Admin Settings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: key
 *         required: true
 *         schema:
 *           type: string
 *         description: Setting key
 *     responses:
 *       200:
 *         description: Setting deleted successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - admin role required
 *       404:
 *         description: Setting not found
 */
router.delete('/:key', authenticate, requireAdmin, settingsController.deleteSetting);

export default router;
