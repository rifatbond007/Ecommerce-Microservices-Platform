import { Router } from 'express';
import { settingsController } from './settings.controller';
import { authenticate, requireAdmin } from '../../middleware';

const router = Router();

router.get('/', authenticate, requireAdmin, settingsController.getSettings);
router.get('/public', settingsController.getPublicSettings);
router.get('/:key', authenticate, requireAdmin, settingsController.getSetting);
router.put('/', authenticate, requireAdmin, settingsController.updateSetting);
router.delete('/:key', authenticate, requireAdmin, settingsController.deleteSetting);

export default router;
