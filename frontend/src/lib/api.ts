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
  (response) => response,
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

// Auth API
export const authApi = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),
  register: (data: { email: string; password: string; username: string }) =>
    api.post('/auth/register', data),
  logout: () => api.post('/auth/logout'),
  verify: () => api.get('/auth/verify'),
  me: () => api.get('/auth/me'),
};

// User API
export const userApi = {
  getProfile: () => api.get('/users/me'),
  updateProfile: (data: any) => api.put('/users/me', data),
  getAddresses: () => api.get('/users/me/addresses'),
  addAddress: (data: any) => api.post('/users/me/addresses', data),
  updateAddress: (id: string, data: any) => api.put(`/users/me/addresses/${id}`, data),
  deleteAddress: (id: string) => api.delete(`/users/me/addresses/${id}`),
  getWishlists: () => api.get('/users/me/wishlists'),
  addToWishlist: (productId: string) => api.post('/users/me/wishlists', { productId }),
  removeFromWishlist: (productId: string) => api.delete(`/users/me/wishlists/${productId}`),
  getReviews: () => api.get('/users/me/reviews'),
};

// Product API
export const productApi = {
  getProducts: (params?: any) => api.get('/products', { params }),
  getProduct: (id: string) => api.get(`/products/${id}`),
  getProductBySlug: (slug: string) => api.get(`/products/slug/${slug}`),
  getCategories: () => api.get('/categories'),
  searchProducts: (query: string) => api.get('/products/search', { params: { q: query } }),
};

// Cart API
export const cartApi = {
  getCart: () => api.get('/cart'),
  addItem: (data: { productId: string; quantity: number; variantId?: string }) =>
    api.post('/cart/items', data),
  updateItem: (id: string, data: { quantity: number }) =>
    api.put(`/cart/items/${id}`, data),
  removeItem: (id: string) => api.delete(`/cart/items/${id}`),
  clearCart: () => api.delete('/cart'),
  checkout: () => api.post('/cart/checkout'),
};

// Order API
export const orderApi = {
  getOrders: () => api.get('/orders'),
  getOrder: (id: string) => api.get(`/orders/${id}`),
  createOrder: (data: any) => api.post('/orders', data),
  updateOrderStatus: (id: string, status: string) =>
    api.put(`/orders/${id}/status`, { status }),
};

// Payment API
export const paymentApi = {
  processPayment: (data: { orderId: string; paymentMethod: string }) =>
    api.post('/payments/process', data),
  getPayment: (orderId: string) => api.get(`/payments/${orderId}`),
  requestRefund: (paymentId: string, reason: string) =>
    api.post(`/payments/${paymentId}/refund`, { reason }),
};

// Search API
export const searchApi = {
  search: (query: string, params?: any) =>
    api.get('/search/products', { params: { q: query, ...params } }),
  suggestions: (query: string) => api.get('/search/suggestions', { params: { q: query } }),
  trending: () => api.get('/search/trending'),
};

// Admin API
export const adminApi = {
  getAnalytics: () => api.get('/admin/analytics/overview'),
  getSalesAnalytics: (params?: any) => api.get('/admin/analytics/sales', { params }),
  getUserAnalytics: () => api.get('/admin/analytics/users'),
  getUsers: (params?: any) => api.get('/admin/users', { params }),
  updateUser: (id: string, data: any) => api.put(`/admin/users/${id}`, data),
  getProducts: (params?: any) => api.get('/admin/products', { params }),
  updateProduct: (id: string, data: any) => api.put(`/admin/products/${id}`, data),
  getOrders: (params?: any) => api.get('/admin/orders', { params }),
  updateOrder: (id: string, status: string) =>
    api.put(`/admin/orders/${id}/status`, { status }),
};

// Seller API
export const sellerApi = {
  becomeSeller: (data: any) => api.post('/sellers/register', data),
  getProducts: () => api.get('/seller/products'),
  addProduct: (data: any) => api.post('/seller/products', data),
  updateProduct: (id: string, data: any) => api.put(`/seller/products/${id}`, data),
  deleteProduct: (id: string) => api.delete(`/seller/products/${id}`),
};

export default api;
