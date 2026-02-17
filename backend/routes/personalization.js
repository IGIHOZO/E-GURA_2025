const express = require('express');
const router = express.Router();
const personalizationService = require('../services/personalizationService');

/**
 * Track product view
 */
router.post('/track/view', async (req, res) => {
  try {
    const { userId, productData } = req.body;
    
    if (!userId || !productData) {
      return res.status(400).json({ 
        success: false, 
        message: 'userId and productData are required' 
      });
    }

    personalizationService.trackView(userId, productData);
    
    res.json({ success: true, message: 'View tracked' });
  } catch (error) {
    console.error('Error tracking view:', error);
    res.status(500).json({ success: false, message: 'Failed to track view' });
  }
});

/**
 * Track search
 */
router.post('/track/search', async (req, res) => {
  try {
    const { userId, query } = req.body;
    
    if (!userId || !query) {
      return res.status(400).json({ 
        success: false, 
        message: 'userId and query are required' 
      });
    }

    personalizationService.trackSearch(userId, query);
    
    res.json({ success: true, message: 'Search tracked' });
  } catch (error) {
    console.error('Error tracking search:', error);
    res.status(500).json({ success: false, message: 'Failed to track search' });
  }
});

/**
 * Get personalized recommendations
 */
router.get('/recommendations', async (req, res) => {
  try {
    const userId = req.query.userId || req.query.deviceId;
    const limit = parseInt(req.query.limit) || 12;
    
    if (!userId) {
      return res.status(400).json({ 
        success: false, 
        message: 'userId or deviceId is required' 
      });
    }

    const recommendations = await personalizationService.getPersonalizedRecommendations(userId, limit);
    
    res.json({ 
      success: true, 
      data: recommendations,
      personalized: recommendations.length > 0
    });
  } catch (error) {
    console.error('Error fetching recommendations:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch recommendations' });
  }
});

/**
 * Get similar products
 */
router.get('/similar/:productId', async (req, res) => {
  try {
    const { productId } = req.params;
    const userId = req.query.userId || req.query.deviceId || 'guest';
    const limit = parseInt(req.query.limit) || 6;

    const similar = await personalizationService.getSimilarProducts(productId, userId, limit);
    
    res.json({ 
      success: true, 
      data: similar 
    });
  } catch (error) {
    console.error('Error fetching similar products:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch similar products' });
  }
});

/**
 * Get user activity summary
 */
router.get('/activity', async (req, res) => {
  try {
    const userId = req.query.userId || req.query.deviceId;
    
    if (!userId) {
      return res.status(400).json({ 
        success: false, 
        message: 'userId or deviceId is required' 
      });
    }

    const activity = personalizationService.getUserActivity(userId);
    
    // Return summary without full history
    res.json({ 
      success: true, 
      data: {
        viewCount: activity.views.length,
        searchCount: activity.searches.length,
        purchaseCount: activity.purchases.length,
        topCategories: Object.entries(activity.categoryInterests)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)
          .map(([cat, count]) => ({ category: cat, count })),
        topBrands: Object.entries(activity.brandPreferences)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)
          .map(([brand, count]) => ({ brand, count })),
        lastActive: activity.lastActive
      }
    });
  } catch (error) {
    console.error('Error fetching activity:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch activity' });
  }
});

module.exports = router;
