import { z } from 'zod';

export const createSavedCartSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Name is required'),
    items: z.array(z.object({
      productId: z.string().uuid('Invalid product ID'),
      variantId: z.string().uuid().optional(),
      quantity: z.number().int().positive(),
      unitPrice: z.number().positive(),
    })),
    originalCartId: z.string().uuid().optional(),
  }),
});

export const updateSavedCartSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Name is required'),
    items: z.array(z.object({
      productId: z.string().uuid('Invalid product ID'),
      variantId: z.string().uuid().optional(),
      quantity: z.number().int().positive(),
      unitPrice: z.number().positive(),
    })),
  }),
});

export const savedCartIdSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid cart ID'),
  }),
});

export type CreateSavedCartInput = z.infer<typeof createSavedCartSchema>['body'];
export type UpdateSavedCartInput = z.infer<typeof updateSavedCartSchema>['body'];
