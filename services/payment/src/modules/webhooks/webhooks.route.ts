import { Router } from 'express';
import { webhooksController } from './webhooks.controller';
import { rawBodyJson, verifyStripeSignature } from './webhooks.middleware';

const router = Router();

// Stripe requires the raw body for HMAC signature verification, so we capture
// it before express.json() and verify the signature inline.
router.post('/stripe', rawBodyJson, verifyStripeSignature, webhooksController.handleStripeWebhook);

router.post('/generic', webhooksController.handleGenericWebhook);

export default router;