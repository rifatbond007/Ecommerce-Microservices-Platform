import { Router } from 'express';
import { productsController } from './products.controller';
import { authenticate, requireAdminOrSeller, optionalAuth } from '../../middleware';
import { validate } from '../../utils/validate';
import { createProductSchema, updateProductSchema, productQuerySchema } from './products.validator';

const router = Router();

router.get('/', optionalAuth, validate(productQuerySchema), productsController.getProducts);

router.get('/featured', optionalAuth, productsController.getFeaturedProducts);

router.get('/slug/:slug', optionalAuth, productsController.getProductBySlug);

router.get('/:id', optionalAuth, productsController.getProductById);

router.post('/', authenticate, requireAdminOrSeller, validate(createProductSchema), productsController.createProduct);

router.put('/:id', authenticate, requireAdminOrSeller, validate(updateProductSchema), productsController.updateProduct);

router.delete('/:id', authenticate, requireAdminOrSeller, productsController.deleteProduct);

export default router;
