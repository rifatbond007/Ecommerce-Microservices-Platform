import { Router } from 'express';
import { adminController } from './admin.controller';
import { authenticate, requireAdmin } from '../../middleware';

const router = Router();

/**
 * @swagger
 * /products/admin/stats:
 *   get:
 *     tags: [Admin]
 *     summary: Product counts for the admin dashboard
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: period
 *         schema: { type: string, enum: [day, week, month, year] }
 *     responses:
 *       '200': { description: OK }
 *       '401': { description: Unauthorized }
 *       '403': { description: Forbidden }
 */
router.get('/stats', authenticate, requireAdmin, adminController.getProductStats);

export default router;
