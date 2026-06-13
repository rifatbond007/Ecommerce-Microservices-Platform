import { Router } from 'express';
import { ordersController } from './orders.controller';
import { authenticate, requireAdmin } from '../../middleware';

const router = Router();

router.get('/', authenticate, requireAdmin, ordersController.getOrders);
router.get('/stats', authenticate, requireAdmin, ordersController.getStats);
router.get('/:id', authenticate, requireAdmin, ordersController.getOrderById);
router.put('/:id/status', authenticate, requireAdmin, ordersController.updateOrderStatus);
router.post('/:id/cancel', authenticate, requireAdmin, ordersController.cancelOrder);

export default router;
