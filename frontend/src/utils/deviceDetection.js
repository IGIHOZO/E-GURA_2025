// Advanced Device Detection and Responsive Utilities
// Detects device type, screen size, capabilities, and optimizes accordingly

import { useState, useEffect } from 'react';

class DeviceDetector {
  constructor() {
    this.breakpoints = {
      xs: 0,     // Extra small devices (phones)
      sm: 640,   // Small devices (large phones)
      md: 768,   // Medium devices (tablets)
      lg: 1024,  // Large devices (laptops)
      xl: 1280,  // Extra large devices (desktops)
      '2xl': 1536 // 2X large devices (large desktops)
    };

    this.deviceTypes = {
      mobile: { min: 0, max: 767 },
      tablet: { min: 768, max: 1023 },
      desktop: { min: 1024, max: 1279 },
      largeDesktop: { min: 1280, max: Infinity }
    };

    this.currentDevice = this.detectDevice();
    this.capabilities = this.detectCapabilities();
    
    // Initialize listeners
    this.initializeListeners();
  }

  // Detect current device type and screen size
  detectDevice() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const userAgent = navigator.userAgent.toLowerCase();
    const pixelRatio = window.devicePixelRatio || 1;

    // Determine device type
    let deviceType = 'desktop';
    let screenSize = 'lg';

    if (width <= this.deviceTypes.mobile.max) {
      deviceType = 'mobile';
      screenSize = width <= this.breakpoints.sm ? 'xs' : 'sm';
    } else if (width <= this.deviceTypes.tablet.max) {
      deviceType = 'tablet';
      screenSize = 'md';
    } else if (width <= this.deviceTypes.desktop.max) {
      deviceType = 'desktop';
      screenSize = 'lg';
    } else {
      deviceType = 'largeDesktop';
      screenSize = width >= this.breakpoints['2xl'] ? '2xl' : 'xl';
    }

    // Detect specific device characteristics
    const isMobile = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent);
    const isTablet = /ipad|android(?!.*mobile)/i.test(userAgent) || (width >= 768 && width <= 1024);
    const isDesktop = !isMobile && !isTablet;
    const isLargeScreen = width >= 1280;
    const isHighDPI = pixelRatio > 1.5;

    // Performance tier based on device
    let performanceTier = 'medium';
    if (deviceType === 'mobile') {
      performanceTier = 'low';
    } else if (deviceType === 'largeDesktop') {
      performanceTier = 'high';
    }

    return {
      type: deviceType,
      screenSize,
      width,
      height,
      pixelRatio,
      isMobile,
      isTablet,
      isDesktop,
      isLargeScreen,
      isHighDPI,
      performanceTier,
      orientation: width > height ? 'landscape' : 'portrait',
      aspectRatio: (width / height).toFixed(2)
    };
  }

  // Detect device capabilities
  detectCapabilities() {
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    
    return {
      // Network capabilities
      connectionType: connection?.effectiveType || 'unknown',
      isSlowConnection: connection?.effectiveType === 'slow-2g' || connection?.effectiveType === '2g',
      isFastConnection: connection?.effectiveType === '4g' || connection?.effectiveType === '5g',
      
      // Hardware capabilities
      hardwareConcurrency: navigator.hardwareConcurrency || 4,
      maxTouchPoints: navigator.maxTouchPoints || 0,
      
      // Browser capabilities
      supportsWebP: this.supportsWebP(),
      supportsAvif: this.supportsAvif(),
      supportsIntersectionObserver: 'IntersectionObserver' in window,
      supportsServiceWorker: 'serviceWorker' in navigator,
      
      // Memory and performance
      deviceMemory: navigator.deviceMemory || 4,
      isLowEndDevice: (navigator.deviceMemory || 4) < 4,
      isHighEndDevice: (navigator.deviceMemory || 4) >= 8,
      
      // Display capabilities
      colorDepth: screen.colorDepth,
      colorGamut: this.detectColorGamut(),
      prefersReducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches
    };
  }

  // Check WebP support
  supportsWebP() {
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
  }

  // Check AVIF support
  supportsAvif() {
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    return canvas.toDataURL('image/avif').indexOf('data:image/avif') === 0;
  }

  // Detect color gamut
  detectColorGamut() {
    if (window.matchMedia('(color-gamut: p3)').matches) return 'p3';
    if (window.matchMedia('(color-gamut: srgb)').matches) return 'srgb';
    return 'unknown';
  }

  // Get optimized loading strategy based on device
  getLoadingStrategy() {
    const { performanceTier, isLargeScreen, isMobile } = this.currentDevice;
    const { isSlowConnection, isLowEndDevice } = this.capabilities;

    if (isLargeScreen && performanceTier === 'high' && !isSlowConnection) {
      return {
        strategy: 'aggressive',
        preloadImages: true,
        lazyLoadThreshold: '200px',
        chunkSize: 'large',
        prefetchNextPage: true,
        enableAnimations: true,
        imageQuality: 'high',
        maxConcurrentRequests: 6
      };
    } else if (isMobile || isLowEndDevice || isSlowConnection) {
      return {
        strategy: 'conservative',
        preloadImages: false,
        lazyLoadThreshold: '50px',
        chunkSize: 'small',
        prefetchNextPage: false,
        enableAnimations: false,
        imageQuality: 'medium',
        maxConcurrentRequests: 2
      };
    } else {
      return {
        strategy: 'balanced',
        preloadImages: true,
        lazyLoadThreshold: '100px',
        chunkSize: 'medium',
        prefetchNextPage: true,
        enableAnimations: true,
        imageQuality: 'high',
        maxConcurrentRequests: 4
      };
    }
  }

  // Get responsive image configuration
  getImageConfig() {
    const { isHighDPI, isLargeScreen, performanceTier } = this.currentDevice;
    const { supportsWebP, supportsAvif, isSlowConnection } = this.capabilities;

    let format = 'jpeg';
    if (supportsAvif && performanceTier === 'high') format = 'avif';
    else if (supportsWebP) format = 'webp';

    let quality = 80;
    if (isSlowConnection) quality = 60;
    else if (performanceTier === 'high') quality = 90;

    let sizes = '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw';
    if (isLargeScreen) {
      sizes = '(max-width: 1280px) 25vw, 20vw';
    }

    return {
      format,
      quality,
      sizes,
      loading: isLargeScreen ? 'eager' : 'lazy',
      decoding: 'async',
      fetchPriority: isLargeScreen ? 'high' : 'auto'
    };
  }

  // Initialize event listeners for device changes
  initializeListeners() {
    // Listen for orientation changes
    window.addEventListener('orientationchange', () => {
      setTimeout(() => {
        this.currentDevice = this.detectDevice();
        this.notifyDeviceChange();
      }, 100);
    });

    // Listen for resize events (throttled)
    let resizeTimeout;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        const newDevice = this.detectDevice();
        if (newDevice.type !== this.currentDevice.type || 
            newDevice.screenSize !== this.currentDevice.screenSize) {
          this.currentDevice = newDevice;
          this.notifyDeviceChange();
        }
      }, 250);
    });

    // Listen for connection changes
    if (navigator.connection) {
      navigator.connection.addEventListener('change', () => {
        this.capabilities = this.detectCapabilities();
        this.notifyDeviceChange();
      });
    }
  }

  // Notify components of device changes
  notifyDeviceChange() {
    const event = new CustomEvent('deviceChange', {
      detail: {
        device: this.currentDevice,
        capabilities: this.capabilities,
        loadingStrategy: this.getLoadingStrategy()
      }
    });
    window.dispatchEvent(event);
  }

  // Get CSS classes for current device
  getCSSClasses() {
    const { type, screenSize, isHighDPI, orientation } = this.currentDevice;
    const { isSlowConnection, prefersReducedMotion } = this.capabilities;

    return [
      `device-${type}`,
      `screen-${screenSize}`,
      `orientation-${orientation}`,
      isHighDPI ? 'high-dpi' : 'standard-dpi',
      isSlowConnection ? 'slow-connection' : 'fast-connection',
      prefersReducedMotion ? 'reduced-motion' : 'full-motion'
    ].join(' ');
  }

  // Get performance recommendations
  getPerformanceRecommendations() {
    const { performanceTier, isLargeScreen } = this.currentDevice;
    const { isSlowConnection, isLowEndDevice } = this.capabilities;

    const recommendations = [];

    if (isLargeScreen && performanceTier === 'high') {
      recommendations.push('Enable high-quality images');
      recommendations.push('Preload critical resources');
      recommendations.push('Use aggressive caching');
      recommendations.push('Enable all animations');
    }

    if (isSlowConnection) {
      recommendations.push('Reduce image quality');
      recommendations.push('Minimize initial bundle');
      recommendations.push('Defer non-critical resources');
    }

    if (isLowEndDevice) {
      recommendations.push('Disable heavy animations');
      recommendations.push('Reduce concurrent requests');
      recommendations.push('Use smaller image sizes');
    }

    return recommendations;
  }
}

// Create singleton instance
const deviceDetector = new DeviceDetector();

// Export utilities
export default deviceDetector;

export const useDeviceDetection = () => {
  return {
    device: deviceDetector.currentDevice,
    capabilities: deviceDetector.capabilities,
    loadingStrategy: deviceDetector.getLoadingStrategy(),
    imageConfig: deviceDetector.getImageConfig(),
    cssClasses: deviceDetector.getCSSClasses(),
    recommendations: deviceDetector.getPerformanceRecommendations()
  };
};

// React hook for device detection

export const useResponsiveDevice = () => {
  const [deviceInfo, setDeviceInfo] = useState({
    device: deviceDetector.currentDevice,
    capabilities: deviceDetector.capabilities
  });

  useEffect(() => {
    const handleDeviceChange = (event) => {
      setDeviceInfo({
        device: event.detail.device,
        capabilities: event.detail.capabilities
      });
    };

    window.addEventListener('deviceChange', handleDeviceChange);
    return () => window.removeEventListener('deviceChange', handleDeviceChange);
  }, []);

  return deviceInfo;
};

// Utility functions
export const isMobile = () => deviceDetector.currentDevice.isMobile;
export const isTablet = () => deviceDetector.currentDevice.isTablet;
export const isDesktop = () => deviceDetector.currentDevice.isDesktop;
export const isLargeScreen = () => deviceDetector.currentDevice.isLargeScreen;
export const getScreenSize = () => deviceDetector.currentDevice.screenSize;
export const getPerformanceTier = () => deviceDetector.currentDevice.performanceTier;
