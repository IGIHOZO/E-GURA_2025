import { useState, useEffect } from 'react';

/**
 * Custom hook for responsive design
 * Detects device type and provides breakpoint information
 */
export const useResponsive = () => {
  const [deviceInfo, setDeviceInfo] = useState({
    isMobile: false,
    isTablet: false,
    isDesktop: false,
    isLargeDesktop: false,
    width: typeof window !== 'undefined' ? window.innerWidth : 1200,
    height: typeof window !== 'undefined' ? window.innerHeight : 800,
    orientation: 'landscape',
    breakpoint: 'lg'
  });

  useEffect(() => {
    const updateDeviceInfo = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      const orientation = width > height ? 'landscape' : 'portrait';

      // Breakpoints following Tailwind CSS standards
      // sm: 640px, md: 768px, lg: 1024px, xl: 1280px, 2xl: 1536px
      const isMobile = width < 768;
      const isTablet = width >= 768 && width < 1024;
      const isDesktop = width >= 1024 && width < 1536;
      const isLargeDesktop = width >= 1536;

      let breakpoint = 'xs';
      if (width >= 1536) breakpoint = '2xl';
      else if (width >= 1280) breakpoint = 'xl';
      else if (width >= 1024) breakpoint = 'lg';
      else if (width >= 768) breakpoint = 'md';
      else if (width >= 640) breakpoint = 'sm';

      setDeviceInfo({
        isMobile,
        isTablet,
        isDesktop,
        isLargeDesktop,
        width,
        height,
        orientation,
        breakpoint,
        // Utility flags
        isTouchDevice: 'ontouchstart' in window || navigator.maxTouchPoints > 0,
        isSmallMobile: width < 375,
        isMediumMobile: width >= 375 && width < 640,
        isLargeMobile: width >= 640 && width < 768,
      });
    };

    // Initial update
    updateDeviceInfo();

    // Listen for resize events
    window.addEventListener('resize', updateDeviceInfo);
    window.addEventListener('orientationchange', updateDeviceInfo);

    // Cleanup
    return () => {
      window.removeEventListener('resize', updateDeviceInfo);
      window.removeEventListener('orientationchange', updateDeviceInfo);
    };
  }, []);

  return deviceInfo;
};

/**
 * Hook to get responsive class names based on device
 */
export const useResponsiveClasses = () => {
  const device = useResponsive();

  return {
    container: device.isMobile 
      ? 'px-4 py-4' 
      : device.isTablet 
      ? 'px-6 py-6' 
      : device.isLargeDesktop
      ? 'px-12 py-8 max-w-[1920px] mx-auto'
      : 'px-8 py-8 max-w-7xl mx-auto',
    
    grid: device.isMobile
      ? 'grid grid-cols-2 gap-3'
      : device.isTablet
      ? 'grid grid-cols-3 gap-4'
      : device.isLargeDesktop
      ? 'grid grid-cols-5 gap-6'
      : 'grid grid-cols-4 gap-6',
    
    text: {
      h1: device.isMobile ? 'text-2xl' : device.isTablet ? 'text-3xl' : 'text-4xl',
      h2: device.isMobile ? 'text-xl' : device.isTablet ? 'text-2xl' : 'text-3xl',
      h3: device.isMobile ? 'text-lg' : device.isTablet ? 'text-xl' : 'text-2xl',
      body: device.isMobile ? 'text-sm' : 'text-base',
      small: device.isMobile ? 'text-xs' : 'text-sm',
    },
    
    spacing: {
      section: device.isMobile ? 'mb-6' : device.isTablet ? 'mb-8' : 'mb-12',
      card: device.isMobile ? 'p-3' : device.isTablet ? 'p-4' : 'p-6',
    },
    
    button: device.isMobile
      ? 'px-4 py-2 text-sm'
      : device.isTablet
      ? 'px-6 py-2.5 text-base'
      : 'px-8 py-3 text-base',
  };
};

export default useResponsive;
