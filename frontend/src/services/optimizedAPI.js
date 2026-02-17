/**
 * Optimized API Service with Advanced Caching
 * Ensures sub-2-second load times with smart caching strategies
 */

import axios from 'axios';
import { cacheManager, localCache, isSlowNetwork } from '../utils/performanceOptimizer';

const BASE_URL = '/api';

// Create axios instance with optimizations
const api = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// ==================== Cache Configuration ====================

const CACHE_DURATIONS = {
  products: 300000,      // 5 minutes
  categories: 600000,    // 10 minutes
  static: 3600000,       // 1 hour
  user: 60000,           // 1 minute
  search: 180000         // 3 minutes
};

// ==================== Request Interceptor ====================

api.interceptors.request.use(
  (config) => {
    // Add timestamp to prevent browser caching on critical endpoints
    if (config.method === 'get' && !config.params) {
      config.params = {};
    }

    // Add authentication token
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    console.log(`📤 API Request: ${config.method.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// ==================== Response Interceptor ====================

api.interceptors.response.use(
  (response) => {
    console.log(`📥 API Response: ${response.config.url} (${response.status})`);
    return response;
  },
  (error) => {
    console.error('❌ API Error:', error.response?.status, error.message);
    
    // Handle specific error cases
    if (error.response?.status === 401) {
      // Unauthorized - clear token and redirect
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    
    return Promise.reject(error);
  }
);

// ==================== Cached GET Request ====================

export const cachedGet = async (endpoint, cacheKey, cacheDuration = CACHE_DURATIONS.products) => {
  const fullCacheKey = `api_${cacheKey || endpoint}`;
  
  // Check memory cache first
  const memCached = cacheManager.get(fullCacheKey, cacheDuration);
  if (memCached) {
    console.log('💾 Serving from memory cache:', endpoint);
    return memCached;
  }

  // Check localStorage cache (for larger TTL)
  const localCached = localCache.get(fullCacheKey);
  if (localCached) {
    console.log('💿 Serving from local cache:', endpoint);
    cacheManager.set(fullCacheKey, localCached); // Promote to memory cache
    return localCached;
  }

  // Make API request
  try {
    const response = await api.get(endpoint);
    const data = response.data;

    // Cache in both memory and localStorage
    cacheManager.set(fullCacheKey, data);
    localCache.set(fullCacheKey, data, cacheDuration);

    return data;
  } catch (error) {
    console.error('API request failed:', error);
    throw error;
  }
};

// ==================== Optimized API Methods ====================

export const productsAPI = {
  // Get all products with caching
  getAll: async (limit = 50) => {
    return cachedGet(`/products?limit=${limit}`, `products_all_${limit}`, CACHE_DURATIONS.products);
  },

  // Get single product
  getById: async (id) => {
    return cachedGet(`/products/${id}`, `product_${id}`, CACHE_DURATIONS.products);
  },

  // Search products (shorter cache)
  search: async (query) => {
    return cachedGet(`/intelligent-search?query=${query}`, `search_${query}`, CACHE_DURATIONS.search);
  },

  // Get by category
  getByCategory: async (category) => {
    return cachedGet(`/products?category=${category}`, `products_cat_${category}`, CACHE_DURATIONS.products);
  },

  // Get featured (longer cache)
  getFeatured: async () => {
    return cachedGet('/products?isFeatured=true', 'products_featured', CACHE_DURATIONS.static);
  },

  // Get trending
  getTrending: async () => {
    return cachedGet('/analytics/trending', 'products_trending', CACHE_DURATIONS.products);
  },

  // Invalidate cache
  invalidateCache: () => {
    cacheManager.clear();
    ['products', 'search'].forEach(key => {
      Object.keys(localStorage).forEach(storageKey => {
        if (storageKey.includes(key)) {
          localStorage.removeItem(storageKey);
        }
      });
    });
  }
};

export const categoriesAPI = {
  getAll: async () => {
    return cachedGet('/categories/hierarchical/all', 'categories_all', CACHE_DURATIONS.categories);
  },

  getSubcategories: async (id) => {
    return cachedGet(`/categories/hierarchical/${id}/subcategories`, `categories_sub_${id}`, CACHE_DURATIONS.categories);
  }
};

export const userAPI = {
  // User data should have shorter cache
  getProfile: async () => {
    return cachedGet('/user/profile', 'user_profile', CACHE_DURATIONS.user);
  },

  getOrders: async () => {
    return cachedGet('/user/orders', 'user_orders', CACHE_DURATIONS.user);
  },

  getWishlist: async () => {
    return cachedGet('/user/wishlist', 'user_wishlist', CACHE_DURATIONS.user);
  }
};

// ==================== Batch Requests ====================

export const batchRequest = async (requests) => {
  console.log(`🔄 Batch request: ${requests.length} endpoints`);
  
  try {
    const promises = requests.map(req => 
      cachedGet(req.endpoint, req.cacheKey, req.cacheDuration)
    );
    
    const results = await Promise.allSettled(promises);
    
    return results.map((result, index) => ({
      endpoint: requests[index].endpoint,
      success: result.status === 'fulfilled',
      data: result.status === 'fulfilled' ? result.value : null,
      error: result.status === 'rejected' ? result.reason : null
    }));
  } catch (error) {
    console.error('Batch request failed:', error);
    throw error;
  }
};

// ==================== Preload Data ====================

export const preloadCriticalData = async () => {
  console.log('🚀 Preloading critical data...');
  
  const criticalRequests = [
    { endpoint: '/products?limit=20', cacheKey: 'products_critical', cacheDuration: CACHE_DURATIONS.products },
    { endpoint: '/categories/hierarchical/all', cacheKey: 'categories_all', cacheDuration: CACHE_DURATIONS.categories },
    { endpoint: '/analytics/trending', cacheKey: 'products_trending', cacheDuration: CACHE_DURATIONS.products }
  ];

  const results = await batchRequest(criticalRequests);
  const successCount = results.filter(r => r.success).length;
  
  console.log(`✅ Preloaded ${successCount}/${criticalRequests.length} critical resources`);
  
  return results;
};

// ==================== Network-Aware Loading ====================

export const smartLoad = async (endpoint, options = {}) => {
  const networkSpeed = isSlowNetwork();
  
  if (networkSpeed) {
    console.log('🐌 Slow network detected, using aggressive caching');
    // On slow network, use longer cache and smaller payloads
    if (options.limit) {
      options.limit = Math.min(options.limit, 10);
    }
  }

  return cachedGet(endpoint, options.cacheKey, options.cacheDuration);
};

// ==================== Progressive Loading ====================

export const progressiveLoad = async (endpoint, initialLimit = 10, maxLimit = 50) => {
  // Load initial batch quickly
  const initial = await cachedGet(`${endpoint}?limit=${initialLimit}`, `${endpoint}_initial_${initialLimit}`);
  
  // Load rest in background
  setTimeout(async () => {
    try {
      await cachedGet(`${endpoint}?limit=${maxLimit}`, `${endpoint}_full_${maxLimit}`);
      console.log('✅ Progressive load completed');
    } catch (error) {
      console.warn('Progressive load failed:', error);
    }
  }, 1000);

  return initial;
};

// ==================== Request Deduplication ====================

const pendingRequests = new Map();

export const deduplicatedRequest = async (key, requestFn) => {
  if (pendingRequests.has(key)) {
    console.log('⏳ Request already pending, waiting...', key);
    return pendingRequests.get(key);
  }

  const promise = requestFn()
    .finally(() => {
      pendingRequests.delete(key);
    });

  pendingRequests.set(key, promise);
  return promise;
};

// ==================== Export ====================

export default {
  api,
  cachedGet,
  productsAPI,
  categoriesAPI,
  userAPI,
  batchRequest,
  preloadCriticalData,
  smartLoad,
  progressiveLoad,
  deduplicatedRequest,
  CACHE_DURATIONS
};
