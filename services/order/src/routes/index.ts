import { Router } from 'express';
import { ordersRoutes } from '../modules';

const router = Router();

router.use('/orders', ordersRoutes);

export default router;
