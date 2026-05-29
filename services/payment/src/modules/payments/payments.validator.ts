import { z } from 'zod';

export const processPaymentSchema = z.object({
  orderId: z.string().uuid(),
  paymentMethod: z.string().min(1),
  paymentMethodId: z.string().optional(),
  savePaymentMethod: z.boolean().optional(),
});

export const refundPaymentSchema = z.object({
  amount: z.number().positive().optional(),
  reason: z.string().min(1),
});

export const paymentIdSchema = z.object({
  id: z.string().uuid(),
});

export const orderIdParamSchema = z.object({
  orderId: z.string().uuid(),
});
