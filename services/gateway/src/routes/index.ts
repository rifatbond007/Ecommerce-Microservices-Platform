import { Router } from 'express';
import { routerRoutes } from '../modules/router';
import { docsRoutes } from '../modules/docs';

const router = Router();

router.use('/docs', docsRoutes);
router.use(routerRoutes);

export default router;
