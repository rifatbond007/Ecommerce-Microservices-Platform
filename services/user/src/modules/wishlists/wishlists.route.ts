import { Router } from 'express';
import { wishlistsController } from './wishlists.controller';
import { authenticate } from '../../middleware';
import { validate, validateParams } from '../../utils/validate';
import { createWishlistSchema, updateWishlistSchema, wishlistIdSchema, addWishlistItemSchema } from './wishlists.validator';

const router = Router();

router.get('/', authenticate, wishlistsController.getWishlists);

router.get('/:id', authenticate, validateParams(wishlistIdSchema), wishlistsController.getWishlistById);

router.post('/', authenticate, validate(createWishlistSchema), wishlistsController.createWishlist);

router.put('/:id', authenticate, validateParams(wishlistIdSchema), validate(updateWishlistSchema), wishlistsController.updateWishlist);

router.delete('/:id', authenticate, validateParams(wishlistIdSchema), wishlistsController.deleteWishlist);

router.post('/:id/items', authenticate, validateParams(wishlistIdSchema), validate(addWishlistItemSchema), wishlistsController.addItem);

router.delete('/:id/items/:productId', authenticate, validateParams(wishlistIdSchema), wishlistsController.removeItem);

export default router;
