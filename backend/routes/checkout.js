const express = require('express');
const router = express.Router();
const checkoutService = require('../services/checkoutService');
const promotionsEngine = require('../services/promotionsEngine');
const orderTrackingService = require('../services/orderTrackingService');
const abandonedCartService = require('../services/abandonedCartService');

/**
 * POST /api/checkout/guest
 * Create guest checkout session
 */
router.post('/guest', async (req, res) => {
  try {
    const { cartItems, guestInfo } = req.body;

    if (!cartItems || cartItems.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Cart is empty'
      });
    }

    const checkout = checkoutService.createGuestCheckout(cartItems, guestInfo);

    res.json({
      success: true,
      checkout
    });
  } catch (error) {
    console.error('❌ Guest checkout error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * POST /api/checkout/one-click
 * One-click checkout for registered users
 */
router.post('/one-click', async (req, res) => {
  try {
    const { userId, cartItems } = req.body;

    const order = await checkoutService.oneClickCheckout(userId, cartItems);

    // Create tracking
    const tracking = orderTrackingService.createTracking({
      orderId: order.orderId,
      userId: order.userId,
      email: req.body.email,
      phone: req.body.phone,
      shippingAddress: order.shippingAddress
    });

    res.json({
      success: true,
      order,
      tracking
    });
  } catch (error) {
    console.error('❌ One-click checkout error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * POST /api/checkout/save-profile
 * Save one-click profile
 */
router.post('/save-profile', async (req, res) => {
  try {
    const { userId, profileData } = req.body;

    const profile = checkoutService.saveOneClickProfile(userId, profileData);

    res.json({
      success: true,
      profile
    });
  } catch (error) {
    console.error('❌ Save profile error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * POST /api/checkout/validate
 * Validate checkout data
 */
router.post('/validate', (req, res) => {
  try {
    const validation = checkoutService.validateCheckout(req.body);

    res.json({
      success: validation.valid,
      errors: validation.errors
    });
  } catch (error) {
    console.error('❌ Validation error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * POST /api/checkout/apply-coupon
 * Apply discount coupon
 */
router.post('/apply-coupon', (req, res) => {
  try {
    const { code, orderTotal, userId } = req.body;

    const result = promotionsEngine.applyCoupon(code, orderTotal, userId);

    res.json({
      success: result.valid,
      ...result
    });
  } catch (error) {
    console.error('❌ Coupon error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * POST /api/checkout/calculate-total
 * Calculate order total with discounts and shipping
 */
router.post('/calculate-total', (req, res) => {
  try {
    const { items, couponCode, address } = req.body;

    const subtotal = checkoutService.calculateSubtotal(items);
    let result = { subtotal, discount: 0, total: subtotal };

    // Apply coupon if provided
    if (couponCode) {
      result = checkoutService.applyDiscount(subtotal, couponCode);
    }

    // Calculate shipping
    const shipping = checkoutService.calculateShipping(items, address || {});
    
    result.shipping = shipping;
    result.grandTotal = result.total + shipping;

    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    console.error('❌ Calculate total error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * POST /api/checkout/track-cart
 * Track cart for abandoned cart recovery
 */
router.post('/track-cart', (req, res) => {
  try {
    const { userId, cartData } = req.body;

    abandonedCartService.trackCart(userId, cartData);

    res.json({
      success: true,
      message: 'Cart tracked'
    });
  } catch (error) {
    console.error('❌ Track cart error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;
