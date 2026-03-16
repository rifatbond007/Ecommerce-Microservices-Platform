import { Router } from 'express';
import { variantsController } from './variants.controller';
import { authenticate, requireAdmin, optionalAuth } from '../../middleware';
import { validate } from '../../utils/validate';
import { createProductVariantSchema, updateProductVariantSchema } from './variants.validator';

const router = Router();

router.get('/product/:productId', optionalAuth, variantsController.getVariantsByProductId);

router.get('/:id', optionalAuth, variantsController.getVariantById);

router.post('/', authenticate, requireAdmin, validate(createProductVariantSchema), variantsController.createVariant);

router.put('/:id', authenticate, requireAdmin, validate(updateProductVariantSchema), variantsController.updateVariant);

router.delete('/:id', authenticate, requireAdmin, variantsController.deleteVariant);

export default router;
