import { Router } from 'express';
import { preferencesController } from './preferences.controller';
import { authenticate } from '../../middleware';
import { validate } from '../../utils/validate';
import { updatePreferenceSchema } from './preferences.validator';

const router = Router();

router.get('/', authenticate, preferencesController.getPreferences);

router.put('/', authenticate, validate(updatePreferenceSchema), preferencesController.updatePreferences);

export default router;
