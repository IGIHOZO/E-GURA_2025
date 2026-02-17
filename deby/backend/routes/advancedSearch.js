const express = require('express');
const router = express.Router();
const advancedSearchService = require('../services/advancedSearchService');

/**
 * Advanced AI-Powered Search Endpoints
 */

// Main search endpoint
router.get('/', async (req, res) => {
  try {
    const searchOptions = {
      query: req.query.q || req.query.query || '',
      category: req.query.category || '',
      subcategory: req.query.subcategory || '',
      minPrice: req.query.minPrice || 0,
      maxPrice: req.query.maxPrice || 10000000,
      colors: req.query.colors ? req.query.colors.split(',') : [],
      sizes: req.query.sizes ? req.query.sizes.split(',') : [],
      materials: req.query.materials ? req.query.materials.split(',') : [],
      brands: req.query.brands ? req.query.brands.split(',') : [],
      tags: req.query.tags ? req.query.tags.split(',') : [],
      gender: req.query.gender || '',
      ageGroup: req.query.ageGroup || '',
      inStock: req.query.inStock === 'true',
      isNew: req.query.isNew === 'true',
      isSale: req.query.isSale === 'true',
      isFeatured: req.query.isFeatured === 'true',
      sortBy: req.query.sortBy || 'relevance',
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 20,
      userId: req.query.userId || req.user?.id || null
    };

    console.log('🔍 Advanced Search Request:', {
      query: searchOptions.query,
      filters: Object.keys(searchOptions).filter(key => 
        searchOptions[key] && !['query', 'page', 'limit', 'userId'].includes(key)
      )
    });

    const results = await advancedSearchService.search(searchOptions);

    res.json(results);
  } catch (error) {
    console.error('Search endpoint error:', error);
    res.status(500).json({
      success: false,
      message: 'Search failed',
      error: error.message
    });
  }
});

// Autocomplete suggestions
router.get('/autocomplete', async (req, res) => {
  try {
    const { q, limit = 10 } = req.query;

    if (!q || q.length < 2) {
      return res.json({
        success: true,
        suggestions: []
      });
    }

    const suggestions = await advancedSearchService.getAutocompleteSuggestions(q, parseInt(limit));

    res.json({
      success: true,
      suggestions
    });
  } catch (error) {
    console.error('Autocomplete error:', error);
    res.status(500).json({
      success: false,
      message: 'Autocomplete failed',
      error: error.message
    });
  }
});

// Trending searches
router.get('/trending', async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    const trending = advancedSearchService.getTrendingSearches(parseInt(limit));

    res.json({
      success: true,
      trending
    });
  } catch (error) {
    console.error('Trending searches error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get trending searches',
      error: error.message
    });
  }
});

// Track product interaction (for personalization)
router.post('/track', async (req, res) => {
  try {
    const { userId, productId, type = 'view' } = req.body;

    if (!userId || !productId) {
      return res.status(400).json({
        success: false,
        message: 'userId and productId are required'
      });
    }

    advancedSearchService.trackProductInteraction(userId, productId, type);

    res.json({
      success: true,
      message: 'Interaction tracked'
    });
  } catch (error) {
    console.error('Track interaction error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to track interaction',
      error: error.message
    });
  }
});

// Get personalized recommendations
router.get('/recommendations', async (req, res) => {
  try {
    const { userId, query = '', limit = 10 } = req.query;

    const recommendations = await advancedSearchService.getRecommendations(
      query,
      userId,
      []
    );

    res.json({
      success: true,
      recommendations: recommendations.slice(0, parseInt(limit))
    });
  } catch (error) {
    console.error('Recommendations error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get recommendations',
      error: error.message
    });
  }
});

module.exports = router;
