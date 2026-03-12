import { z } from 'zod';

export const createWishlistSchema = z.object({
  body: z.object({
    name: z.string().min(1).max(100).optional(),
    isPublic: z.boolean().optional(),
  }),
});

export const updateWishlistSchema = z.object({
  body: z.object({
    name: z.string().min(1).max(100).optional(),
    isPublic: z.boolean().optional(),
  }),
});

export const wishlistIdSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
});

export const addWishlistItemSchema = z.object({
  body: z.object({
    productId: z.string().uuid(),
    variantId: z.string().uuid().optional(),
    notes: z.string().optional(),
    priority: z.number().optional(),
  }),
});

export type CreateWishlistInput = z.infer<typeof createWishlistSchema>['body'];
export type UpdateWishlistInput = z.infer<typeof updateWishlistSchema>['body'];
export type AddWishlistItemInput = z.infer<typeof addWishlistItemSchema>['body'];
