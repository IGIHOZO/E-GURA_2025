/**
 * Image Upload Service
 * Handles file uploads with local storage, WebP conversion, and multiple sizes
 * Eliminates Base64 storage completely
 */

const multer = require('multer');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

// Configuration
const CONFIG = {
  uploadDir: process.env.UPLOAD_DIR || path.join(__dirname, '../uploads/products'),
  maxFileSize: 5 * 1024 * 1024, // 5MB
  maxFiles: 10,
  allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
  sizes: {
    thumb: { width: 300, height: 300, quality: 75 },
    medium: { width: 900, height: 900, quality: 80 },
    large: { width: 1600, height: 1600, quality: 85 }
  }
};

// Ensure upload directories exist
const ensureDirectories = () => {
  const dirs = [
    CONFIG.uploadDir,
    path.join(CONFIG.uploadDir, 'thumb'),
    path.join(CONFIG.uploadDir, 'medium'),
    path.join(CONFIG.uploadDir, 'large'),
    path.join(CONFIG.uploadDir, 'original')
  ];
  
  dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`📁 Created directory: ${dir}`);
    }
  });
};

ensureDirectories();

// Generate unique filename
const generateFilename = (originalName) => {
  const timestamp = Date.now();
  const hash = crypto.randomBytes(8).toString('hex');
  const ext = path.extname(originalName).toLowerCase();
  return `${timestamp}-${hash}${ext}`;
};

// Multer storage configuration
const storage = multer.memoryStorage();

// File filter - validate mime type
const fileFilter = (req, file, cb) => {
  if (CONFIG.allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Invalid file type: ${file.mimetype}. Allowed: ${CONFIG.allowedMimeTypes.join(', ')}`), false);
  }
};

// Create multer upload instance
const upload = multer({
  storage,
  limits: {
    fileSize: CONFIG.maxFileSize,
    files: CONFIG.maxFiles
  },
  fileFilter
});

/**
 * Process and save image in multiple sizes
 * @param {Buffer} buffer - Image buffer
 * @param {string} originalFilename - Original filename
 * @returns {Object} - URLs for all image sizes
 */
const processAndSaveImage = async (buffer, originalFilename) => {
  const baseFilename = generateFilename(originalFilename);
  const webpFilename = baseFilename.replace(/\.[^.]+$/, '.webp');
  
  const results = {
    original: null,
    thumb: null,
    medium: null,
    large: null,
    metadata: {}
  };

  try {
    // Get original image metadata
    const metadata = await sharp(buffer).metadata();
    results.metadata = {
      width: metadata.width,
      height: metadata.height,
      format: metadata.format,
      size: buffer.length
    };

    console.log(`📸 Processing image: ${originalFilename} (${metadata.width}x${metadata.height}, ${(buffer.length / 1024).toFixed(1)}KB)`);

    // Process each size
    for (const [sizeName, config] of Object.entries(CONFIG.sizes)) {
      const outputPath = path.join(CONFIG.uploadDir, sizeName, webpFilename);
      
      await sharp(buffer)
        .resize(config.width, config.height, {
          fit: 'inside',
          withoutEnlargement: true
        })
        .webp({ quality: config.quality })
        .toFile(outputPath);

      const stat = fs.statSync(outputPath);
      results[sizeName] = `/uploads/products/${sizeName}/${webpFilename}`;
      
      console.log(`   ✅ ${sizeName}: ${(stat.size / 1024).toFixed(1)}KB`);
    }

    // Save original as WebP too (for high-quality needs)
    const originalPath = path.join(CONFIG.uploadDir, 'original', webpFilename);
    await sharp(buffer)
      .webp({ quality: 90 })
      .toFile(originalPath);
    
    results.original = `/uploads/products/original/${webpFilename}`;

    console.log(`   ✅ Image processing complete`);
    return results;

  } catch (error) {
    console.error(`❌ Error processing image ${originalFilename}:`, error);
    throw error;
  }
};

/**
 * Check if a string is a Base64 image
 */
const isBase64Image = (str) => {
  if (!str || typeof str !== 'string') return false;
  return str.startsWith('data:image/');
};

/**
 * Convert Base64 image to file and return URL
 * Used for migration of existing products
 */
const convertBase64ToFile = async (base64String, productId = 'unknown') => {
  if (!isBase64Image(base64String)) {
    return base64String; // Return as-is if not base64
  }

  try {
    // Extract the actual base64 data
    const matches = base64String.match(/^data:image\/(\w+);base64,(.+)$/);
    if (!matches) {
      console.warn('Invalid base64 format');
      return null;
    }

    const format = matches[1];
    const base64Data = matches[2];
    const buffer = Buffer.from(base64Data, 'base64');

    console.log(`🔄 Converting base64 image for product ${productId} (${(buffer.length / 1024).toFixed(1)}KB)`);

    // Process and save the image
    const result = await processAndSaveImage(buffer, `migrated-${productId}.${format}`);
    
    return result;
  } catch (error) {
    console.error(`❌ Error converting base64 for product ${productId}:`, error);
    return null;
  }
};

/**
 * Delete image files for a product
 */
const deleteProductImages = (imageUrl) => {
  if (!imageUrl || !imageUrl.startsWith('/uploads/')) return;

  try {
    // Extract filename from URL
    const filename = path.basename(imageUrl);
    
    // Delete all sizes
    const sizes = ['thumb', 'medium', 'large', 'original'];
    sizes.forEach(size => {
      const filePath = path.join(CONFIG.uploadDir, size, filename);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log(`🗑️ Deleted: ${filePath}`);
      }
    });
  } catch (error) {
    console.error('Error deleting image files:', error);
  }
};

/**
 * Get optimized image URL based on context
 */
const getOptimizedUrl = (imageData, size = 'medium') => {
  if (!imageData) return null;
  
  // If it's already a URL string, return as-is
  if (typeof imageData === 'string') {
    // If it's a base64 string, we can't optimize it
    if (isBase64Image(imageData)) {
      console.warn('⚠️ Base64 image detected - should be migrated');
      return imageData;
    }
    return imageData;
  }
  
  // If it's an object with size URLs
  if (typeof imageData === 'object') {
    return imageData[size] || imageData.medium || imageData.original || null;
  }
  
  return null;
};

/**
 * Middleware to handle single image upload
 */
const uploadSingleImage = (fieldName = 'mainImage') => {
  return async (req, res, next) => {
    upload.single(fieldName)(req, res, async (err) => {
      if (err) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({
            success: false,
            message: `File too large. Maximum size is ${CONFIG.maxFileSize / 1024 / 1024}MB`
          });
        }
        return res.status(400).json({
          success: false,
          message: err.message
        });
      }

      if (req.file) {
        try {
          const processed = await processAndSaveImage(req.file.buffer, req.file.originalname);
          req.processedImage = processed;
          // Set the URL to use (medium size by default)
          req.imageUrl = processed.medium;
        } catch (error) {
          return res.status(500).json({
            success: false,
            message: 'Failed to process image',
            error: error.message
          });
        }
      }

      next();
    });
  };
};

/**
 * Middleware to handle multiple image uploads
 */
const uploadMultipleImages = (fieldName = 'images', maxCount = 10) => {
  return async (req, res, next) => {
    upload.array(fieldName, maxCount)(req, res, async (err) => {
      if (err) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({
            success: false,
            message: `File too large. Maximum size is ${CONFIG.maxFileSize / 1024 / 1024}MB`
          });
        }
        return res.status(400).json({
          success: false,
          message: err.message
        });
      }

      if (req.files && req.files.length > 0) {
        try {
          const processedImages = await Promise.all(
            req.files.map(file => processAndSaveImage(file.buffer, file.originalname))
          );
          req.processedImages = processedImages;
          // Set the URLs to use (medium size by default)
          req.imageUrls = processedImages.map(img => img.medium);
        } catch (error) {
          return res.status(500).json({
            success: false,
            message: 'Failed to process images',
            error: error.message
          });
        }
      }

      next();
    });
  };
};

/**
 * Middleware to handle product images (main + additional)
 */
const uploadProductImages = () => {
  const uploadFields = upload.fields([
    { name: 'mainImage', maxCount: 1 },
    { name: 'images', maxCount: 10 }
  ]);

  return async (req, res, next) => {
    uploadFields(req, res, async (err) => {
      if (err) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({
            success: false,
            message: `File too large. Maximum size is ${CONFIG.maxFileSize / 1024 / 1024}MB`
          });
        }
        return res.status(400).json({
          success: false,
          message: err.message
        });
      }

      try {
        // Process main image
        if (req.files && req.files.mainImage && req.files.mainImage[0]) {
          const mainFile = req.files.mainImage[0];
          const processed = await processAndSaveImage(mainFile.buffer, mainFile.originalname);
          req.mainImageData = processed;
          req.mainImageUrl = processed.medium;
        }

        // Process additional images
        if (req.files && req.files.images && req.files.images.length > 0) {
          const processedImages = await Promise.all(
            req.files.images.map(file => processAndSaveImage(file.buffer, file.originalname))
          );
          req.additionalImagesData = processedImages;
          req.additionalImageUrls = processedImages.map(img => img.medium);
        }

        next();
      } catch (error) {
        return res.status(500).json({
          success: false,
          message: 'Failed to process images',
          error: error.message
        });
      }
    });
  };
};

module.exports = {
  processAndSaveImage,
  convertBase64ToFile,
  deleteProductImages,
  isBase64Image,
  getOptimizedUrl,
  uploadSingleImage,
  uploadMultipleImages,
  uploadProductImages,
  CONFIG
};
