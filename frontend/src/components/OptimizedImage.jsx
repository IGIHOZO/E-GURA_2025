import React, { useState, useEffect, useRef } from 'react';

/**
 * OptimizedImage Component
 * Provides lazy loading, responsive images, and fallback support
 * Improves Core Web Vitals (LCP, CLS)
 */
const OptimizedImage = ({
  src,
  alt,
  width,
  height,
  className = '',
  priority = false,
  sizes = '100vw',
  objectFit = 'cover',
  placeholder = 'blur',
  onLoad,
  ...props
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(priority);
  const imgRef = useRef(null);

  // Intersection Observer for lazy loading
  useEffect(() => {
    if (priority || !imgRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true);
            observer.disconnect();
          }
        });
      },
      {
        rootMargin: '50px', // Start loading 50px before element is visible
        threshold: 0.01
      }
    );

    observer.observe(imgRef.current);

    return () => {
      if (imgRef.current) {
        observer.unobserve(imgRef.current);
      }
    };
  }, [priority]);

  // Handle image load
  const handleLoad = () => {
    setIsLoaded(true);
    if (onLoad) onLoad();
  };

  // Generate srcSet for responsive images
  const generateSrcSet = (baseSrc) => {
    if (!baseSrc) return '';
    
    // If it's an external URL, use as-is
    if (baseSrc.startsWith('http')) {
      return `${baseSrc}?w=640 640w, ${baseSrc}?w=750 750w, ${baseSrc}?w=828 828w, ${baseSrc}?w=1080 1080w, ${baseSrc}?w=1200 1200w`;
    }
    
    // For local images, you might have different sized versions
    return '';
  };

  // Placeholder blur effect
  const placeholderStyle = {
    filter: isLoaded ? 'none' : 'blur(10px)',
    transition: 'filter 0.3s ease-in-out',
    backgroundColor: '#f3f4f6',
  };

  return (
    <div
      ref={imgRef}
      className={`relative overflow-hidden ${className}`}
      style={{
        width: width || '100%',
        height: height || 'auto',
        aspectRatio: width && height ? `${width}/${height}` : undefined
      }}
    >
      {/* Placeholder */}
      {!isLoaded && placeholder === 'blur' && (
        <div
          className="absolute inset-0 bg-gradient-to-br from-gray-200 to-gray-300 animate-pulse"
          style={{ zIndex: 1 }}
        />
      )}

      {/* Actual Image */}
      {isInView && (
        <img
          src={src}
          alt={alt}
          width={width}
          height={height}
          loading={priority ? 'eager' : 'lazy'}
          decoding="async"
          srcSet={generateSrcSet(src)}
          sizes={sizes}
          onLoad={handleLoad}
          className={`w-full h-full object-${objectFit} ${!isLoaded && 'opacity-0'} transition-opacity duration-300`}
          style={{
            ...placeholderStyle,
            position: 'relative',
            zIndex: 2
          }}
          {...props}
        />
      )}

      {/* SEO-friendly noscript fallback */}
      <noscript>
        <img
          src={src}
          alt={alt}
          width={width}
          height={height}
          className={`w-full h-full object-${objectFit}`}
        />
      </noscript>
    </div>
  );
};

/**
 * ProductImage Component
 * Specialized component for product images with schema.org integration
 */
export const ProductImage = ({ product, priority = false, className = '' }) => {
  const imageUrl = product.mainImage || product.image || '/placeholder-product.jpg';
  
  return (
    <OptimizedImage
      src={imageUrl}
      alt={`${product.name} - Buy online at E-Gura Store Rwanda`}
      width={600}
      height={600}
      priority={priority}
      className={className}
      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
    />
  );
};

/**
 * HeroImage Component
 * Optimized for above-the-fold hero images (priority loading)
 */
export const HeroImage = ({ src, alt, className = '' }) => {
  return (
    <OptimizedImage
      src={src}
      alt={alt}
      width={1920}
      height={1080}
      priority={true}
      className={className}
      sizes="100vw"
      objectFit="cover"
    />
  );
};

export default OptimizedImage;
