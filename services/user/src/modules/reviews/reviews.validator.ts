import { z } from 'zod';

export const createReviewSchema = z.object({
  body: z.object({
    productId: z.string().uuid(),
    orderId: z.string().uuid().optional(),
    rating: z.number().int().min(1).max(5),
    title: z.string().min(1).max(255),
    content: z.string().min(1),
    images: z.array(z.string().url()).optional(),
  }),
});

export const updateReviewSchema = z.object({
  body: z.object({
    rating: z.number().int().min(1).max(5).optional(),
    title: z.string().min(1).max(255).optional(),
    content: z.string().min(1).optional(),
    images: z.array(z.string().url()).optional(),
  }),
});

export const reviewIdSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
});

export const productReviewsSchema = z.object({
  query: z.object({
    page: z.string().regex(/^\d+$/).optional(),
    limit: z.string().regex(/^\d+$/).optional(),
  }),
});

export type CreateReviewInput = z.infer<typeof createReviewSchema>['body'];
export type UpdateReviewInput = z.infer<typeof updateReviewSchema>['body'];
