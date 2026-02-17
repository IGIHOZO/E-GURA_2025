/**
 * Product Upload Routes
 * Handles product creation/update with file uploads (NO Base64)
 * All images are processed, optimized, and stored as files
 */

const express = require('express');
const router = express.Router();
const { Product } = require('../models');
const { adminMiddleware } = require('../middleware/authMiddleware');
const { invalidateProductData } = require('../services/cacheInvalidation');
const {
  uploadProductImages,
  uploadSingleImage,
  isBase64Image,
  deleteProductImages
} = require('../services/imageUploadService');

// Apply admin middleware to all routes
router.use(adminMiddleware);

/**
 * POST /api/products/upload
 * Create a new product with file uploads
 */
router.post('/', uploadProductImages(), async (req, res) => {
  const startTime = Date.now();
  
  try {
    console.log('📦 Creating product with file upload...');
    console.log(`   Request size: ${JSON.stringify(req.body).length} bytes`);
    
    // Parse product data from form data
    let productData;
    try {
      productData = typeof req.body.productData === 'string' 
        ? JSON.parse(req.body.productData) 
        : req.body;
    } catch (e) {
      productData = req.body;
    }

    // Validate required fields
    if (!productData.name) {
      return res.status(400).json({
        success: false,
        message: 'Product name is required'
      });
    }

    if (!productData.price || parseFloat(productData.price) <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Valid product price is required'
      });
    }

    // Check for main image (from upload or existing URL)
    let mainImageUrl = req.mainImageUrl || productData.mainImage;
    
    // Reject base64 images
    if (isBase64Image(mainImageUrl)) {
      return res.status(400).json({
        success: false,
        message: 'Base64 images are not allowed. Please upload image files.'
      });
    }

    if (!mainImageUrl) {
      return res.status(400).json({
        success: false,
        message: 'Product main image is required. Upload an image file.'
      });
    }

    // Build additional images array
    let additionalImages = [];
    if (req.additionalImageUrls && req.additionalImageUrls.length > 0) {
      additionalImages = req.additionalImageUrls;
    } else if (productData.images && Array.isArray(productData.images)) {
      // Filter out any base64 images
      additionalImages = productData.images.filter(img => !isBase64Image(img));
    }

    // Generate unique slug
    let baseSlug = productData.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    
    let slug = baseSlug;
    let counter = 1;
    while (await Product.findOne({ where: { slug } })) {
      slug = `${baseSlug}-${counter}`;
      counter++;
      if (counter > 100) break;
    }

    // Generate unique SKU
    const sku = productData.sku || `SKU-${Date.now()}-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;

    // Build final product data
    const finalProductData = {
      name: productData.name,
      slug,
      description: productData.description || productData.name,
      shortDescription: productData.shortDescription || `Quality ${productData.category || 'product'} from E-Gura Store`,
      price: parseFloat(productData.price),
      originalPrice: productData.originalPrice ? parseFloat(productData.originalPrice) : null,
      discountPercentage: productData.discountPercentage ? parseFloat(productData.discountPercentage) : 0,
      mainImage: mainImageUrl,
      images: additionalImages,
      video: productData.video || null,
      category: productData.category || 'Fashion',
      subcategory: productData.subcategory || null,
      brand: productData.brand || 'E-Gura Store',
      tags: productData.tags || [productData.name?.toLowerCase(), 'kigali', 'rwanda'],
      gender: productData.gender || 'unisex',
      ageGroup: productData.ageGroup || 'adult',
      material: productData.material || [],
      care: productData.care || [],
      sizes: productData.sizes || [],
      colors: productData.colors || [],
      variants: productData.variants || [],
      stockQuantity: parseInt(productData.stockQuantity) || 0,
      lowStockThreshold: parseInt(productData.lowStockThreshold) || 5,
      sku,
      isActive: productData.isActive !== false,
      isFeatured: productData.isFeatured === true,
      isNew: productData.isNew !== false,
      isSale: productData.isSale === true,
      seoTitle: productData.seoTitle || `${productData.name} | E-Gura Store`,
      seoDescription: productData.seoDescription || productData.shortDescription,
      seoKeywords: productData.seoKeywords || [],
      bargainEnabled: productData.bargainEnabled !== false,
      minBargainPrice: productData.minBargainPrice ? parseFloat(productData.minBargainPrice) : null,
      maxBargainDiscount: productData.maxBargainDiscount || 25,
      bargainStrategy: productData.bargainStrategy || 'balanced'
    };

    // Create product
    const product = await Product.create(finalProductData);
    
    // Invalidate cache
    await invalidateProductData(product.id);

    const processingTime = Date.now() - startTime;
    console.log(`✅ Product created: ${product.id} (${processingTime}ms)`);

    res.status(201).json({
      success: true,
      data: product,
      message: 'Product created successfully with optimized images',
      processingTime: `${processingTime}ms`
    });

  } catch (error) {
    console.error('❌ Error creating product:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to create product',
      error: error.message
    });
  }
});

/**
 * PUT /api/products/upload/:id
 * Update a product with file uploads
 */
router.put('/:id', uploadProductImages(), async (req, res) => {
  const startTime = Date.now();
  
  try {
    const { id } = req.params;
    console.log(`📝 Updating product ${id} with file upload...`);

    // Find existing product
    const product = await Product.findByPk(id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Parse update data
    let updateData;
    try {
      updateData = typeof req.body.productData === 'string'
        ? JSON.parse(req.body.productData)
        : req.body;
    } catch (e) {
      updateData = req.body;
    }

    // Handle main image update
    if (req.mainImageUrl) {
      // Delete old image if it's a local file
      if (product.mainImage && product.mainImage.startsWith('/uploads/')) {
        deleteProductImages(product.mainImage);
      }
      updateData.mainImage = req.mainImageUrl;
    } else if (updateData.mainImage && isBase64Image(updateData.mainImage)) {
      return res.status(400).json({
        success: false,
        message: 'Base64 images are not allowed. Please upload image files.'
      });
    }

    // Handle additional images update
    if (req.additionalImageUrls && req.additionalImageUrls.length > 0) {
      // Merge with existing non-base64 images or replace
      const existingImages = (product.images || []).filter(img => !isBase64Image(img));
      updateData.images = [...existingImages, ...req.additionalImageUrls];
    } else if (updateData.images) {
      // Filter out any base64 images
      updateData.images = updateData.images.filter(img => !isBase64Image(img));
    }

    // Update slug if name changed
    if (updateData.name && updateData.name !== product.name) {
      updateData.slug = updateData.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
    }

    // Ensure numeric fields are properly typed
    if (updateData.price) updateData.price = parseFloat(updateData.price);
    if (updateData.originalPrice) updateData.originalPrice = parseFloat(updateData.originalPrice);
    if (updateData.stockQuantity) updateData.stockQuantity = parseInt(updateData.stockQuantity);

    // Update product
    await product.update(updateData);

    // Invalidate cache
    await invalidateProductData(product.id);

    const processingTime = Date.now() - startTime;
    console.log(`✅ Product updated: ${product.id} (${processingTime}ms)`);

    res.json({
      success: true,
      data: product,
      message: 'Product updated successfully',
      processingTime: `${processingTime}ms`
    });

  } catch (error) {
    console.error('❌ Error updating product:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to update product',
      error: error.message
    });
  }
});

/**
 * POST /api/products/upload/image
 * Upload a single image (returns URL for use in forms)
 */
router.post('/image', uploadSingleImage('image'), async (req, res) => {
  try {
    if (!req.processedImage) {
      return res.status(400).json({
        success: false,
        message: 'No image uploaded'
      });
    }

    res.json({
      success: true,
      data: {
        url: req.imageUrl,
        thumb: req.processedImage.thumb,
        medium: req.processedImage.medium,
        large: req.processedImage.large,
        original: req.processedImage.original,
        metadata: req.processedImage.metadata
      },
      message: 'Image uploaded successfully'
    });

  } catch (error) {
    console.error('❌ Error uploading image:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload image',
      error: error.message
    });
  }
});

module.exports = router;
