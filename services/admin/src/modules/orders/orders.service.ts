import axios from 'axios';
import { config } from '../../config';
import { NotFoundError } from '../../utils/errors';
import { dashboardService } from '../dashboard/dashboard.service';
import type { UpdateOrderStatusInput, OrderQueryInput } from './orders.types';

/**
 * Admin → source-service inter-service calls.
 *
 * See users.service.ts for the rationale behind the
 * `x-internal-admin-call` header pattern. Same fix shape, same loop-break
 * via the gateway loopback.
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

export class OrdersService {
  async findAll(query: OrderQueryInput, adminId: string, ipAddress?: string, adminToken?: string) {
    const params = {
      page: query.page,
      limit: query.limit,
      ...(query.status && { status: query.status }),
      ...(query.financialStatus && { financialStatus: query.financialStatus }),
      ...(query.userId && { userId: query.userId }),
      ...(query.orderNumber && { orderNumber: query.orderNumber }),
    };

    const data = await callGateway<unknown>('get', '/api/v1/admin/orders', { params, adminToken });

    await dashboardService.logAction({
      action: 'VIEW_ORDERS',
      entityType: 'orders',
      userId: adminId,
      details: { query },
      ipAddress,
    });

    return data;
  }

  async findById(orderId: string, adminId: string, ipAddress?: string, adminToken?: string) {
    const data: any = await callGateway<unknown>('get', `/api/v1/admin/orders/${orderId}`, { adminToken });

    if (!data?.data) {
      throw new NotFoundError('Order');
    }

    await dashboardService.logAction({
      action: 'VIEW_ORDER',
      entityType: 'order',
      entityId: orderId,
      userId: adminId,
      ipAddress,
    });

    return data;
  }

  async updateStatus(orderId: string, input: UpdateOrderStatusInput, adminId: string, ipAddress?: string, adminToken?: string) {
    const data = await callGateway<unknown>('put', `/api/v1/admin/orders/${orderId}/status`, { data: input, adminToken });

    await dashboardService.logAction({
      action: 'UPDATE_ORDER_STATUS',
      entityType: 'order',
      entityId: orderId,
      userId: adminId,
      details: { changes: input },
      ipAddress,
    });

    return data;
  }

  async cancel(orderId: string, adminId: string, reason?: string, ipAddress?: string, adminToken?: string) {
    const data = await callGateway<unknown>('post', `/api/v1/admin/orders/${orderId}/cancel`, {
      data: { reason },
      adminToken,
    });

    await dashboardService.logAction({
      action: 'CANCEL_ORDER',
      entityType: 'order',
      entityId: orderId,
      userId: adminId,
      details: { reason },
      ipAddress,
    });

    return data;
  }

  async getStats(adminId: string, ipAddress?: string, adminToken?: string) {
    const data = await callGateway<unknown>('get', '/api/v1/admin/orders/stats', { adminToken });

    await dashboardService.logAction({
      action: 'VIEW_ORDER_STATS',
      entityType: 'orders',
      userId: adminId,
      ipAddress,
    });

    return data;
  }
}

export const ordersService = new OrdersService();