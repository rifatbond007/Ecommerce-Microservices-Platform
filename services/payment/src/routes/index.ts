import { Router } from 'express';
import { paymentsRoutes } from '../modules';

const router = Router();

router.use('/payments', paymentsRoutes);

export default router;
