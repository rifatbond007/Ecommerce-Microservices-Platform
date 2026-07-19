import { Router } from 'express';
import { usersController } from './users.controller';
import { authenticate } from '../auth/auth.middleware';
import { validate } from '../../utils/validate';
import { updateProfileSchema } from './users.validator';

const router = Router();

/**
 * @swagger
 * /users/profile:
 *   get:
 *     tags: [Users]
 *     summary: Get user profile
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       '200':
 *         description: User profile
 *       '401':
 *         description: Unauthorized
 */
router.get('/profile', authenticate, usersController.getProfile);

/**
 * @swagger
 * /users/profile:
 *   put:
 *     tags: [Users]
 *     summary: Update user profile
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               phone:
 *                 type: string
 *               avatarUrl:
 *                 type: string
 *                 format: uri
 *     responses:
 *       '200':
 *         description: Profile updated
 *       '401':
 *         description: Unauthorized
 */
router.put('/profile', authenticate, validate(updateProfileSchema), usersController.updateProfile);

/**
 * @swagger
 * /users/account:
 *   delete:
 *     tags: [Users]
 *     summary: Deactivate user account
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       '200':
 *         description: Account deactivated
 *       '401':
 *         description: Unauthorized
 */
router.delete('/account', authenticate, usersController.deactivateAccount);

export default router;
