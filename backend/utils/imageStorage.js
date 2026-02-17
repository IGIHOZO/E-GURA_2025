/**
 * Image Storage Utility
 * Converts base64 data URIs to optimized WebP files on disk.
 * Used during product creation/update to prevent storing blobs in PostgreSQL.
 */

const sharp = require('sharp');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

const UPLOADS_ROOT = '/var/www/egura/uploads/products';
const URL_PREFIX = '/uploads/products';

const SIZES = {
  thumb:  { width: 200,  quality: 70 },
  medium: { width: 800,  quality: 80 },
  large:  { width: 1920, quality: 85 },
};

// Ensure directories exist on startup
for (const size of Object.keys(SIZES)) {
  fs.mkdirSync(path.join(UPLOADS_ROOT, size), { recursive: true });
}

/**
 * Check if a string is a base64 data URI
 */
function isBase64(str) {
  return str && typeof str === 'string' && str.startsWith('data:');
}

/**
 * Decode a data URI to a raw Buffer
 */
function decodeDataURI(dataUri) {
  const match = dataUri.match(/^data:([^;,]+)?(;base64)?,(.*)$/s);
  if (!match) throw new Error('Invalid data URI');
  const isB64 = !!match[2];
  const payload = match[3];
  return isB64
    ? Buffer.from(payload, 'base64')
    : Buffer.from(decodeURIComponent(payload));
}

/**
 * Save a single image buffer to disk in multiple sizes.
 * Returns the medium-size URL (default display size).
 */
async function saveImageBuffer(buffer, filename) {
  const results = {};
  for (const [sizeName, cfg] of Object.entries(SIZES)) {
    const outDir = path.join(UPLOADS_ROOT, sizeName);
    const outPath = path.join(outDir, `${filename}.webp`);
    await sharp(buffer)
      .resize({ width: cfg.width, fit: 'inside', withoutEnlargement: true })
      .webp({ quality: cfg.quality, effort: 4 })
      .toFile(outPath);
    results[sizeName] = `${URL_PREFIX}/${sizeName}/${filename}.webp`;
  }
  return results;
}

/**
 * Process a single image value (base64 or URL).
 * If base64, saves to disk and returns URL. Otherwise returns as-is.
 * @param {string} imageValue - base64 data URI or URL string
 * @param {string} productId - product UUID for filename
 * @param {string} suffix - e.g. 'main', '0', '1', '2'
 * @returns {string} URL path to the image
 */
async function processImage(imageValue, productId, suffix) {
  if (!isBase64(imageValue)) return imageValue; // already a URL
  const buffer = decodeDataURI(imageValue);
  const filename = `${productId}_${suffix}`;
  const urls = await saveImageBuffer(buffer, filename);
  return urls.medium; // default display size
}

/**
 * Process product image fields before save.
 * Converts any base64 mainImage/images to disk files.
 * Mutates and returns the productData object.
 *
 * @param {object} productData - product data with mainImage and images fields
 * @param {string} productId - UUID (for new products, generate before calling)
 * @returns {object} productData with URLs replacing base64
 */
async function processProductImages(productData, productId) {
  // Process mainImage
  if (productData.mainImage && isBase64(productData.mainImage)) {
    productData.mainImage = await processImage(productData.mainImage, productId, 'main');
  }

  // Process images array
  if (Array.isArray(productData.images)) {
    for (let i = 0; i < productData.images.length; i++) {
      if (isBase64(productData.images[i])) {
        productData.images[i] = await processImage(productData.images[i], productId, String(i));
      }
    }
  }

  return productData;
}

module.exports = {
  isBase64,
  processImage,
  processProductImages,
  saveImageBuffer,
  UPLOADS_ROOT,
  URL_PREFIX,
};
