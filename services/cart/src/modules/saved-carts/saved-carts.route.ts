import { Router } from 'express';
import { savedCartsController } from './saved-carts.controller';
import { authenticate } from '../../middleware';
import { validate } from '../../utils/validate';
import { createSavedCartSchema, updateSavedCartSchema, savedCartIdSchema } from './saved-carts.validator';

const router = Router();

router.get('/', authenticate, savedCartsController.getSavedCarts);
router.get('/:id', authenticate, validate(savedCartIdSchema), savedCartsController.getSavedCartById);
router.post('/', authenticate, validate(createSavedCartSchema), savedCartsController.createSavedCart);
router.put('/:id', authenticate, validate(updateSavedCartSchema), savedCartsController.updateSavedCart);
router.delete('/:id', authenticate, validate(savedCartIdSchema), savedCartsController.deleteSavedCart);

export default router;
