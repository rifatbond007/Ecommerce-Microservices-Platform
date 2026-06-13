import { Router } from 'express';
import { usersController } from './users.controller';
import { authenticate, requireAdmin } from '../../middleware';

const router = Router();

router.get('/', authenticate, requireAdmin, usersController.getUsers);
router.get('/:id', authenticate, requireAdmin, usersController.getUserById);
router.put('/:id', authenticate, requireAdmin, usersController.updateUser);
router.delete('/:id', authenticate, requireAdmin, usersController.deleteUser);
router.get('/:id/addresses', authenticate, requireAdmin, usersController.getUserAddresses);

export default router;
