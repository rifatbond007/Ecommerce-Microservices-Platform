import { z } from 'zod';

export const searchQuerySchema = z.object({
  q: z.string().min(1).max(200),
  category: z.string().optional(),
  minPrice: z.string().optional().transform((v) => (v ? parseFloat(v) : undefined)),
  maxPrice: z.string().optional().transform((v) => (v ? parseFloat(v) : undefined)),
  limit: z.string().optional().transform((v) => (v ? parseInt(v, 10) : 20)),
  offset: z.string().optional().transform((v) => (v ? parseInt(v, 10) : 0)),
});

export const suggestionsQuerySchema = z.object({
  q: z.string().min(1).max(100),
  limit: z.string().optional().transform((v) => (v ? parseInt(v, 10) : 5)),
});

export const trendingQuerySchema = z.object({
  limit: z.string().optional().transform((v) => (v ? parseInt(v, 10) : 10)),
});

export const clickBodySchema = z.object({
  productId: z.string().uuid(),
  logId: z.string().uuid().optional(),
});
