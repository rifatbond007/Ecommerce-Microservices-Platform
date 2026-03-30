import { Router } from 'express';
import { dashboardController } from './dashboard.controller';
import { authenticate, requireAdmin } from '../../middleware';

const router = Router();

router.get('/stats', authenticate, requireAdmin, dashboardController.getStats);
router.get('/activity', authenticate, requireAdmin, dashboardController.getActivity);

export default router;
