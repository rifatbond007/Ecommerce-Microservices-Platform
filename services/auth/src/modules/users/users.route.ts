import { Router } from 'express';
import { usersController } from './users.controller';
import { authenticate } from '../auth/auth.middleware';
import { validate } from '../../utils/validate';
import { updateProfileSchema } from './users.validator';

const router = Router();

router.get('/profile', authenticate, usersController.getProfile);

router.put('/profile', authenticate, validate(updateProfileSchema), usersController.updateProfile);

router.delete('/account', authenticate, usersController.deactivateAccount);

export default router;
