import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useDeviceDetection } from '../utils/deviceDetection';

// Adaptive loading hook that optimizes based on device capabilities
export const useAdaptiveLoading = (options = {}) => {
  const { device, capabilities, loadingStrategy } = useDeviceDetection();
  const [loadingState, setLoadingState] = useState({
    isLoading: false,
    progress: 0,
    error: null,
    loadedItems: 0,
    totalItems: 0
  });

  const {
    initialLoad = true,
    batchSize = null, // Will be determined by device
    priority = 'normal',
    enablePrefetch = null, // Will be determined by device
    maxConcurrent = null // Will be determined by device
  } = options;

  // Adaptive configuration based on device
  const adaptiveConfig = useMemo(() => {
    const config = {
      batchSize: batchSize || (device.isLargeScreen ? 12 : device.isTablet ? 8 : 4),
      maxConcurrent: maxConcurrent || loadingStrategy.maxConcurrentRequests,
      enablePrefetch: enablePrefetch !== null ? enablePrefetch : loadingStrategy.prefetchNextPage,
      imageQuality: loadingStrategy.imageQuality,
      lazyLoadThreshold: loadingStrategy.lazyLoadThreshold,
      preloadCritical: device.isDesktop && loadingStrategy.preloadImages
    };

    // Adjust for performance tier
    if (device.performanceTier === 'high') {
      config.batchSize *= 1.5;
      config.maxConcurrent += 2;
    } else if (device.performanceTier === 'low') {
      config.batchSize = Math.max(2, Math.floor(config.batchSize * 0.5));
      config.maxConcurrent = Math.max(1, config.maxConcurrent - 1);
    }

    // Adjust for connection speed
    if (capabilities.isSlowConnection) {
      config.batchSize = Math.max(2, Math.floor(config.batchSize * 0.3));
      config.maxConcurrent = 1;
      config.enablePrefetch = false;
    }

    return config;
  }, [device, capabilities, loadingStrategy, batchSize, maxConcurrent, enablePrefetch]);

  // Load items with adaptive batching
  const loadItems = useCallback(async (items, loadFunction) => {
    if (!items || items.length === 0) return [];

    setLoadingState(prev => ({
      ...prev,
      isLoading: true,
      totalItems: items.length,
      loadedItems: 0,
      progress: 0,
      error: null
    }));

    const results = [];
    const { batchSize, maxConcurrent } = adaptiveConfig;

    try {
      // Process items in batches
      for (let i = 0; i < items.length; i += batchSize) {
        const batch = items.slice(i, i + batchSize);
        
        // Limit concurrent requests
        const chunks = [];
        for (let j = 0; j < batch.length; j += maxConcurrent) {
          chunks.push(batch.slice(j, j + maxConcurrent));
        }

        // Process each chunk
        for (const chunk of chunks) {
          const chunkPromises = chunk.map(item => loadFunction(item));
          const chunkResults = await Promise.allSettled(chunkPromises);
          
          chunkResults.forEach((result, index) => {
            if (result.status === 'fulfilled') {
              results.push(result.value);
            } else {
              console.warn('Failed to load item:', chunk[index], result.reason);
            }
          });

          // Update progress
          const loadedCount = results.length;
          setLoadingState(prev => ({
            ...prev,
            loadedItems: loadedCount,
            progress: (loadedCount / items.length) * 100
          }));

          // Add delay for low-end devices to prevent overwhelming
          if (device.performanceTier === 'low' && chunks.length > 1) {
            await new Promise(resolve => setTimeout(resolve, 100));
          }
        }
      }

      setLoadingState(prev => ({
        ...prev,
        isLoading: false,
        progress: 100
      }));

      return results;
    } catch (error) {
      setLoadingState(prev => ({
        ...prev,
        isLoading: false,
        error: error.message
      }));
      throw error;
    }
  }, [adaptiveConfig, device.performanceTier]);

  // Preload critical resources for desktop
  const preloadCritical = useCallback(async (resources) => {
    if (!adaptiveConfig.preloadCritical || !resources.length) return;

    const preloadPromises = resources.slice(0, 3).map(resource => {
      return new Promise((resolve) => {
        if (resource.type === 'image') {
          const img = new Image();
          img.onload = resolve;
          img.onerror = resolve;
          img.src = resource.url;
        } else if (resource.type === 'script') {
          const link = document.createElement('link');
          link.rel = 'preload';
          link.as = 'script';
          link.href = resource.url;
          link.onload = resolve;
          link.onerror = resolve;
          document.head.appendChild(link);
        } else {
          resolve();
        }
      });
    });

    await Promise.allSettled(preloadPromises);
  }, [adaptiveConfig.preloadCritical]);

  // Lazy load with intersection observer
  const useLazyLoad = useCallback((ref, callback) => {
    useEffect(() => {
      if (!ref.current || !capabilities.supportsIntersectionObserver) {
        callback();
        return;
      }

      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              callback();
              observer.unobserve(entry.target);
            }
          });
        },
        {
          rootMargin: adaptiveConfig.lazyLoadThreshold,
          threshold: 0.1
        }
      );

      observer.observe(ref.current);

      return () => observer.disconnect();
    }, [ref, callback]);
  }, [capabilities.supportsIntersectionObserver, adaptiveConfig.lazyLoadThreshold]);

  // Prefetch next page for desktop users
  const prefetchNextPage = useCallback(async (url) => {
    if (!adaptiveConfig.enablePrefetch || !url) return;

    try {
      const link = document.createElement('link');
      link.rel = 'prefetch';
      link.href = url;
      document.head.appendChild(link);
    } catch (error) {
      console.warn('Prefetch failed:', error);
    }
  }, [adaptiveConfig.enablePrefetch]);

  // Get optimized image URL
  const getOptimizedImageUrl = useCallback((baseUrl, width = 800) => {
    if (!baseUrl) return '';

    const quality = adaptiveConfig.imageQuality === 'high' ? 90 : 
                   adaptiveConfig.imageQuality === 'medium' ? 75 : 60;

    // Adjust width based on device
    let targetWidth = width;
    if (device.isLargeScreen) {
      targetWidth = Math.min(width * 1.5, 1600);
    } else if (device.isMobile) {
      targetWidth = Math.min(width * 0.7, 800);
    }

    // Add device pixel ratio for high DPI screens
    if (device.isHighDPI && device.performanceTier === 'high') {
      targetWidth *= device.pixelRatio;
    }

    return `${baseUrl}?w=${Math.round(targetWidth)}&q=${quality}&f=auto`;
  }, [adaptiveConfig.imageQuality, device]);

  return {
    // State
    loadingState,
    adaptiveConfig,
    
    // Methods
    loadItems,
    preloadCritical,
    useLazyLoad,
    prefetchNextPage,
    getOptimizedImageUrl,
    
    // Device info
    device,
    capabilities,
    loadingStrategy
  };
};

// Hook for adaptive product loading
export const useAdaptiveProductLoading = () => {
  const { loadItems, loadingState, adaptiveConfig, getOptimizedImageUrl } = useAdaptiveLoading();

  const loadProducts = useCallback(async (products) => {
    const loadProduct = async (product) => {
      // Optimize product images
      const optimizedProduct = {
        ...product,
        mainImage: getOptimizedImageUrl(product.mainImage || product.image),
        images: product.images?.map(img => getOptimizedImageUrl(img)) || []
      };

      return optimizedProduct;
    };

    return loadItems(products, loadProduct);
  }, [loadItems, getOptimizedImageUrl]);

  return {
    loadProducts,
    loadingState,
    adaptiveConfig
  };
};

// Hook for adaptive image loading
export const useAdaptiveImageLoading = () => {
  const { device, capabilities, getOptimizedImageUrl } = useAdaptiveLoading();

  const getResponsiveImageProps = useCallback((src, alt, sizes) => {
    const optimizedSrc = getOptimizedImageUrl(src);
    
    // Generate srcSet for different screen sizes
    const srcSet = [
      `${getOptimizedImageUrl(src, 400)} 400w`,
      `${getOptimizedImageUrl(src, 800)} 800w`,
      `${getOptimizedImageUrl(src, 1200)} 1200w`
    ];

    if (device.isLargeScreen) {
      srcSet.push(`${getOptimizedImageUrl(src, 1600)} 1600w`);
    }

    return {
      src: optimizedSrc,
      srcSet: srcSet.join(', '),
      sizes: sizes || (device.isLargeScreen ? 
        '(max-width: 1280px) 50vw, 33vw' : 
        '(max-width: 768px) 100vw, 50vw'
      ),
      loading: device.isDesktop ? 'eager' : 'lazy',
      decoding: 'async',
      alt
    };
  }, [device, getOptimizedImageUrl]);

  return {
    getResponsiveImageProps,
    supportsWebP: capabilities.supportsWebP,
    supportsAvif: capabilities.supportsAvif
  };
};

export default useAdaptiveLoading;
