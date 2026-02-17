const express = require('express');
const router = express.Router();
const cacheResponse = require('../middleware/cacheMiddleware');
const {
  categories,
  getMainCategories,
  getSubcategories,
  getCategoryById,
  getSubcategoryById,
  searchCategories
} = require('../config/categories');

/**
 * Get all main categories
 * GET /api/categories
 */
router.get('/', cacheResponse(3600, {
  tags: ['categories', 'products:categories']
}), (req, res) => {
  try {
    const mainCategories = getMainCategories();
    
    res.json({
      success: true,
      total: mainCategories.length,
      categories: mainCategories
    });
  } catch (error) {
    console.error('❌ Get categories error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get categories',
      error: error.message
    });
  }
});

/**
 * Get all categories with subcategories
 * GET /api/categories/all
 */
router.get('/all', cacheResponse(3600, {
  tags: ['categories', 'products:categories']
}), (req, res) => {
  try {
    res.json({
      success: true,
      total: categories.length,
      categories: categories
    });
  } catch (error) {
    console.error('❌ Get all categories error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get all categories',
      error: error.message
    });
  }
});

/**
 * Get all hierarchical categories (alias for /all)
 * GET /api/categories/hierarchical/all
 */
router.get('/hierarchical/all', cacheResponse(3600, {
  tags: ['categories', 'products:categories']
}), (req, res) => {
  try {
    res.json({
      success: true,
      total: categories.length,
      categories: categories
    });
  } catch (error) {
    console.error('❌ Get hierarchical categories error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get hierarchical categories',
      error: error.message
    });
  }
});

/**
 * Get subcategories for a main category
 * GET /api/categories/:categoryId/subcategories
 */
router.get('/:categoryId/subcategories', cacheResponse(3600, {
  tags: ['categories', 'products:categories']
}), (req, res) => {
  try {
    const { categoryId } = req.params;
    const subcategories = getSubcategories(categoryId);
    
    if (!subcategories || subcategories.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Category not found or has no subcategories'
      });
    }
    
    res.json({
      success: true,
      categoryId,
      total: subcategories.length,
      subcategories
    });
  } catch (error) {
    console.error('❌ Get subcategories error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get subcategories',
      error: error.message
    });
  }
});

/**
 * Get subcategories for a main category (hierarchical route)
 * GET /api/categories/hierarchical/:categoryId/subcategories
 */
router.get('/hierarchical/:categoryId/subcategories', cacheResponse(3600, {
  tags: ['categories', 'products:categories']
}), (req, res) => {
  try {
    const { categoryId } = req.params;
    const subcategories = getSubcategories(categoryId);
    
    if (!subcategories || subcategories.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Category not found or has no subcategories'
      });
    }
    
    res.json({
      success: true,
      categoryId,
      total: subcategories.length,
      subcategories
    });
  } catch (error) {
    console.error('❌ Get hierarchical subcategories error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get hierarchical subcategories',
      error: error.message
    });
  }
});

/**
 * Get category by ID
 * GET /api/categories/:categoryId
 */
router.get('/:categoryId', cacheResponse(3600, {
  tags: ['categories', 'products:categories']
}), (req, res) => {
  try {
    const { categoryId } = req.params;
    const category = getCategoryById(categoryId);
    
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }
    
    res.json({
      success: true,
      category
    });
  } catch (error) {
    console.error('❌ Get category error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get category',
      error: error.message
    });
  }
});

/**
 * Search categories and subcategories
 * GET /api/categories/search?q=query
 */
router.get('/search/query', cacheResponse(900, {
  keyBuilder: (req) => `category-search:${(req.query.q || '').toLowerCase()}`,
  tags: ['categories', 'products:categories']
}), (req, res) => {
  try {
    const { q } = req.query;
    
    if (!q || q.trim().length < 2) {
      return res.json({
        success: true,
        results: []
      });
    }
    
    const results = searchCategories(q);
    
    res.json({
      success: true,
      query: q,
      total: results.length,
      results
    });
  } catch (error) {
    console.error('❌ Search categories error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to search categories',
      error: error.message
    });
  }
});

module.exports = router;
