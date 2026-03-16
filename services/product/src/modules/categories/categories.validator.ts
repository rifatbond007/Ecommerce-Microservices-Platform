import { z } from 'zod';

export const createCategorySchema = z.object({
  body: z.object({
    name: z.string().min(1).max(100),
    slug: z.string().min(1).max(100),
    description: z.string().optional(),
    imageUrl: z.string().url().optional(),
    parentId: z.string().uuid().optional(),
    isActive: z.boolean().optional(),
    displayOrder: z.number().int().optional(),
  }),
});

export const updateCategorySchema = z.object({
  body: z.object({
    name: z.string().min(1).max(100).optional(),
    slug: z.string().min(1).max(100).optional(),
    description: z.string().nullable().optional(),
    imageUrl: z.string().url().nullable().optional(),
    parentId: z.string().uuid().nullable().optional(),
    isActive: z.boolean().optional(),
    displayOrder: z.number().int().optional(),
  }),
});

export type CreateCategoryInput = z.infer<typeof createCategorySchema>['body'];
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>['body'];
