import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { ValidationError } from '../utils/errors';

export const validate = (schema: ZodSchema) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      schema.parse({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const message = error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ');
        next(new ValidationError(message, { errors: error.errors }));
      } else {
        next(error);
      }
    }
  };
};

/**
 * Validates ONLY `req.params` against the given schema (which must be a
 * Zod schema with a top-level `params` key, e.g. `{ params: { id: uuid() } }`).
 * Use this for path-UUID routes — `validate()` would also parse body/query,
 * which is misleading when the schema is purely about params.
 */
export const validateParams = (schema: ZodSchema) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      schema.parse({ params: req.params });
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const message = error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ');
        next(new ValidationError(message, { errors: error.errors }));
      } else {
        next(error);
      }
    }
  };
};
