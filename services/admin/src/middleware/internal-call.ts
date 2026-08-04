import { Request, Response, NextFunction } from 'express';
import axios from 'axios';
import { config } from '../config';

/**
 * Loop-break middleware for admin's internal gateway calls.
 *
 * The admin service's users/orders/products services call the gateway at
 * `/api/v1/admin/users/...` with `x-internal-admin-call: true`. The gateway
 * forwards those back to the admin service. This middleware detects the
 * header and short-circuits: it fetches the data directly from the source
 * service (user/order/product) using the correct paths, then writes the
 * response and ends the chain — bypassing the controller and the
 * usersService round-trip that would otherwise loop back here.
 *
 * Without this, an internal admin call would loop forever:
 *   controller → usersService → axios(gateway) → controller → usersService → ...
 *
 * Source-service endpoint mapping:
 *   /api/v1/admin/users               → user.service    /api/v1/users/me/profile (own profile; no list)
 *   /api/v1/admin/users/:id           → user.service    /api/v1/users/me/profile/:id  (no public user-by-id)
 *   /api/v1/admin/users/:id/addresses → user.service    /api/v1/users/me/addresses
 *   /api/v1/admin/orders              → order.service   /api/v1/orders
 *   /api/v1/admin/orders/:id          → order.service   /api/v1/orders/:id
 *   /api/v1/admin/orders/:id/status   → order.service   /api/v1/orders/:id/status (PUT, requireAdmin)
 *   /api/v1/admin/orders/:id/cancel   → order.service   /api/v1/orders/:id/cancel (POST? — service has no /cancel)
 *   /api/v1/admin/orders/stats        → order.service   /api/v1/orders/admin/stats
 *   /api/v1/admin/products            → product.service /api/v1/products
 *   /api/v1/admin/products/:id        → product.service /api/v1/products/:id
 *   /api/v1/admin/products/:id/active   → product.service /api/v1/products/:id/active  (no such route)
 *   /api/v1/admin/products/:id/featured → product.service /api/v1/products/:id/featured (no such route)
 *
 * NOTE: where the source service has no matching route, we return 501 Not
 * Implemented. A follow-up PR should add admin-CRUD endpoints to the
 * user/order/product services so this middleware goes away.
 *
 * Also forwards the original `Authorization` header so the source
 * service's middleware can verify (defence-in-depth) — even though the
 * gateway has already verified, the source service should not trust
 * unverified identity.
 */
const ADMIN_USER_PREFIX = '/api/v1/admin/users';
const ADMIN_ORDER_PREFIX = '/api/v1/admin/orders';
const ADMIN_PRODUCT_PREFIX = '/api/v1/admin/products';

async function forwardToSource(
  method: 'get' | 'post' | 'put' | 'delete' | 'patch',
  sourceUrl: string,
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const headers: Record<string, string> = {};
    if (req.headers.authorization) headers.Authorization = req.headers.authorization as string;

    const response = await axios.request({
      method,
      url: sourceUrl,
      params: req.query,
      data: ['post', 'put', 'patch', 'delete'].includes(method) ? req.body : undefined,
      headers,
      timeout: 10000,
      validateStatus: () => true,
    });

    if (response.status >= 200 && response.status < 300) {
      res.status(response.status).json(response.data);
      return;
    }

    // Surface upstream error verbatim so the admin route returns the
    // source-service's real response (404, 401, etc.) rather than masking it.
    res.status(response.status).json(
      response.data ?? {
        success: false,
        error: { code: 'UPSTREAM_ERROR', message: `Upstream returned ${response.status}` },
      }
    );
  } catch (error) {
    next(error);
  }
}

function notImplemented(res: Response, label: string): void {
  res.status(501).json({
    success: false,
    error: {
      code: 'NOT_IMPLEMENTED',
      message: `${label} is not yet wired to a source service. See PUKU.md "Known security gap" / admin internal-call middleware for the follow-up.`,
    },
  });
}

/**
 * Maps admin internal paths to source-service endpoints. Returns
 * `{ sourceUrl, method }` for matched paths, or `null` for unimplemented.
 */
function resolveAdminRoute(method: string, path: string): { url: string; method: 'get' | 'post' | 'put' | 'delete' | 'patch' } | null {
  // Users
  if (path.startsWith(ADMIN_USER_PREFIX)) {
    const suffix = path.slice(ADMIN_USER_PREFIX.length);
    if (suffix === '' || suffix === '/') {
      // No admin user-list endpoint on user service.
      return null;
    }
    // /api/v1/admin/users/:id/...
    const match = suffix.match(/^\/([^\/]+)(?:\/(addresses))?$/);
    if (match) {
      // No public user-by-id or admin user-addresses on user service.
      return null;
    }
    return null;
  }

  // Orders
  if (path.startsWith(ADMIN_ORDER_PREFIX)) {
    const suffix = path.slice(ADMIN_ORDER_PREFIX.length);
    if (suffix === '/stats' || suffix === '/stats/') {
      return {
        url: `${config.orderService.url}/api/v1/orders/admin/stats`,
        method: 'get',
      };
    }
    if (suffix === '' || suffix === '/') {
      // Admin order-list maps to /api/v1/orders (own orders). Admin should
      // see all, but the user-side route returns own orders. Returns a
      // partial view; real fix is a follow-up.
      return { url: `${config.orderService.url}/api/v1/orders`, method: 'get' };
    }
    const matchStatus = suffix.match(/^\/([^\/]+)\/status$/);
    if (matchStatus) {
      return {
        url: `${config.orderService.url}/api/v1/orders/${matchStatus[1]}/status`,
        method: 'put',
      };
    }
    const matchId = suffix.match(/^\/([^\/]+)$/);
    if (matchId) {
      return {
        url: `${config.orderService.url}/api/v1/orders/${matchId[1]}`,
        method: 'get',
      };
    }
    return null;
  }

  // Products
  if (path.startsWith(ADMIN_PRODUCT_PREFIX)) {
    const suffix = path.slice(ADMIN_PRODUCT_PREFIX.length);
    if (suffix === '' || suffix === '/') {
      return { url: `${config.productService.url}/api/v1/products`, method: 'get' };
    }
    const matchActive = suffix.match(/^\/([^\/]+)\/active$/);
    if (matchActive) return null; // no source-service endpoint
    const matchFeatured = suffix.match(/^\/([^\/]+)\/featured$/);
    if (matchFeatured) return null; // no source-service endpoint
    const matchId = suffix.match(/^\/([^\/]+)$/);
    if (matchId) {
      const verb: 'get' | 'put' | 'delete' = method === 'get' ? 'get' : method === 'delete' ? 'delete' : method === 'put' ? 'put' : 'get';
      return {
        url: `${config.productService.url}/api/v1/products/${matchId[1]}`,
        method: verb,
      };
    }
    return null;
  }

  return null;
}

/**
 * Express middleware. When the request carries `x-internal-admin-call: true`,
 * short-circuit by forwarding to the source service directly. Otherwise
 * the request proceeds normally to the admin route handler.
 */
export const internalAdminCallGuard = async (req: Request, res: Response, next: NextFunction) => {
  if (req.headers['x-internal-admin-call'] !== 'true') {
    return next();
  }

  const method = req.method.toLowerCase() as 'get' | 'post' | 'put' | 'delete' | 'patch';
  const fullPath = req.path.startsWith('/api/v1/admin')
    ? req.path
    : `/api/v1/admin${req.path.startsWith('/admin') ? req.path.slice(6) : req.path}`;

  const resolved = resolveAdminRoute(method, fullPath);

  if (!resolved) {
    const label = `${method.toUpperCase()} ${fullPath}`;
    return notImplemented(res, label);
  }

  // Resolve method override: PUT/DELETE on /api/v1/admin/products/:id
  const target = { ...resolved };
  if (fullPath.startsWith(ADMIN_PRODUCT_PREFIX)) {
    const suffix = fullPath.slice(ADMIN_PRODUCT_PREFIX.length);
    if (suffix.match(/^\/[^\/]+$/)) {
      target.method = method;
    }
  }

  return forwardToSource(target.method, target.url, req, res, next);
};
