import { z } from 'zod';

const stripeObjectSchema = z.object({
  id: z.string(),
  amount: z.number().optional(),
  currency: z.string().optional(),
  latest_charge: z.string().optional(),
  last_payment_error: z
    .object({
      message: z.string().optional(),
    })
    .optional(),
  metadata: z.record(z.string()).optional(),
});

export const stripeWebhookSchema = z.object({
  id: z.string(),
  type: z.string(),
  data: z.object({
    object: stripeObjectSchema,
  }),
  created: z.number(),
  livemode: z.boolean(),
});

export const genericWebhookSchema = z.object({
  type: z.string(),
  data: z.record(z.unknown()),
  timestamp: z.string().optional(),
  source: z.string().optional(),
});

export type StripeWebhookPayload = z.infer<typeof stripeWebhookSchema>;
export type GenericWebhookPayload = z.infer<typeof genericWebhookSchema>;
