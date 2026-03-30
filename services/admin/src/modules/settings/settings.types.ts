import { z } from 'zod';

export const settingSchema = z.object({
  key: z.string().min(1),
  value: z.string(),
  type: z.enum(['string', 'number', 'boolean', 'json']).default('string'),
  category: z.string().default('general'),
});

export const settingQuerySchema = z.object({
  category: z.string().optional(),
});

export type SettingInput = z.infer<typeof settingSchema>;
export type SettingQueryInput = z.infer<typeof settingQuerySchema>;
