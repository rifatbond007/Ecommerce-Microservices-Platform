import { Router, Request, Response, NextFunction } from 'express';
import { routerService } from './router.service';
import { proxyRequest, defaultRoutes } from './router.controller';
import { authMiddleware, optionalAuthMiddleware } from '../../middleware/auth.middleware';
import { logger } from '../../utils/logger';

const router = Router();

const setupRoutes = () => {
  const processedPaths = new Set<string>();

  defaultRoutes.forEach((route) => {
    const routeKey = `${route.method}:${route.path}`;
    if (processedPaths.has(routeKey)) return;
    processedPaths.add(routeKey);

    const authMiddlewareToUse = route.authRequired ? authMiddleware : optionalAuthMiddleware;
    const proxy = proxyRequest(route.targetService);

    if (route.method === 'ALL') {
      router.all(route.path, authMiddlewareToUse, (req, res, next) => {
        logger.debug(`Routing ${req.method} ${req.path} to ${route.targetService}`);
        proxy(req, res, next);
      });
    } else {
      const method = route.method.toLowerCase() as 'get' | 'post' | 'put' | 'delete' | 'patch';
      router[method](route.path, authMiddlewareToUse, (req, res, next) => {
        logger.debug(`Routing ${req.method} ${req.path} to ${route.targetService}`);
        proxy(req, res, next);
      });
    }

    logger.info(`Mapped ${route.method} ${route.path} -> ${route.targetService}`);
  });

  router.use((req: Request, res: Response, next: NextFunction) => {
    const resolved = routerService.resolveTargetService(req.path, req.method);

    if (!resolved) {
      next();
      return;
    }

    const authMiddlewareToUse = resolved.authRequired ? authMiddleware : optionalAuthMiddleware;
    authMiddlewareToUse(req, res, (err?: any) => {
      if (err) {
        next(err);
        return;
      }
      proxyRequest(resolved.service)(req, res, next);
    });
  });
};

setupRoutes();

/**
 * @swagger
 * /routes:
 *   get:
 *     summary: List all registered routes (admin only)
 *     tags: [Gateway]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of all registered routes
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *       401:
 *         description: Missing or invalid token
 *       403:
 *         description: Admin role required
 */
router.get('/routes', authMiddleware, (req: Request, res: Response) => {
  // Admin-only — exposes internal service routing that should not be public.
  if (req.user?.role !== 'admin') {
    res.status(403).json({
      success: false,
      error: { code: 'FORBIDDEN', message: 'Admin role required' },
    });
    return;
  }
  res.json({
    success: true,
    data: routerService.getAllRoutes(),
  });
});

export default router;
