const express = require('express');
const router = express.Router();
const aiAdminAnalytics = require('../services/aiAdminAnalytics');
const { adminMiddleware } = require('../middleware/authMiddleware');

// Protect all AI admin routes - require admin authentication
router.use(adminMiddleware);

/**
 * AI-Powered Admin Analytics Routes
 * Advanced AI features for modern ecommerce dashboard
 */

// Sales Forecasting
router.get('/forecast/sales', async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const forecast = await aiAdminAnalytics.forecastSales(parseInt(days));
    res.json(forecast);
  } catch (error) {
    console.error('Sales forecast error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Churn Prediction
router.get('/predict/churn', async (req, res) => {
  try {
    const churnPrediction = await aiAdminAnalytics.predictChurn();
    res.json(churnPrediction);
  } catch (error) {
    console.error('Churn prediction error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Product Performance Analysis
router.get('/analyze/products', async (req, res) => {
  try {
    const analysis = await aiAdminAnalytics.analyzeProductPerformance();
    res.json(analysis);
  } catch (error) {
    console.error('Product analysis error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Pricing Optimization
router.get('/optimize/pricing/:productId', async (req, res) => {
  try {
    const { productId } = req.params;
    const pricingSuggestion = await aiAdminAnalytics.suggestPricing(productId);
    res.json(pricingSuggestion);
  } catch (error) {
    console.error('Pricing optimization error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Inventory Optimization
router.get('/optimize/inventory', async (req, res) => {
  try {
    const inventoryRecommendations = await aiAdminAnalytics.optimizeInventory();
    res.json(inventoryRecommendations);
  } catch (error) {
    console.error('Inventory optimization error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Customer Lifetime Value Prediction
router.get('/predict/clv', async (req, res) => {
  try {
    const clvPrediction = await aiAdminAnalytics.predictCustomerLifetimeValue();
    res.json(clvPrediction);
  } catch (error) {
    console.error('CLV prediction error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// AI Dashboard Summary - All insights in one call
router.get('/dashboard/summary', async (req, res) => {
  try {
    console.log('📊 Fetching AI dashboard summary...');
    
    // Fetch all analytics in parallel for faster response
    const [
      salesForecast,
      churnPrediction,
      productPerformance,
      inventoryOptimization,
      clvPrediction
    ] = await Promise.all([
      aiAdminAnalytics.forecastSales(7), // 7-day forecast
      aiAdminAnalytics.predictChurn(),
      aiAdminAnalytics.analyzeProductPerformance(),
      aiAdminAnalytics.optimizeInventory(),
      aiAdminAnalytics.predictCustomerLifetimeValue()
    ]);

    res.json({
      success: true,
      data: {
        salesForecast: {
          nextWeekRevenue: salesForecast.forecast?.slice(0, 7).reduce((sum, day) => sum + day.projectedRevenue, 0) || 0,
          trend: salesForecast.insights?.trend || 0,
          trendDescription: salesForecast.insights?.trendDescription || 'N/A'
        },
        customerChurn: {
          atRiskCount: churnPrediction.summary?.totalAtRisk || 0,
          highRiskCount: churnPrediction.summary?.highRisk || 0,
          potentialLostRevenue: churnPrediction.summary?.potentialLostRevenue || 0,
          topAtRisk: churnPrediction.atRiskCustomers?.slice(0, 5) || []
        },
        productPerformance: {
          starProducts: productPerformance.summary?.starProducts || 0,
          needsAttention: productPerformance.summary?.needsAttention || 0,
          outOfStock: productPerformance.summary?.outOfStock || 0,
          topPerformers: productPerformance.topPerformers?.slice(0, 5) || []
        },
        inventory: {
          criticalItems: inventoryOptimization.summary?.criticalItems || 0,
          highPriorityItems: inventoryOptimization.summary?.highPriorityItems || 0,
          overstockedItems: inventoryOptimization.summary?.overstockedItems || 0,
          deadStockItems: inventoryOptimization.summary?.deadStockItems || 0,
          urgentActions: inventoryOptimization.recommendations?.filter(r => r.urgency === 'Critical').slice(0, 5) || []
        },
        customerValue: {
          platinumCustomers: clvPrediction.summary?.platinum || 0,
          goldCustomers: clvPrediction.summary?.gold || 0,
          totalPredictedValue: clvPrediction.summary?.totalPredictedValue || 0,
          topCustomers: clvPrediction.topCustomers?.slice(0, 5) || []
        }
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('AI dashboard summary error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

module.exports = router;
