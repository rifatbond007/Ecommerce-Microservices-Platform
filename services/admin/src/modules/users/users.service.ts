import axios from 'axios';
import { config } from '../../config';
import { NotFoundError } from '../../utils/errors';
import { dashboardService } from '../dashboard/dashboard.service';
import type { UpdateUserInput, UserQueryInput } from './users.types';

/**
 * Admin → source-service inter-service calls.
 *
 * Bug 3 fix: the original code called `/api/v1/admin/users` on the user
 * service — that route doesn't exist there, so every admin user-list,
 * user-update, user-delete, and user-addresses call 404'd through the
 * gateway. Same shape applied to admin/orders and admin/products.
 *
 * The right pattern: route through the gateway (single source of truth
 * for JWT verification and routing) with `x-internal-admin-call: true`.
 * The gateway forwards `/api/v1/admin/users` back to the admin service,
 * which detects the header and skips the usersService round-trip,
 * fetching directly from the user service instead. That breaks the loop.
 *
 * The internal-header pattern is a controlled-blast-radius workaround for
 * the missing admin-CRUD endpoints on user/order/product services. A
 * follow-up PR should add those endpoints so this indirection goes away.
 */
const INTERNAL_HEADER = { 'x-internal-admin-call': 'true' };

async function callGateway<T>(method: 'get' | 'post' | 'put' | 'delete', path: string, opts: {
  params?: Record<string, unknown>;
  data?: unknown;
  adminToken?: string;
} = {}): Promise<T> {
  const headers: Record<string, string> = { ...INTERNAL_HEADER };
  if (opts.adminToken) headers.Authorization = `Bearer ${opts.adminToken}`;
  const response = await axios.request({
    method,
    url: `${config.gateway.url}${path}`,
    params: opts.params,
    data: opts.data,
    headers,
    timeout: 10000,
  });
  return response.data as T;
}

export class UsersService {
  async findAll(query: UserQueryInput, adminId: string, ipAddress?: string, adminToken?: string) {
    const params = {
      page: query.page,
      limit: query.limit,
      ...(query.search && { search: query.search }),
      ...(query.role && { role: query.role }),
      ...(query.sellerStatus && { sellerStatus: query.sellerStatus }),
    };

    const data = await callGateway<unknown>('get', '/api/v1/admin/users', { params, adminToken: adminToken });

    await dashboardService.logAction({
      action: 'VIEW_USERS',
      entityType: 'users',
      userId: adminId,
      details: { query },
      ipAddress,
    });

    return data;
  }

  async findById(userId: string, adminId: string, ipAddress?: string, adminToken?: string) {
    const data: any = await callGateway<unknown>('get', `/api/v1/admin/users/${userId}`, { adminToken });

    if (!data?.data) {
      throw new NotFoundError('User');
    }

    await dashboardService.logAction({
      action: 'VIEW_USER',
      entityType: 'user',
      entityId: userId,
      userId: adminId,
      ipAddress,
    });

    return data;
  }

  async update(userId: string, input: UpdateUserInput, adminId: string, ipAddress?: string, adminToken?: string) {
    const data = await callGateway<unknown>('put', `/api/v1/admin/users/${userId}`, { data: input, adminToken });

    await dashboardService.logAction({
      action: 'UPDATE_USER',
      entityType: 'user',
      entityId: userId,
      userId: adminId,
      details: { changes: input },
      ipAddress,
    });

    return data;
  }

  async delete(userId: string, adminId: string, ipAddress?: string, adminToken?: string) {
    await callGateway<unknown>('delete', `/api/v1/admin/users/${userId}`, { adminToken });

    await dashboardService.logAction({
      action: 'DELETE_USER',
      entityType: 'user',
      entityId: userId,
      userId: adminId,
      ipAddress,
    });

    return { success: true, message: 'User deleted successfully' };
  }

  async getAddresses(userId: string, adminId: string, ipAddress?: string, adminToken?: string) {
    const data = await callGateway<unknown>('get', `/api/v1/admin/users/${userId}/addresses`, { adminToken });

    await dashboardService.logAction({
      action: 'VIEW_USER_ADDRESSES',
      entityType: 'user',
      entityId: userId,
      userId: adminId,
      ipAddress,
    });

    return data;
  }
}

export const usersService = new UsersService();
