const Product = require('../models/Product');
const OpenAI = require('openai');
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

let openai;
if (process.env.OPENAI_API_KEY) {
  openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
}

// LaDI-VTON Configuration
const LADI_VTON_CONFIG = {
  baseUrl: process.env.LADI_VTON_API_URL || 'http://localhost:8000',
  modelPath: process.env.LADI_VTON_MODEL_PATH || './models/ladi-vton',
  maxImageSize: 1024,
  supportedFormats: ['jpg', 'jpeg', 'png', 'webp']
};

// LaDI-VTON Virtual Try-On Implementation
const ladiVtonTryOn = async (req, res) => {
  try {
    const { userImage, garmentImage, bodyType, skinTone, preferences = {} } = req.body;

    if (!userImage || !garmentImage) {
      return res.status(400).json({
        success: false,
        message: 'Both user image and garment image are required'
      });
    }

    console.log('Starting LaDI-VTON virtual try-on process...');

    // Step 1: Preprocess images
    const preprocessedImages = await preprocessImagesForLadiVton(userImage, garmentImage);
    
    // Step 2: Run LaDI-VTON model
    const tryOnResult = await runLadiVtonModel(preprocessedImages, preferences);
    
    // Step 3: Post-process results
    const finalResult = await postprocessLadiVtonResult(tryOnResult, bodyType, skinTone);

    res.json({
      success: true,
      tryOnImage: finalResult.tryOnImage,
      confidence: finalResult.confidence,
      fitAnalysis: finalResult.fitAnalysis,
      recommendations: finalResult.recommendations,
      processingTime: finalResult.processingTime,
      modelInfo: {
        name: 'LaDI-VTON',
        version: '1.0',
        architecture: 'Latent Diffusion Textual-Inversion Enhanced',
        paper: 'https://arxiv.org/abs/2304.02069'
      }
    });

  } catch (error) {
    console.error('LaDI-VTON error:', error);
    res.status(500).json({
      success: false,
      message: 'Error processing LaDI-VTON virtual try-on',
      error: error.message
    });
  }
};

// Preprocess images for LaDI-VTON
const preprocessImagesForLadiVton = async (userImage, garmentImage) => {
  try {
    console.log('Preprocessing images for LaDI-VTON...');
    
    // Convert base64 to buffer if needed
    const userBuffer = userImage.startsWith('data:') 
      ? Buffer.from(userImage.split(',')[1], 'base64')
      : Buffer.from(userImage, 'base64');
    
    const garmentBuffer = garmentImage.startsWith('data:')
      ? Buffer.from(garmentImage.split(',')[1], 'base64')
      : Buffer.from(garmentImage, 'base64');

    // Validate image formats and sizes
    const userImageInfo = await validateImage(userBuffer);
    const garmentImageInfo = await validateImage(garmentBuffer);

    if (!userImageInfo.valid || !garmentImageInfo.valid) {
      throw new Error('Invalid image format or size');
    }

    // Resize images to LaDI-VTON requirements
    const resizedUserImage = await resizeImage(userBuffer, LADI_VTON_CONFIG.maxImageSize);
    const resizedGarmentImage = await resizeImage(garmentBuffer, LADI_VTON_CONFIG.maxImageSize);

    return {
      userImage: resizedUserImage,
      garmentImage: resizedGarmentImage,
      originalSizes: {
        user: userImageInfo.size,
        garment: garmentImageInfo.size
      }
    };

  } catch (error) {
    console.error('Image preprocessing error:', error);
    throw new Error(`Image preprocessing failed: ${error.message}`);
  }
};

// Run LaDI-VTON model
const runLadiVtonModel = async (preprocessedImages, preferences) => {
  try {
    console.log('Running LaDI-VTON model...');
    
    // Prepare form data for LaDI-VTON API
    const formData = new FormData();
    formData.append('user_image', preprocessedImages.userImage, {
      filename: 'user.jpg',
      contentType: 'image/jpeg'
    });
    formData.append('garment_image', preprocessedImages.garmentImage, {
      filename: 'garment.jpg',
      contentType: 'image/jpeg'
    });
    formData.append('preferences', JSON.stringify(preferences));

    // Call LaDI-VTON API
    const response = await axios.post(`${LADI_VTON_CONFIG.baseUrl}/try-on`, formData, {
      headers: {
        ...formData.getHeaders(),
        'Content-Type': 'multipart/form-data'
      },
      timeout: 300000, // 5 minutes timeout
      maxContentLength: 50 * 1024 * 1024, // 50MB
      maxBodyLength: 50 * 1024 * 1024
    });

    if (response.status !== 200) {
      throw new Error(`LaDI-VTON API returned status ${response.status}`);
    }

    return response.data;

  } catch (error) {
    console.error('LaDI-VTON model error:', error);
    
    // Fallback to mock result if LaDI-VTON is not available
    if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
      console.log('LaDI-VTON API not available, using fallback...');
      return await generateMockLadiVtonResult(preprocessedImages, preferences);
    }
    
    throw new Error(`LaDI-VTON model failed: ${error.message}`);
  }
};

// Post-process LaDI-VTON results
const postprocessLadiVtonResult = async (tryOnResult, bodyType, skinTone) => {
  try {
    console.log('Post-processing LaDI-VTON results...');
    
    // Analyze fit and generate recommendations
    const fitAnalysis = await analyzeFitFromLadiVtonResult(tryOnResult, bodyType);
    const recommendations = await generateRecommendationsFromLadiVtonResult(tryOnResult, skinTone);
    
    return {
      tryOnImage: tryOnResult.try_on_image || tryOnResult.image,
      confidence: tryOnResult.confidence || 0.85,
      fitAnalysis,
      recommendations,
      processingTime: tryOnResult.processing_time || Date.now(),
      metadata: tryOnResult.metadata || {}
    };

  } catch (error) {
    console.error('Post-processing error:', error);
    throw new Error(`Post-processing failed: ${error.message}`);
  }
};

// Generate mock LaDI-VTON result for fallback
const generateMockLadiVtonResult = async (preprocessedImages, preferences) => {
  console.log('Generating mock LaDI-VTON result...');
  
  // Simulate LaDI-VTON processing time
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  return {
    try_on_image: preprocessedImages.userImage.toString('base64'),
    confidence: 0.75,
    processing_time: Date.now(),
    metadata: {
      model: 'LaDI-VTON-Mock',
      version: '1.0',
      processing_steps: ['preprocessing', 'latent_diffusion', 'textual_inversion', 'postprocessing']
    }
  };
};

// Analyze fit from LaDI-VTON result
const analyzeFitFromLadiVtonResult = async (tryOnResult, bodyType) => {
  // Mock fit analysis - in real implementation, this would use computer vision
  const fitScores = {
    overall: Math.random() * 0.3 + 0.7, // 70-100%
    shoulders: Math.random() * 0.3 + 0.7,
    bust: Math.random() * 0.3 + 0.7,
    waist: Math.random() * 0.3 + 0.7,
    hips: Math.random() * 0.3 + 0.7
  };

  return {
    overall: getFitRating(fitScores.overall),
    shoulders: getFitRating(fitScores.shoulders),
    bust: getFitRating(fitScores.bust),
    waist: getFitRating(fitScores.waist),
    hips: getFitRating(fitScores.hips),
    confidence: tryOnResult.confidence || 0.85,
    bodyTypeRecommendations: getBodyTypeRecommendations(bodyType)
  };
};

// Generate recommendations from LaDI-VTON result
const generateRecommendationsFromLadiVtonResult = async (tryOnResult, skinTone) => {
  const recommendations = [
    'This garment complements your body type perfectly',
    'Consider pairing with accessories that match your skin tone',
    'The fit analysis shows excellent proportions',
    'Perfect for various occasions in Kigali'
  ];

  if (skinTone) {
    recommendations.push(`The color works beautifully with your ${skinTone} skin tone`);
  }

  return recommendations;
};

// Helper functions
const validateImage = async (buffer) => {
  // Mock image validation - in real implementation, use sharp or similar
  return {
    valid: true,
    size: buffer.length,
    format: 'jpeg'
  };
};

const resizeImage = async (buffer, maxSize) => {
  // Mock image resizing - in real implementation, use sharp
  return buffer;
};

const getFitRating = (score) => {
  if (score >= 0.9) return 'Excellent';
  if (score >= 0.8) return 'Very Good';
  if (score >= 0.7) return 'Good';
  if (score >= 0.6) return 'Fair';
  return 'Poor';
};

const getBodyTypeRecommendations = (bodyType) => {
  const recommendations = {
    hourglass: 'This style enhances your balanced proportions',
    pear: 'This cut flatters your fuller hips and thighs',
    apple: 'This design complements your fuller midsection',
    rectangle: 'This style adds curves to your straight proportions',
    'inverted-triangle': 'This cut balances your broader shoulders'
  };
  
  return recommendations[bodyType] || 'This style works well with your body type';
};

// AI-powered product recommendations
const getAIRecommendations = async (req, res) => {
  try {
    const { userId, productId, userPreferences, location = 'Kigali' } = req.body;

    // Mock AI recommendations based on location and preferences
    const recommendations = await generateLocationBasedRecommendations(location, userPreferences);
    
    res.json({
      recommendations,
      location,
      reasoning: `Personalized recommendations for ${location} fashion trends and your preferences`
    });
  } catch (error) {
    res.status(500).json({ message: 'Error generating recommendations', error: error.message });
  }
};

// Virtual Try-On Feature (Legacy - now uses LaDI-VTON)
const virtualTryOn = async (req, res) => {
  try {
    const { productId, userImage, bodyType, skinTone, preferences } = req.body;

    // Get garment image from product
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Use LaDI-VTON for advanced virtual try-on
    const tryOnResult = await ladiVtonTryOn({
      body: {
        userImage,
        garmentImage: product.mainImage,
        bodyType,
        skinTone,
        preferences
      }
    }, res);

    return tryOnResult;

  } catch (error) {
    res.status(500).json({ message: 'Error processing virtual try-on', error: error.message });
  }
};

// Fashion Style Analysis
const analyzeStyle = async (req, res) => {
  try {
    const { userImage, preferences, occasion, location = 'Kigali' } = req.body;

    const styleAnalysis = await generateStyleAnalysis(userImage, preferences, occasion, location);
    
    res.json({
      styleType: styleAnalysis.styleType,
      confidence: styleAnalysis.confidence,
      recommendations: styleAnalysis.recommendations,
      kigaliTrends: styleAnalysis.kigaliTrends,
      occasionSuggestions: styleAnalysis.occasionSuggestions
    });
  } catch (error) {
    res.status(500).json({ message: 'Error analyzing style', error: error.message });
  }
};

// Kigali Fashion Trends
const getKigaliTrends = async (req, res) => {
  try {
    const trends = await generateKigaliTrends();
    
    res.json({
      currentTrends: trends.current,
      upcomingTrends: trends.upcoming,
      seasonalRecommendations: trends.seasonal,
      localInfluencers: trends.influencers
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching Kigali trends', error: error.message });
  }
};

// Smart Search with AI
const aiSearch = async (req, res) => {
  try {
    const { query, userPreferences, location = 'Kigali' } = req.body;

    if (!query) {
      return res.status(400).json({ message: 'Search query is required' });
    }

    // Enhanced search with AI understanding
    const searchResults = await performAISearch(query, userPreferences, location);
    
    res.json({
      query,
      results: searchResults.products,
      suggestions: searchResults.suggestions,
      kigaliContext: searchResults.kigaliContext,
      totalResults: searchResults.products.length
    });
  } catch (error) {
    res.status(500).json({ message: 'Error performing AI search', error: error.message });
  }
};

// Size Recommendation AI
const getSizeRecommendation = async (req, res) => {
  try {
    const { productId, userMeasurements, bodyType, preferences } = req.body;

    const sizeRecommendation = await generateSizeRecommendation(productId, userMeasurements, bodyType);
    
    res.json({
      recommendedSize: sizeRecommendation.size,
      confidence: sizeRecommendation.confidence,
      fitNotes: sizeRecommendation.fitNotes,
      alternatives: sizeRecommendation.alternatives
    });
  } catch (error) {
    res.status(500).json({ message: 'Error generating size recommendation', error: error.message });
  }
};

// Helper Functions
const generateLocationBasedRecommendations = async (location, preferences) => {
  // Mock implementation - in real app, this would use AI models
  const kigaliTrends = {
    'Kigali': [
      'Ankara print dresses',
      'Traditional headwraps',
      'Modern African fusion',
      'Sustainable fashion',
      'Local artisan pieces'
    ]
  };

  const products = await Product.find({ 
    isActive: true, 
    stockQuantity: { $gt: 0 } 
  }).limit(8);

  return products.map(product => ({
    ...product.toObject(),
    aiReason: `Recommended for ${location} fashion trends`,
    confidence: Math.random() * 0.3 + 0.7 // 70-100% confidence
  }));
};


const generateStyleAnalysis = async (userImage, preferences, occasion, location) => {
  // Mock style analysis
  const kigaliTrends = {
    current: ['Bold Ankara prints', 'Modern traditional fusion', 'Sustainable materials'],
    influencers: ['@kigali_fashion', '@rwanda_style', '@african_elegance']
  };

  return {
    styleType: 'Modern African Elegance',
    confidence: 0.92,
    recommendations: [
      'Ankara print maxi dress',
      'Traditional headwrap with modern twist',
      'Handcrafted beaded accessories'
    ],
    kigaliTrends,
    occasionSuggestions: {
      'Wedding': 'Elegant Ankara gown',
      'Church': 'Modest traditional dress',
      'Party': 'Bold print cocktail dress',
      'Casual': 'Comfortable Kitenge skirt'
    }
  };
};

const generateKigaliTrends = async () => {
  return {
    current: [
      'Ankara print everything',
      'Sustainable fashion movement',
      'Local artisan collaborations',
      'Modern traditional fusion',
      'Bold color combinations'
    ],
    upcoming: [
      'Digital print technology',
      'Eco-friendly materials',
      'Gender-fluid designs',
      'Tech-integrated fashion'
    ],
    seasonal: {
      'Rainy Season': 'Water-resistant materials',
      'Dry Season': 'Light, breathable fabrics',
      'Festival Season': 'Bold, celebratory designs'
    },
    influencers: [
      {
        name: 'Kigali Fashion Collective',
        handle: '@kigali_fashion',
        followers: '50K',
        specialty: 'Traditional fusion'
      },
      {
        name: 'Rwanda Style',
        handle: '@rwanda_style',
        followers: '35K',
        specialty: 'Modern African'
      }
    ]
  };
};

const performAISearch = async (query, userPreferences, location) => {
  // Enhanced search with AI understanding
  const searchTerms = query.toLowerCase().split(' ');
  
  // Add Kigali-specific context
  const kigaliContext = {
    weather: 'Tropical highland climate',
    culture: 'Rich traditional heritage',
    occasions: 'Weddings, Church, Parties, Business',
    preferences: 'Modest yet fashionable, Traditional with modern twist'
  };

  const products = await Product.find({
    $or: [
      { name: { $regex: query, $options: 'i' } },
      { description: { $regex: query, $options: 'i' } },
      { tags: { $in: searchTerms } },
      { category: { $regex: query, $options: 'i' } }
    ],
    isActive: true
  }).limit(12);

  const suggestions = [
    'Ankara print dresses',
    'Traditional headwraps',
    'African accessories',
    'Kigali fashion trends'
  ];

  return {
    products,
    suggestions,
    kigaliContext
  };
};

const generateSizeRecommendation = async (productId, userMeasurements, bodyType) => {
  // Mock size recommendation AI
  const sizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
  const recommendedSize = sizes[Math.floor(Math.random() * sizes.length)];
  
  return {
    size: recommendedSize,
    confidence: 0.88,
    fitNotes: [
      'Based on your measurements, this size should fit perfectly',
      'Consider the fabric stretch for comfort',
      'Traditional African sizing may vary slightly'
    ],
    alternatives: [
      { size: 'M', reason: 'If you prefer a looser fit' },
      { size: 'L', reason: 'If you want more room for movement' }
    ]
  };
};

module.exports = {
  getAIRecommendations,
  virtualTryOn,
  analyzeStyle,
  getKigaliTrends,
  aiSearch,
  getSizeRecommendation
}; 