import { Router } from 'express';
import { savedCartsController } from './saved-carts.controller';
import { validate } from '../../utils/validate';
import { createSavedCartSchema, updateSavedCartSchema, savedCartIdSchema } from './saved-carts.validator';

const router = Router();

router.get('/', savedCartsController.getSavedCarts);
router.get('/:id', validate(savedCartIdSchema), savedCartsController.getSavedCartById);
router.post('/', validate(createSavedCartSchema), savedCartsController.createSavedCart);
router.put('/:id', validate(updateSavedCartSchema), savedCartsController.updateSavedCart);
router.delete('/:id', validate(savedCartIdSchema), savedCartsController.deleteSavedCart);

export default router;
