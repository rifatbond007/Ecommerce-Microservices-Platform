import { Router } from 'express';
import { sellersController } from './sellers.controller';
import { authenticate, requireAdmin } from '../../middleware';

const router = Router();

router.get('/status', authenticate, sellersController.getSellerStatus);

router.post('/request', authenticate, sellersController.requestSeller);

router.get('/admin/requests', authenticate, requireAdmin, sellersController.getSellerRequests);

router.post('/admin/approve/:userId', authenticate, requireAdmin, sellersController.approveSeller);

router.post('/admin/reject/:userId', authenticate, requireAdmin, sellersController.rejectSeller);

export default router;
