import { Router } from 'express';
import { ordersController } from './orders.controller';
import { authenticate, requireAdmin } from '../../middleware';
import { validate, validateParams, validateQuery } from '../../utils/validate';
import { 
  createOrderSchema, 
  updateOrderStatusSchema, 
  orderIdSchema,
  createReturnSchema,
  orderQuerySchema
} from './orders.validator';

const router = Router();

/**
 * @swagger
 * /orders:
 *   get:
 *     tags: [Orders]
 *     summary: List orders
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Maximum number of orders to return
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *         description: Number of orders to skip
 *     responses:
 *       200:
 *         description: List of orders retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get('/', authenticate, validateQuery(orderQuerySchema), ordersController.getOrders);

/**
 * @swagger
 * /orders/{id}:
 *   get:
 *     tags: [Orders]
 *     summary: Get order by ID
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Order retrieved successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Order not found
 */
router.get('/:id', authenticate, validateParams(orderIdSchema), ordersController.getOrderById);

/**
 * @swagger
 * /orders/number/{orderNumber}:
 *   get:
 *     tags: [Orders]
 *     summary: Get order by order number
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderNumber
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Order retrieved successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Order not found
 */
router.get('/number/:orderNumber', authenticate, ordersController.getOrderByNumber);

/**
 * @swagger
 * /orders:
 *   post:
 *     tags: [Orders]
 *     summary: Create order
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [cartId, shippingAddressId, billingAddressId]
 *             properties:
 *               cartId:
 *                 type: string
 *               shippingAddressId:
 *                 type: string
 *               billingAddressId:
 *                 type: string
 *               shippingMethod:
 *                 type: string
 *               notes:
 *                 type: string
 *     responses:
 *       201:
 *         description: Order created successfully
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 */
router.post('/', authenticate, validate(createOrderSchema), ordersController.createOrder);

/**
 * @swagger
 * /orders/{id}/status:
 *   put:
 *     tags: [Orders]
 *     summary: Update order status
 *     description: Admin only. Update the status of an order.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [status]
 *             properties:
 *               status:
 *                 type: string
 *               note:
 *                 type: string
 *     responses:
 *       200:
 *         description: Order status updated successfully
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - admin only
 *       404:
 *         description: Order not found
 */
router.put('/:id/status', authenticate, requireAdmin, validateParams(orderIdSchema), validate(updateOrderStatusSchema), ordersController.updateOrderStatus);

/**
 * @swagger
 * /orders/{id}/return:
 *   post:
 *     tags: [Orders]
 *     summary: Request return
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [orderItemId, quantity, reason]
 *             properties:
 *               orderItemId:
 *                 type: string
 *               quantity:
 *                 type: integer
 *               reason:
 *                 type: string
 *     responses:
 *       201:
 *         description: Return request created successfully
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Order not found
 */
router.post('/:id/return', authenticate, validateParams(orderIdSchema), validate(createReturnSchema), ordersController.createReturn);

export default router;
