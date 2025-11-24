const express = require('express');
const router = express.Router();
<<<<<<< HEAD
const cacheResponse = require('../middleware/cacheMiddleware');
=======
>>>>>>> 1a15362f9dae7bb17aa91f0abab9fb8ce9627742
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
<<<<<<< HEAD
router.get('/', cacheResponse(3600, {
  tags: ['categories', 'products:categories']
}), (req, res) => {
=======
router.get('/', (req, res) => {
>>>>>>> 1a15362f9dae7bb17aa91f0abab9fb8ce9627742
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
<<<<<<< HEAD
router.get('/all', cacheResponse(3600, {
  tags: ['categories', 'products:categories']
}), (req, res) => {
=======
router.get('/all', (req, res) => {
>>>>>>> 1a15362f9dae7bb17aa91f0abab9fb8ce9627742
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
<<<<<<< HEAD
router.get('/hierarchical/all', cacheResponse(3600, {
  tags: ['categories', 'products:categories']
}), (req, res) => {
=======
router.get('/hierarchical/all', (req, res) => {
>>>>>>> 1a15362f9dae7bb17aa91f0abab9fb8ce9627742
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
<<<<<<< HEAD
router.get('/:categoryId/subcategories', cacheResponse(3600, {
  tags: ['categories', 'products:categories']
}), (req, res) => {
=======
router.get('/:categoryId/subcategories', (req, res) => {
>>>>>>> 1a15362f9dae7bb17aa91f0abab9fb8ce9627742
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
<<<<<<< HEAD
router.get('/hierarchical/:categoryId/subcategories', cacheResponse(3600, {
  tags: ['categories', 'products:categories']
}), (req, res) => {
=======
router.get('/hierarchical/:categoryId/subcategories', (req, res) => {
>>>>>>> 1a15362f9dae7bb17aa91f0abab9fb8ce9627742
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
<<<<<<< HEAD
router.get('/:categoryId', cacheResponse(3600, {
  tags: ['categories', 'products:categories']
}), (req, res) => {
=======
router.get('/:categoryId', (req, res) => {
>>>>>>> 1a15362f9dae7bb17aa91f0abab9fb8ce9627742
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
<<<<<<< HEAD
router.get('/search/query', cacheResponse(900, {
  keyBuilder: (req) => `category-search:${(req.query.q || '').toLowerCase()}`,
  tags: ['categories', 'products:categories']
}), (req, res) => {
=======
router.get('/search/query', (req, res) => {
>>>>>>> 1a15362f9dae7bb17aa91f0abab9fb8ce9627742
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
