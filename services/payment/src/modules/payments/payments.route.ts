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

router.post('/process', authenticate, validate(processPaymentSchema), paymentsController.processPayment);

router.get('/', authenticate, paymentsController.getMyPayments);

router.get('/:id', authenticate, validateParams(paymentIdSchema), paymentsController.getPaymentById);

router.get('/order/:orderId', authenticate, validateParams(orderIdParamSchema), paymentsController.getPaymentByOrderId);

router.post('/:id/refund', authenticate, validateParams(paymentIdSchema), validate(refundPaymentSchema), paymentsController.refundPayment);

export default router;
