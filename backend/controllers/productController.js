const { Product } = require('../models');
const { invalidateProductData } = require('../services/cacheInvalidation');
// const { getAIRecommendations, aiSearch } = require('../utils/ai'); // Placeholder for AI

const getProducts = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 12,
      category,
      minPrice,
      maxPrice,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      inStock,
      isNew,
      isSale
    } = req.query;

    // Build filter object
    const filter = {};
    if (category) filter.category = category;
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = parseFloat(minPrice);
      if (maxPrice) filter.price.$lte = parseFloat(maxPrice);
    }
    if (inStock === 'true') filter.stockQuantity = { $gt: 0 };
    if (isNew === 'true') filter.isNew = true;
    if (isSale === 'true') filter.isSale = true;

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const products = await Product.find(filter)
      .sort(sort)
      .limit(parseInt(limit))
      .skip(skip)
      .populate('category', 'name');

    const total = await Product.countDocuments(filter);
    const totalPages = Math.ceil(total / parseInt(limit));

    res.json({
      products,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalProducts: total,
        hasNextPage: parseInt(page) < totalPages,
        hasPrevPage: parseInt(page) > 1
      }
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.json(product);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const createProduct = async (req, res) => {
  try {
    const product = await Product.create(req.body);
    await invalidateProductData(product.id || product._id);
    res.status(201).json(product);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

const updateProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!product) return res.status(404).json({ message: 'Product not found' });
    await invalidateProductData(product.id || product._id);
    res.json(product);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });
    await invalidateProductData(product.id || product._id);
    res.json({ message: 'Product deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const searchProducts = async (req, res) => {
  try {
    const { q, category, minPrice, maxPrice, limit = 10 } = req.query;
    
    if (!q) {
      return res.status(400).json({ message: 'Search query is required' });
    }

    // Build search filter
    const filter = {
      $or: [
        { name: { $regex: q, $options: 'i' } },
        { description: { $regex: q, $options: 'i' } },
        { tags: { $regex: q, $options: 'i' } },
        { category: { $regex: q, $options: 'i' } }
      ]
    };

    if (category) filter.category = category;
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = parseFloat(minPrice);
      if (maxPrice) filter.price.$lte = parseFloat(maxPrice);
    }

    const products = await Product.find(filter)
      .limit(parseInt(limit))
      .populate('category', 'name');

    res.json({
      query: q,
      results: products,
      totalResults: products.length
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get featured products
const getFeaturedProducts = async (req, res) => {
  try {
    const { limit = 8 } = req.query;
    
    const products = await Product.find({ 
      isFeatured: true, 
      stockQuantity: { $gt: 0 } 
    })
    .limit(parseInt(limit))
    .populate('category', 'name');

    res.json(products);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get new arrivals
const getNewArrivals = async (req, res) => {
  try {
    const { limit = 8 } = req.query;
    
    const products = await Product.find({ 
      isNew: true, 
      stockQuantity: { $gt: 0 } 
    })
    .sort({ createdAt: -1 })
    .limit(parseInt(limit))
    .populate('category', 'name');

    res.json(products);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get sale products
const getSaleProducts = async (req, res) => {
  try {
    const { limit = 8 } = req.query;
    
    const products = await Product.find({ 
      isSale: true, 
      stockQuantity: { $gt: 0 } 
    })
    .sort({ discountPercentage: -1 })
    .limit(parseInt(limit))
    .populate('category', 'name');

    res.json(products);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get product categories
const getProductCategories = async (req, res) => {
  try {
    const categories = await Product.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    res.json(categories);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Update product stock
const updateProductStock = async (req, res) => {
  try {
    const { id } = req.params;
    const { quantity, operation = 'decrease' } = req.body;

    const product = await Product.findByPk(id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    let newStock = product.stockQuantity;
    if (operation === 'decrease') {
      if (product.stockQuantity < quantity) {
        return res.status(400).json({ message: 'Insufficient stock' });
      }
      newStock -= quantity;
    } else if (operation === 'increase') {
      newStock += quantity;
    }

    await product.update({ stockQuantity: newStock });
    await invalidateProductData(product.id || product._id, { skipCategories: true });
    res.json(product);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get product analytics
const getProductAnalytics = async (req, res) => {
  try {
    const { id } = req.params;
    
    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Mock analytics data (in real app, this would come from order/review data)
    const analytics = {
      salesCount: Math.floor(Math.random() * 1000) + 100,
      totalRevenue: (Math.random() * 10000 + 1000).toFixed(2),
      averageRating: (Math.random() * 2 + 3).toFixed(1),
      totalReviews: Math.floor(Math.random() * 500) + 50,
      views: Math.floor(Math.random() * 5000) + 1000,
      conversionRate: (Math.random() * 5 + 1).toFixed(2)
    };

    res.json(analytics);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  searchProducts,
  getFeaturedProducts,
  getNewArrivals,
  getSaleProducts,
  getProductCategories,
  updateProductStock,
  getProductAnalytics
}; 