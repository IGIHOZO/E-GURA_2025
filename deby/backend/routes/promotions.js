const express = require('express');
const router = express.Router();
const promotionsEngine = require('../services/promotionsEngine');

/**
 * GET /api/promotions/active
 * Get all active promotions
 */
router.get('/active', (req, res) => {
  try {
    const promotions = promotionsEngine.getActivePromotions();

    res.json({
      success: true,
      promotions
    });
  } catch (error) {
    console.error('❌ Get promotions error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * POST /api/promotions/coupon/create
 * Create new coupon (admin)
 */
router.post('/coupon/create', (req, res) => {
  try {
    const coupon = promotionsEngine.createCoupon(req.body);

    res.json({
      success: true,
      coupon
    });
  } catch (error) {
    console.error('❌ Create coupon error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * POST /api/promotions/loyalty/add
 * Add loyalty points
 */
router.post('/loyalty/add', (req, res) => {
  try {
    const { userId, points, reason } = req.body;

    const loyalty = promotionsEngine.addLoyaltyPoints(userId, points, reason);

    res.json({
      success: true,
      loyalty
    });
  } catch (error) {
    console.error('❌ Add loyalty points error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * POST /api/promotions/loyalty/redeem
 * Redeem loyalty points
 */
router.post('/loyalty/redeem', (req, res) => {
  try {
    const { userId, points } = req.body;

    const result = promotionsEngine.redeemLoyaltyPoints(userId, points);

    res.json({
      success: result.success,
      ...result
    });
  } catch (error) {
    console.error('❌ Redeem points error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * POST /api/promotions/referral/create
 * Create referral code
 */
router.post('/referral/create', (req, res) => {
  try {
    const { userId } = req.body;

    const referral = promotionsEngine.createReferral(userId);

    res.json({
      success: true,
      referral
    });
  } catch (error) {
    console.error('❌ Create referral error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * POST /api/promotions/referral/apply
 * Apply referral code
 */
router.post('/referral/apply', (req, res) => {
  try {
    const { referralCode, newUserId } = req.body;

    const result = promotionsEngine.applyReferral(referralCode, newUserId);

    res.json({
      success: result.success,
      ...result
    });
  } catch (error) {
    console.error('❌ Apply referral error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * POST /api/promotions/bundle/create
 * Create product bundle
 */
router.post('/bundle/create', (req, res) => {
  try {
    const bundle = promotionsEngine.createBundle(req.body);

    res.json({
      success: true,
      bundle
    });
  } catch (error) {
    console.error('❌ Create bundle error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * POST /api/promotions/flash-sale/create
 * Create flash sale
 */
router.post('/flash-sale/create', (req, res) => {
  try {
    const sale = promotionsEngine.createFlashSale(req.body);

    res.json({
      success: true,
      sale
    });
  } catch (error) {
    console.error('❌ Create flash sale error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * POST /api/promotions/personalized
 * Get personalized offer
 */
router.post('/personalized', (req, res) => {
  try {
    const { userId, userHistory } = req.body;

    const offer = promotionsEngine.generatePersonalizedOffer(userId, userHistory);

    res.json({
      success: true,
      offer
    });
  } catch (error) {
    console.error('❌ Personalized offer error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * GET /api/promotions/stats
 * Get promotion statistics
 */
router.get('/stats', (req, res) => {
  try {
    const stats = promotionsEngine.getStats();

    res.json({
      success: true,
      stats
    });
  } catch (error) {
    console.error('❌ Get stats error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;
