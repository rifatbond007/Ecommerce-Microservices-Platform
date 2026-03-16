import { Router } from 'express';
import { cartsController } from './carts.controller';
import { validate } from '../../utils/validate';
import { 
  addToCartSchema, 
  updateCartItemSchema, 
  applyCouponSchema
} from './carts.validator';

const router = Router();

router.get('/', cartsController.getCart);
router.post('/init', cartsController.getOrCreateCart);
router.post('/items', validate(addToCartSchema), cartsController.addItem);
router.put('/:cartId/items/:itemId', validate(updateCartItemSchema), cartsController.updateItem);
router.delete('/:cartId/items/:itemId', cartsController.removeItem);
router.delete('/:cartId/clear', cartsController.clearCart);
router.post('/:cartId/coupon', validate(applyCouponSchema), cartsController.applyCoupon);
router.delete('/:cartId/coupon', cartsController.removeCoupon);
router.delete('/:cartId', cartsController.deleteCart);

export default router;
