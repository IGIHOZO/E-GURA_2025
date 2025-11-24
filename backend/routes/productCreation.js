// BRAND NEW PRODUCT CREATION ROUTES
const express = require('express');
const router = express.Router();
const { createProductSimple } = require('../controllers/productCreationController');

// Simple product creation endpoint
router.post('/create-product', createProductSimple);

module.exports = router;
