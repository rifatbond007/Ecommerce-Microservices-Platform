import axios from 'axios';
import { config } from '../../config';
import { NotFoundError } from '../../utils/errors';
import { dashboardService } from '../dashboard/dashboard.service';
import type { UpdateProductInput, ProductQueryInput } from './products.types';

/**
 * Admin → source-service inter-service calls.
 *
 * See users.service.ts for the rationale behind the
 * `x-internal-admin-call` header pattern.
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

export class ProductsService {
  async findAll(query: ProductQueryInput, adminId: string, ipAddress?: string, adminToken?: string) {
    const params = {
      page: query.page,
      limit: query.limit,
      ...(query.search && { search: query.search }),
      ...(query.category && { category: query.category }),
      ...(query.isActive !== undefined && { isActive: query.isActive }),
      ...(query.isFeatured !== undefined && { isFeatured: query.isFeatured }),
    };

    const data = await callGateway<unknown>('get', '/api/v1/admin/products', { params, adminToken });

    await dashboardService.logAction({
      action: 'VIEW_PRODUCTS',
      entityType: 'products',
      userId: adminId,
      details: { query },
      ipAddress,
    });

    return data;
  }

  async findById(productId: string, adminId: string, ipAddress?: string, adminToken?: string) {
    const data: any = await callGateway<unknown>('get', `/api/v1/admin/products/${productId}`, { adminToken });

    if (!data?.data) {
      throw new NotFoundError('Product');
    }

    await dashboardService.logAction({
      action: 'VIEW_PRODUCT',
      entityType: 'product',
      entityId: productId,
      userId: adminId,
      ipAddress,
    });

    return data;
  }

  async update(productId: string, input: UpdateProductInput, adminId: string, ipAddress?: string, adminToken?: string) {
    const data = await callGateway<unknown>('put', `/api/v1/admin/products/${productId}`, { data: input, adminToken });

    await dashboardService.logAction({
      action: 'UPDATE_PRODUCT',
      entityType: 'product',
      entityId: productId,
      userId: adminId,
      details: { changes: input },
      ipAddress,
    });

    return data;
  }

  async delete(productId: string, adminId: string, ipAddress?: string, adminToken?: string) {
    await callGateway<unknown>('delete', `/api/v1/admin/products/${productId}`, { adminToken });

    await dashboardService.logAction({
      action: 'DELETE_PRODUCT',
      entityType: 'product',
      entityId: productId,
      userId: adminId,
      ipAddress,
    });

    return { success: true, message: 'Product deleted successfully' };
  }

  async toggleActive(productId: string, adminId: string, ipAddress?: string, adminToken?: string) {
    const product: any = await this.findById(productId, adminId, ipAddress, adminToken);
    const isActive = !product?.data?.isActive;
    return this.update(productId, { isActive }, adminId, ipAddress, adminToken);
  }

  async toggleFeatured(productId: string, adminId: string, ipAddress?: string, adminToken?: string) {
    const product: any = await this.findById(productId, adminId, ipAddress, adminToken);
    const isFeatured = !product?.data?.isFeatured;
    return this.update(productId, { isFeatured }, adminId, ipAddress, adminToken);
  }
}

export const productsService = new ProductsService();