import { Router } from 'express';
import { profilesController } from './profiles.controller';
import { authenticate } from '../../middleware';
import { validate } from '../../utils/validate';
import { createProfileSchema, updateProfileSchema } from './profiles.validator';

const router = Router();

/**
 * @swagger
 * /users/me:
 *   get:
 *     tags: [Profiles]
 *     summary: Get user profile
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       '200':
 *         description: User profile
 *       '401':
 *         description: Unauthorized
 *       '404':
 *         description: Profile not found
 */
router.get('/', authenticate, profilesController.getProfile);

/**
 * @swagger
 * /users/me:
 *   post:
 *     tags: [Profiles]
 *     summary: Create user profile
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               dateOfBirth:
 *                 type: string
 *                 format: date
 *               gender:
 *                 type: string
 *               language:
 *                 type: string
 *               timezone:
 *                 type: string
 *               currency:
 *                 type: string
 *               bio:
 *                 type: string
 *               website:
 *                 type: string
 *                 format: uri
 *               company:
 *                 type: string
 *               jobTitle:
 *                 type: string
 *               newsletterSubscribed:
 *                 type: boolean
 *               notificationPreferences:
 *                 type: object
 *     responses:
 *       '201':
 *         description: Profile created
 *       '401':
 *         description: Unauthorized
 */
router.post('/', authenticate, validate(createProfileSchema), profilesController.createProfile);

/**
 * @swagger
 * /users/me:
 *   put:
 *     tags: [Profiles]
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
 *               dateOfBirth:
 *                 type: string
 *                 format: date
 *                 nullable: true
 *               gender:
 *                 type: string
 *                 nullable: true
 *               language:
 *                 type: string
 *               timezone:
 *                 type: string
 *               currency:
 *                 type: string
 *               bio:
 *                 type: string
 *                 nullable: true
 *               website:
 *                 type: string
 *                 format: uri
 *                 nullable: true
 *               company:
 *                 type: string
 *                 nullable: true
 *               jobTitle:
 *                 type: string
 *                 nullable: true
 *               newsletterSubscribed:
 *                 type: boolean
 *               notificationPreferences:
 *                 type: object
 *     responses:
 *       '200':
 *         description: Profile updated
 *       '401':
 *         description: Unauthorized
 *       '404':
 *         description: Profile not found
 */
router.put('/', authenticate, validate(updateProfileSchema), profilesController.updateProfile);

/**
 * @swagger
 * /users/me:
 *   delete:
 *     tags: [Profiles]
 *     summary: Delete user profile
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       '200':
 *         description: Profile deleted
 *       '401':
 *         description: Unauthorized
 *       '404':
 *         description: Profile not found
 */
router.delete('/', authenticate, profilesController.deleteProfile);

export default router;
