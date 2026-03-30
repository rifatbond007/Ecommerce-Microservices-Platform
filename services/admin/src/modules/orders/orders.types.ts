import { z } from 'zod';

export const updateOrderStatusSchema = z.object({
  status: z.enum(['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled']).optional(),
  fulfillmentStatus: z.enum(['unfulfilled', 'partial', 'fulfilled']).optional(),
  financialStatus: z.enum(['pending', 'paid', 'failed', 'refunded', 'partially_refunded']).optional(),
  shippingTrackingNumber: z.string().optional(),
  shippingCarrier: z.string().optional(),
  notes: z.string().optional(),
});

export const orderQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  status: z.string().optional(),
  financialStatus: z.string().optional(),
  userId: z.string().optional(),
  orderNumber: z.string().optional(),
});

export type UpdateOrderStatusInput = z.infer<typeof updateOrderStatusSchema>;
export type OrderQueryInput = z.infer<typeof orderQuerySchema>;
