import { Router } from 'express';
import { settingsController } from './settings.controller';
import { authenticate, requireAdmin } from '../../middleware';

const router = Router();

router.get('/settings', authenticate, requireAdmin, settingsController.getSettings);
router.get('/settings/public', settingsController.getPublicSettings);
router.get('/settings/:key', authenticate, requireAdmin, settingsController.getSetting);
router.put('/settings', authenticate, requireAdmin, settingsController.updateSetting);
router.delete('/settings/:key', authenticate, requireAdmin, settingsController.deleteSetting);

export default router;
