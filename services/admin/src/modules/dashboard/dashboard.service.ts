import axios from 'axios';
import { config } from '../../config';
import { adminLogRepository } from '../../repositories';
import type { DashboardStats } from './dashboard.types';

export class DashboardService {
  async getStats(period: DashboardStats['period'] = 'week') {
    const [usersRes, productsRes, ordersRes] = await Promise.all([
      axios.get(`${config.userService.url}/api/v1/admin/users/stats`, { params: { period } }).catch(() => ({ data: { data: { total: 0, new: 0 } } })),
      axios.get(`${config.productService.url}/api/v1/admin/products/stats`, { params: { period } }).catch(() => ({ data: { data: { total: 0, new: 0 } } })),
      axios.get(`${config.orderService.url}/api/v1/admin/orders/stats`, { params: { period } }).catch(() => ({ data: { data: { total: 0, revenue: 0 } } })),
    ]);

    const recentLogs = await adminLogRepository.findAll(10);

    return {
      users: usersRes.data.data || { total: 0, new: 0 },
      products: productsRes.data.data || { total: 0, new: 0 },
      orders: ordersRes.data.data || { total: 0, revenue: 0 },
      recentActivity: recentLogs.logs,
    };
  }

  async logAction(data: {
    action: string;
    entityType: string;
    entityId?: string;
    userId?: string;
    details?: Record<string, any>;
    ipAddress?: string;
  }) {
    return adminLogRepository.create(data);
  }
}

export const dashboardService = new DashboardService();
