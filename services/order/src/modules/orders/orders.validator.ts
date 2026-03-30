import { z } from 'zod';

export const createOrderSchema = z.object({
  cartId: z.string().uuid(),
  shippingAddressId: z.string().uuid(),
  billingAddressId: z.string().uuid(),
  shippingMethod: z.string().optional(),
  notes: z.string().optional(),
});

export const updateOrderStatusSchema = z.object({
  status: z.string().min(1),
  note: z.string().optional(),
});

export const orderIdSchema = z.object({
  id: z.string().uuid(),
});

export const orderNumberSchema = z.object({
  orderNumber: z.string().min(1),
});

export const createReturnSchema = z.object({
  orderItemId: z.string().uuid(),
  quantity: z.number().int().positive(),
  reason: z.string().min(1),
});

export const orderQuerySchema = z.object({
  limit: z.string().optional().transform((val) => (val ? parseInt(val, 10) : 10)),
  offset: z.string().optional().transform((val) => (val ? parseInt(val, 10) : 0)),
});
