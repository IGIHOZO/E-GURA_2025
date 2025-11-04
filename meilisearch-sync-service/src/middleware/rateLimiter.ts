import { Request, Response, NextFunction } from 'express';
import { RateLimiterMemory } from 'rate-limiter-flexible';

const searchRateLimiter = new RateLimiterMemory({
  keyPrefix: 'search_limit',
  points: parseInt(process.env.SEARCH_RATE_LIMIT_PER_MINUTE || '100'), // Number of requests
  duration: 60, // Per minute
});

const suggestionsRateLimiter = new RateLimiterMemory({
  keyPrefix: 'suggestions_limit',
  points: 200, // More lenient for suggestions
  duration: 60,
});

export const rateLimiter = {
  middleware: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const key = req.ip || req.connection.remoteAddress || 'unknown';
      const endpoint = req.path;

      let limiter;
      if (endpoint.includes('/suggest')) {
        limiter = suggestionsRateLimiter;
      } else {
        limiter = searchRateLimiter;
      }

      await limiter.consume(key);
      next();
    } catch (rejRes: any) {
      const msBeforeNext = rejRes.msBeforeNext || 60000;

      res.status(429).json({
        success: false,
        error: 'Too many requests',
        message: `Rate limit exceeded. Try again in ${Math.ceil(msBeforeNext / 1000)} seconds.`,
        retryAfter: Math.ceil(msBeforeNext / 1000)
      });
    }
  },

  getStats: () => {
    return {
      search: {
        points: searchRateLimiter.points,
        duration: searchRateLimiter.duration,
      },
      suggestions: {
        points: suggestionsRateLimiter.points,
        duration: suggestionsRateLimiter.duration,
      }
    };
  }
};
