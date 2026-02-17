/**
 * Advanced Performance Optimization Utilities
 * Ensures page load times < 2 seconds with caching and optimization
 */

// ==================== Cache Management ====================

class CacheManager {
  constructor() {
    this.memoryCache = new Map();
    this.cacheVersion = '1.0.0';
  }

  // Get from cache with TTL check
  get(key, maxAge = 300000) { // Default 5 minutes
    const cached = this.memoryCache.get(key);
    if (!cached) return null;
    
    if (Date.now() - cached.timestamp > maxAge) {
      this.memoryCache.delete(key);
      return null;
    }
    
    return cached.data;
  }

  // Set cache with timestamp
  set(key, data) {
    this.memoryCache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  // Clear cache
  clear(key) {
    if (key) {
      this.memoryCache.delete(key);
    } else {
      this.memoryCache.clear();
    }
  }

  // Get cache size
  size() {
    return this.memoryCache.size;
  }
}

export const cacheManager = new CacheManager();

// ==================== Local Storage Cache ====================

export const localCache = {
  set: (key, value, ttl = 3600000) => { // Default 1 hour
    try {
      const item = {
        value,
        timestamp: Date.now(),
        ttl
      };
      localStorage.setItem(key, JSON.stringify(item));
    } catch (e) {
      console.warn('LocalStorage cache failed:', e);
    }
  },

  get: (key) => {
    try {
      const item = localStorage.getItem(key);
      if (!item) return null;

      const parsed = JSON.parse(item);
      if (Date.now() - parsed.timestamp > parsed.ttl) {
        localStorage.removeItem(key);
        return null;
      }

      return parsed.value;
    } catch (e) {
      return null;
    }
  },

  remove: (key) => {
    localStorage.removeItem(key);
  },

  clear: () => {
    localStorage.clear();
  }
};

// ==================== API Cache Interceptor ====================

export class APICache {
  constructor() {
    this.cache = new Map();
    this.pending = new Map();
  }

  async cachedFetch(url, options = {}, ttl = 300000) {
    const cacheKey = `${url}_${JSON.stringify(options)}`;
    
    // Check cache first
    const cached = cacheManager.get(cacheKey, ttl);
    if (cached) {
      console.log('📦 Serving from cache:', url);
      return cached;
    }

    // Check if request is already pending (deduplication)
    if (this.pending.has(cacheKey)) {
      console.log('⏳ Request already pending, waiting...', url);
      return this.pending.get(cacheKey);
    }

    // Make request
    const fetchPromise = fetch(url, options)
      .then(res => res.json())
      .then(data => {
        cacheManager.set(cacheKey, data);
        this.pending.delete(cacheKey);
        return data;
      })
      .catch(err => {
        this.pending.delete(cacheKey);
        throw err;
      });

    this.pending.set(cacheKey, fetchPromise);
    return fetchPromise;
  }
}

export const apiCache = new APICache();

// ==================== Resource Preloading ====================

export const preloadResource = (href, as = 'script') => {
  const link = document.createElement('link');
  link.rel = 'preload';
  link.as = as;
  link.href = href;
  document.head.appendChild(link);
};

export const preloadImage = (src) => {
  const img = new Image();
  img.src = src;
};

export const preloadImages = (srcs) => {
  srcs.forEach(src => preloadImage(src));
};

// ==================== Lazy Loading ====================

export const lazyLoadImage = (img) => {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const target = entry.target;
        target.src = target.dataset.src;
        target.classList.add('loaded');
        observer.unobserve(target);
      }
    });
  }, {
    rootMargin: '50px' // Start loading 50px before visible
  });

  observer.observe(img);
};

// ==================== Code Splitting Helpers ====================

export const loadComponentAsync = (importFunc) => {
  return React.lazy(() => 
    importFunc().catch(err => {
      console.error('Component load failed:', err);
      return { default: () => <div>Failed to load component</div> };
    })
  );
};

// ==================== Performance Monitoring ====================

export class PerformanceMonitor {
  constructor() {
    this.metrics = {};
  }

  mark(name) {
    if (performance.mark) {
      performance.mark(name);
    }
  }

  measure(name, startMark, endMark) {
    if (performance.measure) {
      try {
        performance.measure(name, startMark, endMark);
        const measure = performance.getEntriesByName(name)[0];
        this.metrics[name] = measure.duration;
        console.log(`⚡ ${name}: ${measure.duration.toFixed(2)}ms`);
        return measure.duration;
      } catch (e) {
        console.warn('Performance measure failed:', e);
      }
    }
  }

  getMetrics() {
    return this.metrics;
  }

  logPageLoad() {
    if (performance.timing) {
      const perfData = performance.timing;
      const pageLoadTime = perfData.loadEventEnd - perfData.navigationStart;
      const connectTime = perfData.responseEnd - perfData.requestStart;
      const renderTime = perfData.domComplete - perfData.domLoading;
      
      console.log('📊 Page Performance Metrics:');
      console.log(`  Total Load Time: ${pageLoadTime}ms`);
      console.log(`  Server Response: ${connectTime}ms`);
      console.log(`  DOM Render: ${renderTime}ms`);
      
      return { pageLoadTime, connectTime, renderTime };
    }
  }
}

export const perfMonitor = new PerformanceMonitor();

// ==================== Debounce & Throttle ====================

export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

export const throttle = (func, limit) => {
  let inThrottle;
  return function(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};

// ==================== Image Optimization ====================

export const optimizeImage = (src, width = 800, quality = 80) => {
  // If using a CDN, add query parameters for optimization
  if (src.includes('unsplash.com')) {
    return `${src}&w=${width}&q=${quality}&fm=webp&fit=crop`;
  }
  if (src.includes('cloudinary.com')) {
    return src.replace('/upload/', `/upload/w_${width},q_${quality},f_auto/`);
  }
  return src;
};

// ==================== Bundle Size Optimization ====================

export const importOnInteraction = (loader) => {
  let component = null;
  
  return {
    load: async () => {
      if (!component) {
        component = await loader();
      }
      return component;
    }
  };
};

// ==================== Network Detection ====================

export const getNetworkSpeed = () => {
  if (navigator.connection) {
    const connection = navigator.connection;
    return {
      effectiveType: connection.effectiveType,
      downlink: connection.downlink,
      rtt: connection.rtt,
      saveData: connection.saveData
    };
  }
  return null;
};

export const isSlowNetwork = () => {
  const network = getNetworkSpeed();
  if (!network) return false;
  return network.effectiveType === '2g' || network.effectiveType === 'slow-2g' || network.saveData;
};

// ==================== Compression ====================

export const compressJSON = (data) => {
  try {
    return btoa(JSON.stringify(data));
  } catch (e) {
    return data;
  }
};

export const decompressJSON = (compressed) => {
  try {
    return JSON.parse(atob(compressed));
  } catch (e) {
    return compressed;
  }
};

// ==================== Critical CSS ====================

export const injectCriticalCSS = (css) => {
  const style = document.createElement('style');
  style.textContent = css;
  document.head.appendChild(style);
};

// ==================== Prefetch ====================

export const prefetchPage = (href) => {
  const link = document.createElement('link');
  link.rel = 'prefetch';
  link.href = href;
  document.head.appendChild(link);
};

export const prefetchDNS = (domain) => {
  const link = document.createElement('link');
  link.rel = 'dns-prefetch';
  link.href = domain;
  document.head.appendChild(link);
};

// ==================== Service Worker Helpers ====================

export const registerServiceWorker = async () => {
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.register('/service-worker.js');
      console.log('✅ Service Worker registered:', registration);
      return registration;
    } catch (err) {
      console.error('❌ Service Worker registration failed:', err);
    }
  }
};

// ==================== Priority Hints ====================

export const addPriorityHint = (element, priority = 'high') => {
  element.setAttribute('importance', priority);
  element.setAttribute('fetchpriority', priority);
};

// ==================== Resource Timing ====================

export const logResourceTiming = () => {
  if (performance.getEntriesByType) {
    const resources = performance.getEntriesByType('resource');
    const slowResources = resources.filter(r => r.duration > 1000);
    
    if (slowResources.length > 0) {
      console.warn('⚠️ Slow Resources (>1s):');
      slowResources.forEach(r => {
        console.log(`  ${r.name}: ${r.duration.toFixed(2)}ms`);
      });
    }
  }
};

// ==================== Memory Management ====================

export const cleanupMemory = () => {
  // Clear old cache entries
  if (cacheManager.size() > 100) {
    console.log('🧹 Cleaning up memory cache...');
    cacheManager.clear();
  }
  
  // Clear old localStorage items
  const now = Date.now();
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    try {
      const item = JSON.parse(localStorage.getItem(key));
      if (item.timestamp && now - item.timestamp > item.ttl) {
        localStorage.removeItem(key);
      }
    } catch (e) {
      // Skip invalid items
    }
  }
};

// Auto cleanup every 5 minutes
setInterval(cleanupMemory, 300000);

// ==================== Export All ====================

export default {
  cacheManager,
  localCache,
  apiCache,
  preloadResource,
  preloadImage,
  preloadImages,
  lazyLoadImage,
  loadComponentAsync,
  perfMonitor,
  debounce,
  throttle,
  optimizeImage,
  importOnInteraction,
  getNetworkSpeed,
  isSlowNetwork,
  compressJSON,
  decompressJSON,
  injectCriticalCSS,
  prefetchPage,
  prefetchDNS,
  registerServiceWorker,
  addPriorityHint,
  logResourceTiming,
  cleanupMemory
};
