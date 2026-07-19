import { Router } from 'express';
import { webhooksController } from './webhooks.controller';
import { rawBodyJson, verifyStripeSignature } from './webhooks.middleware';

const router = Router();

// Stripe requires the raw body for HMAC signature verification, so we capture
// it before express.json() and verify the signature inline.

/**
 * @swagger
 * /webhooks/stripe:
 *   post:
 *     summary: Handle Stripe webhook
 *     tags: [Webhooks]
 *     description: Receives Stripe webhook events. Requires raw body for HMAC signature verification via the stripe-signature header.
 *     parameters:
 *       - in: header
 *         name: stripe-signature
 *         required: true
 *         schema:
 *           type: string
 *         description: Stripe HMAC signature for payload verification
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             description: Raw Stripe event payload
 *     responses:
 *       200:
 *         description: Webhook processed successfully
 *       400:
 *         description: Invalid signature or payload
 */
router.post('/stripe', rawBodyJson, verifyStripeSignature, webhooksController.handleStripeWebhook);

/**
 * @swagger
 * /webhooks/generic:
 *   post:
 *     summary: Generic webhook endpoint
 *     tags: [Webhooks]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             description: Arbitrary webhook payload
 *     responses:
 *       200:
 *         description: Webhook processed successfully
 *       400:
 *         description: Invalid payload
 */
router.post('/generic', webhooksController.handleGenericWebhook);

export default router;
