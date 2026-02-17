const express = require('express');
const router = express.Router();
const { Product } = require('../models');
const { optionalAuthMiddleware } = require('../middleware/authMiddleware');
const RawProductModel = require('../models-postgres/Product'); // Import raw Sequelize model directly
const { Op } = require('sequelize');
const cacheResponse = require('../middleware/cacheMiddleware');
const { sequelize } = require('../config/database');
const { buildFuzzySearchConditions, rankSearchResults } = require('../utils/fuzzySearch');

// Shared lightweight attributes for product cards (listings/grids)
// Excludes heavy columns: description, images, variants, reviews, seo fields, etc.
const CARD_ATTRIBUTES = [
  'id', 'name', 'price', 'originalPrice', 'discountPercentage',
  'mainImage', 'category', 'brand', 'tags', 'colors', 'sizes',
  'averageRating', 'totalReviews', 'salesCount', 'stockQuantity',
  'isFeatured', 'isNew', 'isSale', 'isBestSeller',
  'shortDescription', 'createdAt'
];

const parseArrayParam = (value) => {
  if (!value) return [];
  if (Array.isArray(value)) {
    return value.map((v) => (typeof v === 'string' ? v.trim() : v)).filter(Boolean);
  }
  if (typeof value === 'string') {
    return value
      .split(',')
      .map((item) => item.trim())
      .filter((item) => item.length > 0);
  }
  return [value].filter(Boolean);
};

// Quick search suggestions endpoint (must come before /:id route)
router.get('/search-suggestions', async (req, res) => {
  try {
    const { q } = req.query;
    
    if (!q || q.length < 2) {
      return res.json({ success: true, data: [] });
    }

    const searchTerm = `%${q}%`;
    
    const products = await Product.findAll({
      where: {
        isActive: true,
        [Op.or]: [
          { name: { [Op.iLike]: searchTerm } },
          { brand: { [Op.iLike]: searchTerm } },
          { category: { [Op.iLike]: searchTerm } }
        ]
      },
      attributes: ['id', 'name', 'price', 'mainImage', 'brand', 'category'],
      limit: 8,
      order: [['isFeatured', 'DESC'], ['salesCount', 'DESC']]
    });

    res.json({ success: true, data: products });
  } catch (error) {
    console.error('Error fetching search suggestions:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch suggestions', error: error.message });
  }
});

// Get featured products (must come before /:id route)
router.get('/featured', cacheResponse(300, {
  tags: ['products', 'products:featured', 'products:list']
}), async (req, res) => {
  try {
    const products = await RawProductModel.findAll({
      where: {
        isActive: true,
        isFeatured: true
      },
      attributes: CARD_ATTRIBUTES,
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
    const products = await RawProductModel.findAll({
      where: {
        isActive: true,
        isNew: true
      },
      attributes: CARD_ATTRIBUTES,
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
    const products = await RawProductModel.findAll({
      where: {
        isActive: true,
        isSale: true
      },
      attributes: CARD_ATTRIBUTES,
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
    const products = await RawProductModel.findAll({
      where: {
        isActive: true
      },
      attributes: CARD_ATTRIBUTES,
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
    const products = await RawProductModel.findAll({
      where: {
        isActive: true
      },
      attributes: CARD_ATTRIBUTES,
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
    const products = await RawProductModel.findAll({
      where: {
        isActive: true
      },
      attributes: CARD_ATTRIBUTES,
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
  skip: (req) => !!req.user,
  tags: ['products', 'products:list']
}), async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 24, 1), 100);
    const offset = (page - 1) * limit;

    const search = (req.query.search || '').trim();
    const categories = parseArrayParam(req.query.categories);
    const brands = parseArrayParam(req.query.brands);
    const colors = parseArrayParam(req.query.colors);
    const sizes = parseArrayParam(req.query.sizes);

    const minPrice = Number.parseFloat(req.query.minPrice);
    const maxPrice = Number.parseFloat(req.query.maxPrice);
    const minRating = Number.parseFloat(req.query.rating);

    const whereClause = { isActive: true };

    // Use fuzzy search for typo tolerance
    if (search) {
      const fuzzyConditions = buildFuzzySearchConditions(search, ['name', 'description', 'shortDescription', 'brand', 'category', 'tags']);
      if (fuzzyConditions) {
        Object.assign(whereClause, fuzzyConditions);
      }
    }

    if (categories.length > 0) {
      whereClause.category = { [Op.in]: categories };
    }

    if (brands.length > 0) {
      whereClause.brand = { [Op.in]: brands };
    }

    if (!Number.isNaN(minPrice) || !Number.isNaN(maxPrice)) {
      whereClause.price = {};
      if (!Number.isNaN(minPrice)) {
        whereClause.price[Op.gte] = minPrice;
      }
      if (!Number.isNaN(maxPrice)) {
        whereClause.price[Op.lte] = maxPrice;
      }
    }

    if (!Number.isNaN(minRating) && minRating > 0) {
      whereClause.averageRating = { [Op.gte]: minRating };
    }

    if (colors.length > 0) {
      whereClause.colors = { [Op.overlap]: colors };
    }

    if (sizes.length > 0) {
      whereClause.sizes = { [Op.overlap]: sizes };
    }

    if (req.query.isNew === 'true') whereClause.isNew = true;
    if (req.query.isSale === 'true') whereClause.isSale = true;
    if (req.query.isFeatured === 'true') whereClause.isFeatured = true;
    if (req.query.isBestSeller === 'true') whereClause.isBestSeller = true;

    let orderClause = [];
    switch (req.query.sort) {
      case 'price-asc':
        orderClause = [['price', 'ASC']];
        break;
      case 'price-desc':
        orderClause = [['price', 'DESC']];
        break;
      case 'orders':
        orderClause = [['salesCount', 'DESC']];
        break;
      case 'newest':
        orderClause = [['createdAt', 'DESC']];
        break;
      case 'rating':
        orderClause = [['averageRating', 'DESC']];
        break;
      case 'featured':
      default:
        orderClause = [['isFeatured', 'DESC'], ['createdAt', 'DESC']];
        break;
    }

    const { rows, count } = await RawProductModel.findAndCountAll({
      where: whereClause,
      order: orderClause,
      limit,
      offset,
      attributes: [
        'id',
        'name',
        'price',
        'originalPrice',
        'discountPercentage',
        'mainImage',
        'category',
        'brand',
        'tags',
        'colors',
        'sizes',
        'averageRating',
        'salesCount',
        'isFeatured',
        'isNew',
        'isSale',
        'createdAt'
      ]
    });

    let products = rows.map((product) => {
      const plain = product.toJSON();
      if (plain.price != null) plain.price = Number(plain.price);
      if (plain.originalPrice != null) plain.originalPrice = Number(plain.originalPrice);
      if (plain.discountPercentage != null) plain.discountPercentage = Number(plain.discountPercentage);
      if (plain.averageRating != null) plain.averageRating = Number(plain.averageRating);
      return plain;
    });

    // Apply fuzzy ranking if search term exists
    if (search && products.length > 0) {
      products = rankSearchResults(rows, search);
    }

    res.json({
      success: true,
      data: products,
      pagination: {
        page,
        limit,
        total: typeof count === 'number' ? count : count.length,
        pages: Math.ceil((typeof count === 'number' ? count : count.length) / limit)
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
      RawProductModel.findAll({
        where: { ...baseWhere, isFeatured: true },
        attributes: CARD_ATTRIBUTES,
        limit: featuredLimit
      }),
      RawProductModel.findAll({
        where: baseWhere,
        attributes: CARD_ATTRIBUTES,
        order: [['createdAt', 'DESC']],
        limit: flashLimit
      }),
      RawProductModel.findAll({
        where: baseWhere,
        attributes: CARD_ATTRIBUTES,
        order: [['createdAt', 'DESC']],
        limit: trendingLimit
      }),
      RawProductModel.findAll({
        where: baseWhere,
        attributes: CARD_ATTRIBUTES,
        order: [['createdAt', 'DESC']],
        limit: bestDealsLimit
      }),
      RawProductModel.findAll({
        where: baseWhere,
        attributes: CARD_ATTRIBUTES,
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
