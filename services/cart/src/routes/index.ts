import { Router } from 'express';
import { cartsRouter } from '../modules/carts';
import { savedCartsRouter } from '../modules/saved-carts';

const router = Router();

router.use('/carts', cartsRouter);
router.use('/saved-carts', savedCartsRouter);

export default router;
