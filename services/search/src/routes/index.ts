import { Router } from 'express';
import { searchRoutes } from '../modules';

const router = Router();

router.use('/search', searchRoutes);

export default router;
