const express = require('express');
const router = express.Router();
const modernAI = require('../services/modernAIBargaining'); // New modern LLM-inspired AI
const aiBargaining = require('../services/aiBargaining'); // Fallback
const intelligentAI = require('../services/intelligentAI');
const productFetcher = require('../services/productFetcher');

// Store active offers in memory (can be moved to database later)
const activeOffers = new Map();

// Test database connection on startup
(async () => {
  const isConnected = await productFetcher.testConnection();
  if (isConnected) {
    console.log('✅ Offers route: Database connection verified');
  } else {
    console.warn('⚠️ Offers route: Database connection issue detected');
  }
})();

/**
 * POST /api/offers/make
 * Make an offer on a product with AI bargaining
 */
router.post('/make', async (req, res) => {
  try {
    const { productId, offeredPrice, customerInfo } = req.body;

    console.log('💰 New offer received:', { 
      productId, 
      offeredPrice, 
      customerInfo,
      body: req.body 
    });

    // Validate input
    if (!productId) {
      console.error('❌ Missing productId');
      return res.status(400).json({
        success: false,
        message: 'Product ID is required'
      });
    }

    if (!offeredPrice || isNaN(offeredPrice) || offeredPrice <= 0) {
      console.error('❌ Invalid offeredPrice:', offeredPrice);
      return res.status(400).json({
        success: false,
        message: 'Valid offered price is required'
      });
    }

    // Fetch product using AI-powered fetcher with multiple fallback strategies
    let product;
    try {
      console.log('🤖 Using AI Product Fetcher for ID:', productId);
      product = await productFetcher.fetchProduct(productId);
      
      if (!product) {
        console.error('❌ Product not found (returned null)');
        return res.status(404).json({
          success: false,
          message: 'Product not found. It may have been removed.'
        });
      }
      
      console.log('✅ Product successfully fetched:', product.name);
    } catch (fetchError) {
      console.error('❌ AI Product Fetcher failed:', fetchError.message);
      console.error('Stack:', fetchError.stack);
      
      return res.status(500).json({
        success: false,
        message: 'Unable to fetch product. Please try again or contact support.',
        error: process.env.NODE_ENV === 'development' ? fetchError.message : undefined
      });
    }

    if (!product) {
      console.error('❌ Product not found with ID:', productId);
      return res.status(404).json({
        success: false,
        message: 'Product not found. It may have been removed.'
      });
    }

    // Validate product has price
    if (!product.price || product.price <= 0) {
      console.error('❌ Product has invalid price:', product.price);
      return res.status(400).json({
        success: false,
        message: 'Product price is invalid'
      });
    }

    // Get offer history for this product/customer
    const offerKey = `${productId}-${customerInfo?.deviceId || 'guest'}`;
    const offerHistory = activeOffers.get(offerKey) || [];

    console.log('📝 Offer history:', { attempts: offerHistory.length });

    // Run Modern AI bargaining algorithm (LLM-inspired)
    let aiResponse;
    try {
      console.log('🤖 Running Modern AI bargaining engine...');
      
      // Use new modern AI with product context
      aiResponse = modernAI.negotiate(
        product.price,
        offeredPrice,
        offerHistory,
        {
          name: product.name,
          category: product.category,
          brand: product.brand,
          stock: product.stock
        }
      );
      
      console.log('✅ Modern AI analysis complete:', {
        decision: aiResponse.decision,
        counterOffer: aiResponse.counterOffer,
        discount: aiResponse.discount,
        tactic: aiResponse.tactic,
        confidence: aiResponse.confidence
      });
    } catch (aiError) {
      console.error('❌ Modern AI error, falling back to basic AI:', aiError);
      
      // Fallback to old AI if modern AI fails
      try {
        aiResponse = aiBargaining.analyzeOffer(
          product.price,
          offeredPrice,
          offerHistory
        );
      } catch (fallbackError) {
        console.error('❌ Fallback AI also failed:', fallbackError);
        return res.status(500).json({
          success: false,
          message: 'Error processing your offer. Please try again!',
          error: process.env.NODE_ENV === 'development' ? fallbackError.message : undefined
        });
      }
    }

    // Update offer history
    const newOffer = {
      timestamp: new Date(),
      customerOffer: offeredPrice,
      aiDecision: aiResponse.decision,
      aiCounterOffer: aiResponse.counterOffer,
      message: aiResponse.message
    };
    offerHistory.push(newOffer);
    activeOffers.set(offerKey, offerHistory);

    console.log('💾 Offer saved. Total attempts:', offerHistory.length);
    console.log('🤖 Final decision:', aiResponse.decision, aiResponse.counterOffer);

    // Send successful response
    const response = {
      success: true,
      product: {
        id: product.id,
        name: product.name,
        originalPrice: product.price,
        image: product.mainImage || product.image
      },
      offer: {
        decision: aiResponse.decision,
        counterOffer: aiResponse.counterOffer,
        message: aiResponse.message,
        reasoning: aiResponse.reasoning,
        discount: aiResponse.discount.toFixed(1),
        savings: aiResponse.savings,
        offerAttempt: aiResponse.offerAttempt,
        canNegotiate: aiResponse.canNegotiate
      }
    };

    console.log('📤 Sending response:', JSON.stringify(response, null, 2));
    res.json(response);

  } catch (error) {
    console.error('❌ Error processing offer:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process offer',
      error: error.message
    });
  }
});

/**
 * POST /api/offers/chat
 * Intelligent AI Assistant chat with learning capabilities
 */
router.post('/chat', async (req, res) => {
  try {
    const { message, context, userId } = req.body;

    console.log('💬 Intelligent chat message:', { message, userId: userId || 'guest' });

    if (!message || message.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Message is required',
        reply: "Please type a message to start chatting! 😊"
      });
    }

    // Get user ID (use deviceId or generate one)
    const chatUserId = userId || context?.deviceId || 'guest-' + Date.now();

    // Use intelligent AI to handle conversation
    const aiResponse = await intelligentAI.handleConversation(chatUserId, message, context);

    console.log('🤖 AI Response:', { action: aiResponse.action, shouldSearch: aiResponse.shouldSearch });

    // If AI suggests product search, fetch products
    if (aiResponse.action === 'product_search' || aiResponse.shouldSearch || aiResponse.searchQuery) {
      const { Product } = require('../models');
      const { Op } = require('sequelize');
      let products = [];
      
      try {
        const searchTerm = aiResponse.searchQuery || message;
        console.log('🔍 Searching for:', searchTerm);
        
        if (Product.findAll) {
          // PostgreSQL/Sequelize with search
          products = await Product.findAll({ 
            where: {
              isActive: true,
              [Op.or]: [
                { name: { [Op.iLike]: `%${searchTerm}%` } },
                { description: { [Op.iLike]: `%${searchTerm}%` } },
                { category: { [Op.iLike]: `%${searchTerm}%` } },
                { tags: { [Op.contains]: [searchTerm.toLowerCase()] } }
              ]
            },
            limit: 20,
            order: [['createdAt', 'DESC']]
          });
        } else {
          // MongoDB/Mongoose with search
          products = await Product.find({ 
            isActive: true,
            $or: [
              { name: { $regex: searchTerm, $options: 'i' } },
              { description: { $regex: searchTerm, $options: 'i' } },
              { category: { $regex: searchTerm, $options: 'i' } }
            ]
          }).limit(20);
        }
        
        console.log('✅ Found products:', products.length);
        
        // If no exact matches, get similar products
        if (products.length === 0) {
          console.log('🔄 No exact matches, fetching popular products...');
          if (Product.findAll) {
            products = await Product.findAll({ 
              where: { isActive: true },
              limit: 10,
              order: [['createdAt', 'DESC']]
            });
          } else {
            products = await Product.find({ isActive: true }).limit(10).sort({ createdAt: -1 });
          }
        }
        
        // Map products to suggestions
        aiResponse.suggestions = products.map(p => {
          const productData = p.toJSON ? p.toJSON() : p;
          return {
            id: productData.id,
            name: productData.name,
            price: productData.price,
            image: productData.mainImage || productData.image,
            category: productData.category
          };
        });
        
        // Store products in context for intelligent follow-up
        if (aiResponse.suggestions.length > 0) {
          intelligentAI.lastShownProducts.set(chatUserId, aiResponse.suggestions);
          console.log('💾 Stored context:', aiResponse.suggestions.length, 'products for user:', chatUserId);
        }
        
        // Update response text if we found products
        if (aiResponse.suggestions.length > 0) {
          if (products.length < 20 && searchTerm !== message) {
            aiResponse.text += `\n\nFound ${aiResponse.suggestions.length} products matching "${searchTerm}"! 📦`;
          }
        } else {
          aiResponse.text = `I couldn't find products matching "${searchTerm}". Let me show you our popular items instead! 🌟`;
        }
        
      } catch (dbError) {
        console.error('❌ Product search error:', dbError.message);
        console.error('Stack:', dbError.stack);
        aiResponse.suggestions = [];
        aiResponse.text += '\n\n(Having trouble fetching products right now 😅)';
      }
    }

    // Return intelligent response
    res.json({
      success: true,
      reply: aiResponse.text,
      suggestions: aiResponse.suggestions || [],
      action: aiResponse.action,
      personalized: aiResponse.personalized || false
    });

  } catch (error) {
    console.error('❌ Error in intelligent chat:', error);
    res.status(500).json({
      success: false,
      message: 'Chat error',
      reply: "I'm experiencing a technical difficulty. Let me try again! 😅",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * GET /api/offers/active/:productId
 * Get active offers for a product
 */
router.get('/active/:productId', (req, res) => {
  try {
    const { productId } = req.params;
    const { deviceId } = req.query;

    const offerKey = `${productId}-${deviceId || 'guest'}`;
    const offers = activeOffers.get(offerKey) || [];

    res.json({
      success: true,
      offers,
      hasActiveOffer: offers.length > 0,
      lastOffer: offers[offers.length - 1] || null
    });

  } catch (error) {
    console.error('Error getting offers:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get offers'
    });
  }
});

/**
 * DELETE /api/offers/clear/:productId
 * Clear offer history for a product
 */
router.delete('/clear/:productId', (req, res) => {
  try {
    const { productId } = req.params;
    const { deviceId } = req.query;

    const offerKey = `${productId}-${deviceId || 'guest'}`;
    activeOffers.delete(offerKey);

    res.json({
      success: true,
      message: 'Offer history cleared'
    });

  } catch (error) {
    console.error('Error clearing offers:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to clear offers'
    });
  }
});

module.exports = router;
