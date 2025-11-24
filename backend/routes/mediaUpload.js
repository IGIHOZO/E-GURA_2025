/**
 * Media Upload Routes
 * Handles image and video uploads with compression
 */

const express = require('express');
const router = express.Router();
const { uploadSingleMedia, uploadMultipleMedia } = require('../middleware/advancedMediaUpload');

/**
 * POST /api/media/upload/single
 * Upload single image or video
 */
router.post('/upload/single', uploadSingleMedia, async (req, res) => {
  try {
    res.json({
      success: true,
      message: 'Media uploaded successfully',
      data: req.processedMedia
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Upload failed',
      error: error.message
    });
  }
});

/**
 * POST /api/media/upload/multiple
 * Upload multiple images or videos
 */
router.post('/upload/multiple', uploadMultipleMedia, async (req, res) => {
  try {
    res.json({
      success: true,
      message: `${req.processedMedia.length} files uploaded successfully`,
      data: req.processedMedia
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Upload failed',
      error: error.message
    });
  }
});

/**
 * POST /api/media/upload/product-gallery
 * Upload product images and videos for gallery
 */
router.post('/upload/product-gallery', uploadMultipleMedia, async (req, res) => {
  try {
    const images = [];
    const videos = [];
    
    req.processedMedia.forEach(media => {
      if (media.metadata.format && !['mp4', 'webm', 'avi'].includes(media.metadata.format.toLowerCase())) {
        images.push({
          url: media.compressed,
          thumbnail: media.responsive?.thumbnail || media.compressed,
          medium: media.responsive?.medium || media.compressed,
          large: media.responsive?.large || media.compressed,
          width: media.metadata.width,
          height: media.metadata.height
        });
      } else {
        videos.push({
          url: media.compressed,
          thumbnail: media.thumbnail,
          duration: media.metadata.duration,
          width: media.metadata.width,
          height: media.metadata.height
        });
      }
    });
    
    res.json({
      success: true,
      message: 'Product gallery uploaded successfully',
      data: {
        images,
        videos,
        totalFiles: req.processedMedia.length
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Gallery upload failed',
      error: error.message
    });
  }
});

module.exports = router;
