import { Router } from 'express';
import { notificationsRoutes, preferencesRoutes } from '../modules';

const router = Router();

router.use('/notifications', notificationsRoutes);
router.use('/notifications/preferences', preferencesRoutes);

export default router;
