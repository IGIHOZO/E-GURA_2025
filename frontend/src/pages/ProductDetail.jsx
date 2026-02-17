import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import SEO from '../components/SEO';
import ProductMedia from '../components/ProductMedia';
import { 
  ShoppingBagIcon,
  HeartIcon,
  StarIcon,
  TruckIcon,
  ShieldCheckIcon,
  ArrowLeftIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CheckCircleIcon,
  XMarkIcon,
  MagnifyingGlassIcon,
  ExclamationTriangleIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';
import { HeartIcon as HeartIconSolid } from '@heroicons/react/24/solid';
import { productsAPI } from '../services/api';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import AIAssistant from '../components/AIAssistant';
import { LazyWrapper, LazyReviewsSection } from '../components/LazyComponents';
import axios from 'axios';
import { usePersonalization } from '../hooks/usePersonalization';

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { toggleWishlist: contextToggleWishlist, isInWishlist } = useWishlist();
  const { trackView } = usePersonalization();
  
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [isImageZoomed, setIsImageZoomed] = useState(false);
  const [showErrorMessage, setShowErrorMessage] = useState(false);
  const [selectedVariant, setSelectedVariant] = useState(null);

  // Get device ID for tracking
  const getDeviceId = () => {
    let deviceId = localStorage.getItem('deviceId');
    if (!deviceId) {
      deviceId = `device-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('deviceId', deviceId);
    }
    return deviceId;
  };

  // Track user events (view, add_to_cart, purchase)
  const trackEvent = (eventType, product) => {
    const deviceId = getDeviceId();
    
    // Track in intelligent search
    axios.post('/api/intelligent-search/track', {
      userId: deviceId,
      eventType,
      productId: product.id || product._id,
      product: {
        name: product.name,
        category: product.category,
        brand: product.brand,
        price: product.price
      }
    }).then(() => {
      console.log(`✅ ${eventType} tracked for device:`, deviceId, product.name);
    }).catch(err => console.error(`❌ Track ${eventType} error:`, err));
    
    // Track view in personalization service
    if (eventType === 'view') {
      trackView(product);
    }
  };


  // Color mapping for admin-defined colors
  const colorMap = {
    'Blue': { filter: 'hue-rotate(240deg) saturate(1.2)', hex: '#3B82F6' },
    'Red': { filter: 'hue-rotate(0deg) saturate(1.5)', hex: '#EF4444' },
    'Green': { filter: 'hue-rotate(120deg) saturate(1.3)', hex: '#10B981' },
    'Yellow': { filter: 'hue-rotate(60deg) saturate(1.4)', hex: '#F59E0B' },
    'Black': { filter: 'brightness(0.3) contrast(1.2)', hex: '#111827' },
    'White': { filter: 'brightness(1.2) contrast(0.8)', hex: '#F9FAFB' },
    'Purple': { filter: 'hue-rotate(280deg) saturate(1.3)', hex: '#8B5CF6' },
    'Orange': { filter: 'hue-rotate(30deg) saturate(1.4)', hex: '#F97316' },
    'Pink': { filter: 'hue-rotate(320deg) saturate(1.3)', hex: '#EC4899' },
    'Brown': { filter: 'hue-rotate(30deg) saturate(0.8) brightness(0.8)', hex: '#92400E' },
    'Gray': { filter: 'grayscale(1) brightness(0.7)', hex: '#6B7280' },
    'Navy': { filter: 'hue-rotate(240deg) saturate(1.5) brightness(0.6)', hex: '#1E3A8A' },
    'Beige': { filter: 'hue-rotate(45deg) saturate(0.3) brightness(1.1)', hex: '#F5F5DC' },
    'Cream': { filter: 'hue-rotate(45deg) saturate(0.2) brightness(1.2)', hex: '#FFFDD0' },
    'Silver': { filter: 'grayscale(0.5) brightness(1.1)', hex: '#C0C0C0' },
    'Gold': { filter: 'hue-rotate(45deg) saturate(1.2) brightness(1.1)', hex: '#FFD700' }
  };

  // Get sizes from product - only if they exist
  const sizes = product?.sizes?.length > 0 ? product.sizes : [];

  // Generate colors from product's colors - only if they exist
  const colors = product?.colors?.length > 0 
    ? product.colors.map(colorName => ({
        name: colorName,
        value: colorName.toLowerCase(),
        filter: colorMap[colorName]?.filter || 'none',
        hex: colorMap[colorName]?.hex || '#6B7280'
      }))
    : [];

  // Get materials from product
  const materials = product?.material?.length > 0 ? product.material : [];

  // Find the selected variant based on size and color
  const findVariant = (size, color) => {
    if (!product?.variants || product.variants.length === 0) return null;
    
    return product.variants.find(v => {
      const sizeMatch = size ? v.size === size : !v.size;
      const colorMatch = color ? v.color === color : !v.color;
      return sizeMatch && colorMatch;
    });
  };

  // Get current price based on selected variant or base price
  const getCurrentPrice = () => {
    if (selectedVariant && selectedVariant.price !== undefined && selectedVariant.price !== null) {
      return parseFloat(selectedVariant.price) || 0;
    }
    return product?.price || 0;
  };

  // Get current stock based on selected variant or base stock
  const getCurrentStock = () => {
    if (selectedVariant && selectedVariant.stockQuantity !== undefined) {
      return selectedVariant.stockQuantity;
    }
    return product?.stockQuantity || 0;
  };

  // Update selected variant when size or color changes
  useEffect(() => {
    if (product && (selectedSize || selectedColor)) {
      const variant = findVariant(selectedSize, selectedColor);
      setSelectedVariant(variant);
      console.log('Selected variant:', variant);
    } else {
      setSelectedVariant(null);
    }
  }, [selectedSize, selectedColor, product]);

  useEffect(() => {
    fetchProduct();
    // Wishlist is now managed by WishlistContext - no need to load here
  }, [id]);

  // Track product view when product loads
  useEffect(() => {
    if (product && product.id) {
      trackEvent('view', product);
    }
  }, [product]);

  const fetchProduct = async () => {
    try {
      setLoading(true);
      console.log('Fetching product with ID:', id);
      
      // Try to get from API first
      try {
        const response = await productsAPI.getById(id);
        console.log('API response:', response);
        
        if (response.data && response.data.success && response.data.data) {
          console.log('Setting product from API:', response.data.data);
          setProduct(response.data.data);
          setLoading(false);
          return;
        }
      } catch (apiError) {
        console.error('API fetch failed:', apiError);
        if (apiError.response) {
          console.error('Response status:', apiError.response.status);
          console.error('Response data:', apiError.response.data);
        }
      }
      
      // Fallback to cached products
      try {
        const cachedProducts = JSON.parse(localStorage.getItem('cachedProducts') || '[]');
        console.log('Cached products count:', cachedProducts.length);
        const foundProduct = cachedProducts.find(p => p.id === id || p._id === id);
        console.log('Found product in cache:', foundProduct ? 'Yes' : 'No');
        
        if (foundProduct) {
          setProduct(foundProduct);
          setLoading(false);
          return;
        }
      } catch (cacheError) {
        console.error('Cache lookup failed:', cacheError);
      }
      
      // If still not found, show error and redirect
      console.log('Product not found anywhere, redirecting to shop');
      setTimeout(() => navigate('/shop'), 2000); // Give user time to see the message
      
    } catch (error) {
      console.error('Error fetching product:', error);
      setTimeout(() => navigate('/shop'), 2000);
    } finally {
      setLoading(false);
    }
  };



  const handleAddToCart = () => {
    console.log('Add to Cart clicked!');
    
    // No auth check - allow adding to cart, auth will be at checkout
    
    // Validate required fields - only if sizes exist
    if (sizes.length > 0 && !selectedSize) {
      alert('Please select a size before adding to cart.');
      return;
    }
    
    // Check stock availability
    if (currentStock < quantity) {
      alert(`Only ${currentStock} items available in stock.`);
      return;
    }
    
    // Create product with variant-specific price
    const productWithVariantPrice = {
      ...product,
      price: currentPrice,
      selectedVariant: selectedVariant
    };
    
    // Add to cart with proper parameters
    addToCart(productWithVariantPrice, selectedSize || 'Default', selectedColor || 'Default', quantity);
    
    // Track add_to_cart event for trending/recommendations
    trackEvent('add_to_cart', productWithVariantPrice);
    
    setShowSuccessMessage(true);
    setTimeout(() => {
      setShowSuccessMessage(false);
    }, 5000);
  };

  const handleBuyNow = () => {
    console.log('Buy Now clicked!');
    
    // No auth check - allow buy now, auth will be at checkout
    
    // Validate required fields - only if sizes exist
    if (sizes.length > 0 && !selectedSize) {
      alert('Please select a size before proceeding.');
      return;
    }
    
    // Check stock availability
    if (currentStock < quantity) {
      alert(`Only ${currentStock} items available in stock.`);
      return;
    }
    
    // Create product with variant-specific price
    const productWithVariantPrice = {
      ...product,
      price: currentPrice,
      selectedVariant: selectedVariant
    };
    
    // Add to cart with proper parameters
    addToCart(productWithVariantPrice, selectedSize || 'Default', selectedColor || 'Default', quantity);
    
    // Navigate to checkout - ScrollToTop component will handle scrolling
    navigate('/checkout');
  };

  const toggleWishlist = () => {
    if (product) {
      contextToggleWishlist(product);
    }
  };

  const getStockStatus = (stockQuantity) => {
    if (stockQuantity > 20) return { text: 'In Stock', color: 'text-green-600', bg: 'bg-green-100' };
    if (stockQuantity > 5) return { text: 'Low Stock', color: 'text-yellow-600', bg: 'bg-yellow-100' };
    return { text: 'Out of Stock', color: 'text-red-600', bg: 'bg-red-100' };
  };

  const getColorFilter = (colorName) => {
    const color = colors.find(c => c.name === colorName);
    return color ? color.filter : '';
  };

  const getColorHex = (colorName) => {
    const color = colors.find(c => c.name === colorName);
    return color ? color.hex : '#000000';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading product...</p>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Product not found</h2>
          <button
            onClick={() => navigate('/shop')}
            className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors"
          >
            Back to Shop
          </button>
        </div>
      </div>
    );
  }

  const currentStock = getCurrentStock();
  const currentPrice = getCurrentPrice();
  const stockStatus = getStockStatus(currentStock);
  const allImages = [
    product.mainImage,
    ...(product.images || [])
  ].filter(Boolean);

  return (
    <>
      <SEO
        title={product.seoTitle || product.metaTitle || `${product.name} - E-Gura Store | Premium Shopping in Kigali, Rwanda`}
        description={product.seoDescription || product.metaDescription || `${product.name} - ${product.shortDescription || product.description}. Buy ${product.name} online in Kigali, Rwanda. Free delivery, best prices, and premium quality from E-Gura Store.`}
        keywords={(product.seoKeywords || product.keywords || []).join(', ') || `${product.name}, ${product.category}, online shopping, Kigali, Rwanda, E-Gura Store, free delivery, mobile money`}
        canonicalUrl={window.location.href}
        ogImage={product.metaTags?.ogImage || product.mainImage || '/og-image.jpg'}
        ogType="product"
        product={{
          name: product.name,
          description: product.description || product.shortDescription,
          image: product.mainImage,
          price: product.price,
          url: window.location.href,
          inStock: product.stockQuantity > 0,
          rating: product.averageRating || 4.5,
          reviewCount: product.totalReviews || 0
        }}
      />

      <div className="min-h-screen bg-gray-50">
        {/* Back Navigation */}
        <div className="bg-white border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <button
              onClick={() => navigate('/shop')}
              className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeftIcon className="h-5 w-5 mr-2" />
              Back to Shop
            </button>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Product Images */}
            <div className="space-y-4">
              {/* Main Image */}
              <div className="relative group">
                <div 
                  className="relative cursor-pointer overflow-hidden rounded-lg"
                  onClick={() => setShowImageModal(true)}
                >
                  <ProductMedia
                    src={allImages[selectedImage]}
                    alt={product.name}
                    className="w-full h-96 lg:h-[500px] object-cover transition-all duration-300 group-hover:scale-105"
                    controls={true}
                  />
                  
                  {/* Zoom Icon Overlay */}
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-300 flex items-center justify-center">
                    <MagnifyingGlassIcon className="h-12 w-12 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  </div>
                </div>
                
                {/* Color Preview Badge */}
                {selectedColor && (
                  <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm px-3 py-2 rounded-lg shadow-lg">
                    <div className="flex items-center space-x-2">
                      <div 
                        className="w-4 h-4 rounded-full border border-gray-300"
                        style={{
                          backgroundColor: getColorHex(selectedColor)
                        }}
                      ></div>
                      <span className="text-sm font-medium text-gray-700">
                        {selectedColor}
                      </span>
                    </div>
                  </div>
                )}
                
                {/* Image Navigation */}
                {allImages.length > 1 && (
                  <>
                    <button
                      onClick={() => setSelectedImage(prev => prev === 0 ? allImages.length - 1 : prev - 1)}
                      className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white/80 backdrop-blur-sm p-2 rounded-full hover:bg-white transition-colors"
                    >
                      <ChevronLeftIcon className="h-5 w-5 text-gray-600" />
                    </button>
                    <button
                      onClick={() => setSelectedImage(prev => prev === allImages.length - 1 ? 0 : prev + 1)}
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white/80 backdrop-blur-sm p-2 rounded-full hover:bg-white transition-colors"
                    >
                      <ChevronRightIcon className="h-5 w-5 text-gray-600" />
                    </button>
                  </>
                )}
              </div>

              {/* Thumbnail Images */}
              {allImages.length > 1 && (
                <div className="flex space-x-2 overflow-x-auto">
                  {allImages.map((image, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedImage(index)}
                      className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-colors hover:scale-105 ${
                        selectedImage === index ? 'border-purple-600' : 'border-gray-200'
                      }`}
                    >
                      <ProductMedia
                        src={image}
                        alt={`${product.name} - Image ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Product Info */}
            <div className="space-y-6">
              {/* Product Badges */}
              <div className="flex items-center space-x-2">
                {product.isNew && (
                  <span className="bg-blue-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
                    NEW
                  </span>
                )}
                {product.isSale && (
                  <span className="bg-red-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
                    SALE
                  </span>
                )}
                <span className={`px-3 py-1 rounded-full text-sm font-semibold ${stockStatus.bg} ${stockStatus.color}`}>
                  {stockStatus.text}
                </span>
              </div>

              {/* Product Title */}
              <h1 className="text-3xl lg:text-4xl font-bold text-gray-900">
                {product.name}
              </h1>

              {/* Brand */}
              <p className="text-lg text-gray-600">
                Brand: {product.brand || 'E-Gura Store'}
              </p>

              {/* Rating */}
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <div className="flex items-center">
                    {[...Array(5)].map((_, i) => (
                      <StarIcon
                        key={i}
                        className={`h-5 w-5 ${
                          i < Math.floor(product.averageRating || 4.5)
                            ? 'text-yellow-400 fill-current'
                            : 'text-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-gray-600">
                    ({product.totalReviews || 0} reviews)
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    const reviewsEl = document.getElementById('reviews');
                    if (reviewsEl) {
                      reviewsEl.scrollIntoView({ behavior: 'smooth' });
                    }
                    const aiButton = document.querySelector('[class*="fixed bottom-6 right-6"]');
                    if (aiButton) {
                      aiButton.click();
                    }
                  }}
                  className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200 transition-colors"
                >
                  <SparklesIcon className="h-4 w-4 mr-1" />
                  AI Write a review
                </button>
              </div>

              {/* Price */}
              <div className="flex items-center space-x-4">
                <span className="text-3xl font-bold text-gray-900">
                  {currentPrice?.toLocaleString()} RWF
                </span>
                {product.originalPrice && product.originalPrice > currentPrice && (
                  <span className="text-xl text-gray-500 line-through">
                    {product.originalPrice?.toLocaleString()} RWF
                  </span>
                )}
                {selectedVariant && selectedVariant.price !== product.price && (
                  <span className="text-sm text-purple-600 font-medium">
                    Variant price
                  </span>
                )}
              </div>

              {/* Description */}
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Product Description</h3>
                <div className="text-gray-600 leading-relaxed space-y-3">
                  {product.description ? (
                    // Render formatted description with line breaks and bullet points
                    product.description.split('\n').map((line, index) => {
                      // Check if line is a heading (starts with **)
                      if (line.trim().startsWith('**') && line.trim().endsWith('**')) {
                        const heading = line.replace(/\*\*/g, '').trim();
                        return (
                          <h4 key={index} className="font-semibold text-gray-900 mt-4 mb-2">
                            {heading}
                          </h4>
                        );
                      }
                      // Check if line is a bullet point
                      else if (line.trim().startsWith('•')) {
                        return (
                          <div key={index} className="flex items-start ml-2">
                            <span className="text-purple-600 mr-2">•</span>
                            <span>{line.replace('•', '').trim()}</span>
                          </div>
                        );
                      }
                      // Regular paragraph
                      else if (line.trim()) {
                        return (
                          <p key={index} className="text-gray-700">
                            {line}
                          </p>
                        );
                      }
                      return null;
                    })
                  ) : (
                    <p className="text-gray-700">
                      {product.shortDescription || `A beautiful ${product.category?.toLowerCase()} product from E-Gura Store. Made with premium materials and African-inspired design.`}
                    </p>
                  )}
                </div>
              </div>

              {/* Size Selection */}
              {sizes.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">
                    Size {sizes.length > 0 && <span className="text-red-500">*</span>}
                  </h3>
                  <div className="grid grid-cols-3 gap-3">
                    {sizes.map((size) => {
                      // Check if this size is available (has stock)
                      const sizeVariant = findVariant(size, selectedColor);
                      const isAvailable = sizeVariant ? sizeVariant.stockQuantity > 0 : true;
                      
                      return (
                        <button
                          key={size}
                          onClick={() => setSelectedSize(size)}
                          disabled={!isAvailable}
                          className={`py-3 px-4 border-2 rounded-lg font-medium transition-colors relative ${
                            selectedSize === size
                              ? 'border-purple-600 bg-purple-600 text-white'
                              : isAvailable
                              ? 'border-gray-300 text-gray-700 hover:border-purple-300'
                              : 'border-gray-200 text-gray-400 cursor-not-allowed opacity-50'
                          }`}
                        >
                          {size}
                          {!isAvailable && (
                            <span className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-xs text-red-500 font-bold">
                              Out
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Color Selection */}
              {colors.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Color</h3>
                  <div className="grid grid-cols-4 gap-3">
                    {colors.map((color) => {
                      // Check if this color is available (has stock)
                      const colorVariant = findVariant(selectedSize, color.name);
                      const isAvailable = colorVariant ? colorVariant.stockQuantity > 0 : true;
                      
                      return (
                        <button
                          key={color.name}
                          onClick={() => setSelectedColor(color.name)}
                          disabled={!isAvailable}
                          className={`py-3 px-4 border-2 rounded-lg font-medium transition-colors relative ${
                            selectedColor === color.name
                              ? 'border-purple-600 bg-purple-600 text-white'
                              : isAvailable
                              ? 'border-gray-300 text-gray-700 hover:border-purple-300'
                              : 'border-gray-200 text-gray-400 cursor-not-allowed opacity-50'
                          }`}
                        >
                          <div className="flex items-center space-x-2">
                            <div 
                              className="w-4 h-4 rounded-full border border-gray-300"
                              style={{
                                backgroundColor: color.hex
                              }}
                            ></div>
                            <span>{color.name}</span>
                          </div>
                          {!isAvailable && (
                            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs px-1 rounded">
                              ✕
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                  {selectedColor && (
                    <p className="text-sm text-gray-600 mt-2">
                      Color applied to product images
                    </p>
                  )}
                </div>
              )}

              {/* Material Display */}
              {materials.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Materials</h3>
                  <div className="flex flex-wrap gap-2">
                    {materials.map((material, index) => (
                      <span
                        key={index}
                        className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium"
                      >
                        {material}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Quantity */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Quantity</h3>
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => setQuantity(prev => Math.max(1, prev - 1))}
                    className="w-10 h-10 border border-gray-300 rounded-lg flex items-center justify-center hover:bg-gray-50"
                  >
                    -
                  </button>
                  <span className="w-16 text-center text-lg font-medium">{quantity}</span>
                  <button
                    onClick={() => setQuantity(prev => Math.min(currentStock || 10, prev + 1))}
                    className="w-10 h-10 border border-gray-300 rounded-lg flex items-center justify-center hover:bg-gray-50"
                  >
                    +
                  </button>
                  <span className="text-gray-600">
                    {currentStock} available
                  </span>
                </div>
                {selectedVariant && (
                  <p className="text-sm text-purple-600 mt-2">
                    Stock for selected variant: {selectedSize || 'Any'} / {selectedColor || 'Any'}
                  </p>
                )}
              </div>

              {/* Action Buttons - FORCE ENABLED */}
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={handleAddToCart}
                    className="bg-purple-600 text-white py-4 rounded-lg font-semibold hover:bg-purple-700 transition-colors flex items-center justify-center"
                  >
                    <ShoppingBagIcon className="h-5 w-5 mr-2" />
                    Add to Cart
                  </button>
                  <button
                    onClick={handleBuyNow}
                    className="bg-green-600 text-white py-4 rounded-lg font-semibold hover:bg-green-700 transition-colors"
                  >
                    Buy Now
                  </button>
                </div>
                
                {/* Make Offer Button - Opens AI Assistant */}
                <div className="flex space-x-3">
                  <button
                    onClick={() => {
                      // Find and click the AI Assistant floating button
                      const aiButton = document.querySelector('[class*="fixed bottom-6 right-6"]');
                      if (aiButton) {
                        aiButton.click();
                      } else {
                        // Fallback: show alert
                        alert('💬 Click the AI Assistant button in the bottom-right corner to chat and make offers!');
                      }
                    }}
                    className="flex-1 bg-gradient-to-r from-orange-500 via-orange-600 to-red-600 text-white py-4 rounded-lg font-semibold hover:from-orange-600 hover:via-orange-700 hover:to-red-700 transition-all shadow-lg hover:shadow-xl flex items-center justify-center space-x-2 transform hover:scale-105"
                  >
                    <SparklesIcon className="h-5 w-5" />
                    <span>💬 Chat & Make Offer</span>
                  </button>
                  <button
                    onClick={toggleWishlist}
                    className="p-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    title={isInWishlist(product._id || product.id) ? "Remove from wishlist" : "Add to wishlist"}
                  >
                    {isInWishlist(product._id || product.id) ? (
                      <HeartIconSolid className="h-6 w-6 text-red-500" />
                    ) : (
                      <HeartIcon className="h-6 w-6 text-gray-600" />
                    )}
                  </button>
                </div>
              </div>



              {/* Inline Error Notification */}
              {showErrorMessage && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-4 bg-orange-50 border border-orange-200 rounded-lg p-4"
                >
                  <div className="flex items-start space-x-3">
                    <ExclamationTriangleIcon className="h-5 w-5 text-orange-600 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <h4 className="font-semibold text-orange-800 mb-1">
                        Shipping Information Required
                      </h4>
                      <p className="text-sm text-orange-700">
                        To complete your order, we need your shipping details. Our team will contact you to arrange delivery once your order is confirmed.
                      </p>
                      <div className="mt-3 flex space-x-3">
                        <button
                          onClick={() => setShowErrorMessage(false)}
                          className="text-xs bg-orange-100 text-orange-700 px-3 py-1 rounded-md hover:bg-orange-200 transition-colors"
                        >
                          Got it
                        </button>
                        <a
                          href="tel:+250788123456"
                          className="text-xs bg-orange-600 text-white px-3 py-1 rounded-md hover:bg-orange-700 transition-colors"
                        >
                          Call Us
                        </a>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Features */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-6 border-t">
                <div className="flex items-center space-x-3">
                  <TruckIcon className="h-6 w-6 text-green-600" />
                  <div>
                    <h4 className="font-semibold text-gray-900">Free Shipping</h4>
                    <p className="text-sm text-gray-600">On orders over 50,000 RWF</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <ShieldCheckIcon className="h-6 w-6 text-green-600" />
                  <div>
                    <h4 className="font-semibold text-gray-900">Secure Payment</h4>
                    <p className="text-sm text-gray-600">100% secure payment</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Additional Product Images Gallery */}
          {allImages.length > 1 && (
            <div className="mt-12">
              <div className="bg-white rounded-xl shadow-sm p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Product Gallery</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {allImages.map((image, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.1 }}
                      className="relative group cursor-pointer"
                      onClick={() => {
                        setSelectedImage(index);
                        setShowImageModal(true);
                      }}
                    >
                      <div className="aspect-square overflow-hidden rounded-lg border-2 border-gray-200 hover:border-purple-500 transition-all">
                        <ProductMedia
                          src={image}
                          alt={`${product.name} - View ${index + 1}`}
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                        />
                      </div>
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-300 rounded-lg flex items-center justify-center">
                        <MagnifyingGlassIcon className="h-8 w-8 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Product Details & Specifications */}
          <div className="mt-12">
            <div className="bg-white rounded-xl shadow-sm p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Product Details</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Left Column */}
                <div className="space-y-4">
                  <div className="flex justify-between py-3 border-b border-gray-200">
                    <span className="font-semibold text-gray-700">Brand</span>
                    <span className="text-gray-900">{product.brand || 'E-Gura Store'}</span>
                  </div>
                  <div className="flex justify-between py-3 border-b border-gray-200">
                    <span className="font-semibold text-gray-700">Category</span>
                    <span className="text-gray-900">{product.category || 'Fashion'}</span>
                  </div>
                  {product.subcategory && (
                    <div className="flex justify-between py-3 border-b border-gray-200">
                      <span className="font-semibold text-gray-700">Subcategory</span>
                      <span className="text-gray-900">{product.subcategory}</span>
                    </div>
                  )}
                  {materials.length > 0 && (
                    <div className="flex justify-between py-3 border-b border-gray-200">
                      <span className="font-semibold text-gray-700">Materials</span>
                      <span className="text-gray-900">{materials.join(', ')}</span>
                    </div>
                  )}
                </div>

                {/* Right Column */}
                <div className="space-y-4">
                  {sizes.length > 0 && (
                    <div className="flex justify-between py-3 border-b border-gray-200">
                      <span className="font-semibold text-gray-700">Available Sizes</span>
                      <span className="text-gray-900">{sizes.join(', ')}</span>
                    </div>
                  )}
                  {colors.length > 0 && (
                    <div className="flex justify-between py-3 border-b border-gray-200">
                      <span className="font-semibold text-gray-700">Available Colors</span>
                      <span className="text-gray-900">{colors.map(c => c.name).join(', ')}</span>
                    </div>
                  )}
                  <div className="flex justify-between py-3 border-b border-gray-200">
                    <span className="font-semibold text-gray-700">Stock Status</span>
                    <span className={`font-semibold ${stockStatus.color}`}>{stockStatus.text}</span>
                  </div>
                  <div className="flex justify-between py-3 border-b border-gray-200">
                    <span className="font-semibold text-gray-700">SKU</span>
                    <span className="text-gray-900 font-mono text-sm">{product._id?.slice(-8).toUpperCase()}</span>
                  </div>
                </div>
              </div>

              {/* Shipping & Returns Info */}
              <div className="mt-8 pt-6 border-t border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Shipping & Returns</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="flex items-start space-x-3">
                    <TruckIcon className="h-6 w-6 text-purple-600 flex-shrink-0 mt-1" />
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-1">Free Delivery</h4>
                      <p className="text-sm text-gray-600">Free delivery within Kigali on orders over 50,000 RWF</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <ShieldCheckIcon className="h-6 w-6 text-purple-600 flex-shrink-0 mt-1" />
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-1">7-Day Returns</h4>
                      <p className="text-sm text-gray-600">Easy returns within 7 days of delivery</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <CheckCircleIcon className="h-6 w-6 text-purple-600 flex-shrink-0 mt-1" />
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-1">Quality Guarantee</h4>
                      <p className="text-sm text-gray-600">100% authentic products guaranteed</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Customer Reviews */}
          {product && (
            <section id="reviews" className="mt-12">
              <div className="bg-white rounded-xl shadow-sm p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Customer Reviews</h2>
                <p className="text-sm text-gray-600 mb-4">
                  Use the AI assistant (bottom-right) to help you write a great review, then submit it below.
                </p>
                <LazyWrapper>
                  <LazyReviewsSection productId={product._id || product.id} />
                </LazyWrapper>
              </div>
            </section>
          )}
        </div>
      </div>

      {/* Success Message */}
      {showSuccessMessage && (
        <motion.div
          initial={{ opacity: 0, y: -20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          className="fixed top-6 right-6 bg-white/95 backdrop-blur-xl text-gray-800 px-6 py-5 rounded-2xl shadow-2xl z-50 max-w-md border border-white/20"
        >
          <div className="flex items-start space-x-4">
            <div className="p-2 bg-green-100 rounded-xl">
              <CheckCircleIcon className="h-6 w-6 text-green-600" />
            </div>
            <div className="flex-1">
              <h4 className="font-bold text-lg mb-3 bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                🎉 Successfully Added!
              </h4>
              <p className="text-sm text-gray-600">
                Product added to cart successfully! You can add shipping information during checkout.
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* AI Assistant - Always Available */}
      {product && (
        <AIAssistant
          currentProduct={{
            id: product._id || product.id,
            _id: product._id || product.id,
            name: product.name,
            price: currentPrice,
            mainImage: product.mainImage || product.image || product.images?.[0],
            image: product.mainImage || product.image || product.images?.[0],
            category: product.category
          }}
        />
      )}
      {!product && <AIAssistant />}

      {/* Image Modal */}
      {showImageModal && (
        <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4">
          <div className="relative max-w-6xl w-full max-h-[90vh]">
            <button
              onClick={() => setShowImageModal(false)}
              className="absolute top-4 right-4 bg-white/80 backdrop-blur-sm p-2 rounded-full hover:bg-white transition-colors z-10"
            >
              <XMarkIcon className="h-6 w-6 text-gray-600" />
            </button>

            {/* Main Image */}
            <ProductMedia
              src={allImages[selectedImage]}
              alt={product.name}
              className="w-full h-auto max-h-[80vh] object-contain rounded-lg"
              controls={true}
            />

            {/* Thumbnail Navigation */}
            {allImages.length > 1 && (
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
                {allImages.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImage(index)}
                    className={`w-3 h-3 rounded-full transition-colors ${
                      selectedImage === index ? 'bg-white' : 'bg-white/50'
                    }`}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}

    </>
  );
};

export default ProductDetail; 