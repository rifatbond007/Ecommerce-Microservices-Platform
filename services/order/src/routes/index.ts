import { Router } from 'express';
import { ordersRoutes, adminRoutes } from '../modules';

const router = Router();

router.use('/orders', ordersRoutes);
router.use('/orders/admin', adminRoutes);

export default router;
