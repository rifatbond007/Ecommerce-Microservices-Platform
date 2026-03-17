import { Router } from 'express';
import { variantsController } from './variants.controller';
import { authenticate, requireAdminOrSeller, optionalAuth } from '../../middleware';
import { validate } from '../../utils/validate';
import { createProductVariantSchema, updateProductVariantSchema } from './variants.validator';

const router = Router();

router.get('/product/:productId', optionalAuth, variantsController.getVariantsByProductId);

router.get('/:id', optionalAuth, variantsController.getVariantById);

router.post('/', authenticate, requireAdminOrSeller, validate(createProductVariantSchema), variantsController.createVariant);

router.put('/:id', authenticate, requireAdminOrSeller, validate(updateProductVariantSchema), variantsController.updateVariant);

router.delete('/:id', authenticate, requireAdminOrSeller, variantsController.deleteVariant);

export default router;
