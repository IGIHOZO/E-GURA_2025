const express = require('express');
const router = express.Router();
const searchEngineV2 = require('../services/searchEngineV2');
const recommendationService = require('../services/recommendationService');
const UserEvent = require('../models/UserEvent');
const FeatureFlag = require('../models/FeatureFlag');
const Product = require('../models/Product');
const searchCache = require('../middleware/searchCache');
const rateLimiter = require('../middleware/rateLimiter');
const vectorIndexer = require('../jobs/vectorIndexer');

// Extract user identity from request
const extractIdentity = (req, res, next) => {
  req.identity = {
    userId: req.body.userId || req.query.userId || req.user?.id || null,
    deviceId: req.body.deviceId || req.query.deviceId || req.headers['x-device-id'] || null,
    sessionId: req.body.sessionId || req.query.sessionId || req.headers['x-session-id'] || null
  };
  if (!req.identity.deviceId) {
    req.identity.deviceId = `anon_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  next();
};

// Check feature flags
const checkFeatureFlag = (flagName) => {
  return async (req, res, next) => {
    try {
      const flag = await FeatureFlag.findOne({ name: flagName }).maxTimeMS(2000);
      if (!flag) {
        // If flag doesn't exist, allow by default (fail-open for better UX)
        console.log(`⚠️  Feature flag ${flagName} not found, allowing request`);
        return next();
      }
      if (!flag.enabled) {
        return res.status(503).json({
          success: false,
          error: 'Feature not available',
          message: `${flagName} is currently disabled`
        });
      }
      next();
    } catch (error) {
      // On error, allow the request to proceed (fail-open)
      console.log(`⚠️  Feature flag check failed for ${flagName}, allowing request:`, error.message);
      next();
    }
  };
};

// Health check with detailed metrics
router.get('/health', async (req, res) => {
  try {
    const flags = await FeatureFlag.find({ name: /^search\./ }).lean();
    const productCount = await Product.countDocuments({ isActive: true });
    const indexStatus = await vectorIndexer.getStatus();
    const cacheStats = searchCache.getStats();
    const rateLimitStats = rateLimiter.getStats();
    
    res.json({
      success: true,
      status: 'operational',
      version: '2.0',
      features: flags.reduce((acc, flag) => { acc[flag.name] = flag.enabled; return acc; }, {}),
      stats: {
        activeProducts: productCount,
        vectorIndex: indexStatus,
        cache: cacheStats,
        rateLimit: rateLimitStats
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Main search endpoint (POST) - with rate limiting
router.post('/', 
  checkFeatureFlag('search.v2.enabled'),
  extractIdentity,
  rateLimiter.middleware('search'),
  async (req, res) => {
    try {
      const { query = '', filters = {}, sortBy = 'relevance', page = 1, limit = 20 } = req.body;
      const result = await searchEngineV2.search({
        query, filters, sortBy, page, limit,
        userId: req.identity.userId, deviceId: req.identity.deviceId
      });
      if (query) {
        // Track asynchronously without blocking response
        UserEvent.track({
          userId: req.identity.userId, deviceId: req.identity.deviceId,
          sessionId: req.identity.sessionId, eventType: 'search', query
        }).catch(err => console.error('UserEvent tracking failed:', err.message));
      }
      res.json(result);
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
);

// Main search endpoint (GET) - with caching and rate limiting
router.get('/',
  checkFeatureFlag('search.v2.enabled'),
  extractIdentity,
  rateLimiter.middleware('search'),
  searchCache.middleware(),
  async (req, res) => {
    try {
      const { 
        q: query = '', 
        category, brand, minPrice, maxPrice, minRating,
        sizes, colors, materials, tags,
        inStock,
        sortBy = 'relevance', 
        page = 1, 
        limit = 20,
        pageCursor
      } = req.query;
      
      const filters = {};
      if (category) filters.category = category;
      if (brand) filters.brand = brand;
      if (minPrice) filters.minPrice = Number(minPrice);
      if (maxPrice) filters.maxPrice = Number(maxPrice);
      if (minRating) filters.minRating = Number(minRating);
      if (inStock === 'true') filters.inStock = true;
      
      // Array filters
      if (sizes) filters.sizes = sizes.split(',');
      if (colors) filters.colors = colors.split(',');
      if (materials) filters.materials = materials.split(',');
      if (tags) filters.tags = tags.split(',');
      
      const result = await searchEngineV2.search({
        query, filters, sortBy, 
        page: Number(page), 
        limit: Number(limit),
        pageCursor,
        userId: req.identity.userId, 
        deviceId: req.identity.deviceId
      });
      
      if (query) {
        // Track asynchronously without blocking response
        UserEvent.track({
          userId: req.identity.userId, 
          deviceId: req.identity.deviceId,
          sessionId: req.identity.sessionId, 
          eventType: 'search', 
          query,
          filters,
          sortBy
        }).catch(err => console.error('UserEvent tracking failed:', err.message));
      }
      
      res.json(result);
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
);

// Home page recommendations
router.get('/reco/home',
  checkFeatureFlag('search.recommendations.enabled'),
  extractIdentity,
  rateLimiter.middleware('recommendations'),
  async (req, res) => {
    try {
      const { limit = 20 } = req.query;
      const data = await recommendationService.getHomeRecommendations(
        req.identity.userId, req.identity.deviceId, Number(limit)
      );
      res.json({ success: true, data, type: 'home', personalized: true });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
);

// Related products (similar to current product)
router.get('/reco/related/:productId',
  checkFeatureFlag('search.recommendations.enabled'),
  rateLimiter.middleware('recommendations'),
  async (req, res) => {
    try {
      const { limit = 10 } = req.query;
      const data = await recommendationService.getRelatedProducts(
        req.params.productId, 
        Number(limit)
      );
      res.json({ success: true, data, type: 'related' });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
);

// "Because you viewed..." recommendations
router.get('/reco/because-you-viewed',
  checkFeatureFlag('search.recommendations.enabled'),
  extractIdentity,
  rateLimiter.middleware('recommendations'),
  async (req, res) => {
    try {
      const { limit = 10 } = req.query;
      const data = await recommendationService.getBecauseYouViewed(
        req.identity.userId,
        req.identity.deviceId,
        Number(limit)
      );
      res.json({ success: true, data, type: 'because-you-viewed', personalized: true });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
);

// Trending products
router.get('/trending',
  rateLimiter.middleware('recommendations'),
  async (req, res) => {
    try {
      const { category = null, limit = 10 } = req.query;
      const data = await recommendationService.getTrendingProducts(category, Number(limit));
      res.json({ success: true, data, type: 'trending' });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
);

// Track user events
router.post('/track',
  extractIdentity,
  rateLimiter.middleware('track'),
  async (req, res) => {
    try {
      const { eventType, productId, query, priceAtTime, quantity, dwellTime, category, filters, sortBy } = req.body;
      if (!eventType) {
        return res.status(400).json({ success: false, message: 'eventType required' });
      }
      
      // Track asynchronously
      UserEvent.track({
        userId: req.identity.userId,
        deviceId: req.identity.deviceId,
        sessionId: req.identity.sessionId,
        eventType,
        productId,
        query,
        category,
        filters,
        sortBy,
        priceAtTime,
        quantity,
        dwellTime
      }).then(() => {
        // Invalidate personalized cache when user interacts
        if (productId || query) {
          searchCache.invalidateUser(req.identity.userId, req.identity.deviceId);
        }
      }).catch(err => {
        console.error('UserEvent tracking failed:', err.message);
      });
      
      // Respond immediately
      res.json({ success: true, message: 'Event tracked' });
    } catch (error) {
      // Don't fail the request if tracking fails
      console.error('Track endpoint error:', error.message);
      res.json({ success: true, message: 'Tracking failed but request succeeded' });
    }
  }
);

// Type-ahead suggestions
router.get('/suggestions',
  rateLimiter.middleware('suggestions'),
  async (req, res) => {
    try {
      const { q } = req.query;
      if (!q || q.length < 2) {
        return res.json({ success: true, suggestions: [] });
      }
      
      const products = await Product.find({
        isActive: true,
        $or: [
          { name: new RegExp(q, 'i') },
          { category: new RegExp(q, 'i') },
          { brand: new RegExp(q, 'i') },
          { tags: new RegExp(q, 'i') }
        ]
      }).select('name category brand tags').limit(20).lean();
      
      const suggestions = new Set();
      products.forEach(p => {
        if (p.name.toLowerCase().includes(q.toLowerCase())) {
          suggestions.add(p.name);
        }
        if (p.category?.toLowerCase().includes(q.toLowerCase())) {
          suggestions.add(p.category);
        }
        if (p.brand?.toLowerCase().includes(q.toLowerCase())) {
          suggestions.add(p.brand);
        }
        p.tags?.forEach(tag => {
          if (tag.toLowerCase().includes(q.toLowerCase())) {
            suggestions.add(tag);
          }
        });
      });
      
      res.json({ 
        success: true, 
        suggestions: Array.from(suggestions).slice(0, 10),
        query: q
      });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
);

// Admin: Trigger vector indexing
router.post('/admin/index',
  async (req, res) => {
    try {
      const { type = 'updated' } = req.body;
      
      if (type === 'all') {
        // Start full indexing in background
        vectorIndexer.indexAll().catch(err => console.error('Indexing error:', err));
        res.json({ success: true, message: 'Full indexing started in background' });
      } else {
        // Index updated products
        const result = await vectorIndexer.indexUpdated();
        res.json({ success: true, message: 'Updated products indexed', result });
      }
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
);

// Admin: Get indexing status
router.get('/admin/index/status', async (req, res) => {
  try {
    const status = await vectorIndexer.getStatus();
    res.json({ success: true, status });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Admin: Clear cache
router.post('/admin/cache/clear', (req, res) => {
  try {
    const { pattern } = req.body;
    searchCache.invalidate(pattern);
    res.json({ success: true, message: 'Cache cleared' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Admin: Get cache stats
router.get('/admin/cache/stats', (req, res) => {
  try {
    const stats = searchCache.getStats();
    res.json({ success: true, stats });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
