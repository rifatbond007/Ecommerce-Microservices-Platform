import { Router } from 'express';
import { cartsController } from './carts.controller';
import { authenticate } from '../../middleware';
import { validate } from '../../utils/validate';
import { 
  addToCartSchema, 
  updateCartItemSchema, 
  applyCouponSchema
} from './carts.validator';

const router = Router();

router.get('/', authenticate, cartsController.getCart);
router.post('/init', authenticate, cartsController.getOrCreateCart);
router.post('/items', authenticate, validate(addToCartSchema), cartsController.addItem);
router.put('/:cartId/items/:itemId', authenticate, validate(updateCartItemSchema), cartsController.updateItem);
router.delete('/:cartId/items/:itemId', authenticate, cartsController.removeItem);
router.delete('/:cartId/clear', authenticate, cartsController.clearCart);
router.post('/:cartId/coupon', authenticate, validate(applyCouponSchema), cartsController.applyCoupon);
router.delete('/:cartId/coupon', authenticate, cartsController.removeCoupon);
router.delete('/:cartId', authenticate, cartsController.deleteCart);

export default router;
