import { z } from 'zod';
import { ValidationError } from './errors';

export const validate = <T extends z.ZodSchema>(schema: T, data: unknown): z.infer<T> => {
  const result = schema.safeParse(data);
  if (!result.success) {
    const messages = result.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
    throw new ValidationError(messages);
  }
  return result.data;
};

export const validateParams = <T extends z.ZodSchema>(schema: T, data: unknown): z.infer<T> => {
  const result = schema.safeParse(data);
  if (!result.success) {
    const messages = result.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
    throw new ValidationError(messages);
  }
  return result.data;
};

export const validateQuery = <T extends z.ZodSchema>(schema: T, data: unknown): z.infer<T> => {
  const result = schema.safeParse(data);
  if (!result.success) {
    const messages = result.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
    throw new ValidationError(messages);
  }
  return result.data;
};
