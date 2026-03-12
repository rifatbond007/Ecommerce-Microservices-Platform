import { Router } from 'express';
import { profilesController } from './profiles.controller';
import { authenticate } from '../../middleware';
import { validate } from '../../utils/validate';
import { createProfileSchema, updateProfileSchema } from './profiles.validator';

const router = Router();

router.get('/', authenticate, profilesController.getProfile);

router.post('/', authenticate, validate(createProfileSchema), profilesController.createProfile);

router.put('/', authenticate, validate(updateProfileSchema), profilesController.updateProfile);

router.delete('/', authenticate, profilesController.deleteProfile);

export default router;
