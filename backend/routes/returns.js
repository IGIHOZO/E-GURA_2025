const express = require('express');
const router = express.Router();
const returnsService = require('../services/returnsService');

/**
 * POST /api/returns/create
 * Create return request
 */
router.post('/create', async (req, res) => {
  try {
    const returnRequest = await returnsService.createReturnRequest(req.body);

    res.json({
      success: true,
      return: returnRequest
    });
  } catch (error) {
    console.error('❌ Create return error:', error);
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * GET /api/returns/:returnId
 * Get return request details
 */
router.get('/:returnId', (req, res) => {
  try {
    const { returnId } = req.params;
    const returnRequest = returnsService.getReturn(returnId);

    if (!returnRequest) {
      return res.status(404).json({
        success: false,
        message: 'Return request not found'
      });
    }

    res.json({
      success: true,
      return: returnRequest
    });
  } catch (error) {
    console.error('❌ Get return error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * GET /api/returns/user/:userId
 * Get user's return requests
 */
router.get('/user/:userId', (req, res) => {
  try {
    const { userId } = req.params;
    const returns = returnsService.getUserReturns(userId);

    res.json({
      success: true,
      returns
    });
  } catch (error) {
    console.error('❌ Get user returns error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * PUT /api/returns/:returnId/approve
 * Approve return request (admin)
 */
router.put('/:returnId/approve', async (req, res) => {
  try {
    const { returnId } = req.params;
    const { note } = req.body;

    const returnRequest = await returnsService.approveReturn(returnId, note);

    res.json({
      success: true,
      return: returnRequest
    });
  } catch (error) {
    console.error('❌ Approve return error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * PUT /api/returns/:returnId/reject
 * Reject return request (admin)
 */
router.put('/:returnId/reject', async (req, res) => {
  try {
    const { returnId } = req.params;
    const { reason } = req.body;

    const returnRequest = await returnsService.rejectReturn(returnId, reason);

    res.json({
      success: true,
      return: returnRequest
    });
  } catch (error) {
    console.error('❌ Reject return error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * PUT /api/returns/:returnId/status
 * Update return status
 */
router.put('/:returnId/status', async (req, res) => {
  try {
    const { returnId } = req.params;
    const { status, note } = req.body;

    const returnRequest = await returnsService.updateReturnStatus(returnId, status, note);

    res.json({
      success: true,
      return: returnRequest
    });
  } catch (error) {
    console.error('❌ Update status error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * GET /api/returns/check-eligibility/:orderId
 * Check return eligibility
 */
router.get('/check-eligibility/:orderId', (req, res) => {
  try {
    const { orderId } = req.params;
    const { orderDate } = req.query;

    const eligibility = returnsService.checkEligibility(orderId, orderDate);

    res.json({
      success: true,
      ...eligibility
    });
  } catch (error) {
    console.error('❌ Check eligibility error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * GET /api/returns/stats
 * Get return statistics (admin)
 */
router.get('/admin/stats', (req, res) => {
  try {
    const stats = returnsService.getStats();

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
