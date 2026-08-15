import axios, { AxiosError, AxiosInstance, AxiosResponse, InternalAxiosRequestConfig } from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api/v1';

/**
 * Type definitions for the canonical service envelope.
 *     Success: { success: true,  data: T }
 *     Error:   { success: false, error: { code, message, details? } }
 */
export interface ApiSuccess<T> {
  success: true;
  data: T;
}
export interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown> | null;
  };
}
export type ApiEnvelope<T> = ApiSuccess<T> | ApiError;

export interface Tokens {
  accessToken: string;
  refreshToken?: string;
}

let refreshPromise: Promise<Tokens | null> | null = null;

/**
 * Soft navigation hook. The auth interceptor lives outside React's component
 * tree, so it can't call useNavigate. Instead, it dispatches this custom event
 * and the App-level effect performs a react-router Navigate to /login. This
 * avoids a hard page reload — which would re-trigger the same 401 / refresh
 * loop and look like the page is "auto-reloading every second".
 */
export const navigateToLoginEvent = 'app:navigate-to-login';
export const navigateToLogin = (): void => {
  // localStorage cleared in caller before this fires
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(navigateToLoginEvent));
  }
};

/**
 * Single refresh attempt shared across concurrent 401s — prevents the
 * stampede seen in the previous interceptor (every failed request triggered
 * its own /auth/refresh call).
 */
const performRefresh = async (): Promise<Tokens | null> => {
  if (refreshPromise) return refreshPromise;
  refreshPromise = (async () => {
    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) return null;
    try {
      const res = await axios.post<ApiEnvelope<Tokens>>(
        `${API_BASE_URL}/auth/refresh`,
        { refreshToken }
      );
      if (!res.data.success) return null;
      const tokens = res.data.data;
      localStorage.setItem('token', tokens.accessToken);
      if (tokens.refreshToken) {
        localStorage.setItem('refreshToken', tokens.refreshToken);
      }
      return tokens;
    } catch (error) {
      // Only treat 401 (refresh token invalid/expired) as "we must log out".
      // 5xx / network errors are transient — return a sentinel so the caller
      // can re-throw the original 401 instead of bouncing the user.
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        return null;
      }
      throw error;
    } finally {
      refreshPromise = null;
    }
  })();
  return refreshPromise;
};

export const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15_000,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response: AxiosResponse) => {
    // Unwrap canonical envelope if present: { success, data } → data.
    const body = response.data;
    if (
      body &&
      typeof body === 'object' &&
      'success' in body &&
      'data' in body &&
      (body as ApiEnvelope<unknown>).success === true
    ) {
      response.data = (body as ApiSuccess<unknown>).data;
    }
    return response;
  },
  async (error: AxiosError<ApiError>) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url?.includes('/auth/')
    ) {
      originalRequest._retry = true;
      let tokens: Tokens | null = null;
      try {
        tokens = await performRefresh();
      } catch {
        // performRefresh re-throws on transient failures (5xx / network).
        // Don't bounce the user — just surface the original 401.
        return Promise.reject(error);
      }
      if (tokens?.accessToken) {
        originalRequest.headers.Authorization = `Bearer ${tokens.accessToken}`;
        return api(originalRequest);
      }
      // Refresh token is genuinely invalid — clear creds and bounce to login.
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      navigateToLogin();
    }

    return Promise.reject(error);
  }
);

/** Extract a human-readable message from any axios error. */
export const getErrorMessage = (error: unknown, fallback = 'Something went wrong'): string => {
  if (axios.isAxiosError<ApiError>(error)) {
    const body = error.response?.data;
    if (body && 'success' in body && body.success === false) {
      return body.error.message || fallback;
    }
  }
  if (error instanceof Error) return error.message;
  return fallback;
};

export const authApi = {
  login: (email: string, password: string) => api.post('/auth/login', { email, password }),
  register: (data: { email: string; password: string; username: string; firstName?: string; lastName?: string; phone?: string }) =>
    api.post('/auth/register', data),
  logout: () => api.post('/auth/logout'),
  refresh: (refreshToken: string) => api.post('/auth/refresh', { refreshToken }),
  forgotPassword: (email: string) => api.post('/auth/forgot-password', { email }),
  resetPassword: (token: string, password: string) => api.post('/auth/reset-password', { token, password }),
  verifyEmail: (token: string) => api.post('/auth/verify-email', { token }),
  me: () => api.get('/auth/me'),
  sellerStatus: () => api.get('/auth/seller/status'),
};

export const userApi = {
  getProfile: () => api.get('/users/me'),
  updateProfile: (data: Record<string, unknown>) => api.put('/users/me', data),
  changePassword: (currentPassword: string, newPassword: string) =>
    api.post('/auth/change-password', { currentPassword, newPassword }),
  deleteAccount: () => api.delete('/users/me'),
  getAddresses: () => api.get('/users/me/addresses'),
  addAddress: (data: Record<string, unknown>) => api.post('/users/me/addresses', data),
  updateAddress: (id: string, data: Record<string, unknown>) =>
    api.put(`/users/me/addresses/${id}`, data),
  deleteAddress: (id: string) => api.delete(`/users/me/addresses/${id}`),
  setDefaultAddress: (id: string) => api.post(`/users/me/addresses/${id}/default`),
  getWishlists: () => api.get('/users/me/wishlists'),
  createWishlist: (name: string) => api.post('/users/me/wishlists', { name }),
  deleteWishlist: (id: string) => api.delete(`/users/me/wishlists/${id}`),
  addWishlistItem: (wishlistId: string, productId: string) =>
    api.post(`/users/me/wishlists/${wishlistId}/items`, { productId }),
  removeWishlistItem: (wishlistId: string, productId: string) =>
    api.delete(`/users/me/wishlists/${wishlistId}/items/${productId}`),
  getReviews: (productId: string) => api.get(`/users/me/reviews/product/${productId}`),
  createReview: (data: { productId: string; rating: number; title?: string; comment?: string }) =>
    api.post('/users/me/reviews', data),
  markReviewHelpful: (id: string) => api.post(`/users/me/reviews/${id}/helpful`),
};

export const productApi = {
  getProducts: (params?: Record<string, unknown>) => api.get('/products', { params }),
  getProduct: (id: string) => api.get(`/products/${id}`),
  getProductBySlug: (slug: string) => api.get(`/products/slug/${slug}`),
  getFeatured: () => api.get('/products/featured'),
  getCategories: () => api.get('/categories'),
  getCategoryTree: () => api.get('/categories/tree'),
  getCategoryById: (id: string) => api.get(`/categories/${id}`),
};

export const cartApi = {
  getCart: () => api.get('/carts'),
  initCart: () => api.post('/carts/init'),
  addItem: (data: {
    cartId: string;
    productId: string;
    quantity: number;
    variantId?: string;
    unitPrice?: number;
  }) => api.post('/carts/items', data),
  updateItem: (cartId: string, itemId: string, data: { quantity: number }) =>
    api.put(`/carts/${cartId}/items/${itemId}`, data),
  removeItem: (cartId: string, itemId: string) =>
    api.delete(`/carts/${cartId}/items/${itemId}`),
  clearCart: (cartId: string) => api.delete(`/carts/${cartId}/clear`),
  applyCoupon: (cartId: string, couponCode: string) =>
    api.post(`/carts/${cartId}/coupon`, { couponCode }),
  removeCoupon: (cartId: string) => api.delete(`/carts/${cartId}/coupon`),
  deleteCart: (cartId: string) => api.delete(`/carts/${cartId}`),
  savedCarts: () => api.get('/saved-carts'),
  createSavedCart: (name: string) => api.post('/saved-carts', { name }),
  restoreSavedCart: (id: string) => api.post(`/saved-carts/${id}/restore`),
  deleteSavedCart: (id: string) => api.delete(`/saved-carts/${id}`),
};

export const orderApi = {
  getOrders: (params?: Record<string, unknown>) => api.get('/orders', { params }),
  getOrder: (id: string) => api.get(`/orders/${id}`),
  getOrderByNumber: (orderNumber: string) => api.get(`/orders/number/${orderNumber}`),
  createOrder: (data: { cartId: string; addressId: string; notes?: string }) =>
    api.post('/orders', data),
  updateOrderStatus: (id: string, status: string) =>
    api.put(`/orders/${id}/status`, { status }),
  cancelOrder: (id: string) => api.post(`/orders/${id}/cancel`),
  requestReturn: (id: string, data: { orderItemId: string; quantity: number; reason: string }) =>
    api.post(`/orders/${id}/return`, data),
};

export const paymentApi = {
  processPayment: (data: { orderId: string; paymentMethod: string }) =>
    api.post('/payments/process', data),
  getMyPayments: () => api.get('/payments'),
  getPayment: (id: string) => api.get(`/payments/${id}`),
  getPaymentByOrderId: (orderId: string) => api.get(`/payments/order/${orderId}`),
  requestRefund: (paymentId: string, reason: string) =>
    api.post(`/payments/${paymentId}/refund`, { reason }),
};

export const brandApi = {
  getBrands: (params?: Record<string, unknown>) => api.get('/brands', { params }),
  getBrand: (id: string) => api.get(`/brands/${id}`),
  getBrandBySlug: (slug: string) => api.get(`/brands/slug/${slug}`),
};

export const searchApi = {
  search: (query: string, params?: Record<string, unknown>) =>
    api.get('/search/products', { params: { q: query, ...params } }),
  suggestions: (query: string) => api.get('/search/suggestions', { params: { q: query } }),
  trending: () => api.get('/search/trending'),
  logClick: (productId: string) => api.post('/search/click', { productId }),
};

export const notificationApi = {
  list: (params?: Record<string, unknown>) => api.get('/notifications', { params }),
  markRead: (id: string) => api.put(`/notifications/${id}/read`),
  markAllRead: () => api.put('/notifications/read-all'),
  remove: (id: string) => api.delete(`/notifications/${id}`),
  clearAll: () => api.delete('/notifications'),
  preferences: () => api.get('/notifications/preferences'),
  updatePreferences: (data: Record<string, unknown>) =>
    api.put('/notifications/preferences', data),
};

export const adminApi = {
  getStats: () => api.get('/admin/dashboard/stats'),
  getActivity: () => api.get('/admin/dashboard/activity'),
  getUsers: (params?: Record<string, unknown>) => api.get('/admin/users', { params }),
  updateUser: (id: string, data: Record<string, unknown>) => api.put(`/admin/users/${id}`, data),
  deleteUser: (id: string) => api.delete(`/admin/users/${id}`),
  getProducts: (params?: Record<string, unknown>) => api.get('/admin/products', { params }),
  updateProduct: (id: string, data: Record<string, unknown>) =>
    api.put(`/admin/products/${id}`, data),
  deleteProduct: (id: string) => api.delete(`/admin/products/${id}`),
  toggleProductActive: (id: string) => api.patch(`/admin/products/${id}/active`),
  toggleProductFeatured: (id: string) => api.patch(`/admin/products/${id}/featured`),
  getOrders: (params?: Record<string, unknown>) => api.get('/admin/orders', { params }),
  updateOrderStatus: (id: string, status: string) =>
    api.put(`/admin/orders/${id}/status`, { status }),
  cancelOrder: (id: string) => api.post(`/admin/orders/${id}/cancel`),
  getSettings: () => api.get('/admin/settings'),
  getPublicSettings: () => api.get('/admin/settings/public'),
  updateSettings: (data: Record<string, unknown>) => api.put('/admin/settings', data),
};

export const sellerApi = {
  becomeSeller: (data: Record<string, unknown>) => api.post('/sellers/request', data),
  getStatus: () => api.get('/sellers/status'),
  getProducts: (params?: Record<string, unknown>) => api.get('/products', { params }),
  createProduct: (data: Record<string, unknown>) => api.post('/products', data),
  updateProduct: (id: string, data: Record<string, unknown>) =>
    api.put(`/products/${id}`, data),
  deleteProduct: (id: string) => api.delete(`/products/${id}`),
};

export default api;
