import { z } from 'zod';

export const createProductSchema = z.object({
  body: z.object({
    sku: z.string().min(1).max(50),
    name: z.string().min(1).max(255),
    slug: z.string().min(1).max(255),
    description: z.string().optional(),
    categoryId: z.string().uuid(),
    brandId: z.string().uuid().optional(),
    basePrice: z.number().positive(),
    compareAtPrice: z.number().positive().optional(),
    costPerItem: z.number().positive().optional(),
    weight: z.number().positive().optional(),
    requiresShipping: z.boolean().optional(),
    isTaxable: z.boolean().optional(),
    taxRate: z.number().min(0).max(100).optional(),
    tags: z.array(z.string()).optional(),
    images: z.array(z.string()).optional(),
    videoUrl: z.string().url().optional(),
    metaTitle: z.string().max(70).optional(),
    metaDescription: z.string().max(160).optional(),
    isActive: z.boolean().optional(),
    isFeatured: z.boolean().optional(),
  }),
});

export const updateProductSchema = z.object({
  body: z.object({
    sku: z.string().min(1).max(50).optional(),
    name: z.string().min(1).max(255).optional(),
    slug: z.string().min(1).max(255).optional(),
    description: z.string().nullable().optional(),
    categoryId: z.string().uuid().optional(),
    brandId: z.string().uuid().nullable().optional(),
    basePrice: z.number().positive().optional(),
    compareAtPrice: z.number().positive().nullable().optional(),
    costPerItem: z.number().positive().nullable().optional(),
    weight: z.number().positive().nullable().optional(),
    requiresShipping: z.boolean().optional(),
    isTaxable: z.boolean().optional(),
    taxRate: z.number().min(0).max(100).nullable().optional(),
    tags: z.array(z.string()).optional(),
    images: z.array(z.string()).optional(),
    videoUrl: z.string().url().nullable().optional(),
    metaTitle: z.string().max(70).nullable().optional(),
    metaDescription: z.string().max(160).nullable().optional(),
    isActive: z.boolean().optional(),
    isFeatured: z.boolean().optional(),
  }),
});

export const productQuerySchema = z.object({
  query: z.object({
    categoryId: z.string().uuid().optional(),
    brandId: z.string().uuid().optional(),
    isActive: z.boolean().optional(),
    isFeatured: z.boolean().optional(),
    search: z.string().optional(),
    minPrice: z.coerce.number().optional(),
    maxPrice: z.coerce.number().optional(),
    page: z.string().optional(),
    limit: z.string().optional(),
  }),
});

export type CreateProductInput = z.infer<typeof createProductSchema>['body'];
export type UpdateProductInput = z.infer<typeof updateProductSchema>['body'];
export type ProductQueryInput = z.infer<typeof productQuerySchema>['query'];
