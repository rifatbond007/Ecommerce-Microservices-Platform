import { z } from 'zod';

export const addToCartSchema = z.object({
  body: z.object({
    cartId: z.string().uuid('Invalid cart ID'),
    productId: z.string().uuid('Invalid product ID'),
    variantId: z.string().uuid().optional(),
    quantity: z.number().int().positive('Quantity must be a positive integer'),
    unitPrice: z.number().positive('Unit price must be positive'),
  }),
});

export const updateCartItemSchema = z.object({
  body: z.object({
    quantity: z.number().int().min(0, 'Quantity must be 0 or more'),
    unitPrice: z.number().positive('Unit price must be positive'),
  }),
});

export const applyCouponSchema = z.object({
  body: z.object({
    // Accept both `code` (preferred, what api-test sends) and `couponCode`
    // (legacy/internal callers). Controller normalizes before passing to service.
    code: z.string().min(1, 'Coupon code is required').optional(),
    couponCode: z.string().min(1, 'Coupon code is required').optional(),
  }).refine(
    (data) => Boolean(data.code || data.couponCode),
    { message: 'Coupon code is required (provide either `code` or `couponCode`)' }
  ),
});

export const cartIdSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid cart ID'),
  }),
});

export const itemIdSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid item ID'),
    itemId: z.string().uuid('Invalid item ID'),
  }),
});

export type AddToCartInput = z.infer<typeof addToCartSchema>['body'];
export type UpdateCartItemInput = z.infer<typeof updateCartItemSchema>['body'];
export type ApplyCouponInput = z.infer<typeof applyCouponSchema>['body'];
