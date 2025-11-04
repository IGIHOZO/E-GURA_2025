/**
 * Rate Limiter Middleware - Protects search endpoints from abuse
 * Implements sliding window rate limiting with different tiers
 */

class RateLimiter {
  constructor() {
    this.requests = new Map(); // userId/deviceId -> [timestamps]
    this.cleanupInterval = 60000; // Cleanup every minute
    
    // Rate limits (requests per minute)
    this.limits = {
      search: 60,        // 60 searches per minute
      suggestions: 120,  // 120 suggestion requests per minute
      track: 300,        // 300 tracking events per minute
      recommendations: 30 // 30 recommendation requests per minute
    };

    // Start cleanup job
    this.startCleanup();
  }

  /**
   * Check if request should be rate limited
   */
  isRateLimited(identifier, endpoint = 'search') {
    const now = Date.now();
    const windowMs = 60000; // 1 minute window
    const limit = this.limits[endpoint] || this.limits.search;

    // Get or create request log for this identifier
    if (!this.requests.has(identifier)) {
      this.requests.set(identifier, []);
    }

    const requestLog = this.requests.get(identifier);

    // Remove old requests outside the window
    const recentRequests = requestLog.filter(timestamp => now - timestamp < windowMs);
    this.requests.set(identifier, recentRequests);

    // Check if limit exceeded
    if (recentRequests.length >= limit) {
      return {
        limited: true,
        retryAfter: Math.ceil((recentRequests[0] + windowMs - now) / 1000),
        limit,
        remaining: 0
      };
    }

    // Add current request
    recentRequests.push(now);
    this.requests.set(identifier, recentRequests);

    return {
      limited: false,
      limit,
      remaining: limit - recentRequests.length,
      resetAt: new Date(now + windowMs)
    };
  }

  /**
   * Express middleware
   */
  middleware(endpoint = 'search') {
    return (req, res, next) => {
      // Get identifier (prefer userId, fallback to deviceId, then IP)
      const identifier = 
        req.identity?.userId ||
        req.identity?.deviceId ||
        req.query.userId ||
        req.query.deviceId ||
        req.headers['x-device-id'] ||
        req.ip ||
        req.connection.remoteAddress;

      if (!identifier) {
        // No identifier, allow but warn
        console.warn('Rate limiter: No identifier found');
        return next();
      }

      const result = this.isRateLimited(identifier, endpoint);

      // Set rate limit headers
      res.setHeader('X-RateLimit-Limit', result.limit);
      res.setHeader('X-RateLimit-Remaining', result.remaining || 0);
      
      if (result.limited) {
        res.setHeader('X-RateLimit-Reset', result.retryAfter);
        res.setHeader('Retry-After', result.retryAfter);
        
        return res.status(429).json({
          success: false,
          error: 'Rate limit exceeded',
          message: `Too many requests. Please try again in ${result.retryAfter} seconds.`,
          retryAfter: result.retryAfter
        });
      }

      if (result.resetAt) {
        res.setHeader('X-RateLimit-Reset', Math.floor(result.resetAt.getTime() / 1000));
      }

      next();
    };
  }

  /**
   * Cleanup old entries
   */
  cleanup() {
    const now = Date.now();
    const windowMs = 60000;

    for (const [identifier, requestLog] of this.requests.entries()) {
      const recentRequests = requestLog.filter(timestamp => now - timestamp < windowMs);
      
      if (recentRequests.length === 0) {
        this.requests.delete(identifier);
      } else {
        this.requests.set(identifier, recentRequests);
      }
    }
  }

  /**
   * Start cleanup interval
   */
  startCleanup() {
    setInterval(() => this.cleanup(), this.cleanupInterval);
  }

  /**
   * Get statistics
   */
  getStats() {
    return {
      activeUsers: this.requests.size,
      limits: this.limits
    };
  }

  /**
   * Reset rate limit for identifier
   */
  reset(identifier) {
    this.requests.delete(identifier);
  }
}

module.exports = new RateLimiter();
