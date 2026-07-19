import { Router } from 'express';
import { paymentsController } from './payments.controller';
import { authenticate } from '../../middleware';
import { validate, validateParams } from '../../utils/validate';
import {
  processPaymentSchema,
  refundPaymentSchema,
  paymentIdSchema,
  orderIdParamSchema,
} from './payments.validator';

const router = Router();

/**
 * @swagger
 * /payments/process:
 *   post:
 *     summary: Process a payment
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [orderId, paymentMethod]
 *             properties:
 *               orderId:
 *                 type: string
 *                 description: The ID of the order to pay for
 *               paymentMethod:
 *                 type: string
 *                 description: The payment method to use
 *     responses:
 *       200:
 *         description: Payment processed successfully
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 */
router.post('/process', authenticate, validate(processPaymentSchema), paymentsController.processPayment);

/**
 * @swagger
 * /payments/:
 *   get:
 *     summary: Get current user's payments
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of user's payments
 *       401:
 *         description: Unauthorized
 */
router.get('/', authenticate, paymentsController.getMyPayments);

/**
 * @swagger
 * /payments/{id}:
 *   get:
 *     summary: Get payment by ID
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Payment ID
 *     responses:
 *       200:
 *         description: Payment details
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Payment not found
 */
router.get('/:id', authenticate, validateParams(paymentIdSchema), paymentsController.getPaymentById);

/**
 * @swagger
 * /payments/order/{orderId}:
 *   get:
 *     summary: Get payment by order ID
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 *         description: Order ID
 *     responses:
 *       200:
 *         description: Payment details for the order
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Payment not found
 */
router.get('/order/:orderId', authenticate, validateParams(orderIdParamSchema), paymentsController.getPaymentByOrderId);

/**
 * @swagger
 * /payments/{id}/refund:
 *   post:
 *     summary: Request a refund
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Payment ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [reason]
 *             properties:
 *               reason:
 *                 type: string
 *                 description: Reason for the refund
 *     responses:
 *       200:
 *         description: Refund requested successfully
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Payment not found
 */
router.post('/:id/refund', authenticate, validateParams(paymentIdSchema), validate(refundPaymentSchema), paymentsController.refundPayment);

export default router;
