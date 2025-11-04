const express = require('express');
const router = express.Router();
const {
  getUserProfile,
  updateUserProfile,
  addUserAddress,
  updateUserAddress,
  deleteUserAddress,
  addPaymentMethod,
  updatePaymentMethod,
  deletePaymentMethod,
  getUserAnalytics
} = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');

// All routes require authentication
router.use(protect);

// Profile management
router.get('/profile', getUserProfile);
router.put('/profile', updateUserProfile);

// Address management
router.post('/addresses', addUserAddress);
router.put('/addresses/:addressId', updateUserAddress);
router.delete('/addresses/:addressId', deleteUserAddress);

// Payment method management
router.post('/payment-methods', addPaymentMethod);
router.put('/payment-methods/:methodId', updatePaymentMethod);
router.delete('/payment-methods/:methodId', deletePaymentMethod);

// Analytics
router.get('/analytics', getUserAnalytics);

module.exports = router; 