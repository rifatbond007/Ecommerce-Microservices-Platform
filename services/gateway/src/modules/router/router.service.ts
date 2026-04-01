import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../shared/prisma/prisma.client';
import { ServiceRoute, defaultRoutes, getTargetUrl } from './router.controller';
import { logger } from '../../utils/logger';
import { NotFoundError } from '../../utils/errors';

export class RouterService {
  private routes: ServiceRoute[] = [];

  constructor() {
    this.routes = [...defaultRoutes];
  }

  async loadRoutesFromDb(): Promise<void> {
    try {
      const dbRoutes = await prisma.routeConfig.findMany();
      
      const dbRouteMappings: ServiceRoute[] = dbRoutes.map((route) => ({
        path: route.path,
        method: route.method.toUpperCase(),
        targetService: route.targetService as keyof typeof import('../../config').config.services,
        authRequired: route.authRequired,
      }));

      this.routes = [...defaultRoutes, ...dbRouteMappings];
      logger.info(`Loaded ${dbRouteMappings.length} routes from database`);
    } catch (error) {
      logger.warn('Failed to load routes from database, using defaults:', error);
    }
  }

  findRoute(path: string, method: string): ServiceRoute | undefined {
    const normalizedPath = path.replace(/^\/api\/v1/, '');

    const routesWithoutPrefix = this.routes.map(r => ({
      ...r,
      path: r.path.replace(/^\/api\/v1/, ''),
    }));

    const normalizedMethod = method.toUpperCase();

    const exactMatch = routesWithoutPrefix.find(
      (route) => route.path === normalizedPath && 
                 (route.method === 'ALL' || route.method === normalizedMethod)
    );

    if (exactMatch) return this.routes.find(r => r.path === `/${exactMatch.path.replace(/^\//, '')}`);

    const prefixMatch = routesWithoutPrefix.find((route) => {
      if (route.method !== 'ALL' && route.method !== normalizedMethod) return false;
      return normalizedPath.startsWith(route.path);
    });

    if (prefixMatch) {
      return this.routes.find(r => r.path === `/${prefixMatch.path.replace(/^\//, '')}`);
    }

    return undefined;
  }

  resolveTargetService(path: string, method: string): { 
    service: keyof ReturnType<typeof import('../../config').config.services>; 
    url: string;
    authRequired: boolean;
  } | null {
    const route = this.findRoute(path, method);
    
    if (!route) {
      return null;
    }

    return {
      service: route.targetService,
      url: getTargetUrl(route.targetService),
      authRequired: route.authRequired,
    };
  }

  getAllRoutes(): ServiceRoute[] {
    return this.routes;
  }

  addRoute(route: ServiceRoute): void {
    this.routes.push(route);
  }

  removeRoute(path: string, method: string): boolean {
    const index = this.routes.findIndex(
      (r) => r.path === path && r.method === method
    );
    
    if (index > -1) {
      this.routes.splice(index, 1);
      return true;
    }
    return false;
  }
}

export const routerService = new RouterService();
