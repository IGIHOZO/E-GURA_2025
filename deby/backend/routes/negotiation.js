const express = require('express');
const router = express.Router();
const negotiationService = require('../services/negotiationService');
const analyticsService = require('../services/analyticsService');

// Handle MongoDB models gracefully
let NegotiationRule, FeatureFlag;
try {
  NegotiationRule = require('../models/NegotiationRule');
  FeatureFlag = require('../models/FeatureFlag');
} catch (error) {
  console.log('⚠️ MongoDB models not available, using fallback mode');
}

/**
 * POST /api/negotiation/offer
 * Start or continue a negotiation
 */
router.post('/offer', async (req, res) => {
  try {
    const { sku, userId, offerPrice, quantity, sessionId, language, conversionSource } = req.body;

    // Validation
    if (!sku || !userId || !offerPrice) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: sku, userId, offerPrice'
      });
    }

    if (offerPrice <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Invalid offer price'
      });
    }

    const metadata = {
      language: language || 'en',
      ipAddress: req.ip || req.headers['x-forwarded-for'],
      userAgent: req.headers['user-agent'],
      deviceType: req.headers['user-agent']?.includes('Mobile') ? 'mobile' : 'desktop',
      referrer: req.headers.referer,
      conversionSource: conversionSource || 'product_page'
    };

    let result;

    if (sessionId) {
      // Continue existing negotiation
      result = await negotiationService.continueNegotiation({
        sessionId,
        offerPrice,
        metadata
      });
    } else {
      // Start new negotiation
      result = await negotiationService.startNegotiation({
        sku,
        userId,
        offerPrice,
        quantity: quantity || 1,
        metadata
      });
    }

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Negotiation error:', error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/negotiation/accept
 * Accept a negotiated price
 */
router.post('/accept', async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({
        success: false,
        error: 'Missing discount token'
      });
    }

    const result = await negotiationService.acceptNegotiation({ token });

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Accept error:', error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/negotiation/rules
 * Get negotiation rules (optionally filtered by SKU)
 */
router.get('/rules', async (req, res) => {
  try {
    const { sku } = req.query;
    const rules = await negotiationService.getRules(sku);

    res.json({
      success: true,
      data: rules
    });
  } catch (error) {
    console.error('Get rules error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/negotiation/session/:sessionId
 * Get negotiation session details
 */
router.get('/session/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const Negotiation = require('../models/Negotiation');
    
    const negotiation = await Negotiation.findOne({ sessionId });
    
    if (!negotiation) {
      return res.status(404).json({
        success: false,
        error: 'Session not found'
      });
    }

    res.json({
      success: true,
      data: {
        sessionId: negotiation.sessionId,
        sku: negotiation.sku,
        status: negotiation.status,
        currentRound: negotiation.currentRound,
        maxRounds: negotiation.maxRounds,
        rounds: negotiation.rounds,
        finalPrice: negotiation.finalPrice,
        expiresAt: negotiation.expiresAt,
        discountToken: negotiation.discountToken
      }
    });
  } catch (error) {
    console.error('Get session error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Admin routes
 */

/**
 * POST /api/negotiation/admin/rules
 * Create or update negotiation rule
 */
router.post('/admin/rules', async (req, res) => {
  try {
    const ruleData = req.body;

    const rule = await NegotiationRule.findOneAndUpdate(
      { sku: ruleData.sku },
      ruleData,
      { upsert: true, new: true, runValidators: true }
    );

    res.json({
      success: true,
      data: rule
    });
  } catch (error) {
    console.error('Create/update rule error:', error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * DELETE /api/negotiation/admin/rules/:sku
 * Delete negotiation rule
 */
router.delete('/admin/rules/:sku', async (req, res) => {
  try {
    const { sku } = req.params;
    
    await NegotiationRule.findOneAndDelete({ sku });

    res.json({
      success: true,
      message: 'Rule deleted'
    });
  } catch (error) {
    console.error('Delete rule error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/negotiation/admin/analytics
 * Get analytics dashboard data
 */
router.get('/admin/analytics', async (req, res) => {
  try {
    const { startDate, endDate, sku } = req.query;

    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();

    const data = await analyticsService.getDashboardData(start, end, sku);

    res.json({
      success: true,
      data
    });
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/negotiation/admin/analytics/export
 * Export analytics to CSV
 */
router.get('/admin/analytics/export', async (req, res) => {
  try {
    const { startDate, endDate, sku } = req.query;

    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();

    const csv = await analyticsService.exportToCSV(start, end, sku);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=negotiation-analytics-${start.toISOString().split('T')[0]}-to-${end.toISOString().split('T')[0]}.csv`);
    res.send(csv);
  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/negotiation/admin/analytics/realtime
 * Get real-time metrics
 */
router.get('/admin/analytics/realtime', async (req, res) => {
  try {
    const metrics = await analyticsService.getRealTimeMetrics();

    res.json({
      success: true,
      data: metrics
    });
  } catch (error) {
    console.error('Real-time metrics error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/negotiation/admin/feature-flags
 * Create or update feature flag
 */
router.post('/admin/feature-flags', async (req, res) => {
  try {
    const flagData = req.body;

    const flag = await FeatureFlag.findOneAndUpdate(
      { name: flagData.name },
      flagData,
      { upsert: true, new: true, runValidators: true }
    );

    res.json({
      success: true,
      data: flag
    });
  } catch (error) {
    console.error('Feature flag error:', error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/negotiation/admin/feature-flags
 * Get all feature flags
 */
router.get('/admin/feature-flags', async (req, res) => {
  try {
    const flags = await FeatureFlag.find();

    res.json({
      success: true,
      data: flags
    });
  } catch (error) {
    console.error('Get feature flags error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/negotiation/admin/aggregate
 * Manually trigger analytics aggregation
 */
router.post('/admin/aggregate', async (req, res) => {
  try {
    const { date } = req.body;
    const targetDate = date ? new Date(date) : new Date();

    const results = await analyticsService.aggregateDailyAnalytics(targetDate);

    res.json({
      success: true,
      data: {
        date: targetDate,
        skusProcessed: results.length,
        results
      }
    });
  } catch (error) {
    console.error('Aggregation error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
