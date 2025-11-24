const express = require('express');
const router = express.Router();
const { Product } = require('../models');
const { optionalAuthMiddleware } = require('../middleware/authMiddleware');
const RawProductModel = require('../models-postgres/Product'); // Import raw Sequelize model directly
const { Op } = require('sequelize');
const cacheResponse = require('../middleware/cacheMiddleware');

// Get featured products (must come before /:id route)
router.get('/featured', cacheResponse(300, {
  tags: ['products', 'products:featured', 'products:list']
}), async (req, res) => {
  try {
    const products = await Product.findAll({
      where: {
        isActive: true,
        isFeatured: true
      },
      limit: 8
    });

    res.json({
      success: true,
      data: products
    });
  } catch (error) {
    console.error('Error fetching featured products:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch featured products', error: error.message });
  }
});

// Get new arrivals (must come before /:id route)
router.get('/new-arrivals', cacheResponse(300, {
  tags: ['products', 'products:new-arrivals', 'products:list']
}), async (req, res) => {
  try {
    const products = await Product.findAll({
      where: {
        isActive: true,
        isNew: true
      },
      order: [['createdAt', 'DESC']],
      limit: 8
    });

    res.json({
      success: true,
      data: products
    });
  } catch (error) {
    console.error('Error fetching new arrivals:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch new arrivals', error: error.message });
  }
});

// Get sale products (must come before /:id route)
router.get('/sale', cacheResponse(300, {
  tags: ['products', 'products:sale', 'products:list']
}), async (req, res) => {
  try {
    const products = await Product.findAll({
      where: {
        isActive: true,
        isSale: true
      },
      limit: 8
    });

    res.json({
      success: true,
      data: products
    });
  } catch (error) {
    console.error('Error fetching sale products:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch sale products', error: error.message });
  }
});

// Get flash deals - products with high discount and limited time (must come before /:id route)
router.get('/flash-deals', cacheResponse(120, {
  keyBuilder: (req) => `flash-deals:${req.query.limit || 10}`,
  tags: ['products', 'products:flash', 'products:list']
}), async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    
    console.log('🔥 Backend: Fetching flash deals...');
    // Simplified query - just get active products
    const products = await Product.findAll({
      where: {
        isActive: true
      },
      order: [['createdAt', 'DESC']],
      limit: limit
    });

    console.log('🔥 Backend: Found', products.length, 'products');
    if (products.length > 0) {
      console.log('🔥 Backend: First product mainImage:', products[0].mainImage);
    }

    res.json({
      success: true,
      data: products
    });
  } catch (error) {
    console.error('❌ Backend Error fetching flash deals:', error);
    console.error('❌ Error details:', error.message);
    console.error('❌ Error stack:', error.stack);
    res.status(500).json({ success: false, message: 'Failed to fetch flash deals', error: error.message });
  }
});

// Get trending products - based on views, orders, and recent activity (must come before /:id route)
router.get('/trending', cacheResponse(120, {
  keyBuilder: (req) => `trending:${req.query.limit || 10}`,
  tags: ['products', 'products:trending', 'products:list']
}), async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    
    console.log('🔥 Backend: Fetching trending...');
    // Simplified query
    const products = await Product.findAll({
      where: {
        isActive: true
      },
      order: [['createdAt', 'DESC']],
      limit: limit
    });

    console.log('🔥 Backend: Found', products.length, 'trending products');

    res.json({
      success: true,
      data: products
    });
  } catch (error) {
    console.error('❌ Backend Error fetching trending:', error);
    console.error('❌ Error message:', error.message);
    res.status(500).json({ success: false, message: 'Failed to fetch trending products', error: error.message });
  }
});

// Get best deals - combination of good price, high rating, and value (must come before /:id route)
router.get('/best-deals', cacheResponse(120, {
  keyBuilder: (req) => `best-deals:${req.query.limit || 10}`,
  tags: ['products', 'products:best-deals', 'products:list']
}), async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    
    console.log('💎 Backend: Fetching best deals...');
    // Simplified query
    const products = await Product.findAll({
      where: {
        isActive: true
      },
      order: [['createdAt', 'DESC']],
      limit: limit
    });

    console.log('💎 Backend: Found', products.length, 'best deals');

    res.json({
      success: true,
      data: products
    });
  } catch (error) {
    console.error('❌ Backend Error fetching best deals:', error);
    console.error('❌ Error message:', error.message);
    res.status(500).json({ success: false, message: 'Failed to fetch best deals', error: error.message });
  }
});

// Get product categories (must come before /:id route)
router.get('/categories', cacheResponse(1800, {
  tags: ['products', 'products:categories', 'categories']
}), async (req, res) => {
  try {
    const categories = await Product.distinct('category');
    const subcategories = await Product.distinct('subcategory');
    const brands = await Product.distinct('brand');

    res.json({
      success: true,
      data: {
        categories,
        subcategories,
        brands
      }
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch categories' });
  }
});

// Search products (must come before /:id route)
router.get('/search', cacheResponse(90, {
  tags: ['products', 'products:search', 'search']
}), async (req, res) => {
  try {
    const { q, category, priceRange, limit = 10 } = req.query;
    
    let query = { isActive: true };
    
    if (q) {
      query.$or = [
        { name: { $regex: q, $options: 'i' } },
        { description: { $regex: q, $options: 'i' } },
        { tags: { $regex: q, $options: 'i' } }
      ];
    }

    if (category) {
      query.category = category;
    }

    if (priceRange) {
      const [min, max] = priceRange.split('-').map(Number);
      query.price = { $gte: min, $lte: max };
    }

    const products = await Product.find(query)
      .sort({ isFeatured: -1, createdAt: -1 })
      .limit(parseInt(limit));

    res.json({
      success: true,
      data: products
    });
  } catch (error) {
    console.error('Error searching products:', error);
    console.error('Search error details:', error.message);
    res.status(500).json({ success: false, message: 'Failed to search products', error: error.message });
  }
});

// Get all products with filtering and pagination
router.get('/', optionalAuthMiddleware, cacheResponse(60, {
  skip: (req) => !!req.user, // personalized data shouldn't be cached
  tags: ['products', 'products:list']
}), async (req, res) => {
  try {
const {
      page = 1,
      limit = 20,
      category,
      subcategory,
      minPrice,
      maxPrice,
      sort = 'featured',
      search,
      gender,
      ageGroup,
      brand,
      tags,
      isNew,
      isSale,
      isFeatured,
      isBestSeller
    } = req.query;

    const skip = (page - 1) * limit;
    let query = { isActive: true };

    // Search functionality
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { shortDescription: { $regex: search, $options: 'i' } },
        { tags: { $regex: search, $options: 'i' } }
      ];
    }

    // Category filter
    if (category) {
      query.category = category;
    }

    // Subcategory filter
    if (subcategory) {
      query.subcategory = subcategory;
    }

    // Price range filter
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = parseInt(minPrice);
      if (maxPrice) query.price.$lte = parseInt(maxPrice);
    }

    // Gender filter
    if (gender) {
      query.gender = gender;
    }

    // Age group filter
    if (ageGroup) {
      query.ageGroup = ageGroup;
    }

    // Brand filter
    if (brand) {
      query.brand = brand;
    }

    // Tags filter
    if (tags) {
      const tagArray = tags.split(',').map(tag => tag.trim());
      query.tags = { $in: tagArray };
    }

    // Boolean filters
    if (isNew === 'true') query.isNew = true;
    if (isSale === 'true') query.isSale = true;
    if (isFeatured === 'true') query.isFeatured = true;
    if (isBestSeller === 'true') query.isBestSeller = true;

    // Sorting
    let sortOption = {};
    switch (sort) {
      case 'price_asc':
        sortOption = { price: 1 };
        break;
      case 'price_desc':
        sortOption = { price: -1 };
        break;
      case 'newest':
        sortOption = { createdAt: -1 };
        break;
      case 'rating':
        sortOption = { averageRating: -1 };
        break;
      case 'featured':
      default:
        sortOption = { isFeatured: -1, createdAt: -1 };
        break;
    }

    const products = await Product.find(query)
      .sort(sortOption)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Product.countDocuments(query);

    res.json({
      success: true,
      data: products,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch products', error: error.message });
  }
});

// Test endpoint to debug ID parameter
// Aggregated home page feed
router.get('/home-feed', cacheResponse(120, {
  keyBuilder: (req) => {
    const params = {
      featuredLimit: req.query.featuredLimit || 8,
      flashLimit: req.query.flashLimit || 10,
      trendingLimit: req.query.trendingLimit || 12,
      bestDealsLimit: req.query.bestDealsLimit || 8
    };
    return `home-feed:${Object.values(params).join(':')}`;
  },
  tags: ['products', 'products:list', 'products:home']
}), async (req, res) => {
  try {
    const parseLimit = (value, fallback) => {
      const parsed = parseInt(value, 10);
      return Number.isNaN(parsed) ? fallback : parsed;
    };

    const featuredLimit = parseLimit(req.query.featuredLimit, 8);
    const flashLimit = parseLimit(req.query.flashLimit, 10);
    const trendingLimit = parseLimit(req.query.trendingLimit, 12);
    const bestDealsLimit = parseLimit(req.query.bestDealsLimit, 8);

    const baseWhere = { isActive: true };

    const [
      featured,
      flashDeals,
      trending,
      bestDeals,
      latestProducts
    ] = await Promise.all([
      Product.findAll({
        where: { ...baseWhere, isFeatured: true },
        limit: featuredLimit
      }),
      Product.findAll({
        where: baseWhere,
        order: [['createdAt', 'DESC']],
        limit: flashLimit
      }),
      Product.findAll({
        where: baseWhere,
        order: [['createdAt', 'DESC']],
        limit: trendingLimit
      }),
      Product.findAll({
        where: baseWhere,
        order: [['createdAt', 'DESC']],
        limit: bestDealsLimit
      }),
      Product.findAll({
        where: baseWhere,
        order: [['createdAt', 'DESC']],
        limit: parseLimit(req.query.latestLimit, 20)
      })
    ]);

    res.json({
      success: true,
      data: {
        featured,
        flashDeals,
        trending,
        bestDeals,
        latest: latestProducts
      }
    });
  } catch (error) {
    console.error('Error building home feed:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to build home feed',
      error: error.message
    });
  }
});

router.get('/test/:id', cacheResponse(60, {
  tags: ['products', 'products:test']
}), async (req, res) => {
  res.json({
    idFromParams: req.params.id,
    typeOfId: typeof req.params.id,
    fullParams: req.params
  });
});

// Get product by ID (must come last)
router.get('/:id', cacheResponse(300, {
  keyBuilder: (req) => `product:${req.params.id}`,
  tags: ['products', 'products:detail']
}), async (req, res) => {
  try {
    const productId = req.params.id; // Use different variable name
    console.log('========================================');
    console.log('Fetching product by ID:', productId, 'type:', typeof productId);
    console.log('========================================');
    
    // Use the raw Sequelize model directly - NO WRAPPERS AT ALL
    console.log('Using RawProductModel with raw query...');
    const { sequelize } = require('../config/database');
    const [results] = await sequelize.query(
      'SELECT * FROM "Products" WHERE id = :productId LIMIT 1',
      {
        replacements: { productId: productId },
        type: sequelize.QueryTypes.SELECT,
        raw: true
      }
    );
    const product = results;
    console.log('Product found:', product ? 'Yes (' + product.name + ')' : 'No');
    
    if (!product) {
      return res.status(404).json({ 
        success: false, 
        message: 'Product not found' 
      });
    }

    res.json({
      success: true,
      data: product
    });
  } catch (error) {
    console.error('========================================');
    console.error('ERROR fetching product by ID:', error);
    console.error('Error message:', error.message);
    console.error('========================================');
    res.status(500).json({ success: false, message: 'Failed to fetch product', error: error.message });
  }
});

module.exports = router; 