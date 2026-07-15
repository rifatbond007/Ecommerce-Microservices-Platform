import { Router } from 'express';
import { docsIndexHandler, docsProxyHandler } from './docs.controller';

const router = Router();

router.get('/', docsIndexHandler);
router.get('/:name', docsProxyHandler);

export default router;