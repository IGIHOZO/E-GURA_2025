/**
 * Search Cache Middleware - Server-side caching for search queries
 * Implements intelligent cache invalidation and personalization-aware caching
 */

class SearchCache {
  constructor() {
    this.cache = new Map();
    this.defaultTTL = 120000; // 120 seconds (2 minutes)
    this.personalizedTTL = 60000; // 60 seconds for personalized results
    this.maxCacheSize = 1000; // Maximum number of cached entries
    this.hits = 0;
    this.misses = 0;
  }

  /**
   * Generate cache key from request
   */
  generateKey(query, filters, sortBy, userId, deviceId) {
    const baseKey = JSON.stringify({
      q: query || '',
      f: filters || {},
      s: sortBy || 'relevance'
    });

    // Personalized results get unique keys per user/device
    if (userId || deviceId) {
      return `personalized:${userId || deviceId}:${baseKey}`;
    }

    return `public:${baseKey}`;
  }

  /**
   * Get from cache
   */
  get(key) {
    const entry = this.cache.get(key);
    
    if (!entry) {
      this.misses++;
      return null;
    }

    // Check if expired
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      this.misses++;
      return null;
    }

    this.hits++;
    return entry.data;
  }

  /**
   * Set cache entry
   */
  set(key, data, ttl = null) {
    // Enforce cache size limit
    if (this.cache.size >= this.maxCacheSize) {
      // Remove oldest entries (simple LRU)
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }

    const isPersonalized = key.startsWith('personalized:');
    const cacheTTL = ttl || (isPersonalized ? this.personalizedTTL : this.defaultTTL);

    this.cache.set(key, {
      data,
      createdAt: Date.now(),
      expiresAt: Date.now() + cacheTTL
    });
  }

  /**
   * Invalidate cache entries
   */
  invalidate(pattern = null) {
    if (!pattern) {
      // Clear all
      this.cache.clear();
      return;
    }

    // Clear matching pattern
    const keys = Array.from(this.cache.keys());
    keys.forEach(key => {
      if (key.includes(pattern)) {
        this.cache.delete(key);
      }
    });
  }

  /**
   * Invalidate personalized cache for user
   */
  invalidateUser(userId, deviceId) {
    const identifier = userId || deviceId;
    if (identifier) {
      this.invalidate(`personalized:${identifier}`);
    }
  }

  /**
   * Get cache statistics
   */
  getStats() {
    const total = this.hits + this.misses;
    return {
      size: this.cache.size,
      hits: this.hits,
      misses: this.misses,
      hitRate: total > 0 ? ((this.hits / total) * 100).toFixed(2) : 0,
      maxSize: this.maxCacheSize
    };
  }

  /**
   * Clear statistics
   */
  clearStats() {
    this.hits = 0;
    this.misses = 0;
  }

  /**
   * Express middleware
   */
  middleware() {
    return (req, res, next) => {
      // Only cache GET requests
      if (req.method !== 'GET') {
        return next();
      }

      const { q: query, category, brand, minPrice, maxPrice, sortBy } = req.query;
      const userId = req.identity?.userId || req.query.userId;
      const deviceId = req.identity?.deviceId || req.query.deviceId;

      const filters = { category, brand, minPrice, maxPrice };
      const cacheKey = this.generateKey(query, filters, sortBy, userId, deviceId);

      // Try to get from cache
      const cached = this.get(cacheKey);
      if (cached) {
        return res.json({
          ...cached,
          cached: true,
          cacheHit: true
        });
      }

      // Store original json method
      const originalJson = res.json.bind(res);

      // Override json method to cache response
      res.json = (data) => {
        if (res.statusCode === 200 && data.success) {
          this.set(cacheKey, data);
        }
        return originalJson({
          ...data,
          cached: false,
          cacheHit: false
        });
      };

      next();
    };
  }
}

module.exports = new SearchCache();
