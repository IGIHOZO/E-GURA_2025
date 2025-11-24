// Device Detection Utility

export const detectDevice = () => {
  const ua = navigator.userAgent;
  
  const device = {
    isMobile: /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua),
    isTablet: /iPad|Android/i.test(ua) && !/Mobile/i.test(ua),
    isDesktop: !/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua),
    isIOS: /iPhone|iPad|iPod/i.test(ua),
    isAndroid: /Android/i.test(ua),
    isChrome: /Chrome/i.test(ua),
    isSafari: /Safari/i.test(ua) && !/Chrome/i.test(ua),
    isFirefox: /Firefox/i.test(ua),
    screenWidth: window.innerWidth,
    screenHeight: window.innerHeight,
    orientation: window.innerWidth > window.innerHeight ? 'landscape' : 'portrait'
  };

  return device;
};

export const getDeviceType = () => {
  const width = window.innerWidth;
  
  if (width < 640) return 'mobile';
  if (width < 1024) return 'tablet';
  return 'desktop';
};

export const isTouchDevice = () => {
  return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
};

export const getViewportSize = () => {
  return {
    width: window.innerWidth,
    height: window.innerHeight
  };
};

export const isLowEndDevice = () => {
  // Check for low-end devices based on hardware concurrency
  const cores = navigator.hardwareConcurrency || 2;
  const memory = navigator.deviceMemory || 4;
  
  return cores <= 2 || memory <= 2;
};

// React Hook for device detection
export const useDeviceDetect = () => {
  const [device, setDevice] = React.useState(detectDevice());

  React.useEffect(() => {
    const handleResize = () => {
      setDevice(detectDevice());
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, []);

  return device;
};

export default {
  detectDevice,
  getDeviceType,
  isTouchDevice,
  getViewportSize,
  isLowEndDevice
};
