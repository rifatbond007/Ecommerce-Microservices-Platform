import { Router } from 'express';
import { brandsController } from './brands.controller';
import { authenticate, requireAdmin, optionalAuth } from '../../middleware';
import { validate } from '../../utils/validate';
import { createBrandSchema, updateBrandSchema } from './brands.validator';

const router = Router();

router.get('/', optionalAuth, brandsController.getBrands);

router.get('/slug/:slug', optionalAuth, brandsController.getBrandBySlug);

router.get('/:id', optionalAuth, brandsController.getBrandById);

router.post('/', authenticate, requireAdmin, validate(createBrandSchema), brandsController.createBrand);

router.put('/:id', authenticate, requireAdmin, validate(updateBrandSchema), brandsController.updateBrand);

router.delete('/:id', authenticate, requireAdmin, brandsController.deleteBrand);

export default router;
