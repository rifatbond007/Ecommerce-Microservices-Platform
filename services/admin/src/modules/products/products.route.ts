import { Router } from 'express';
import { productsController } from './products.controller';
import { authenticate, requireAdmin } from '../../middleware';

const router = Router();

router.get('/products', authenticate, requireAdmin, productsController.getProducts);
router.get('/products/:id', authenticate, requireAdmin, productsController.getProductById);
router.put('/products/:id', authenticate, requireAdmin, productsController.updateProduct);
router.delete('/products/:id', authenticate, requireAdmin, productsController.deleteProduct);
router.patch('/products/:id/active', authenticate, requireAdmin, productsController.toggleProductActive);
router.patch('/products/:id/featured', authenticate, requireAdmin, productsController.toggleProductFeatured);

export default router;
