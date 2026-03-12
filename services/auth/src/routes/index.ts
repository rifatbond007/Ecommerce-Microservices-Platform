import { Router } from 'express';
import { authRoutes, usersRoutes } from '../modules';

const router = Router();

router.use('/', authRoutes);
router.use('/users', usersRoutes);

export default router;
