import axios from 'axios';
import { config } from '../../config';
import { NotFoundError } from '../../utils/errors';
import { dashboardService } from '../dashboard/dashboard.service';
import type { UpdateOrderStatusInput, OrderQueryInput } from './orders.types';

export class OrdersService {
  async findAll(query: OrderQueryInput, adminId: string, ipAddress?: string) {
    const params = {
      page: query.page,
      limit: query.limit,
      ...(query.status && { status: query.status }),
      ...(query.financialStatus && { financialStatus: query.financialStatus }),
      ...(query.userId && { userId: query.userId }),
      ...(query.orderNumber && { orderNumber: query.orderNumber }),
    };

    const response = await axios.get(`${config.orderService.url}/api/v1/admin/orders`, {
      params,
      headers: { 'x-user-id': adminId },
    });

    await dashboardService.logAction({
      action: 'VIEW_ORDERS',
      entityType: 'orders',
      userId: adminId,
      details: { query },
      ipAddress,
    });

    return response.data;
  }

  async findById(orderId: string, adminId: string, ipAddress?: string) {
    const response = await axios.get(`${config.orderService.url}/api/v1/admin/orders/${orderId}`, {
      headers: { 'x-user-id': adminId },
    });

    if (!response.data.data) {
      throw new NotFoundError('Order');
    }

    await dashboardService.logAction({
      action: 'VIEW_ORDER',
      entityType: 'order',
      entityId: orderId,
      userId: adminId,
      ipAddress,
    });

    return response.data;
  }

  async updateStatus(orderId: string, input: UpdateOrderStatusInput, adminId: string, ipAddress?: string) {
    const response = await axios.put(`${config.orderService.url}/api/v1/admin/orders/${orderId}/status`, input, {
      headers: { 'x-user-id': adminId },
    });

    await dashboardService.logAction({
      action: 'UPDATE_ORDER_STATUS',
      entityType: 'order',
      entityId: orderId,
      userId: adminId,
      details: { changes: input },
      ipAddress,
    });

    return response.data;
  }

  async cancel(orderId: string, adminId: string, reason?: string, ipAddress?: string) {
    const response = await axios.post(`${config.orderService.url}/api/v1/admin/orders/${orderId}/cancel`, 
      { reason },
      { headers: { 'x-user-id': adminId } }
    );

    await dashboardService.logAction({
      action: 'CANCEL_ORDER',
      entityType: 'order',
      entityId: orderId,
      userId: adminId,
      details: { reason },
      ipAddress,
    });

    return response.data;
  }

  async getStats(adminId: string, ipAddress?: string) {
    const response = await axios.get(`${config.orderService.url}/api/v1/admin/orders/stats`, {
      headers: { 'x-user-id': adminId },
    });

    await dashboardService.logAction({
      action: 'VIEW_ORDER_STATS',
      entityType: 'orders',
      userId: adminId,
      ipAddress,
    });

    return response.data;
  }
}

export const ordersService = new OrdersService();
