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

/**
 * @swagger
 * /carts:
 *   get:
 *     tags: [Carts]
 *     summary: Get current cart
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Current cart retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get('/', authenticate, cartsController.getCart);

/**
 * @swagger
 * /carts/init:
 *   post:
 *     tags: [Carts]
 *     summary: Initialize or get cart
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Cart initialized or retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.post('/init', authenticate, cartsController.getOrCreateCart);

/**
 * @swagger
 * /carts/items:
 *   post:
 *     tags: [Carts]
 *     summary: Add item to cart
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [productId, quantity]
 *             properties:
 *               productId:
 *                 type: string
 *               quantity:
 *                 type: integer
 *               variantId:
 *                 type: string
 *               unitPrice:
 *                 type: number
 *     responses:
 *       201:
 *         description: Item added to cart successfully
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 */
router.post('/items', authenticate, validate(addToCartSchema), cartsController.addItem);

/**
 * @swagger
 * /carts/{cartId}/items/{itemId}:
 *   put:
 *     tags: [Carts]
 *     summary: Update cart item
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: cartId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: itemId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [quantity]
 *             properties:
 *               quantity:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Cart item updated successfully
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Cart or item not found
 */
router.put('/:cartId/items/:itemId', authenticate, validate(updateCartItemSchema), cartsController.updateItem);

/**
 * @swagger
 * /carts/{cartId}/items/{itemId}:
 *   delete:
 *     tags: [Carts]
 *     summary: Remove item from cart
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: cartId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: itemId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Item removed from cart successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Cart or item not found
 */
router.delete('/:cartId/items/:itemId', authenticate, cartsController.removeItem);

/**
 * @swagger
 * /carts/{cartId}/clear:
 *   delete:
 *     tags: [Carts]
 *     summary: Clear all items from cart
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: cartId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Cart cleared successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Cart not found
 */
router.delete('/:cartId/clear', authenticate, cartsController.clearCart);

/**
 * @swagger
 * /carts/{cartId}/coupon:
 *   post:
 *     tags: [Carts]
 *     summary: Apply coupon to cart
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: cartId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [couponCode]
 *             properties:
 *               couponCode:
 *                 type: string
 *     responses:
 *       200:
 *         description: Coupon applied successfully
 *       400:
 *         description: Invalid coupon
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Cart not found
 */
router.post('/:cartId/coupon', authenticate, validate(applyCouponSchema), cartsController.applyCoupon);

/**
 * @swagger
 * /carts/{cartId}/coupon:
 *   delete:
 *     tags: [Carts]
 *     summary: Remove coupon from cart
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: cartId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Coupon removed successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Cart not found
 */
router.delete('/:cartId/coupon', authenticate, cartsController.removeCoupon);

/**
 * @swagger
 * /carts/{cartId}:
 *   delete:
 *     tags: [Carts]
 *     summary: Delete entire cart
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: cartId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Cart deleted successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Cart not found
 */
router.delete('/:cartId', authenticate, cartsController.deleteCart);

export default router;
