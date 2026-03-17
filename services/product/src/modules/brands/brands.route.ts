import { Router } from 'express';
import { brandsController } from './brands.controller';
import { authenticate, requireAdminOrSeller, optionalAuth } from '../../middleware';
import { validate } from '../../utils/validate';
import { createBrandSchema, updateBrandSchema } from './brands.validator';

const router = Router();

router.get('/', optionalAuth, brandsController.getBrands);

router.get('/slug/:slug', optionalAuth, brandsController.getBrandBySlug);

router.get('/:id', optionalAuth, brandsController.getBrandById);

router.post('/', authenticate, requireAdminOrSeller, validate(createBrandSchema), brandsController.createBrand);

router.put('/:id', authenticate, requireAdminOrSeller, validate(updateBrandSchema), brandsController.updateBrand);

router.delete('/:id', authenticate, requireAdminOrSeller, brandsController.deleteBrand);

export default router;
