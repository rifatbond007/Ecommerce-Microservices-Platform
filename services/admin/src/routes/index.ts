import { Router } from 'express';
import { dashboardRoutes, usersRoutes, productsRoutes, ordersRoutes, settingsRoutes } from '../modules';

const router = Router();

router.use('/dashboard', dashboardRoutes);
router.use('/users', usersRoutes);
router.use('/products', productsRoutes);
router.use('/orders', ordersRoutes);
router.use('/settings', settingsRoutes);

export default router;
