/**
 * Intelligent AI Search Routes
 * Unified search API with advanced AI capabilities
 */

const express = require('express');
const router = express.Router();
const intelligentSearchService = require('../services/intelligentSearchService');

/**
 * Main AI Search Endpoint
 * Supports both GET and POST methods
 * GET /api/intelligent-search or POST /api/intelligent-search
 */
const handleSearch = async (req, res) => {
  try {
    // Support both GET and POST
    const params = req.method === 'GET' ? req.query : req.body;
    
    let {
      query = '',
      category,
      brand,
      minPrice,
      maxPrice,
      minRating,
      sizes,
      colors,
      materials,
      tags,
      gender,
      inStock,
      sortBy = 'relevance',
      page = 1,
      limit = 20,
      userId
    } = params;
    
    // Parse filters
    const filters = {};
    if (category) filters.category = category;
    if (brand) filters.brand = brand;
    if (minPrice) filters.minPrice = Number(minPrice);
    if (maxPrice) filters.maxPrice = Number(maxPrice);
    if (minRating) filters.minRating = Number(minRating);
    if (inStock === 'true' || inStock === true) filters.inStock = true;
    if (gender) filters.gender = gender;
    
    // Parse array filters
    if (sizes) filters.sizes = Array.isArray(sizes) ? sizes : sizes.split(',');
    if (colors) filters.colors = Array.isArray(colors) ? colors : colors.split(',');
    if (materials) filters.materials = Array.isArray(materials) ? materials : materials.split(',');
    if (tags) filters.tags = Array.isArray(tags) ? tags : tags.split(',');
    
    // Parse filters from JSON string if present
    if (params.filters && typeof params.filters === 'string') {
      try {
        const parsedFilters = JSON.parse(params.filters);
        Object.assign(filters, parsedFilters);
      } catch (e) {
        console.warn('Failed to parse filters JSON:', e);
      }
    }
    
    console.log('🔍 Intelligent Search:', { query, filters, sortBy, page, limit });
    
    const result = await intelligentSearchService.search({
      query,
      filters,
      sortBy,
      page: Number(page),
      limit: Number(limit),
      userId: userId || req.headers['x-user-id'] || null
    });
    
    res.json(result);
    
  } catch (error) {
    console.error('❌ Search Error:', error);
    res.status(500).json({
      success: false,
      message: 'Search failed',
      error: error.message
    });
  }
};

// Register both GET and POST
router.get('/', handleSearch);
router.post('/', handleSearch);
router.get('/products', handleSearch);
router.post('/products', handleSearch);

/**
 * Get personalized recommendations
 * GET /api/intelligent-search/recommendations/:userId
 */
router.get('/recommendations/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 6 } = req.query;
    
    const recommendations = await intelligentSearchService.getPersonalizedRecommendations(
      userId,
      Number(limit)
    );
    
    res.json({
      success: true,
      data: recommendations,
      count: recommendations.length
    });
    
  } catch (error) {
    console.error('❌ Recommendations Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get recommendations',
      error: error.message
    });
  }
});

/**
 * Get related products
 * GET /api/intelligent-search/related/:productId
 */
router.get('/related/:productId', async (req, res) => {
  try {
    const { productId } = req.params;
    const { limit = 8 } = req.query;
    
    const related = await intelligentSearchService.getRelatedProducts(
      productId,
      Number(limit)
    );
    
    res.json({
      success: true,
      data: related,
      count: related.length
    });
    
  } catch (error) {
    console.error('❌ Related Products Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get related products',
      error: error.message
    });
  }
});

/**
 * Get trending products
 * GET /api/intelligent-search/trending
 */
router.get('/trending', async (req, res) => {
  try {
    const { category, limit = 10 } = req.query;
    
    const trending = await intelligentSearchService.getTrendingProducts(
      category,
      Number(limit)
    );
    
    res.json({
      success: true,
      data: trending,
      count: trending.length
    });
    
  } catch (error) {
    console.error('❌ Trending Products Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get trending products',
      error: error.message
    });
  }
});

/**
 * Get autocomplete suggestions
 * GET /api/intelligent-search/autocomplete
 */
router.get('/autocomplete', async (req, res) => {
  try {
    const { q, limit = 10 } = req.query;
    
    if (!q || q.length < 2) {
      return res.json({
        success: true,
        suggestions: []
      });
    }
    
    const suggestions = await intelligentSearchService.getAutocompleteSuggestions(
      q,
      Number(limit)
    );
    
    res.json({
      success: true,
      suggestions,
      query: q
    });
    
  } catch (error) {
    console.error('❌ Autocomplete Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get suggestions',
      error: error.message
    });
  }
});

/**
 * Get cart-based recommendations
 * POST /api/intelligent-search/cart-recommendations
 */
router.post('/cart-recommendations', async (req, res) => {
  try {
    const { cartItems, limit = 6 } = req.body;
    
    const recommendations = await intelligentSearchService.getCartBasedRecommendations(
      cartItems,
      Number(limit)
    );
    
    res.json({
      success: true,
      data: recommendations,
      count: recommendations.length
    });
    
  } catch (error) {
    console.error('❌ Cart Recommendations Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get cart recommendations',
      error: error.message
    });
  }
});

/**
 * Get search analytics (Admin only)
 * GET /api/intelligent-search/analytics
 */
router.get('/analytics', async (req, res) => {
  try {
    const { days = 7 } = req.query;
    
    const analytics = await intelligentSearchService.getSearchAnalytics(Number(days));
    
    res.json({
      success: true,
      data: analytics,
      period: `Last ${days} days`
    });
    
  } catch (error) {
    console.error('❌ Analytics Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get analytics',
      error: error.message
    });
  }
});

/**
 * Track user events (view, add to cart, purchase)
 * POST /api/intelligent-search/track
 */
router.post('/track', async (req, res) => {
  try {
    const { userId, eventType, productId, product } = req.body;
    
    if (!userId || !eventType || !productId) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: userId, eventType, productId'
      });
    }
    
    await intelligentSearchService.trackUserEvent(userId, eventType, productId, product);
    
    res.json({
      success: true,
      message: 'Event tracked successfully',
      eventType,
      productId
    });
    
  } catch (error) {
    console.error('❌ Track Event Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to track event',
      error: error.message
    });
  }
});

/**
 * Get cache statistics for debugging
 * GET /api/intelligent-search/cache-stats
 */
router.get('/cache-stats', (req, res) => {
  try {
    const stats = intelligentSearchService.getCacheStats();
    res.json({
      success: true,
      data: stats,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error getting cache stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get cache statistics',
      error: error.message
    });
  }
});

/**
 * Health check
 * GET /api/intelligent-search/health
 */
router.get('/health', (req, res) => {
  res.json({
    success: true,
    service: 'Intelligent AI Search',
    status: 'operational',
    features: [
      'AI-powered search',
      'Personalized recommendations',
      'Collaborative filtering',
      'Semantic ranking',
      'Real-time autocomplete',
      'Trending products',
      'Advanced filtering & sorting',
      'User behavior tracking',
      'Search analytics'
    ],
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
