import { Router } from 'express';
import { routerRoutes } from '../modules/router';

const router = Router();

router.use(routerRoutes);

export default router;
