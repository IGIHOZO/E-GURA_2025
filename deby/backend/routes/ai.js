const express = require('express');
const router = express.Router();
const {
  getAIRecommendations,
  virtualTryOn,
  ladiVtonTryOn,
  analyzeStyle,
  getKigaliTrends,
  aiSearch,
  getSizeRecommendation
} = require('../controllers/aiController');
const { protect } = require('../middleware/authMiddleware');
const Customer = require('../models/Customer');
const CustomerActivity = require('../models/CustomerActivity');

// Middleware to track AI interactions
const trackAIActivity = async (req, res, next) => {
  // Store original json method
  const originalJson = res.json.bind(res);
  
  // Override json method to capture response
  res.json = function(data) {
    // Track activity after response is sent
    if (req.customerPhone && req.aiActivityType) {
      setImmediate(async () => {
        try {
          const customer = await Customer.findOne({ phone: req.customerPhone });
          
          if (customer) {
            // Log in CustomerActivity collection
            await CustomerActivity.logActivity({
              customerPhone: req.customerPhone,
              customerId: customer._id,
              activityType: req.aiActivityType,
              details: {
                query: req.body.query || req.body.prompt,
                success: data.success !== false,
                ...req.aiActivityDetails
              },
              ipAddress: req.ip || req.connection.remoteAddress,
              userAgent: req.get('user-agent'),
              device: req.get('user-agent')?.includes('Mobile') ? 'mobile' : 'desktop',
              status: data.success !== false ? 'success' : 'failed',
              priority: 'medium'
            });
            
            // Also log in customer's activity log
            customer.logActivity(req.aiActivityType, {
              query: req.body.query || req.body.prompt,
              ...req.aiActivityDetails
            }, {
              ipAddress: req.ip,
              userAgent: req.get('user-agent')
            });
            
            await customer.save();
          }
        } catch (error) {
          console.error('Error tracking AI activity:', error);
        }
      });
    }
    
    // Call original json method
    return originalJson(data);
  };
  
  next();
};

// AI-powered features with tracking
router.post('/recommendations', trackAIActivity, async (req, res, next) => {
  req.customerPhone = req.body.phone || req.body.customerPhone;
  req.aiActivityType = 'ai_recommendation_requested';
  req.aiActivityDetails = { type: 'product_recommendation' };
  next();
}, getAIRecommendations);

router.post('/virtual-tryon', trackAIActivity, async (req, res, next) => {
  req.customerPhone = req.body.phone || req.body.customerPhone;
  req.aiActivityType = 'virtual_tryon_used';
  req.aiActivityDetails = { 
    type: 'virtual_tryon',
    productId: req.body.productId 
  };
  next();
}, virtualTryOn);

router.post('/ladi-vton', trackAIActivity, async (req, res, next) => {
  req.customerPhone = req.body.phone || req.body.customerPhone;
  req.aiActivityType = 'virtual_tryon_used';
  req.aiActivityDetails = { 
    type: 'ladi_vton',
    productId: req.body.productId 
  };
  next();
}, ladiVtonTryOn);

router.post('/style-analysis', trackAIActivity, async (req, res, next) => {
  req.customerPhone = req.body.phone || req.body.customerPhone;
  req.aiActivityType = 'ai_style_recommendation';
  req.aiActivityDetails = { type: 'style_analysis' };
  next();
}, analyzeStyle);

router.get('/kigali-trends', getKigaliTrends);

router.post('/smart-search', trackAIActivity, async (req, res, next) => {
  req.customerPhone = req.body.phone || req.body.customerPhone;
  req.aiActivityType = 'product_searched';
  req.aiActivityDetails = { 
    type: 'ai_search',
    query: req.body.query 
  };
  next();
}, aiSearch);

router.post('/size-recommendation', trackAIActivity, async (req, res, next) => {
  req.customerPhone = req.body.phone || req.body.customerPhone;
  req.aiActivityType = 'ai_size_recommendation';
  req.aiActivityDetails = { 
    type: 'size_recommendation',
    measurements: req.body.measurements 
  };
  next();
}, getSizeRecommendation);

// Track AI recommendation acceptance/rejection
router.post('/track-recommendation', async (req, res) => {
  try {
    const { phone, productId, action, recommendationType } = req.body;
    
    if (!phone || !productId || !action) {
      return res.status(400).json({
        success: false,
        message: 'Phone, productId, and action are required'
      });
    }
    
    const customer = await Customer.findOne({ phone });
    
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }
    
    // Add to AI recommendations history
    const recommendation = {
      type: recommendationType || 'product',
      recommendations: [{ product: productId }],
      accepted: action === 'accepted' ? [productId] : [],
      rejected: action === 'rejected' ? [productId] : []
    };
    
    customer.aiRecommendations.push(recommendation);
    
    // Log activity
    await CustomerActivity.logActivity({
      customerPhone: phone,
      customerId: customer._id,
      activityType: action === 'accepted' ? 'ai_recommendation_accepted' : 'ai_recommendation_rejected',
      details: {
        productId,
        recommendationType
      },
      relatedProduct: productId,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      device: req.get('user-agent')?.includes('Mobile') ? 'mobile' : 'desktop',
      priority: 'medium'
    });
    
    await customer.save();
    
    res.json({
      success: true,
      message: 'Recommendation tracked successfully'
    });
  } catch (error) {
    console.error('Error tracking recommendation:', error);
    res.status(500).json({
      success: false,
      message: 'Error tracking recommendation',
      error: error.message
    });
  }
});

// Track product view
router.post('/track-view', async (req, res) => {
  try {
    const { phone, productId, timeSpent } = req.body;
    
    if (!phone || !productId) {
      return res.status(400).json({
        success: false,
        message: 'Phone and productId are required'
      });
    }
    
    const customer = await Customer.findOne({ phone });
    
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }
    
    // Initialize shopping behavior if not exists
    if (!customer.shoppingBehavior) {
      customer.shoppingBehavior = { viewedProducts: [] };
    }
    
    // Check if product already viewed
    const existingView = customer.shoppingBehavior.viewedProducts.find(
      vp => vp.product.toString() === productId
    );
    
    if (existingView) {
      existingView.viewCount += 1;
      existingView.lastViewed = new Date();
      if (timeSpent) existingView.timeSpent = (existingView.timeSpent || 0) + timeSpent;
    } else {
      customer.shoppingBehavior.viewedProducts.push({
        product: productId,
        viewCount: 1,
        lastViewed: new Date(),
        timeSpent: timeSpent || 0
      });
    }
    
    // Log activity
    await CustomerActivity.logActivity({
      customerPhone: phone,
      customerId: customer._id,
      activityType: 'product_viewed',
      details: { timeSpent },
      relatedProduct: productId,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      device: req.get('user-agent')?.includes('Mobile') ? 'mobile' : 'desktop'
    });
    
    await customer.save();
    
    res.json({
      success: true,
      message: 'Product view tracked successfully'
    });
  } catch (error) {
    console.error('Error tracking product view:', error);
    res.status(500).json({
      success: false,
      message: 'Error tracking product view',
      error: error.message
    });
  }
});

// Track search
router.post('/track-search', async (req, res) => {
  try {
    const { phone, query, resultsCount, clickedProducts } = req.body;
    
    if (!phone || !query) {
      return res.status(400).json({
        success: false,
        message: 'Phone and query are required'
      });
    }
    
    const customer = await Customer.findOne({ phone });
    
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }
    
    // Initialize shopping behavior if not exists
    if (!customer.shoppingBehavior) {
      customer.shoppingBehavior = { searchHistory: [] };
    }
    
    customer.shoppingBehavior.searchHistory.push({
      query,
      resultsCount: resultsCount || 0,
      clicked: clickedProducts || [],
      timestamp: new Date()
    });
    
    // Keep only last 100 searches
    if (customer.shoppingBehavior.searchHistory.length > 100) {
      customer.shoppingBehavior.searchHistory = customer.shoppingBehavior.searchHistory.slice(-100);
    }
    
    // Log activity
    await CustomerActivity.logActivity({
      customerPhone: phone,
      customerId: customer._id,
      activityType: 'product_searched',
      details: { query, resultsCount },
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      device: req.get('user-agent')?.includes('Mobile') ? 'mobile' : 'desktop'
    });
    
    await customer.save();
    
    res.json({
      success: true,
      message: 'Search tracked successfully'
    });
  } catch (error) {
    console.error('Error tracking search:', error);
    res.status(500).json({
      success: false,
      message: 'Error tracking search',
      error: error.message
    });
  }
});

module.exports = router; 