import axios from 'axios';
import { config } from '../../config';
import { NotFoundError } from '../../utils/errors';
import { dashboardService } from '../dashboard/dashboard.service';
import type { UpdateUserInput, UserQueryInput } from './users.types';

export class UsersService {
  async findAll(query: UserQueryInput, adminId: string, ipAddress?: string) {
    const params = {
      page: query.page,
      limit: query.limit,
      ...(query.search && { search: query.search }),
      ...(query.role && { role: query.role }),
      ...(query.sellerStatus && { sellerStatus: query.sellerStatus }),
    };

    const response = await axios.get(`${config.userService.url}/api/v1/admin/users`, {
      params,
      headers: { 'x-user-id': adminId },
    });

    await dashboardService.logAction({
      action: 'VIEW_USERS',
      entityType: 'users',
      userId: adminId,
      details: { query },
      ipAddress,
    });

    return response.data;
  }

  async findById(userId: string, adminId: string, ipAddress?: string) {
    const response = await axios.get(`${config.userService.url}/api/v1/users/${userId}`, {
      headers: { 'x-user-id': adminId },
    });

    if (!response.data.data) {
      throw new NotFoundError('User');
    }

    await dashboardService.logAction({
      action: 'VIEW_USER',
      entityType: 'user',
      entityId: userId,
      userId: adminId,
      ipAddress,
    });

    return response.data;
  }

  async update(userId: string, input: UpdateUserInput, adminId: string, ipAddress?: string) {
    const response = await axios.put(`${config.userService.url}/api/v1/admin/users/${userId}`, input, {
      headers: { 'x-user-id': adminId },
    });

    await dashboardService.logAction({
      action: 'UPDATE_USER',
      entityType: 'user',
      entityId: userId,
      userId: adminId,
      details: { changes: input },
      ipAddress,
    });

    return response.data;
  }

  async delete(userId: string, adminId: string, ipAddress?: string) {
    await axios.delete(`${config.userService.url}/api/v1/admin/users/${userId}`, {
      headers: { 'x-user-id': adminId },
    });

    await dashboardService.logAction({
      action: 'DELETE_USER',
      entityType: 'user',
      entityId: userId,
      userId: adminId,
      ipAddress,
    });

    return { success: true, message: 'User deleted successfully' };
  }

  async getAddresses(userId: string, adminId: string, ipAddress?: string) {
    const response = await axios.get(`${config.userService.url}/api/v1/users/${userId}/addresses`, {
      headers: { 'x-user-id': adminId },
    });

    await dashboardService.logAction({
      action: 'VIEW_USER_ADDRESSES',
      entityType: 'user',
      entityId: userId,
      userId: adminId,
      ipAddress,
    });

    return response.data;
  }
}

export const usersService = new UsersService();
