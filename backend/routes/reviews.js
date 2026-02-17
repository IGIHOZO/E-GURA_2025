const express = require('express');
const router = express.Router();
const { Review, Product, User, Order, Customer } = require('../models');
const { convertObjectId } = require('../utils/objectIdHelper');
const { authMiddleware, optionalAuthMiddleware } = require('../middleware/authMiddleware');
const { Op } = require('sequelize');

// Create review (supports authenticated users and customer sessions)
router.post('/', optionalAuthMiddleware, async (req, res) => {
  try {
    const { productId, rating, title, comment, images, orderId, userId: bodyUserId } = req.body;

    const userId = req.user?.id || bodyUserId;

    if (!userId) {
      return res.status(401).json({ success: false, message: 'Authentication required to submit a review' });
    }

    // Validate
    if (!productId || !rating || !comment) {
      return res.status(400).json({ success: false, message: 'Product, rating, and comment are required' });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({ success: false, message: 'Rating must be between 1 and 5' });
    }

    // Check if product exists
    const product = await Product.findOne({ where: { id: productId } });
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    // Ensure user exists when coming from bodyUserId
    let reviewUser = req.user;
    if (!reviewUser) {
      reviewUser = await User.findOne({ where: { id: userId } });
    }

    if (!reviewUser) {
      reviewUser = await Customer.findOne({ where: { id: userId } });
    }

    if (!reviewUser) {
      return res.status(400).json({ success: false, message: 'User not found' });
    }

    // Check if user already reviewed this product
    const existingReview = await Review.findOne({
      where: { userId, productId: productId }
    });

    if (existingReview) {
      return res.status(400).json({ success: false, message: 'You have already reviewed this product' });
    }

    // Check if verified purchase
    let verified = false;
    if (orderId && req.user) {
      const order = await Order.findOne({
        where: {
          id: orderId,
          userId: req.user.id,
          status: 'delivered'
        }
      });
      verified = !!order;
    }

    // Create review
    const review = await Review.create({
      userId,
      productId: productId,
      orderId: orderId || null,
      rating: rating,
      title: title,
      comment: comment,
      images: images || [],
      verified: verified,
      status: 'pending'
    });

    // Update product rating
    await updateProductRating(productId);

    console.log('✅ Review created:', review.id);

    res.status(201).json({
      success: true,
      message: 'Review submitted successfully',
      data: review
    });

  } catch (error) {
    console.error('❌ Error creating review:', error);
    res.status(500).json({ success: false, message: 'Failed to create review', error: error.message });
  }
});

// Get product reviews
router.get('/product/:productId', async (req, res) => {
  try {
    const { sort = 'recent', rating } = req.query;

    const productId = convertObjectId(req.params.productId);

    console.log('🔍 Fetching reviews for product:', productId);

    const where = {
      productId,
      status: 'approved'
    };

    if (rating) {
      where.rating = rating;
    }

    let order = [['createdAt', 'DESC']];
    if (sort === 'helpful') {
      order = [['helpful', 'DESC']];
    } else if (sort === 'rating-high') {
      order = [['rating', 'DESC']];
    } else if (sort === 'rating-low') {
      order = [['rating', 'ASC']];
    }

    const reviews = await Review.findAll({
      where: where,
      order: order
    });

    const plainReviews = reviews.map((review) => review.toJSON());

    const userIds = [...new Set(plainReviews.map((review) => review.userId).filter(Boolean))];
    let userMap = new Map();

    if (userIds.length > 0) {
      const users = await User.findAll({
        where: { id: userIds },
        attributes: ['id', 'firstName', 'lastName', 'email']
      });

      userMap = new Map(users.map((user) => [
        user.id,
        {
          name: [user.firstName, user.lastName].filter(Boolean).join(' ') || user.email,
          email: user.email
        }
      ]));
    }

    const reviewsWithUser = plainReviews.map((review) => ({
      ...review,
      user: userMap.get(review.userId) || null
    }));

    // Calculate rating summary
    const allReviews = plainReviews;

    const summary = {
      totalReviews: allReviews.length,
      averageRating: 0,
      ratings: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
    };

    if (allReviews.length > 0) {
      const totalRating = allReviews.reduce((sum, r) => sum + r.rating, 0);
      summary.averageRating = (totalRating / allReviews.length).toFixed(1);
      
      allReviews.forEach(r => {
        summary.ratings[r.rating]++;
      });
    }

    res.json({
      success: true,
      reviews: reviewsWithUser,
      summary: summary
    });

  } catch (error) {
    console.error('❌ Error fetching reviews:', error.message, error.stack);
    res.status(500).json({ success: false, message: 'Failed to fetch reviews', error: error.message });
  }
});

// Get user's reviews
router.get('/my-reviews', authMiddleware, async (req, res) => {
  try {
    const reviews = await Review.findAll({
      where: { userId: req.user.id },
      order: [['createdAt', 'DESC']],
      include: [{
        model: Product.sequelize.models.Product,
        as: 'product',
        attributes: ['id', 'name', 'mainImage']
      }]
    });

    res.json({
      success: true,
      reviews: reviews
    });

  } catch (error) {
    console.error('❌ Error fetching user reviews:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch reviews', error: error.message });
  }
});

// Update review
router.put('/:reviewId', authMiddleware, async (req, res) => {
  try {
    const { rating, title, comment, images } = req.body;

    const review = await Review.findOne({
      where: { id: req.params.reviewId, userId: req.user.id }
    });

    if (!review) {
      return res.status(404).json({ success: false, message: 'Review not found' });
    }

    await review.update({
      rating: rating || review.rating,
      title: title || review.title,
      comment: comment || review.comment,
      images: images || review.images,
      status: 'pending' // Reset to pending after edit
    });

    // Update product rating
    await updateProductRating(review.productId);

    res.json({
      success: true,
      message: 'Review updated successfully',
      review: review
    });

  } catch (error) {
    console.error('❌ Error updating review:', error);
    res.status(500).json({ success: false, message: 'Failed to update review', error: error.message });
  }
});

// Delete review
router.delete('/:reviewId', authMiddleware, async (req, res) => {
  try {
    const review = await Review.findOne({
      where: { id: req.params.reviewId, userId: req.user.id }
    });

    if (!review) {
      return res.status(404).json({ success: false, message: 'Review not found' });
    }

    const productId = review.productId;
    await review.destroy();

    // Update product rating
    await updateProductRating(productId);

    res.json({
      success: true,
      message: 'Review deleted successfully'
    });

  } catch (error) {
    console.error('❌ Error deleting review:', error);
    res.status(500).json({ success: false, message: 'Failed to delete review', error: error.message });
  }
});

// Mark review helpful
router.post('/:reviewId/helpful', async (req, res) => {
  try {
    const { helpful } = req.body; // true or false

    const review = await Review.findOne({
      where: { id: req.params.reviewId }
    });

    if (!review) {
      return res.status(404).json({ success: false, message: 'Review not found' });
    }

    if (helpful) {
      await review.update({ helpful: review.helpful + 1 });
    } else {
      await review.update({ notHelpful: review.notHelpful + 1 });
    }

    res.json({
      success: true,
      message: 'Thank you for your feedback',
      review: review
    });

  } catch (error) {
    console.error('❌ Error marking review helpful:', error);
    res.status(500).json({ success: false, message: 'Failed to mark review', error: error.message });
  }
});

// Admin: Approve review
router.put('/admin/:reviewId/approve', authMiddleware, async (req, res) => {
  try {
    const review = await Review.findOne({
      where: { id: req.params.reviewId }
    });

    if (!review) {
      return res.status(404).json({ success: false, message: 'Review not found' });
    }

    await review.update({ status: 'approved' });

    res.json({
      success: true,
      message: 'Review approved successfully',
      review: review
    });

  } catch (error) {
    console.error('❌ Error approving review:', error);
    res.status(500).json({ success: false, message: 'Failed to approve review', error: error.message });
  }
});

// Admin: Reject review
router.put('/admin/:reviewId/reject', authMiddleware, async (req, res) => {
  try {
    const review = await Review.findOne({
      where: { id: req.params.reviewId }
    });

    if (!review) {
      return res.status(404).json({ success: false, message: 'Review not found' });
    }

    await review.update({ status: 'rejected' });

    res.json({
      success: true,
      message: 'Review rejected successfully',
      review: review
    });

  } catch (error) {
    console.error('❌ Error rejecting review:', error);
    res.status(500).json({ success: false, message: 'Failed to reject review', error: error.message });
  }
});

// Helper function to update product rating
async function updateProductRating(productId) {
  try {
    const reviews = await Review.findAll({
      where: { productId: productId, status: 'approved' }
    });

    if (reviews.length > 0) {
      const totalRating = reviews.reduce((sum, r) => sum + r.rating, 0);
      const averageRating = totalRating / reviews.length;

      await Product.update(
        {
          averageRating: averageRating.toFixed(1),
          reviewCount: reviews.length
        },
        { where: { id: productId } }
      );
    }
  } catch (error) {
    console.error('Error updating product rating:', error);
  }
}

module.exports = router;
