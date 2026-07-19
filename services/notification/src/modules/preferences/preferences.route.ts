import { Router } from 'express';
import { preferencesController } from './preferences.controller';
import { authenticate } from '../../middleware';
import { validate } from '../../utils/validate';
import { updatePreferenceSchema } from './preferences.validator';

const router = Router();

/**
 * @swagger
 * /notifications/preferences/:
 *   get:
 *     summary: Get notification preferences
 *     tags: [Preferences]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User's notification preferences
 *       401:
 *         description: Unauthorized
 */
router.get('/', authenticate, preferencesController.getPreferences);

/**
 * @swagger
 * /notifications/preferences/:
 *   put:
 *     summary: Update notification preferences
 *     tags: [Preferences]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: boolean
 *                 description: Enable/disable email notifications
 *               push:
 *                 type: boolean
 *                 description: Enable/disable push notifications
 *               sms:
 *                 type: boolean
 *                 description: Enable/disable SMS notifications
 *               orderUpdates:
 *                 type: boolean
 *                 description: Enable/disable order update notifications
 *               promotions:
 *                 type: boolean
 *                 description: Enable/disable promotional notifications
 *               security:
 *                 type: boolean
 *                 description: Enable/disable security alert notifications
 *     responses:
 *       200:
 *         description: Preferences updated successfully
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 */
router.put('/', authenticate, validate(updatePreferenceSchema), preferencesController.updatePreferences);

export default router;
