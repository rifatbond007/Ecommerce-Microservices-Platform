import { Router } from 'express';
import { paymentsRoutes, webhooksRoutes } from '../modules';

const router = Router();

router.use('/payments', paymentsRoutes);
router.use('/webhooks', webhooksRoutes);

export default router;
