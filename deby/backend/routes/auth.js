const express = require('express');
const router = express.Router();
const { registerUser, loginUser, getProfile, checkPhoneExists } = require('../controllers/authController');

// Logging middleware for auth routes
router.use((req, res, next) => {
  console.log(`🔐 Auth Route: ${req.method} ${req.path}`);
  console.log('📦 Body:', JSON.stringify(req.body, null, 2));
  next();
});

// Check if phone exists (both GET and POST for compatibility)
router.get('/check-phone', checkPhoneExists);
router.post('/check-phone', checkPhoneExists);

// Login with phone
router.post('/login-phone', loginUser);

// Register user
router.post('/register', registerUser);

// Login user
router.post('/login', loginUser);

// Get current user profile
router.get('/profile', getProfile);

// Logout (client-side token removal)
router.post('/logout', (req, res) => {
  res.json({
    success: true,
    message: 'Logged out successfully'
  });
});

module.exports = router; 