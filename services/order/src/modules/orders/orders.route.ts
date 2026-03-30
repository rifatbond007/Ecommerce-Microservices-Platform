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

router.get('/', authenticate, validateQuery(orderQuerySchema), ordersController.getOrders);

router.get('/:id', authenticate, validateParams(orderIdSchema), ordersController.getOrderById);

router.get('/number/:orderNumber', authenticate, ordersController.getOrderByNumber);

router.post('/', authenticate, validate(createOrderSchema), ordersController.createOrder);

router.put('/:id/status', authenticate, requireAdmin, validateParams(orderIdSchema), validate(updateOrderStatusSchema), ordersController.updateOrderStatus);

router.post('/:id/return', authenticate, validateParams(orderIdSchema), validate(createReturnSchema), ordersController.createReturn);

export default router;
