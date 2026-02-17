// Example backend API endpoints for optimized pagination
// Add these to your existing backend routes

// GET /api/products/paginated - Server-side pagination with filtering
app.get('/api/products/paginated', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      category,
      sortBy = 'featured',
      priceRange,
      rating,
      colors,
      sizes,
      brands,
      search
    } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(limit);
    
    // Build query conditions
    let whereConditions = {};
    
    if (category) {
      whereConditions.category = { $regex: category, $options: 'i' };
    }
    
    if (search) {
      whereConditions.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { category: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (priceRange) {
      const [min, max] = priceRange.split(',').map(Number);
      whereConditions.price = { $gte: min, $lte: max };
    }
    
    if (rating) {
      whereConditions.rating = { $gte: parseFloat(rating) };
    }
    
    if (colors) {
      whereConditions.colors = { $in: colors.split(',') };
    }
    
    if (sizes) {
      whereConditions.sizes = { $in: sizes.split(',') };
    }
    
    if (brands) {
      whereConditions.brand = { $in: brands.split(',') };
    }

    // Build sort conditions
    let sortConditions = {};
    switch (sortBy) {
      case 'price-asc':
        sortConditions.price = 1;
        break;
      case 'price-desc':
        sortConditions.price = -1;
        break;
      case 'orders':
        sortConditions.sold = -1;
        break;
      case 'newest':
        sortConditions.createdAt = -1;
        break;
      default:
        sortConditions.featured = -1;
        break;
    }

    // Execute query with pagination
    const products = await Product.find(whereConditions)
      .sort(sortConditions)
      .skip(offset)
      .limit(parseInt(limit))
      .lean(); // Use lean() for better performance

    // Get total count for pagination info
    const totalItems = await Product.countDocuments(whereConditions);
    const totalPages = Math.ceil(totalItems / parseInt(limit));
    const hasMore = parseInt(page) < totalPages;

    res.json({
      success: true,
      data: products,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalItems,
        itemsPerPage: parseInt(limit),
        hasMore,
        hasPrevious: parseInt(page) > 1
      }
    });
  } catch (error) {
    console.error('Pagination error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching paginated products',
      error: error.message
    });
  }
});

// GET /api/products/search - Optimized search with pagination
app.get('/api/products/search', async (req, res) => {
  try {
    const {
      query = '',
      page = 1,
      limit = 20,
      categories,
      sortBy = 'featured'
    } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(limit);
    
    // Build search conditions
    let searchConditions = {};
    
    if (query) {
      searchConditions.$or = [
        { name: { $regex: query, $options: 'i' } },
        { description: { $regex: query, $options: 'i' } },
        { tags: { $in: [new RegExp(query, 'i')] } }
      ];
    }
    
    if (categories && categories.length > 0) {
      const categoryList = categories.split(',');
      searchConditions.category = { $in: categoryList };
    }

    // Execute search with pagination
    const products = await Product.find(searchConditions)
      .sort({ [sortBy]: -1 })
      .skip(offset)
      .limit(parseInt(limit))
      .lean();

    const totalItems = await Product.countDocuments(searchConditions);
    const hasMore = products.length === parseInt(limit);

    res.json({
      success: true,
      data: products,
      pagination: {
        currentPage: parseInt(page),
        totalItems,
        hasMore,
        query
      }
    });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({
      success: false,
      message: 'Error searching products',
      error: error.message
    });
  }
});

// GET /api/products/flash-deals - Optimized flash deals
app.get('/api/products/flash-deals', async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    
    // Get products with discounts (originalPrice > price)
    const flashDeals = await Product.find({
      originalPrice: { $exists: true },
      $expr: { $gt: ['$originalPrice', '$price'] }
    })
    .sort({ createdAt: -1 })
    .limit(parseInt(limit))
    .lean();

    res.json({
      success: true,
      data: flashDeals
    });
  } catch (error) {
    console.error('Flash deals error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching flash deals',
      error: error.message
    });
  }
});

// GET /api/products/trending - Trending products based on views/sales
app.get('/api/products/trending', async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    
    const trendingProducts = await Product.find({})
      .sort({ 
        views: -1,      // Most viewed
        sold: -1,       // Most sold
        rating: -1      // Highest rated
      })
      .limit(parseInt(limit))
      .lean();

    res.json({
      success: true,
      data: trendingProducts
    });
  } catch (error) {
    console.error('Trending products error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching trending products',
      error: error.message
    });
  }
});

// GET /api/products/best-deals - Best deals (highest discount percentage)
app.get('/api/products/best-deals', async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    
    const bestDeals = await Product.aggregate([
      {
        $match: {
          originalPrice: { $exists: true },
          $expr: { $gt: ['$originalPrice', '$price'] }
        }
      },
      {
        $addFields: {
          discountPercentage: {
            $multiply: [
              { $divide: [{ $subtract: ['$originalPrice', '$price'] }, '$originalPrice'] },
              100
            ]
          }
        }
      },
      { $sort: { discountPercentage: -1 } },
      { $limit: parseInt(limit) }
    ]);

    res.json({
      success: true,
      data: bestDeals
    });
  } catch (error) {
    console.error('Best deals error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching best deals',
      error: error.message
    });
  }
});

// Performance optimization middleware
app.use('/api/products', (req, res, next) => {
  // Add caching headers for product data
  res.set({
    'Cache-Control': 'public, max-age=300', // 5 minutes cache
    'ETag': `"${Date.now()}"` // Simple ETag
  });
  next();
});

module.exports = app;
