import { Request, Response, NextFunction } from 'express';
import httpProxy from 'http-proxy';
import { config } from '../../config';
import { logger } from '../../utils/logger';
import { ServiceUnavailableError } from '../../utils/errors';
import { signRequest } from '../../utils/sign';

const proxy = httpProxy.createProxyServer({
  changeOrigin: true,
  timeout: 30000,
  proxyTimeout: 30000,
  // We always read the body in app.ts via `express.json({ verify })` so we can
  // forward it manually via the `proxyReq` listener below. Disable the default
  // auto-pipe of the original request stream, otherwise http-proxy races with
  // our manual write and POST bodies (e.g. /api/v1/auth/register) get truncated
  // or duplicated, causing downstream services to reject them.
  // `forwardStream` is supported by http-proxy 1.18.x at runtime but missing
  // from @types/http-proxy 1.17.x, hence the cast.
  ...({ forwardStream: false } as Record<string, unknown>),
});

proxy.on('error', (err, req, res) => {
  logger.error('Proxy error:', err);
  const response = res as Response;
  if (!response.headersSent) {
    response.status(503).json({
      success: false,
      error: {
        code: 'SERVICE_UNAVAILABLE',
        message: 'Upstream service unavailable',
      },
    });
  }
});

proxy.on('econnreset', (err, req, res) => {
  logger.error('Connection reset by upstream:', err);
});

proxy.on('proxyReq', (proxyReq, req: any) => {
  if (req.rawBody) {
    proxyReq.setHeader('Content-Length', Buffer.byteLength(req.rawBody));
    proxyReq.write(req.rawBody);
  }

  // Inter-service HMAC signing. Downstream services verify the signature
  // before honouring x-user-id/x-user-email/x-user-role headers. Both sides
  // MUST use req.originalUrl as the path string (includes query string).
  // Webhooks are exempt: payment service allow-lists /api/v1/webhooks/* in
  // services/payment/src/utils/verify.ts.
  const { signature, timestamp, keyId } = signRequest({
    method: req.method,
    path: req.originalUrl,
    body: req.rawBody ?? '',
  });
  proxyReq.setHeader('x-inter-service-signature', signature);
  proxyReq.setHeader('x-inter-service-timestamp', timestamp);
  proxyReq.setHeader('x-inter-service-key-id', keyId);

  // With forwardStream:false, http-proxy won't end the upstream request for us.
  proxyReq.end();
});

proxy.on('proxyRes', (proxyRes) => {
  const headersToRemove = [
    'access-control-allow-origin',
    'access-control-allow-credentials',
    'access-control-allow-methods',
    'access-control-allow-headers',
    'access-control-expose-headers',
    'access-control-max-age',
  ];
  headersToRemove.forEach((header) => {
    delete proxyRes.headers[header];
  });
});

export interface ServiceRoute {
  path: string;
  method: string;
  targetService: keyof typeof config.services;
  authRequired: boolean;
}

// Routes the gateway forwards to upstream services. All 9 downstream services
// are wired in; user-service owns /users and /sellers, and the remaining
// prefixes map to notification/search/admin/product/cart as listed below.
export const defaultRoutes: ServiceRoute[] = [
  { path: '/api/v1/auth', method: 'ALL', targetService: 'auth', authRequired: false },
  { path: '/api/v1/products', method: 'ALL', targetService: 'product', authRequired: false },
  { path: '/api/v1/categories', method: 'ALL', targetService: 'product', authRequired: false },
  { path: '/api/v1/carts', method: 'ALL', targetService: 'cart', authRequired: true },
  { path: '/api/v1/orders', method: 'ALL', targetService: 'order', authRequired: true },
  { path: '/api/v1/payments', method: 'ALL', targetService: 'payment', authRequired: true },
  // Webhooks bypass auth; signature verified upstream.
  { path: '/api/v1/webhooks', method: 'ALL', targetService: 'payment', authRequired: false },
  // Users (profiles, addresses, wishlists, reviews) — auth required.
  { path: '/api/v1/users', method: 'ALL', targetService: 'user', authRequired: true },
  // Sellers — user-service is the entry point (passthrough to auth).
  { path: '/api/v1/sellers', method: 'ALL', targetService: 'user', authRequired: true },
  // Saved carts live alongside /carts in the cart service.
  { path: '/api/v1/saved-carts', method: 'ALL', targetService: 'cart', authRequired: true },
  // Catalog reads are public; writes are gated inside the product service.
  { path: '/api/v1/brands', method: 'ALL', targetService: 'product', authRequired: false },
  { path: '/api/v1/variants', method: 'ALL', targetService: 'product', authRequired: false },
  { path: '/api/v1/inventory', method: 'ALL', targetService: 'product', authRequired: false },
  // User-scoped notifications — auth required.
  { path: '/api/v1/notifications', method: 'ALL', targetService: 'notification', authRequired: true },
  // Search reads are public; only /search/click needs auth (gated inside the service).
  { path: '/api/v1/search', method: 'ALL', targetService: 'search', authRequired: false },
  // Admin — role enforcement (requireAdmin) happens inside the admin service.
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
      req.headers['x-user-id'] = req.user.userId;
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
