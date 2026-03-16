import { z } from 'zod';

export const createBrandSchema = z.object({
  body: z.object({
    name: z.string().min(1).max(100),
    slug: z.string().min(1).max(100),
    description: z.string().optional(),
    logoUrl: z.string().url().optional(),
    website: z.string().url().optional(),
    isActive: z.boolean().optional(),
  }),
});

export const updateBrandSchema = z.object({
  body: z.object({
    name: z.string().min(1).max(100).optional(),
    slug: z.string().min(1).max(100).optional(),
    description: z.string().nullable().optional(),
    logoUrl: z.string().url().nullable().optional(),
    website: z.string().url().nullable().optional(),
    isActive: z.boolean().optional(),
  }),
});

export type CreateBrandInput = z.infer<typeof createBrandSchema>['body'];
export type UpdateBrandInput = z.infer<typeof updateBrandSchema>['body'];
