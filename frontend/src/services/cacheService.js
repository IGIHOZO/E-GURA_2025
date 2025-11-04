/**
 * AI-Powered Caching Service
 * Ultra-fast product loading with intelligent cache management
 */

class CacheService {
  constructor() {
    this.CACHE_PREFIX = 'egura_cache_';
    this.CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
    this.MAX_CACHE_SIZE = 50; // Maximum cached items
    this.predictiveCache = new Map();
    this.accessPattern = new Map();
  }

  /**
   * Generate cache key
   */
  getCacheKey(key) {
    return `${this.CACHE_PREFIX}${key}`;
  }

  /**
   * Set cache with timestamp
   */
  set(key, data, duration = this.CACHE_DURATION) {
    try {
      const cacheData = {
        data,
        timestamp: Date.now(),
        duration,
        accessCount: 0
      };
      
      const cacheKey = this.getCacheKey(key);
      localStorage.setItem(cacheKey, JSON.stringify(cacheData));
      
      // Track access patterns for AI prediction
      this.trackAccess(key);
      
      console.log('💾 Cached:', key);
      return true;
    } catch (error) {
      console.error('Cache set error:', error);
      return false;
    }
  }

  /**
   * Get from cache if not expired
   */
  get(key) {
    try {
      const cacheKey = this.getCacheKey(key);
      const cached = localStorage.getItem(cacheKey);
      
      if (!cached) return null;

      const cacheData = JSON.parse(cached);
      const now = Date.now();
      
      // Check if expired
      if (now - cacheData.timestamp > cacheData.duration) {
        this.delete(key);
        return null;
      }

      // Update access count
      cacheData.accessCount++;
      localStorage.setItem(cacheKey, JSON.stringify(cacheData));
      
      // Track access for AI
      this.trackAccess(key);
      
      console.log('⚡ Cache hit:', key, `(${cacheData.accessCount} accesses)`);
      return cacheData.data;
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  }

  /**
   * Delete specific cache
   */
  delete(key) {
    const cacheKey = this.getCacheKey(key);
    localStorage.removeItem(cacheKey);
  }

  /**
   * Clear all cache
   */
  clearAll() {
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith(this.CACHE_PREFIX)) {
        localStorage.removeItem(key);
      }
    });
    console.log('🧹 Cache cleared');
  }

  /**
   * Get cache size
   */
  getSize() {
    let count = 0;
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith(this.CACHE_PREFIX)) {
        count++;
      }
    });
    return count;
  }

  /**
   * Clean expired cache
   */
  cleanExpired() {
    const keys = Object.keys(localStorage);
    const now = Date.now();
    let cleaned = 0;

    keys.forEach(key => {
      if (key.startsWith(this.CACHE_PREFIX)) {
        try {
          const cached = JSON.parse(localStorage.getItem(key));
          if (now - cached.timestamp > cached.duration) {
            localStorage.removeItem(key);
            cleaned++;
          }
        } catch (error) {
          localStorage.removeItem(key);
          cleaned++;
        }
      }
    });

    if (cleaned > 0) {
      console.log(`🧹 Cleaned ${cleaned} expired cache entries`);
    }
  }

  /**
   * Track access patterns for AI prediction
   */
  trackAccess(key) {
    const pattern = this.accessPattern.get(key) || {
      count: 0,
      lastAccess: Date.now(),
      frequency: []
    };

    pattern.count++;
    const timeSinceLastAccess = Date.now() - pattern.lastAccess;
    pattern.frequency.push(timeSinceLastAccess);
    
    // Keep only last 10 access intervals
    if (pattern.frequency.length > 10) {
      pattern.frequency.shift();
    }
    
    pattern.lastAccess = Date.now();
    this.accessPattern.set(key, pattern);
  }

  /**
   * Predict next likely accessed items (AI)
   */
  predictNextAccess() {
    const predictions = [];
    
    this.accessPattern.forEach((pattern, key) => {
      // Calculate average access interval
      if (pattern.frequency.length > 0) {
        const avgInterval = pattern.frequency.reduce((a, b) => a + b, 0) / pattern.frequency.length;
        const timeSinceLastAccess = Date.now() - pattern.lastAccess;
        
        // If we're near the expected next access time
        if (timeSinceLastAccess >= avgInterval * 0.8) {
          predictions.push({
            key,
            likelihood: pattern.count / (timeSinceLastAccess / avgInterval),
            priority: pattern.count
          });
        }
      }
    });

    // Sort by likelihood
    predictions.sort((a, b) => b.likelihood - a.likelihood);
    
    return predictions.slice(0, 5); // Top 5 predictions
  }

  /**
   * Prefetch data (AI-powered)
   */
  async prefetch(fetchFn, key) {
    // Check if already cached and valid
    const cached = this.get(key);
    if (cached) return cached;

    // Fetch in background
    try {
      const data = await fetchFn();
      this.set(key, data);
      return data;
    } catch (error) {
      console.error('Prefetch error:', error);
      return null;
    }
  }

  /**
   * Batch cache multiple items
   */
  batchSet(items, keyFn, duration) {
    items.forEach(item => {
      const key = keyFn(item);
      this.set(key, item, duration);
    });
    console.log(`💾 Batch cached ${items.length} items`);
  }

  /**
   * Intelligent cache warming
   */
  warmCache(popularKeys, fetchFn) {
    console.log('🔥 Warming cache with popular items...');
    popularKeys.forEach(async (key) => {
      if (!this.get(key)) {
        await this.prefetch(fetchFn, key);
      }
    });
  }

  /**
   * Get cache statistics
   */
  getStats() {
    const keys = Object.keys(localStorage);
    let totalSize = 0;
    let cacheItems = 0;
    let totalAccesses = 0;

    keys.forEach(key => {
      if (key.startsWith(this.CACHE_PREFIX)) {
        try {
          const data = localStorage.getItem(key);
          totalSize += data.length;
          const cached = JSON.parse(data);
          totalAccesses += cached.accessCount || 0;
          cacheItems++;
        } catch (error) {
          // Invalid cache entry
        }
      }
    });

    return {
      items: cacheItems,
      sizeKB: (totalSize / 1024).toFixed(2),
      totalAccesses,
      avgAccessesPerItem: cacheItems > 0 ? (totalAccesses / cacheItems).toFixed(1) : 0,
      predictions: this.predictNextAccess().length
    };
  }
}

// Export singleton
const cacheService = new CacheService();

// Auto-clean expired cache every 5 minutes
setInterval(() => {
  cacheService.cleanExpired();
}, 5 * 60 * 1000);

export default cacheService;
