/**
 * Analytics Routes
 * Handles analytics tracking events from frontend
 */

const express = require('express');
const router = express.Router();

/**
 * POST /api/analytics/track
 * Track analytics event
 */
router.post('/track', async (req, res) => {
  try {
    const { event_name, event_data, user_id, session_id } = req.body;
    
    // Log the event (in production, save to database or send to analytics service)
    console.log('📊 Analytics Event:', {
      event: event_name,
      data: event_data,
      user: user_id,
      session: session_id,
      timestamp: new Date().toISOString()
    });
    
    // Return success
    res.json({
      success: true,
      message: 'Event tracked',
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Analytics tracking error:', error);
    res.status(200).json({
      success: true,
      message: 'Event received (error logged)'
    });
  }
});

/**
 * GET /api/analytics/health
 * Check analytics service health
 */
router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'analytics',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
