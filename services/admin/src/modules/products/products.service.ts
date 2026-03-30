import axios from 'axios';
import { config } from '../../config';
import { NotFoundError } from '../../utils/errors';
import { dashboardService } from '../dashboard/dashboard.service';
import type { UpdateProductInput, ProductQueryInput } from './products.types';

export class ProductsService {
  async findAll(query: ProductQueryInput, adminId: string, ipAddress?: string) {
    const params = {
      page: query.page,
      limit: query.limit,
      ...(query.search && { search: query.search }),
      ...(query.category && { category: query.category }),
      ...(query.isActive !== undefined && { isActive: query.isActive }),
      ...(query.isFeatured !== undefined && { isFeatured: query.isFeatured }),
    };

    const response = await axios.get(`${config.productService.url}/api/v1/admin/products`, {
      params,
      headers: { 'x-user-id': adminId },
    });

    await dashboardService.logAction({
      action: 'VIEW_PRODUCTS',
      entityType: 'products',
      userId: adminId,
      details: { query },
      ipAddress,
    });

    return response.data;
  }

  async findById(productId: string, adminId: string, ipAddress?: string) {
    const response = await axios.get(`${config.productService.url}/api/v1/products/${productId}`, {
      headers: { 'x-user-id': adminId },
    });

    if (!response.data.data) {
      throw new NotFoundError('Product');
    }

    await dashboardService.logAction({
      action: 'VIEW_PRODUCT',
      entityType: 'product',
      entityId: productId,
      userId: adminId,
      ipAddress,
    });

    return response.data;
  }

  async update(productId: string, input: UpdateProductInput, adminId: string, ipAddress?: string) {
    const response = await axios.put(`${config.productService.url}/api/v1/admin/products/${productId}`, input, {
      headers: { 'x-user-id': adminId },
    });

    await dashboardService.logAction({
      action: 'UPDATE_PRODUCT',
      entityType: 'product',
      entityId: productId,
      userId: adminId,
      details: { changes: input },
      ipAddress,
    });

    return response.data;
  }

  async delete(productId: string, adminId: string, ipAddress?: string) {
    await axios.delete(`${config.productService.url}/api/v1/admin/products/${productId}`, {
      headers: { 'x-user-id': adminId },
    });

    await dashboardService.logAction({
      action: 'DELETE_PRODUCT',
      entityType: 'product',
      entityId: productId,
      userId: adminId,
      ipAddress,
    });

    return { success: true, message: 'Product deleted successfully' };
  }

  async toggleActive(productId: string, adminId: string, ipAddress?: string) {
    const product = await this.findById(productId, adminId, ipAddress);
    const isActive = !product.data.isActive;
    
    return this.update(productId, { isActive }, adminId, ipAddress);
  }

  async toggleFeatured(productId: string, adminId: string, ipAddress?: string) {
    const product = await this.findById(productId, adminId, ipAddress);
    const isFeatured = !product.data.isFeatured;
    
    return this.update(productId, { isFeatured }, adminId, ipAddress);
  }
}

export const productsService = new ProductsService();
