import { Router } from 'express';
import { usersController } from './users.controller';
import { authenticate, requireAdmin } from '../../middleware';

const router = Router();

router.get('/users', authenticate, requireAdmin, usersController.getUsers);
router.get('/users/:id', authenticate, requireAdmin, usersController.getUserById);
router.put('/users/:id', authenticate, requireAdmin, usersController.updateUser);
router.delete('/users/:id', authenticate, requireAdmin, usersController.deleteUser);
router.get('/users/:id/addresses', authenticate, requireAdmin, usersController.getUserAddresses);

export default router;
