const express = require('express');
const router = express.Router();
const { Product } = require('../models');
const { wrapModel } = require('../utils/db-adapter');
const { Op } = require('sequelize');

// Helper function to sort products
function sortProducts(products, sortBy) {
  const sorted = [...products];
  
  switch (sortBy) {
    case 'price-low':
    case 'price_asc':
      return sorted.sort((a, b) => (a.price || 0) - (b.price || 0));
    
    case 'price-high':
    case 'price_desc':
      return sorted.sort((a, b) => (b.price || 0) - (a.price || 0));
    
    case 'newest':
    case 'date-newest':
      return sorted.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    case 'rating':
      return sorted.sort((a, b) => (b.averageRating || 0) - (a.averageRating || 0));
    
    case 'popular':
      return sorted.sort((a, b) => (b.soldCount || 0) - (a.soldCount || 0));
    
    case 'relevance':
    case 'featured':
    default:
      return sorted.sort((a, b) => {
        // Featured first
        if (b.isFeatured && !a.isFeatured) return 1;
        if (a.isFeatured && !b.isFeatured) return -1;
        // Then by newest
        return new Date(b.createdAt) - new Date(a.createdAt);
      });
  }
}

// Helper function to get filter options
function getFilterOptions(products) {
  const categories = [...new Set(products.map(p => p.category).filter(Boolean))];
  const brands = [...new Set(products.map(p => p.brand).filter(Boolean))];
  const sizes = [...new Set(products.flatMap(p => p.sizes || []))];
  const colors = [...new Set(products.flatMap(p => p.colors || []))];
  
  const prices = products.map(p => p.price || 0).filter(p => p > 0);
  const minPrice = Math.min(...prices, 0);
  const maxPrice = Math.max(...prices, 100000);
  
  return {
    categories: categories.sort(),
    brands: brands.sort(),
    sizes: sizes.sort(),
    colors: colors.sort(),
    priceRange: { min: minPrice, max: maxPrice }
  };
}

// Helper function to calculate AI relevance score
function calculateRelevanceScore(product, query) {
  if (!query) return 0;
  
  const searchTerm = query.toLowerCase();
  let score = 0;
  
  // Exact name match: highest score
  if (product.name && product.name.toLowerCase() === searchTerm) {
    score += 100;
  }
  
  // Name contains search term
  if (product.name && product.name.toLowerCase().includes(searchTerm)) {
    score += 50;
  }
  
  // Category match
  if (product.category && product.category.toLowerCase().includes(searchTerm)) {
    score += 30;
  }
  
  // Brand match
  if (product.brand && product.brand.toLowerCase().includes(searchTerm)) {
    score += 20;
  }
  
  // Description match
  if (product.description && product.description.toLowerCase().includes(searchTerm)) {
    score += 10;
  }
  
  // Tags match
  if (product.tags && Array.isArray(product.tags)) {
    const tagMatch = product.tags.some(tag => 
      tag && tag.toLowerCase().includes(searchTerm)
    );
    if (tagMatch) score += 15;
  }
  
  return score;
}

// Simple health check
router.get('/health', (req, res) => {
  res.json({ 
    success: true, 
    message: 'Search routes are working!',
    timestamp: new Date().toISOString()
  });
});

/**
 * Professional AI-Powered Product Search
 * POST /api/search/products
 * GET /api/search/products (also supported)
 * Integrated with entire database for comprehensive results
 */
const searchProducts = async (req, res) => {
  try {
    // Support both GET and POST
    const { query, filters = {}, sortBy = 'relevance', page = 1, limit = 20 } = 
      req.method === 'GET' ? req.query : req.body;

    console.log('🤖 Professional AI Search Request:', { query, filters, sortBy, page, method: req.method });

    // Build database query for PostgreSQL
    const WrappedProduct = wrapModel(Product);
    let dbWhere = { isActive: true };

    // Apply database-level filters for performance
    if (filters.category && filters.category !== 'all') {
      dbWhere.category = { [Op.iLike]: `%${filters.category}%` };
    }

    if (filters.brand && filters.brand !== 'all') {
      dbWhere.brand = { [Op.iLike]: `%${filters.brand}%` };
    }

    if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
      dbWhere.price = {};
      if (filters.minPrice !== undefined) dbWhere.price[Op.gte] = Number(filters.minPrice);
      if (filters.maxPrice !== undefined) dbWhere.price[Op.lte] = Number(filters.maxPrice);
    }

    if (filters.inStock) {
      dbWhere.stockQuantity = { [Op.gt]: 0 };
    }

    // Build search condition
    let searchCondition = {};
    if (query && query.trim()) {
      const searchTerm = `%${query.trim()}%`;
      searchCondition = {
        [Op.or]: [
          { name: { [Op.iLike]: searchTerm } },
          { description: { [Op.iLike]: searchTerm } },
          { category: { [Op.iLike]: searchTerm } },
          { brand: { [Op.iLike]: searchTerm } }
        ]
      };
    }

    // Combine conditions
    const finalWhere = query && query.trim() 
      ? { [Op.and]: [dbWhere, searchCondition] }
      : dbWhere;

    // Fetch products with optimized query
    const allProducts = await WrappedProduct.find(finalWhere)
      .sort({ isFeatured: -1, createdAt: -1 })
      .limit(100); // Limit to 100 for performance
    
    // Convert to plain objects
    const plainProducts = allProducts.map(p => p.toJSON ? p.toJSON() : p);

    console.log(`📊 Database returned ${plainProducts.length} products`);
    
    // If no products in database, return helpful message
    if (plainProducts.length === 0) {
      console.log('⚠️ No products found in database');
      return res.json({
        success: true,
        data: [],
        pagination: { total: 0, page: 1, limit: 20, totalPages: 0, hasMore: false, showing: '0-0 of 0' },
        filterOptions: {},
        suggestions: [],
        query,
        filters,
        sortBy,
        message: 'No products available in the database. Please add products first.',
        performance: { dbResults: 0, aiFiltered: 0, returned: 0 }
      });
    }

    // Use database results directly (already filtered)
    let results = plainProducts;

    console.log(`🤖 Filtered to ${results.length} products`);
    
    // Apply sorting
    results = sortProducts(results, sortBy);

    // Pagination
    const total = results.length;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedResults = results.slice(startIndex, endIndex);

    // Get filter options from results
    const filterOptions = getFilterOptions(results);

    // Get search suggestions (simplified to avoid MongoDB timeout)
    const suggestions = [];

    // Analytics: Track search
    console.log(`✅ Search completed: ${total} results, returning page ${page} (${paginatedResults.length} items)`);

    res.json({
      success: true,
      data: paginatedResults,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / limit),
        hasMore: endIndex < total,
        showing: `${startIndex + 1}-${Math.min(endIndex, total)} of ${total}`
      },
      filterOptions,
      suggestions,
      query,
      filters,
      sortBy,
      performance: {
        dbResults: allProducts.length,
        aiFiltered: results.length,
        returned: paginatedResults.length
      }
    });

  } catch (error) {
    console.error('❌ Professional AI Search error:', error);
    res.status(500).json({
      success: false,
      message: 'Search failed',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

// Register both GET and POST routes
router.post('/products', searchProducts);
router.get('/products', searchProducts);

/**
 * AI-Powered Product Recommendations
 * GET /api/search/recommendations
 */
router.get('/recommendations', async (req, res) => {
  try {
    const { productId, category, limit = 8 } = req.query;
    
    const WrappedProduct = wrapModel(Product);
    let recommendations = [];
    
    if (productId) {
      // Get similar products based on current product
      const currentProduct = await WrappedProduct.findById(productId);
      
      if (currentProduct) {
        const where = {
          isActive: true,
          id: { [Op.ne]: productId }
        };
        
        // Same category first
        if (currentProduct.category) {
          where.category = currentProduct.category;
        }
        
        recommendations = await WrappedProduct.find(where)
          .sort({ isFeatured: -1, soldCount: -1 })
          .limit(parseInt(limit));
      }
    } else if (category) {
      // Get products by category
      recommendations = await WrappedProduct.find({
        isActive: true,
        category: { [Op.iLike]: `%${category}%` }
      })
      .sort({ isFeatured: -1, soldCount: -1 })
      .limit(parseInt(limit));
    } else {
      // Get featured/popular products
      recommendations = await WrappedProduct.find({
        isActive: true
      })
      .sort({ isFeatured: -1, soldCount: -1 })
      .limit(parseInt(limit));
    }
    
    // Convert to plain objects
    const plainRecommendations = recommendations.map(p => p.toJSON ? p.toJSON() : p);
    
    res.json({
      success: true,
      data: plainRecommendations,
      count: plainRecommendations.length
    });
    
  } catch (error) {
    console.error('❌ Recommendations error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get recommendations',
      error: error.message
    });
  }
});

module.exports = router;
