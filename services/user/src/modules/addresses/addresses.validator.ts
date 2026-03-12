import { z } from 'zod';

export const createAddressSchema = z.object({
  body: z.object({
    type: z.enum(['shipping', 'billing']).optional(),
    isDefault: z.boolean().optional(),
    firstName: z.string().min(1).max(100),
    lastName: z.string().min(1).max(100),
    company: z.string().optional(),
    addressLine1: z.string().min(1).max(255),
    addressLine2: z.string().optional(),
    city: z.string().min(1).max(100),
    state: z.string().min(1).max(100),
    postalCode: z.string().min(1).max(20),
    country: z.string().length(2),
    phone: z.string().optional(),
    deliveryInstructions: z.string().optional(),
  }),
});

export const updateAddressSchema = z.object({
  body: z.object({
    type: z.enum(['shipping', 'billing']).optional(),
    isDefault: z.boolean().optional(),
    firstName: z.string().min(1).max(100).optional(),
    lastName: z.string().min(1).max(100).optional(),
    company: z.string().nullable().optional(),
    addressLine1: z.string().min(1).max(255).optional(),
    addressLine2: z.string().nullable().optional(),
    city: z.string().min(1).max(100).optional(),
    state: z.string().min(1).max(100).optional(),
    postalCode: z.string().min(1).max(20).optional(),
    country: z.string().length(2).optional(),
    phone: z.string().nullable().optional(),
    deliveryInstructions: z.string().nullable().optional(),
  }),
});

export const addressIdSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
});

export type CreateAddressInput = z.infer<typeof createAddressSchema>['body'];
export type UpdateAddressInput = z.infer<typeof updateAddressSchema>['body'];
