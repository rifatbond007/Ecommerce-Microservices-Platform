import { Router } from 'express';
import { webhooksController } from './webhooks.controller';

const router = Router();

router.post('/stripe', webhooksController.handleStripeWebhook);

router.post('/generic', webhooksController.handleGenericWebhook);

export default router;
