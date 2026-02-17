import React, { useState, useEffect, useMemo } from 'react';
import { useDeviceDetection } from '../utils/deviceDetection';

// Desktop-optimized image component
export const DesktopOptimizedImage = ({ 
  src, 
  alt, 
  className = '', 
  priority = false,
  sizes,
  ...props 
}) => {
  const { device, imageConfig, loadingStrategy } = useDeviceDetection();
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState(false);

  // Generate responsive image URLs based on device
  const imageUrls = useMemo(() => {
    if (!src) return { src: '', srcSet: '' };

    const baseUrl = src.replace(/\.[^/.]+$/, ''); // Remove extension
    const extension = imageConfig.format;
    
    if (device.isLargeScreen) {
      // High-resolution images for large screens
      return {
        src: `${baseUrl}.${extension}?w=800&q=${imageConfig.quality}`,
        srcSet: `
          ${baseUrl}.${extension}?w=400&q=${imageConfig.quality} 400w,
          ${baseUrl}.${extension}?w=800&q=${imageConfig.quality} 800w,
          ${baseUrl}.${extension}?w=1200&q=${imageConfig.quality} 1200w,
          ${baseUrl}.${extension}?w=1600&q=${imageConfig.quality} 1600w
        `.trim()
      };
    } else {
      // Standard resolution for smaller screens
      return {
        src: `${baseUrl}.${extension}?w=600&q=${imageConfig.quality}`,
        srcSet: `
          ${baseUrl}.${extension}?w=300&q=${imageConfig.quality} 300w,
          ${baseUrl}.${extension}?w=600&q=${imageConfig.quality} 600w,
          ${baseUrl}.${extension}?w=900&q=${imageConfig.quality} 900w
        `.trim()
      };
    }
  }, [src, device.isLargeScreen, imageConfig]);

  // Preload critical images on desktop
  useEffect(() => {
    if (priority && device.isDesktop && loadingStrategy.preloadImages) {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'image';
      link.href = imageUrls.src;
      document.head.appendChild(link);
      
      return () => {
        if (document.head.contains(link)) {
          document.head.removeChild(link);
        }
      };
    }
  }, [priority, device.isDesktop, loadingStrategy.preloadImages, imageUrls.src]);

  if (error) {
    return (
      <div className={`bg-gray-200 flex items-center justify-center ${className}`}>
        <span className="text-gray-500 text-sm">Image failed to load</span>
      </div>
    );
  }

  return (
    <img
      src={imageUrls.src}
      srcSet={imageUrls.srcSet}
      sizes={sizes || imageConfig.sizes}
      alt={alt}
      className={`transition-opacity duration-300 ${isLoaded ? 'opacity-100' : 'opacity-0'} ${className}`}
      loading={priority ? 'eager' : imageConfig.loading}
      decoding={imageConfig.decoding}
      fetchPriority={priority ? 'high' : imageConfig.fetchPriority}
      onLoad={() => setIsLoaded(true)}
      onError={() => setError(true)}
      {...props}
    />
  );
};

// Desktop-optimized grid component
export const DesktopOptimizedGrid = ({ children, className = '' }) => {
  const { device } = useDeviceDetection();

  const gridClasses = useMemo(() => {
    if (device.screenSize === '2xl') {
      return 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6';
    } else if (device.screenSize === 'xl') {
      return 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5';
    } else if (device.isDesktop) {
      return 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4';
    } else {
      return 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3';
    }
  }, [device]);

  return (
    <div className={`grid gap-4 ${gridClasses} ${className}`}>
      {children}
    </div>
  );
};

// Desktop-optimized product card
export const DesktopOptimizedProductCard = ({ product, className = '' }) => {
  const { device, loadingStrategy } = useDeviceDetection();
  const [isHovered, setIsHovered] = useState(false);

  const cardSize = useMemo(() => {
    if (device.screenSize === '2xl') return 'large';
    if (device.isLargeScreen) return 'medium';
    return 'small';
  }, [device]);

  const cardClasses = {
    small: 'p-3',
    medium: 'p-4',
    large: 'p-6'
  };

  const imageClasses = {
    small: 'h-48',
    medium: 'h-56',
    large: 'h-64'
  };

  return (
    <div 
      className={`bg-white rounded-lg shadow-md hover:shadow-lg transition-all duration-300 ${cardClasses[cardSize]} ${className}`}
      onMouseEnter={() => device.isDesktop && setIsHovered(true)}
      onMouseLeave={() => device.isDesktop && setIsHovered(false)}
    >
      <div className={`relative overflow-hidden rounded-lg ${imageClasses[cardSize]}`}>
        <DesktopOptimizedImage
          src={product.mainImage || product.image}
          alt={product.name}
          className="w-full h-full object-cover"
          priority={false}
        />
        
        {/* Desktop hover effects */}
        {device.isDesktop && isHovered && loadingStrategy.enableAnimations && (
          <div className="absolute inset-0 bg-black bg-opacity-20 flex items-center justify-center transition-all duration-300">
            <button className="bg-white text-gray-900 px-4 py-2 rounded-lg font-semibold hover:bg-gray-100 transform scale-95 hover:scale-100 transition-transform">
              Quick View
            </button>
          </div>
        )}
      </div>
      
      <div className="mt-3">
        <h3 className={`font-semibold text-gray-900 line-clamp-2 ${cardSize === 'large' ? 'text-lg' : 'text-base'}`}>
          {product.name}
        </h3>
        <p className={`text-orange-600 font-bold mt-1 ${cardSize === 'large' ? 'text-xl' : 'text-lg'}`}>
          {product.price?.toLocaleString()} RWF
        </p>
        
        {/* Desktop-specific additional info */}
        {device.isLargeScreen && cardSize === 'large' && (
          <div className="mt-2">
            <p className="text-gray-600 text-sm line-clamp-2">{product.description}</p>
            <div className="flex items-center mt-2">
              <div className="flex text-yellow-400">
                {[...Array(5)].map((_, i) => (
                  <span key={i} className="text-sm">★</span>
                ))}
              </div>
              <span className="text-gray-500 text-sm ml-2">(4.5)</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Desktop-optimized navigation
export const DesktopOptimizedNavigation = ({ categories = [] }) => {
  const { device } = useDeviceDetection();

  if (!device.isDesktop) return null;

  return (
    <nav className="hidden lg:flex items-center space-x-8">
      {categories.slice(0, device.isLargeScreen ? 8 : 6).map((category) => (
        <a
          key={category.slug}
          href={`/category/${category.slug}`}
          className="text-gray-700 hover:text-orange-600 font-medium transition-colors duration-200 relative group"
        >
          {category.name}
          <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-orange-600 transition-all duration-300 group-hover:w-full"></span>
        </a>
      ))}
    </nav>
  );
};

// Desktop-optimized hero section
export const DesktopOptimizedHero = ({ title, subtitle, backgroundImage, children }) => {
  const { device, loadingStrategy } = useDeviceDetection();

  const heroHeight = useMemo(() => {
    if (device.screenSize === '2xl') return 'h-screen';
    if (device.isLargeScreen) return 'h-96';
    return 'h-80';
  }, [device]);

  return (
    <section className={`relative ${heroHeight} flex items-center justify-center overflow-hidden`}>
      {/* Background image with optimization */}
      <DesktopOptimizedImage
        src={backgroundImage}
        alt="Hero background"
        className="absolute inset-0 w-full h-full object-cover"
        priority={true}
        sizes="100vw"
      />
      
      {/* Overlay */}
      <div className="absolute inset-0 bg-black bg-opacity-40"></div>
      
      {/* Content */}
      <div className="relative z-10 text-center text-white max-w-4xl mx-auto px-4">
        <h1 className={`font-bold mb-4 ${device.isLargeScreen ? 'text-6xl' : 'text-4xl'}`}>
          {title}
        </h1>
        <p className={`mb-8 ${device.isLargeScreen ? 'text-xl' : 'text-lg'}`}>
          {subtitle}
        </p>
        {children}
      </div>
      
      {/* Desktop-specific decorative elements */}
      {device.isLargeScreen && loadingStrategy.enableAnimations && (
        <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 animate-bounce">
          <div className="w-6 h-10 border-2 border-white rounded-full flex justify-center">
            <div className="w-1 h-3 bg-white rounded-full mt-2 animate-pulse"></div>
          </div>
        </div>
      )}
    </section>
  );
};

// Desktop performance monitor
export const DesktopPerformanceMonitor = () => {
  const { device, capabilities, recommendations } = useDeviceDetection();
  const [showMonitor, setShowMonitor] = useState(false);

  // Only show on desktop in development
  if (!device.isDesktop || process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <>
      <button
        onClick={() => setShowMonitor(!showMonitor)}
        className="fixed bottom-4 right-4 bg-blue-600 text-white p-2 rounded-full shadow-lg z-50"
        title="Performance Monitor"
      >
        📊
      </button>
      
      {showMonitor && (
        <div className="fixed bottom-16 right-4 bg-white p-4 rounded-lg shadow-xl z-50 max-w-sm">
          <h3 className="font-bold mb-2">Desktop Performance</h3>
          <div className="text-sm space-y-1">
            <p><strong>Screen:</strong> {device.width}x{device.height} ({device.screenSize})</p>
            <p><strong>Performance:</strong> {device.performanceTier}</p>
            <p><strong>Connection:</strong> {capabilities.connectionType}</p>
            <p><strong>Memory:</strong> {capabilities.deviceMemory}GB</p>
            <p><strong>Cores:</strong> {capabilities.hardwareConcurrency}</p>
          </div>
          
          {recommendations.length > 0 && (
            <div className="mt-3">
              <h4 className="font-semibold text-xs">Recommendations:</h4>
              <ul className="text-xs space-y-1 mt-1">
                {recommendations.map((rec, index) => (
                  <li key={index} className="text-green-600">• {rec}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </>
  );
};
