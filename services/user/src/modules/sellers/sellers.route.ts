import { Router } from 'express';
import { sellersController } from './sellers.controller';
import { authenticate, requireAdmin } from '../../middleware';

const router = Router();

/**
 * @swagger
 * /sellers/status:
 *   get:
 *     tags: [Sellers]
 *     summary: Get seller status
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       '200':
 *         description: Seller status
 *       '401':
 *         description: Unauthorized
 */
router.get('/status', authenticate, sellersController.getSellerStatus);

/**
 * @swagger
 * /sellers/request:
 *   post:
 *     tags: [Sellers]
 *     summary: Request seller role
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [businessName]
 *             properties:
 *               businessName:
 *                 type: string
 *               description:
 *                 type: string
 *     responses:
 *       '201':
 *         description: Seller request submitted
 *       '401':
 *         description: Unauthorized
 */
router.post('/request', authenticate, sellersController.requestSeller);

/**
 * @swagger
 * /sellers/admin/requests:
 *   get:
 *     tags: [Sellers]
 *     summary: List pending seller requests (admin)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       '200':
 *         description: List of seller requests
 *       '401':
 *         description: Unauthorized
 *       '403':
 *         description: Admin access required
 */
router.get('/admin/requests', authenticate, requireAdmin, sellersController.getSellerRequests);

/**
 * @swagger
 * /sellers/admin/approve/{userId}:
 *   post:
 *     tags: [Sellers]
 *     summary: Approve seller request (admin)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID to approve as seller
 *     responses:
 *       '200':
 *         description: Seller request approved
 *       '401':
 *         description: Unauthorized
 *       '403':
 *         description: Admin access required
 */
router.post('/admin/approve/:userId', authenticate, requireAdmin, sellersController.approveSeller);

/**
 * @swagger
 * /sellers/admin/reject/{userId}:
 *   post:
 *     tags: [Sellers]
 *     summary: Reject seller request (admin)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID to reject as seller
 *     responses:
 *       '200':
 *         description: Seller request rejected
 *       '401':
 *         description: Unauthorized
 *       '403':
 *         description: Admin access required
 */
router.post('/admin/reject/:userId', authenticate, requireAdmin, sellersController.rejectSeller);

export default router;
