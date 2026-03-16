import { z } from 'zod';

export const createProductVariantSchema = z.object({
  body: z.object({
    productId: z.string().uuid(),
    sku: z.string().min(1).max(50),
    name: z.string().min(1).max(255),
    price: z.number().positive(),
    compareAtPrice: z.number().positive().optional(),
    costPerItem: z.number().positive().optional(),
    inventoryQuantity: z.number().int().min(0).optional(),
    inventoryPolicy: z.enum(['deny', 'continue']).optional(),
    weight: z.number().positive().optional(),
    barcode: z.string().optional(),
    options: z.record(z.string()).optional(),
    isActive: z.boolean().optional(),
  }),
});

export const updateProductVariantSchema = z.object({
  body: z.object({
    sku: z.string().min(1).max(50).optional(),
    name: z.string().min(1).max(255).optional(),
    price: z.number().positive().optional(),
    compareAtPrice: z.number().positive().nullable().optional(),
    costPerItem: z.number().positive().nullable().optional(),
    inventoryQuantity: z.number().int().min(0).optional(),
    inventoryPolicy: z.enum(['deny', 'continue']).optional(),
    weight: z.number().positive().nullable().optional(),
    barcode: z.string().nullable().optional(),
    options: z.record(z.string()).optional(),
    isActive: z.boolean().optional(),
  }),
});

export type CreateProductVariantInput = z.infer<typeof createProductVariantSchema>['body'];
export type UpdateProductVariantInput = z.infer<typeof updateProductVariantSchema>['body'];
