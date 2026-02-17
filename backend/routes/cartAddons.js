/**
 * Cart Add-On Recommendations API Routes
 * Provides intelligent product suggestions at cart/checkout
 */

const express = require('express');
const router = express.Router();
const cartAddonService = require('../services/cartAddonService');
const addonExplanationService = require('../services/addonExplanationService');

/**
 * GET /api/cart/addons
 * Get add-on recommendations for cart items
 * 
 * Query params:
 * - cartItems: JSON string of cart items [{productId, name, category, price}]
 * - limit: Number of recommendations (default 6, max 10)
 * - sessionId: Session identifier for tracking
 */
router.get('/addons', async (req, res) => {
  try {
    const { cartItems: cartItemsJson, limit = 6, sessionId } = req.query;
    const userId = req.user?.id || null;

    if (!cartItemsJson) {
      return res.status(400).json({
        success: false,
        message: 'cartItems query parameter is required'
      });
    }

    let cartItems;
    try {
      cartItems = JSON.parse(cartItemsJson);
    } catch (e) {
      return res.status(400).json({
        success: false,
        message: 'Invalid cartItems JSON format'
      });
    }

    if (!Array.isArray(cartItems) || cartItems.length === 0) {
      return res.json({
        success: true,
        data: { headline: '', recommendations: [] }
      });
    }

    // Get recommendations from scoring engine
    const recommendations = await cartAddonService.getCartAddons(cartItems, {
      userId,
      sessionId,
      limit: Math.min(parseInt(limit) || 6, 10)
    });

    if (recommendations.length === 0) {
      return res.json({
        success: true,
        data: { headline: '', recommendations: [] }
      });
    }

    // Generate human-readable explanations
    const explanations = await addonExplanationService.generateExplanations(
      cartItems,
      recommendations
    );

    // Format final response
    const response = addonExplanationService.formatResponse(
      explanations,
      recommendations
    );

    res.json({
      success: true,
      data: response
    });

  } catch (error) {
    console.error('GET /api/cart/addons error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get recommendations'
    });
  }
});

/**
 * POST /api/cart/addons
 * Get add-on recommendations (POST version for larger cart data)
 * 
 * Body:
 * - cartItems: Array of cart items [{productId, name, category, price, quantity}]
 * - limit: Number of recommendations (default 6, max 10)
 * - sessionId: Session identifier for tracking
 */
router.post('/addons', async (req, res) => {
  try {
    const { cartItems, limit = 6, sessionId } = req.body;
    const userId = req.user?.id || null;

    if (!cartItems || !Array.isArray(cartItems) || cartItems.length === 0) {
      return res.json({
        success: true,
        data: { headline: '', recommendations: [] }
      });
    }

    // Get recommendations from scoring engine
    const recommendations = await cartAddonService.getCartAddons(cartItems, {
      userId,
      sessionId,
      limit: Math.min(parseInt(limit) || 6, 10)
    });

    if (recommendations.length === 0) {
      return res.json({
        success: true,
        data: { headline: '', recommendations: [] }
      });
    }

    // Generate human-readable explanations
    const explanations = await addonExplanationService.generateExplanations(
      cartItems,
      recommendations
    );

    // Format final response
    const response = addonExplanationService.formatResponse(
      explanations,
      recommendations
    );

    res.json({
      success: true,
      data: response
    });

  } catch (error) {
    console.error('POST /api/cart/addons error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get recommendations'
    });
  }
});

/**
 * POST /api/cart/events
 * Track cart events for future analysis
 * 
 * Body:
 * - productId: Product being added/removed
 * - eventType: 'add' | 'remove' | 'view' | 'purchase'
 * - quantity: Number of items
 * - cartSnapshot: Current cart items (for context)
 */
router.post('/events', async (req, res) => {
  try {
    const { productId, eventType, quantity, cartSnapshot, metadata } = req.body;
    const sessionId = req.body.sessionId || req.sessionID || 'anonymous';
    const userId = req.user?.id || null;

    if (!productId || !eventType) {
      return res.status(400).json({
        success: false,
        message: 'productId and eventType are required'
      });
    }

    const validEvents = ['add', 'remove', 'view', 'purchase'];
    if (!validEvents.includes(eventType)) {
      return res.status(400).json({
        success: false,
        message: `eventType must be one of: ${validEvents.join(', ')}`
      });
    }

    await cartAddonService.trackCartEvent({
      sessionId,
      userId,
      productId,
      eventType,
      quantity: quantity || 1,
      cartSnapshot,
      metadata
    });

    res.json({ success: true });

  } catch (error) {
    console.error('POST /api/cart/events error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to track event'
    });
  }
});

/**
 * POST /api/cart/recalculate-relationships
 * Admin endpoint to recalculate product relationships
 * Should be run periodically (e.g., daily cron job)
 */
router.post('/recalculate-relationships', async (req, res) => {
  try {
    // Optional: Add admin authentication check here
    // if (!req.user?.isAdmin) return res.status(403).json({...});

    const result = await cartAddonService.recalculateRelationships();
    
    res.json({
      success: result,
      message: result ? 'Relationships recalculated' : 'Recalculation failed'
    });

  } catch (error) {
    console.error('POST /api/cart/recalculate-relationships error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to recalculate relationships'
    });
  }
});

module.exports = router;
