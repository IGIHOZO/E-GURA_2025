/**
 * Advanced Media Upload Middleware
 * Supports images (JPG, PNG, WebP) and videos (MP4, AVI, WebM)
 * with automatic compression and optimization
 */

const multer = require('multer');
const sharp = require('sharp');
const ffmpeg = require('fluent-ffmpeg');
const cloudinary = require('cloudinary').v2;
const path = require('path');
const fs = require('fs');
const { promisify } = require('util');

const unlinkAsync = promisify(fs.unlink);

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'demo',
  api_key: process.env.CLOUDINARY_API_KEY || 'demo',
  api_secret: process.env.CLOUDINARY_API_SECRET || 'demo'
});

// Temporary storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads/temp');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1E9)}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

// File filter for images and videos
const fileFilter = (req, file, cb) => {
  const allowedImageTypes = /jpeg|jpg|png|webp|gif/;
  const allowedVideoTypes = /mp4|avi|webm|mov|mkv/;
  
  const extname = path.extname(file.originalname).toLowerCase();
  const mimetype = file.mimetype;
  
  if (mimetype.startsWith('image/') && allowedImageTypes.test(extname.slice(1))) {
    file.mediaType = 'image';
    cb(null, true);
  } else if (mimetype.startsWith('video/') && allowedVideoTypes.test(extname.slice(1))) {
    file.mediaType = 'video';
    cb(null, true);
  } else {
    cb(new Error(`Unsupported file type: ${extname}. Allowed: jpg, png, webp, gif, mp4, avi, webm`), false);
  }
};

// Multer upload configuration
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB limit (for videos)
  },
  fileFilter: fileFilter
});

/**
 * Compress and optimize image
 * Converts to WebP for best compression and modern format support
 */
async function compressImage(inputPath, quality = 80) {
  try {
    console.log('📸 Compressing image:', inputPath);
    
    const outputPath = inputPath.replace(path.extname(inputPath), '.webp');
    
    // Get image metadata
    const metadata = await sharp(inputPath).metadata();
    console.log(`  Original: ${metadata.width}x${metadata.height}, ${metadata.format}`);
    
    // Compress and convert to WebP
    await sharp(inputPath)
      .resize({
        width: Math.min(metadata.width, 1920), // Max width 1920px
        height: Math.min(metadata.height, 1920),
        fit: 'inside',
        withoutEnlargement: true
      })
      .webp({
        quality: quality,
        effort: 6, // Maximum compression effort
        smartSubsample: true
      })
      .toFile(outputPath);
    
    const originalSize = fs.statSync(inputPath).size;
    const compressedSize = fs.statSync(outputPath).size;
    const reduction = ((1 - compressedSize / originalSize) * 100).toFixed(1);
    
    console.log(`  ✅ Compressed: ${(originalSize / 1024).toFixed(1)}KB → ${(compressedSize / 1024).toFixed(1)}KB (${reduction}% reduction)`);
    
    return outputPath;
  } catch (error) {
    console.error('❌ Image compression error:', error);
    throw error;
  }
}

/**
 * Generate multiple image sizes (thumbnail, medium, large)
 * for responsive loading
 */
async function generateResponsiveImages(inputPath) {
  try {
    const sizes = {
      thumbnail: { width: 200, quality: 70 },
      medium: { width: 800, quality: 80 },
      large: { width: 1920, quality: 85 }
    };
    
    const results = {};
    
    for (const [sizeName, config] of Object.entries(sizes)) {
      const outputPath = inputPath.replace(
        path.extname(inputPath),
        `-${sizeName}.webp`
      );
      
      await sharp(inputPath)
        .resize({
          width: config.width,
          fit: 'inside',
          withoutEnlargement: true
        })
        .webp({
          quality: config.quality,
          effort: 6
        })
        .toFile(outputPath);
      
      results[sizeName] = outputPath;
    }
    
    console.log('  ✅ Generated responsive images:', Object.keys(results).join(', '));
    return results;
  } catch (error) {
    console.error('❌ Error generating responsive images:', error);
    throw error;
  }
}

/**
 * Compress and optimize video
 * Converts to MP4 with H.264 codec for best compatibility
 */
async function compressVideo(inputPath, quality = 'medium') {
  return new Promise((resolve, reject) => {
    console.log('🎥 Compressing video:', inputPath);
    
    const outputPath = inputPath.replace(path.extname(inputPath), '-compressed.mp4');
    
    // Quality settings
    const qualitySettings = {
      low: { videoBitrate: '500k', audioBitrate: '96k', crf: 28 },
      medium: { videoBitrate: '1000k', audioBitrate: '128k', crf: 23 },
      high: { videoBitrate: '2000k', audioBitrate: '192k', crf: 18 }
    };
    
    const settings = qualitySettings[quality] || qualitySettings.medium;
    
    ffmpeg(inputPath)
      .videoCodec('libx264')
      .audioCodec('aac')
      .videoBitrate(settings.videoBitrate)
      .audioBitrate(settings.audioBitrate)
      .outputOptions([
        `-crf ${settings.crf}`,
        '-preset fast',
        '-movflags +faststart', // Enable fast start for web
        '-pix_fmt yuv420p' // Ensure compatibility
      ])
      .format('mp4')
      .on('start', (commandLine) => {
        console.log('  FFmpeg command:', commandLine);
      })
      .on('progress', (progress) => {
        if (progress.percent) {
          console.log(`  Progress: ${progress.percent.toFixed(1)}%`);
        }
      })
      .on('end', () => {
        const originalSize = fs.statSync(inputPath).size;
        const compressedSize = fs.statSync(outputPath).size;
        const reduction = ((1 - compressedSize / originalSize) * 100).toFixed(1);
        
        console.log(`  ✅ Compressed: ${(originalSize / 1024 / 1024).toFixed(1)}MB → ${(compressedSize / 1024 / 1024).toFixed(1)}MB (${reduction}% reduction)`);
        resolve(outputPath);
      })
      .on('error', (err) => {
        console.error('  ❌ Video compression error:', err);
        reject(err);
      })
      .save(outputPath);
  });
}

/**
 * Generate video thumbnail
 */
async function generateVideoThumbnail(videoPath) {
  return new Promise((resolve, reject) => {
    const thumbnailPath = videoPath.replace(path.extname(videoPath), '-thumb.jpg');
    
    ffmpeg(videoPath)
      .screenshots({
        timestamps: ['10%'],
        filename: path.basename(thumbnailPath),
        folder: path.dirname(thumbnailPath),
        size: '640x?'
      })
      .on('end', async () => {
        // Convert thumbnail to WebP for consistency
        const webpPath = await compressImage(thumbnailPath, 75);
        resolve(webpPath);
      })
      .on('error', reject);
  });
}

/**
 * Upload file to Cloudinary
 */
async function uploadToCloudinary(filePath, resourceType = 'image', folder = 'egura-products') {
  try {
    console.log(`☁️  Uploading to Cloudinary: ${path.basename(filePath)}`);
    
    const result = await cloudinary.uploader.upload(filePath, {
      folder: folder,
      resource_type: resourceType,
      quality: 'auto:best',
      fetch_format: 'auto',
      flags: 'progressive'
    });
    
    console.log(`  ✅ Uploaded: ${result.secure_url}`);
    return result;
  } catch (error) {
    console.error('❌ Cloudinary upload error:', error);
    throw error;
  }
}

/**
 * Process uploaded media (main function)
 */
async function processMedia(file) {
  const results = {
    original: null,
    compressed: null,
    thumbnail: null,
    responsive: {},
    metadata: {}
  };
  
  try {
    if (file.mediaType === 'image') {
      // Process image
      console.log('🖼️  Processing image:', file.originalname);
      
      // Compress main image
      const compressedPath = await compressImage(file.path);
      
      // Generate responsive sizes
      const responsiveImages = await generateResponsiveImages(file.path);
      
      // Upload to Cloudinary
      const mainUpload = await uploadToCloudinary(compressedPath, 'image');
      results.compressed = mainUpload.secure_url;
      results.metadata = {
        width: mainUpload.width,
        height: mainUpload.height,
        format: mainUpload.format,
        size: mainUpload.bytes
      };
      
      // Upload responsive sizes
      for (const [sizeName, imagePath] of Object.entries(responsiveImages)) {
        const upload = await uploadToCloudinary(imagePath, 'image');
        results.responsive[sizeName] = upload.secure_url;
        await unlinkAsync(imagePath);
      }
      
      // Clean up
      await unlinkAsync(file.path);
      await unlinkAsync(compressedPath);
      
    } else if (file.mediaType === 'video') {
      // Process video
      console.log('🎬 Processing video:', file.originalname);
      
      // Compress video
      const compressedPath = await compressVideo(file.path, 'medium');
      
      // Generate thumbnail
      const thumbnailPath = await generateVideoThumbnail(compressedPath);
      
      // Upload video to Cloudinary
      const videoUpload = await uploadToCloudinary(compressedPath, 'video');
      results.compressed = videoUpload.secure_url;
      results.metadata = {
        duration: videoUpload.duration,
        width: videoUpload.width,
        height: videoUpload.height,
        format: videoUpload.format,
        size: videoUpload.bytes
      };
      
      // Upload thumbnail
      const thumbUpload = await uploadToCloudinary(thumbnailPath, 'image');
      results.thumbnail = thumbUpload.secure_url;
      
      // Clean up
      await unlinkAsync(file.path);
      await unlinkAsync(compressedPath);
      await unlinkAsync(thumbnailPath);
    }
    
    console.log('✅ Media processing complete');
    return results;
    
  } catch (error) {
    console.error('❌ Media processing error:', error);
    // Clean up on error
    try {
      if (fs.existsSync(file.path)) await unlinkAsync(file.path);
    } catch (cleanupError) {
      console.error('Cleanup error:', cleanupError);
    }
    throw error;
  }
}

/**
 * Middleware: Upload single media file
 */
const uploadSingleMedia = async (req, res, next) => {
  upload.single('media')(req, res, async (err) => {
    if (err) {
      return res.status(400).json({
        success: false,
        message: err.message
      });
    }
    
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }
    
    try {
      const processed = await processMedia(req.file);
      req.processedMedia = processed;
      next();
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to process media',
        error: error.message
      });
    }
  });
};

/**
 * Middleware: Upload multiple media files
 */
const uploadMultipleMedia = async (req, res, next) => {
  upload.array('media', 10)(req, res, async (err) => {
    if (err) {
      return res.status(400).json({
        success: false,
        message: err.message
      });
    }
    
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No files uploaded'
      });
    }
    
    try {
      const processedFiles = await Promise.all(
        req.files.map(file => processMedia(file))
      );
      req.processedMedia = processedFiles;
      next();
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to process media',
        error: error.message
      });
    }
  });
};

module.exports = {
  uploadSingleMedia,
  uploadMultipleMedia,
  compressImage,
  compressVideo,
  generateResponsiveImages,
  generateVideoThumbnail,
  uploadToCloudinary,
  cloudinary
};
