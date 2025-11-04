/**
 * Placeholder Image Utilities
 * Provides inline SVG placeholders to avoid external service dependencies
 */

// Generate inline SVG placeholder
export const generatePlaceholder = (width = 200, height = 200, text = 'No Image') => {
  return `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='${width}' height='${height}'%3E%3Crect fill='%23f3f4f6' width='${width}' height='${height}'/%3E%3Ctext fill='%239ca3af' font-family='Arial,sans-serif' font-size='${Math.floor(width / 10)}' x='50%25' y='50%25' text-anchor='middle' dy='.3em'%3E${encodeURIComponent(text)}%3C/text%3E%3C/svg%3E`;
};

// Predefined placeholders for common sizes
export const PLACEHOLDER_IMAGES = {
  small: generatePlaceholder(100, 100, 'No Image'),
  medium: generatePlaceholder(200, 200, 'No Image'),
  large: generatePlaceholder(400, 400, 'No Image'),
  wide: generatePlaceholder(800, 400, 'No Image'),
};

// Default product placeholder
export const DEFAULT_PRODUCT_IMAGE = PLACEHOLDER_IMAGES.medium;

// Handle image error with placeholder
export const handleImageError = (e, size = 'medium') => {
  e.target.onerror = null; // Prevent infinite loop
  e.target.src = PLACEHOLDER_IMAGES[size] || PLACEHOLDER_IMAGES.medium;
};

// Get image with fallback
export const getImageWithFallback = (imageUrl, fallbackSize = 'medium') => {
  return imageUrl || PLACEHOLDER_IMAGES[fallbackSize];
};

export default {
  generatePlaceholder,
  PLACEHOLDER_IMAGES,
  DEFAULT_PRODUCT_IMAGE,
  handleImageError,
  getImageWithFallback
};
