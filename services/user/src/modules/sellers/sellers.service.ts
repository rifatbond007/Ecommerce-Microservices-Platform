import axios from 'axios';
import { config } from '../../config';
import type { SellerStatusResponse, SellerRequest } from './sellers.types';

export class SellersService {
  private authServiceUrl = config.authService.url;

  async getSellerStatus(authToken: string): Promise<SellerStatusResponse> {
    const response = await axios.get<SellerStatusResponse>(
      `${this.authServiceUrl}/api/v1/auth/seller/status`,
      { headers: { Authorization: `Bearer ${authToken}` } }
    );
    return response.data;
  }

  async requestSeller(authToken: string): Promise<void> {
    await axios.post(
      `${this.authServiceUrl}/api/v1/auth/seller/request`,
      {},
      { headers: { Authorization: `Bearer ${authToken}` } }
    );
  }

  async getSellerRequests(authToken: string): Promise<SellerRequest[]> {
    const response = await axios.get<SellerRequest[]>(
      `${this.authServiceUrl}/api/v1/auth/admin/seller-requests`,
      { headers: { Authorization: `Bearer ${authToken}` } }
    );
    return response.data;
  }

  async approveSeller(authToken: string, userId: string): Promise<void> {
    await axios.post(
      `${this.authServiceUrl}/api/v1/auth/admin/seller-requests/${userId}/approve`,
      {},
      { headers: { Authorization: `Bearer ${authToken}` } }
    );
  }

  async rejectSeller(authToken: string, userId: string): Promise<void> {
    await axios.post(
      `${this.authServiceUrl}/api/v1/auth/admin/seller-requests/${userId}/reject`,
      {},
      { headers: { Authorization: `Bearer ${authToken}` } }
    );
  }
}

export const sellersService = new SellersService();
