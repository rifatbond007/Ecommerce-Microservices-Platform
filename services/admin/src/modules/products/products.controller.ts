import { Response, NextFunction } from 'express';
import { productsService } from './products.service';
import { validateQuery, validate } from '../../utils/validate';
import { updateProductSchema, productQuerySchema } from './products.types';
import type { AuthRequest } from '../../middleware';

/** Forward the admin's Bearer token (see users.controller.ts for context). */
function extractToken(req: AuthRequest): string | undefined {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) return undefined;
  return auth.substring(7);
}

export class ProductsController {
  async getProducts(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const query = validateQuery(productQuerySchema, req.query);
      const result = await productsService.findAll(query, req.user!.id, req.ip, extractToken(req));

      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async getProductById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const result = await productsService.findById(id, req.user!.id, req.ip, extractToken(req));

      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async updateProduct(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const input = validate(updateProductSchema, req.body);
      const result = await productsService.update(id, input, req.user!.id, req.ip, extractToken(req));

      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async deleteProduct(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const result = await productsService.delete(id, req.user!.id, req.ip, extractToken(req));

      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async toggleProductActive(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const result = await productsService.toggleActive(id, req.user!.id, req.ip, extractToken(req));

      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async toggleProductFeatured(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const result = await productsService.toggleFeatured(id, req.user!.id, req.ip, extractToken(req));

      res.json(result);
    } catch (error) {
      next(error);
    }
  }
}

export const productsController = new ProductsController();