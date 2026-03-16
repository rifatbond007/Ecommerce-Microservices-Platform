import { z } from 'zod';

export const createInventorySchema = z.object({
  body: z.object({
    productId: z.string().uuid(),
    variantId: z.string().uuid().optional(),
    warehouseId: z.string().uuid(),
    quantity: z.number().int().min(0).optional(),
    reorderPoint: z.number().int().min(0).optional(),
    reorderQuantity: z.number().int().min(0).optional(),
  }),
});

export const adjustInventorySchema = z.object({
  body: z.object({
    adjustment: z.number().int(),
  }),
});

export const reserveInventorySchema = z.object({
  body: z.object({
    quantity: z.number().int().positive(),
  }),
});

export const inventoryQuerySchema = z.object({
  query: z.object({
    page: z.string().optional(),
    limit: z.string().optional(),
    lowStock: z.boolean().optional(),
    outOfStock: z.boolean().optional(),
  }),
});

export const createWarehouseSchema = z.object({
  body: z.object({
    name: z.string().min(1).max(100),
    code: z.string().min(1).max(20),
    addressLine1: z.string().min(1).max(255),
    addressLine2: z.string().optional(),
    city: z.string().min(1).max(100),
    state: z.string().min(1).max(100),
    postalCode: z.string().min(1).max(20),
    country: z.string().length(2),
    isActive: z.boolean().optional(),
  }),
});

export const updateWarehouseSchema = z.object({
  body: z.object({
    name: z.string().min(1).max(100).optional(),
    code: z.string().min(1).max(20).optional(),
    addressLine1: z.string().min(1).max(255).optional(),
    addressLine2: z.string().nullable().optional(),
    city: z.string().min(1).max(100).optional(),
    state: z.string().min(1).max(100).optional(),
    postalCode: z.string().min(1).max(20).optional(),
    country: z.string().length(2).optional(),
    isActive: z.boolean().optional(),
  }),
});

export type CreateInventoryInput = z.infer<typeof createInventorySchema>['body'];
export type AdjustInventoryInput = z.infer<typeof adjustInventorySchema>['body'];
export type ReserveInventoryInput = z.infer<typeof reserveInventorySchema>['body'];
export type InventoryQueryInput = z.infer<typeof inventoryQuerySchema>['query'];
export type CreateWarehouseInput = z.infer<typeof createWarehouseSchema>['body'];
export type UpdateWarehouseInput = z.infer<typeof updateWarehouseSchema>['body'];
