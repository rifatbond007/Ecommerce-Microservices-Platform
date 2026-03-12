import { Request, Response, NextFunction } from 'express';
import httpProxy from 'http-proxy';
import { config } from '../../config';
import { logger } from '../../utils/logger';
import { ServiceUnavailableError } from '../../utils/errors';

const proxy = httpProxy.createProxyServer({
  changeOrigin: true,
  timeout: 30000,
  proxyTimeout: 30000,
});

proxy.on('error', (err, req, res) => {
  logger.error('Proxy error:', err);
  if (!res.headersSent) {
    new ServiceUnavailableError('Upstream service unavailable');
  }
});

proxy.on('econnreset', (err, req, res) => {
  logger.error('Connection reset by upstream:', err);
});

export interface ServiceRoute {
  path: string;
  method: string;
  targetService: keyof typeof config.services;
  authRequired: boolean;
}

export const defaultRoutes: ServiceRoute[] = [
  { path: '/api/v1/auth', method: 'ALL', targetService: 'auth', authRequired: false },
  { path: '/api/v1/users', method: 'ALL', targetService: 'user', authRequired: true },
  { path: '/api/v1/products', method: 'ALL', targetService: 'product', authRequired: false },
  { path: '/api/v1/cart', method: 'ALL', targetService: 'cart', authRequired: true },
  { path: '/api/v1/orders', method: 'ALL', targetService: 'order', authRequired: true },
  { path: '/api/v1/payments', method: 'ALL', targetService: 'payment', authRequired: true },
  { path: '/api/v1/notifications', method: 'ALL', targetService: 'notification', authRequired: true },
  { path: '/api/v1/search', method: 'ALL', targetService: 'search', authRequired: false },
  { path: '/api/v1/admin', method: 'ALL', targetService: 'admin', authRequired: true },
];

export const getTargetUrl = (serviceName: keyof typeof config.services): string => {
  return config.services[serviceName];
};

export const proxyRequest = (serviceName: keyof typeof config.services) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const targetUrl = getTargetUrl(serviceName);
    
    logger.debug(`Proxying ${req.method} ${req.path} to ${targetUrl}`);
    
    req.headers['x-forwarded-for'] = req.ip || '';
    req.headers['x-original-method'] = req.method;
    req.headers['x-original-path'] = req.path;

    if (req.user) {
      req.headers['x-user-id'] = req.user.sub;
      req.headers['x-user-email'] = req.user.email;
      req.headers['x-user-role'] = req.user.role;
    }

    proxy.web(req, res, { target: targetUrl }, (err) => {
      if (err) {
        logger.error(`Proxy error for ${serviceName}:`, err);
        next(new ServiceUnavailableError(`Failed to connect to ${serviceName}`));
      }
    });
  };
};

export const closeProxy = (): void => {
  proxy.close();
};
