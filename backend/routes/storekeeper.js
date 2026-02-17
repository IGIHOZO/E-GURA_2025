const express = require('express');
const router = express.Router();
const { Product } = require('../models');
const { staffMiddleware } = require('../middleware/authMiddleware');
const { invalidateProductData } = require('../services/cacheInvalidation');

const sanitizeProduct = (product) => {
  if (!product) return null;
  const plain = product.toJSON ? product.toJSON() : product;
  return {
    id: plain.id || plain._id,
    name: plain.name,
    price: Number(plain.price),
    stockQuantity: plain.stockQuantity,
    category: plain.category,
    mainImage: plain.mainImage,
    sku: plain.sku,
    createdAt: plain.createdAt
  };
};

const generateSlug = (name) =>
  name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '') + '-' + Date.now();

router.use(staffMiddleware);

// Quick add product endpoint for storekeepers
router.post('/products/quick-add', async (req, res) => {
  try {
    const {
      name,
      price,
      stockQuantity = 0,
      mainImage,
      category,
      description
    } = req.body;

    if (!name || name.trim().length < 3) {
      return res.status(400).json({
        success: false,
        message: 'Product name must be at least 3 characters'
      });
    }

    if (!price || Number(price) <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Valid price is required'
      });
    }

    const productPayload = {
      name: name.trim(),
      price: parseFloat(price),
      stockQuantity: parseInt(stockQuantity, 10) || 0,
      mainImage: mainImage || 'https://via.placeholder.com/600?text=New+Product',
      category: category || 'General',
      description: description || name.trim(),
      shortDescription: description || `Quick add product - ${name.trim()}`,
      slug: generateSlug(name),
      sku: `SKU-${Date.now()}`,
      tags: [name.toLowerCase(), 'quick-add', 'kigali', 'rwanda'],
      isActive: true,
      isNew: true,
      isSale: false
    };

    const product = await Product.create(productPayload);
    await invalidateProductData(product.id || product._id);

    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: sanitizeProduct(product)
    });
  } catch (error) {
    console.error('Storekeeper quick add error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create product',
      error: error.message
    });
  }
});

// Stock-in endpoint
router.post('/stock/stock-in', async (req, res) => {
  try {
    const { productId, quantity, note } = req.body;

    if (!productId) {
      return res.status(400).json({
        success: false,
        message: 'Product ID is required'
      });
    }

    const parsedQuantity = parseInt(quantity, 10);
    if (!parsedQuantity || parsedQuantity <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Quantity must be greater than 0'
      });
    }

    const product = await Product.findById(productId);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    const currentStock = parseInt(product.stockQuantity || 0, 10);
    const updatedStock = currentStock + parsedQuantity;

    product.stockQuantity = updatedStock;
    if (typeof product.save === 'function') {
      await product.save();
    } else if (typeof product.update === 'function') {
      await product.update({ stockQuantity: updatedStock });
    } else {
      await Product.findByIdAndUpdate(productId, { stockQuantity: updatedStock });
    }

    await invalidateProductData(product.id || product._id, { skipCategories: true });

    res.json({
      success: true,
      message: 'Stock updated successfully',
      data: {
        ...sanitizeProduct(product),
        note: note || null,
        addedQuantity: parsedQuantity
      }
    });
  } catch (error) {
    console.error('Storekeeper stock-in error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update stock',
      error: error.message
    });
  }
});

// Lightweight product list for dropdowns
router.get('/products/basic', async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit, 10) || 100, 250);
    const search = req.query.search?.trim();

    const query = {};
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { sku: { $regex: search, $options: 'i' } }
      ];
    }

    const products = await Product.find(query)
      .sort({ createdAt: -1 })
      .limit(limit);

    res.json({
      success: true,
      data: (products || []).map(sanitizeProduct)
    });
  } catch (error) {
    console.error('Storekeeper basic products error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to load products',
      error: error.message
    });
  }
});

// Dashboard summary for storekeepers
router.get('/dashboard/summary', async (req, res) => {
  try {
    const totalProducts = await Product.countDocuments({});
    const lowStockCount = await Product.countDocuments({ stockQuantity: { $lte: 5 } });
    const outOfStockCount = await Product.countDocuments({ stockQuantity: 0 });

    const recentProducts = await Product.find({})
      .sort({ createdAt: -1 })
      .limit(5);

    res.json({
      success: true,
      data: {
        totals: {
          totalProducts,
          lowStockCount,
          outOfStockCount
        },
        recentProducts: (recentProducts || []).map(sanitizeProduct)
      }
    });
  } catch (error) {
    console.error('Storekeeper dashboard summary error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to load dashboard summary',
      error: error.message
    });
  }
});

module.exports = router;
