import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => {
    if (response.data && typeof response.data === 'object' && 'success' in response.data && 'data' in response.data) {
      response.data = response.data.data;
    }
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken) {
        try {
          const { data } = await axios.post(`${API_BASE_URL}/auth/refresh`, {
            refreshToken,
          });
          localStorage.setItem('token', data.accessToken);
          originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
          return api(originalRequest);
        } catch {
          localStorage.removeItem('token');
          localStorage.removeItem('refreshToken');
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

export const authApi = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),
  register: (data: { email: string; password: string; username: string }) =>
    api.post('/auth/register', data),
  logout: () => api.post('/auth/logout'),
  verify: () => api.get('/auth/verify'),
  me: () => api.get('/auth/me'),
};

export const userApi = {
  getProfile: () => api.get('/users/me'),
  updateProfile: (data: any) => api.put('/users/me', data),
  getAddresses: () => api.get('/users/me/addresses'),
  addAddress: (data: any) => api.post('/users/me/addresses', data),
  updateAddress: (id: string, data: any) => api.put(`/users/me/addresses/${id}`, data),
  deleteAddress: (id: string) => api.delete(`/users/me/addresses/${id}`),
  setDefaultAddress: (id: string) => api.post(`/users/me/addresses/${id}/default`),
  getWishlists: () => api.get('/users/me/wishlists'),
  createWishlist: (name: string) => api.post('/users/me/wishlists', { name }),
  addWishlistItem: (wishlistId: string, productId: string) => api.post(`/users/me/wishlists/${wishlistId}/items`, { productId }),
  removeWishlistItem: (wishlistId: string, productId: string) => api.delete(`/users/me/wishlists/${wishlistId}/items/${productId}`),
  getReviews: (productId: string) => api.get(`/users/me/reviews/product/${productId}`),
  createReview: (data: { productId: string; rating: number; title?: string; comment?: string }) =>
    api.post('/users/me/reviews', data),
  markReviewHelpful: (id: string) => api.post(`/users/me/reviews/${id}/helpful`),
};

export const productApi = {
  getProducts: (params?: any) => api.get('/products', { params }),
  getProduct: (id: string) => api.get(`/products/${id}`),
  getProductBySlug: (slug: string) => api.get(`/products/slug/${slug}`),
  getFeatured: () => api.get('/products/featured'),
  getCategories: () => api.get('/categories'),
  getCategoryTree: () => api.get('/categories/tree'),
};

export const cartApi = {
  getCart: () => api.get('/carts'),
  initCart: () => api.post('/carts/init'),
  addItem: (data: { cartId: string; productId: string; quantity: number; variantId?: string; unitPrice?: number }) =>
    api.post('/carts/items', data),
  updateItem: (cartId: string, itemId: string, data: { quantity: number }) =>
    api.put(`/carts/${cartId}/items/${itemId}`, data),
  removeItem: (cartId: string, itemId: string) =>
    api.delete(`/carts/${cartId}/items/${itemId}`),
  clearCart: (cartId: string) =>
    api.delete(`/carts/${cartId}/clear`),
  applyCoupon: (cartId: string, couponCode: string) =>
    api.post(`/carts/${cartId}/coupon`, { couponCode }),
  removeCoupon: (cartId: string) =>
    api.delete(`/carts/${cartId}/coupon`),
  deleteCart: (cartId: string) =>
    api.delete(`/carts/${cartId}`),
};

export const orderApi = {
  getOrders: (params?: any) => api.get('/orders', { params }),
  getOrder: (id: string) => api.get(`/orders/${id}`),
  getOrderByNumber: (orderNumber: string) => api.get(`/orders/number/${orderNumber}`),
  createOrder: (data: any) => api.post('/orders', data),
  updateOrderStatus: (id: string, status: string) =>
    api.put(`/orders/${id}/status`, { status }),
  requestReturn: (id: string, reason: string) =>
    api.post(`/orders/${id}/return`, { reason }),
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
  getBrands: (params?: any) => api.get('/brands', { params }),
  getBrand: (id: string) => api.get(`/brands/${id}`),
  getBrandBySlug: (slug: string) => api.get(`/brands/slug/${slug}`),
};

export const searchApi = {
  search: (query: string, params?: any) =>
    api.get('/search/products', { params: { q: query, ...params } }),
  suggestions: (query: string) => api.get('/search/suggestions', { params: { q: query } }),
  trending: () => api.get('/search/trending'),
  logClick: (productId: string) => api.post('/search/click', { productId }),
};

export const adminApi = {
  getStats: () => api.get('/admin/dashboard/stats'),
  getActivity: () => api.get('/admin/dashboard/activity'),
  getUsers: (params?: any) => api.get('/admin/users', { params }),
  updateUser: (id: string, data: any) => api.put(`/admin/users/${id}`, data),
  deleteUser: (id: string) => api.delete(`/admin/users/${id}`),
  getProducts: (params?: any) => api.get('/admin/products', { params }),
  updateProduct: (id: string, data: any) => api.put(`/admin/products/${id}`, data),
  deleteProduct: (id: string) => api.delete(`/admin/products/${id}`),
  toggleProductActive: (id: string) => api.patch(`/admin/products/${id}/active`),
  toggleProductFeatured: (id: string) => api.patch(`/admin/products/${id}/featured`),
  getOrders: (params?: any) => api.get('/admin/orders', { params }),
  updateOrderStatus: (id: string, status: string) =>
    api.put(`/admin/orders/${id}/status`, { status }),
  cancelOrder: (id: string) => api.post(`/admin/orders/${id}/cancel`),
  getSettings: () => api.get('/admin/settings'),
  getPublicSettings: () => api.get('/admin/settings/public'),
  updateSettings: (data: any) => api.put('/admin/settings', data),
};

export const sellerApi = {
  becomeSeller: (data: any) => api.post('/sellers/request', data),
  getStatus: () => api.get('/sellers/status'),
  getProducts: (params?: any) => api.get('/products', { params }),
  createProduct: (data: any) => api.post('/products', data),
  updateProduct: (id: string, data: any) => api.put(`/products/${id}`, data),
  deleteProduct: (id: string) => api.delete(`/products/${id}`),
};

export default api;