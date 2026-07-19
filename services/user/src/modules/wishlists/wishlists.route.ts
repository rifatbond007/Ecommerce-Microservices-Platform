import { Router } from 'express';
import { wishlistsController } from './wishlists.controller';
import { authenticate } from '../../middleware';
import { validate, validateParams } from '../../utils/validate';
import { createWishlistSchema, updateWishlistSchema, wishlistIdSchema, addWishlistItemSchema } from './wishlists.validator';

const router = Router();

/**
 * @swagger
 * /users/me/wishlists:
 *   get:
 *     tags: [Wishlists]
 *     summary: List user wishlists
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       '200':
 *         description: List of wishlists
 *       '401':
 *         description: Unauthorized
 */
router.get('/', authenticate, wishlistsController.getWishlists);

/**
 * @swagger
 * /users/me/wishlists/{id}:
 *   get:
 *     tags: [Wishlists]
 *     summary: Get wishlist by ID
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       '200':
 *         description: Wishlist details
 *       '401':
 *         description: Unauthorized
 *       '404':
 *         description: Wishlist not found
 */
router.get('/:id', authenticate, validateParams(wishlistIdSchema), wishlistsController.getWishlistById);

/**
 * @swagger
 * /users/me/wishlists:
 *   post:
 *     tags: [Wishlists]
 *     summary: Create a new wishlist
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               isPublic:
 *                 type: boolean
 *     responses:
 *       '201':
 *         description: Wishlist created
 *       '401':
 *         description: Unauthorized
 */
router.post('/', authenticate, validate(createWishlistSchema), wishlistsController.createWishlist);

/**
 * @swagger
 * /users/me/wishlists/{id}:
 *   put:
 *     tags: [Wishlists]
 *     summary: Update a wishlist
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               isPublic:
 *                 type: boolean
 *     responses:
 *       '200':
 *         description: Wishlist updated
 *       '401':
 *         description: Unauthorized
 *       '404':
 *         description: Wishlist not found
 */
router.put('/:id', authenticate, validateParams(wishlistIdSchema), validate(updateWishlistSchema), wishlistsController.updateWishlist);

/**
 * @swagger
 * /users/me/wishlists/{id}:
 *   delete:
 *     tags: [Wishlists]
 *     summary: Delete a wishlist
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       '200':
 *         description: Wishlist deleted
 *       '401':
 *         description: Unauthorized
 *       '404':
 *         description: Wishlist not found
 */
router.delete('/:id', authenticate, validateParams(wishlistIdSchema), wishlistsController.deleteWishlist);

/**
 * @swagger
 * /users/me/wishlists/{id}/items:
 *   post:
 *     tags: [Wishlists]
 *     summary: Add item to wishlist
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [productId]
 *             properties:
 *               productId:
 *                 type: string
 *                 format: uuid
 *               variantId:
 *                 type: string
 *                 format: uuid
 *               notes:
 *                 type: string
 *               priority:
 *                 type: number
 *     responses:
 *       '201':
 *         description: Item added to wishlist
 *       '401':
 *         description: Unauthorized
 *       '404':
 *         description: Wishlist not found
 */
router.post('/:id/items', authenticate, validateParams(wishlistIdSchema), validate(addWishlistItemSchema), wishlistsController.addItem);

/**
 * @swagger
 * /users/me/wishlists/{id}/items/{productId}:
 *   delete:
 *     tags: [Wishlists]
 *     summary: Remove item from wishlist
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       '200':
 *         description: Item removed from wishlist
 *       '401':
 *         description: Unauthorized
 *       '404':
 *         description: Wishlist or item not found
 */
router.delete('/:id/items/:productId', authenticate, validateParams(wishlistIdSchema), wishlistsController.removeItem);

export default router;
