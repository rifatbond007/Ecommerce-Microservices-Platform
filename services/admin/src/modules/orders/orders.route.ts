import { Router } from 'express';
import { ordersController } from './orders.controller';
import { authenticate, requireAdmin } from '../../middleware';

const router = Router();

router.get('/orders', authenticate, requireAdmin, ordersController.getOrders);
router.get('/orders/stats', authenticate, requireAdmin, ordersController.getStats);
router.get('/orders/:id', authenticate, requireAdmin, ordersController.getOrderById);
router.put('/orders/:id/status', authenticate, requireAdmin, ordersController.updateOrderStatus);
router.post('/orders/:id/cancel', authenticate, requireAdmin, ordersController.cancelOrder);

export default router;
