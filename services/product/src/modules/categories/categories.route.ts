import { Router } from 'express';
import { categoriesController } from './categories.controller';
import { authenticate, requireAdminOrSeller, optionalAuth } from '../../middleware';
import { validate } from '../../utils/validate';
import { createCategorySchema, updateCategorySchema } from './categories.validator';

const router = Router();

router.get('/', optionalAuth, categoriesController.getCategories);

router.get('/tree', optionalAuth, categoriesController.getCategoryTree);

router.get('/slug/:slug', optionalAuth, categoriesController.getCategoryBySlug);

router.get('/:id', optionalAuth, categoriesController.getCategoryById);

router.post('/', authenticate, requireAdminOrSeller, validate(createCategorySchema), categoriesController.createCategory);

router.put('/:id', authenticate, requireAdminOrSeller, validate(updateCategorySchema), categoriesController.updateCategory);

router.delete('/:id', authenticate, requireAdminOrSeller, categoriesController.deleteCategory);

export default router;
