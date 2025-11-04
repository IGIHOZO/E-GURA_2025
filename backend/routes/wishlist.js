const express = require('express');
const router = express.Router();
const { Wishlist, Product } = require('../models');
const { authMiddleware } = require('../middleware/authMiddleware');

// Add to wishlist
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { productId } = req.body;

    if (!productId) {
      return res.status(400).json({ success: false, message: 'Product ID is required' });
    }

    // Check if product exists
    const product = await Product.findOne({ where: { id: productId } });
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    // Check if already in wishlist
    const existing = await Wishlist.findOne({
      where: { userId: req.user.id, productId: productId }
    });

    if (existing) {
      return res.status(400).json({ success: false, message: 'Product already in wishlist' });
    }

    // Add to wishlist
    const wishlistItem = await Wishlist.create({
      userId: req.user.id,
      productId: productId
    });

    console.log('✅ Added to wishlist:', productId);

    res.status(201).json({
      success: true,
      message: 'Product added to wishlist',
      wishlistItem: wishlistItem
    });

  } catch (error) {
    console.error('❌ Error adding to wishlist:', error);
    res.status(500).json({ success: false, message: 'Failed to add to wishlist', error: error.message });
  }
});

// Get user's wishlist
router.get('/', authMiddleware, async (req, res) => {
  try {
    const wishlistItems = await Wishlist.findAll({
      where: { userId: req.user.id },
      order: [['createdAt', 'DESC']],
      include: [{
        model: Product.sequelize.models.Product,
        as: 'product',
        attributes: ['id', 'name', 'price', 'originalPrice', 'mainImage', 'averageRating', 'isActive', 'stock']
      }]
    });

    res.json({
      success: true,
      wishlist: wishlistItems,
      count: wishlistItems.length
    });

  } catch (error) {
    console.error('❌ Error fetching wishlist:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch wishlist', error: error.message });
  }
});

// Check if product is in wishlist
router.get('/check/:productId', authMiddleware, async (req, res) => {
  try {
    const item = await Wishlist.findOne({
      where: { userId: req.user.id, productId: req.params.productId }
    });

    res.json({
      success: true,
      inWishlist: !!item
    });

  } catch (error) {
    console.error('❌ Error checking wishlist:', error);
    res.status(500).json({ success: false, message: 'Failed to check wishlist', error: error.message });
  }
});

// Remove from wishlist
router.delete('/:productId', authMiddleware, async (req, res) => {
  try {
    const item = await Wishlist.findOne({
      where: { userId: req.user.id, productId: req.params.productId }
    });

    if (!item) {
      return res.status(404).json({ success: false, message: 'Product not in wishlist' });
    }

    await item.destroy();

    console.log('✅ Removed from wishlist:', req.params.productId);

    res.json({
      success: true,
      message: 'Product removed from wishlist'
    });

  } catch (error) {
    console.error('❌ Error removing from wishlist:', error);
    res.status(500).json({ success: false, message: 'Failed to remove from wishlist', error: error.message });
  }
});

// Toggle wishlist (add if not exists, remove if exists)
router.post('/toggle', authMiddleware, async (req, res) => {
  try {
    const { productId } = req.body;

    if (!productId) {
      return res.status(400).json({ success: false, message: 'Product ID is required' });
    }

    const existing = await Wishlist.findOne({
      where: { userId: req.user.id, productId: productId }
    });

    if (existing) {
      // Remove from wishlist
      await existing.destroy();
      return res.json({
        success: true,
        message: 'Product removed from wishlist',
        action: 'removed'
      });
    } else {
      // Add to wishlist
      const wishlistItem = await Wishlist.create({
        userId: req.user.id,
        productId: productId
      });

      return res.json({
        success: true,
        message: 'Product added to wishlist',
        action: 'added',
        wishlistItem: wishlistItem
      });
    }

  } catch (error) {
    console.error('❌ Error toggling wishlist:', error);
    res.status(500).json({ success: false, message: 'Failed to toggle wishlist', error: error.message });
  }
});

// Clear entire wishlist
router.delete('/clear/all', authMiddleware, async (req, res) => {
  try {
    await Wishlist.destroy({
      where: { userId: req.user.id }
    });

    console.log('✅ Wishlist cleared for user:', req.user.id);

    res.json({
      success: true,
      message: 'Wishlist cleared successfully'
    });

  } catch (error) {
    console.error('❌ Error clearing wishlist:', error);
    res.status(500).json({ success: false, message: 'Failed to clear wishlist', error: error.message });
  }
});

// Get wishlist count
router.get('/count', authMiddleware, async (req, res) => {
  try {
    const count = await Wishlist.count({
      where: { userId: req.user.id }
    });

    res.json({
      success: true,
      count: count
    });

  } catch (error) {
    console.error('❌ Error getting wishlist count:', error);
    res.status(500).json({ success: false, message: 'Failed to get wishlist count', error: error.message });
  }
});

module.exports = router;
