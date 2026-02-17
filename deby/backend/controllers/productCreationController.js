// BRAND NEW PRODUCT CREATION - CLEAN, SIMPLE, NO BUGS
const { Product } = require('../models');

const createProductSimple = async (req, res) => {
  try {
    console.log('=== NEW PRODUCT CREATION ===');
    console.log('Name:', req.body.name);
    console.log('Price:', req.body.price);
    
    // Extract data
    const {
      name,
      description,
      price,
      stockQuantity,
      mainImage,
      category,
      subcategory,
      sizes,
      colors,
      material
    } = req.body;
    
    // Validate
    if (!name || name.length < 3) {
      return res.status(400).json({
        success: false,
        message: 'Product name required (min 3 characters)'
      });
    }
    
    if (!price || parseFloat(price) <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Valid price required (must be greater than 0)'
      });
    }
    
    // Create product object
    const productData = {
      // Required fields
      name: name.trim(),
      price: parseFloat(price),
      stockQuantity: parseInt(stockQuantity) || 0,
      
      // Auto-generated fields
      slug: name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-') + '-' + Date.now(),
      sku: 'SKU-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7).toUpperCase(),
      
      // Optional fields with defaults
      description: description || name,
      mainImage: mainImage || 'https://via.placeholder.com/800x800?text=Product',
      category: category || 'Fashion',
      subcategory: subcategory || null,
      
      // Arrays
      sizes: sizes || [],
      colors: colors || [],
      material: material || [],
      images: [],
      tags: [
        name.toLowerCase(),
        category ? category.toLowerCase() : 'fashion',
        'kigali',
        'rwanda',
        'SEWITHDEBBY'
      ],
      
      // SEO
      seoTitle: `${name} | SEWITHDEBBY Kigali`,
      shortDescription: `Buy ${name} in Kigali, Rwanda. Quality products, fast delivery.`,
      
      // Status flags
      isActive: true,
      isFeatured: false,
      isNew: true,
      isSale: false,
      isBestSeller: false,
      
      // Numbers
      averageRating: 0,
      totalReviews: 0,
      viewCount: 0,
      salesCount: 0,
      lowStockThreshold: 5,
      discountPercentage: 0
    };
    
    console.log('Creating product:', productData.name);
    
    // Save to database
    const product = await Product.create(productData);
    
    console.log('✅ Product created successfully!');
    console.log('ID:', product.id);
    console.log('Slug:', product.slug);
    
    // Return success
    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      product: {
        id: product.id,
        name: product.name,
        slug: product.slug,
        price: product.price,
        stockQuantity: product.stockQuantity,
        category: product.category,
        mainImage: product.mainImage
      }
    });
    
  } catch (error) {
    console.error('❌ Error creating product:');
    console.error(error.message);
    console.error(error.stack);
    
    res.status(500).json({
      success: false,
      message: 'Failed to create product: ' + error.message
    });
  }
};

module.exports = {
  createProductSimple
};
