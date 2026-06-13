import { Router } from 'express';
import { productsController } from './products.controller';
import { authenticate, requireAdmin } from '../../middleware';

const router = Router();

router.get('/', authenticate, requireAdmin, productsController.getProducts);
router.get('/:id', authenticate, requireAdmin, productsController.getProductById);
router.put('/:id', authenticate, requireAdmin, productsController.updateProduct);
router.delete('/:id', authenticate, requireAdmin, productsController.deleteProduct);
router.patch('/:id/active', authenticate, requireAdmin, productsController.toggleProductActive);
router.patch('/:id/featured', authenticate, requireAdmin, productsController.toggleProductFeatured);

export default router;
