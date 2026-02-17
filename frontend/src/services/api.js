import axios from 'axios';

// Determine the correct API URL based on environment
const getApiBaseUrl = () => {
  // In development, use proxy for localhost, full URL for network access
  if (import.meta.env.DEV) {
    const hostname = window.location.hostname;
    const protocol = window.location.protocol;
    
    // If accessing from localhost, use proxy
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      console.log('🔧 API Service: Using Vite proxy /api');
      return '/api';
    }
    // If accessing from network IP, construct backend URL with same hostname
    const apiUrl = `${protocol}//${hostname}:5000/api`;
    console.log('🔧 API Service: Using network URL', apiUrl);
    return apiUrl;
  }
  // In production, use relative path
  console.log('🔧 API Service: Production mode, using /api');
  return '/api';
};

// Create axios instance with base URL
const api = axios.create({
  baseURL: getApiBaseUrl(),
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests if available
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Products API
export const productsAPI = {
  getAll: (params = {}) => api.get('/products', { params }),
  getById: (id) => api.get(`/products/${id}`),
  getFeatured: () => api.get('/products/featured'),
  getFeaturedProducts: () => api.get('/products/featured'),
  getNewArrivals: () => api.get('/products/new-arrivals'),
  getSale: () => api.get('/products/sale'),
  search: (params) => api.get('/products/search', { params }),
  getCategories: () => api.get('/products/categories'),
  
  // Admin methods
  getAllAdmin: (params = {}) => api.get('/admin/products', { params }),
  create: (data) => api.post('/admin/products', data),
  update: (id, data) => api.put(`/admin/products/${id}`, data),
  delete: (id) => api.delete(`/admin/products/${id}`),
};

// Orders API
export const ordersAPI = {
  create: (data) => api.post('/orders', data),
  getUserOrders: (params = {}) => api.get('/orders/user-orders', { params }),
  getById: (id) => api.get(`/orders/${id}`),
  cancel: (id, data) => api.post(`/orders/${id}/cancel`, data),
  return: (id, data) => api.post(`/orders/${id}/return`, data),
  track: (orderNumber) => api.get(`/orders/track/${orderNumber}`),
  
  // Admin methods
  getAll: (params = {}) => api.get('/admin/orders', { params }),
  updateStatus: (id, data) => api.put(`/admin/orders/${id}/status`, data),
};

// Users API
export const userAPI = {
  getProfile: () => api.get('/users/profile'),
  updateProfile: (data) => api.put('/users/profile', data),
  addAddress: (data) => api.post('/users/addresses', data),
  updateAddress: (id, data) => api.put(`/users/addresses/${id}`, data),
  deleteAddress: (id) => api.delete(`/users/addresses/${id}`),
  addPaymentMethod: (data) => api.post('/users/payment-methods', data),
  updatePaymentMethod: (id, data) => api.put(`/users/payment-methods/${id}`, data),
  deletePaymentMethod: (id) => api.delete(`/users/payment-methods/${id}`),
  getAnalytics: () => api.get('/users/analytics'),
  
  // Admin methods
  getAll: (params = {}) => api.get('/admin/users', { params }),
  updateStatus: (id, data) => api.put(`/admin/users/${id}/status`, data),
};

// Auth API
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  logout: () => api.post('/auth/logout'),
  getCurrentUser: () => api.get('/auth/me'),
  refreshToken: () => api.post('/auth/refresh'),
};

// Payments API
export const paymentAPI = {
  initiateMobileMoney: (data) => api.post('/payments/mobile-money', data),
  verifyMobileMoney: (data) => api.post('/payments/mobile-money/verify', data),
  initiateMomoPay: (data) => api.post('/payments/momo-pay', data),
  processCashOnDelivery: (data) => api.post('/payments/cash-on-delivery', data),
  getStatus: (id) => api.get(`/payments/${id}/status`),
  getUserPayments: (params = {}) => api.get('/payments/user', { params }),
  refund: (id, data) => api.post(`/payments/${id}/refund`, data),
};

// Reviews API
export const reviewAPI = {
  getProductReviews: (productId, params = {}) => api.get(`/reviews/product/${productId}`, { params }),
  create: (data) => api.post('/reviews', data),
  update: (id, data) => api.put(`/reviews/${id}`, data),
  delete: (id) => api.delete(`/reviews/${id}`),
  getUserReviews: (params = {}) => api.get('/reviews/user', { params }),
};

// AI API
export const aiAPI = {
  getRecommendations: (params) => api.get('/ai/recommendations', { params }),
  analyzeStyle: (data) => api.post('/ai/style-analysis', data),
  smartSearch: (params) => api.get('/ai/smart-search', { params }),
  getSizeRecommendation: (data) => api.post('/ai/size-recommendation', data),
  getKigaliTrends: () => api.get('/ai/kigali-trends'),
};

// Admin Analytics API
export const adminAPI = {
  getAnalytics: (params = {}) => api.get('/admin/analytics', { params }),
  getInventoryStatus: () => api.get('/admin/inventory'),
  updateInventory: (id, data) => api.put(`/admin/inventory/${id}`, data),
};

// Customer API
export const customerAPI = {
  createAccount: (data) => api.post('/customers/create-account', data),
  getByPhone: (phoneNumber) => api.get(`/customers/phone/${phoneNumber}`),
  updateProfile: (data) => api.put('/customers/profile', data),
  addShippingAddress: (data) => api.post('/customers/shipping-addresses', data),
  getShippingAddresses: () => api.get('/customers/shipping-addresses'),
  updateShippingAddress: (id, data) => api.put(`/customers/shipping-addresses/${id}`, data),
  deleteShippingAddress: (id) => api.delete(`/customers/shipping-addresses/${id}`),
  
  // Admin methods
  getAll: (params = {}) => api.get('/admin/customers', { params }),
  getById: (id) => api.get(`/admin/customers/${id}`),
  updateStatus: (id, data) => api.put(`/admin/customers/${id}/status`, data),
};

export default api; 