import React, { useState, useEffect } from 'react';

const SimplePWAPrompt = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showBanner, setShowBanner] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Simple mobile detection
    const detectMobile = () => {
      const userAgent = navigator.userAgent.toLowerCase();
      const isMobileUA = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent);
      const isSmallScreen = window.innerWidth <= 768;
      const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      
      return isMobileUA || (isSmallScreen && isTouchDevice);
    };

    // Check if already installed
    const checkInstalled = () => {
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
      const isIOSStandalone = window.navigator.standalone === true;
      return isStandalone || isIOSStandalone;
    };

    const mobile = detectMobile();
    const installed = checkInstalled();
    
    setIsMobile(mobile);
    setIsInstalled(installed);

    console.log('PWA: Mobile detected:', mobile);
    console.log('PWA: Already installed:', installed);

    // Show banner immediately for testing if mobile and not installed
    if (mobile && !installed) {
      console.log('PWA: Showing banner for mobile device');
      setTimeout(() => {
        setShowBanner(true);
      }, 2000); // Show after 2 seconds
    }

    // Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (e) => {
      console.log('PWA: beforeinstallprompt event fired');
      e.preventDefault();
      setDeferredPrompt(e);
      
      // Show banner if mobile
      if (mobile && !installed) {
        setShowBanner(true);
      }
    };

    // Listen for app installed event
    const handleAppInstalled = () => {
      console.log('PWA: App was installed');
      setIsInstalled(true);
      setShowBanner(false);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    console.log('PWA: Install button clicked');
    
    if (deferredPrompt) {
      console.log('PWA: Using deferred prompt');
      try {
        const result = await deferredPrompt.prompt();
        console.log('PWA: Prompt result:', result);
        
        const choiceResult = await deferredPrompt.userChoice;
        console.log('PWA: User choice:', choiceResult);
        
        if (choiceResult.outcome === 'accepted') {
          console.log('PWA: User accepted install');
        }
        
        setDeferredPrompt(null);
        setShowBanner(false);
      } catch (error) {
        console.error('PWA: Install error:', error);
      }
    } else {
      console.log('PWA: No deferred prompt, showing manual instructions');
      // Show manual install instructions
      showManualInstructions();
    }
  };

  const showManualInstructions = () => {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isAndroid = /Android/.test(navigator.userAgent);
    
    let instructions = '';
    if (isIOS) {
      instructions = 'To install:\n1. Tap the Share button (📤)\n2. Tap "Add to Home Screen"\n3. Tap "Add"';
    } else if (isAndroid) {
      instructions = 'To install:\n1. Tap the menu (⋮)\n2. Tap "Add to Home screen"\n3. Tap "Add"';
    } else {
      instructions = 'To install:\nLook for the install option in your browser menu';
    }
    
    alert(`Install E-Gura Store\n\n${instructions}`);
  };

  const handleDismiss = () => {
    console.log('PWA: Banner dismissed');
    setShowBanner(false);
    // Remember dismissal for 1 hour
    localStorage.setItem('pwa-banner-dismissed', Date.now().toString());
  };

  // Check if recently dismissed
  const wasRecentlyDismissed = () => {
    const dismissed = localStorage.getItem('pwa-banner-dismissed');
    if (!dismissed) return false;
    
    const dismissedTime = parseInt(dismissed);
    const oneHour = 60 * 60 * 1000;
    return (Date.now() - dismissedTime) < oneHour;
  };

  // Don't show if installed or recently dismissed
  if (isInstalled || wasRecentlyDismissed()) {
    return null;
  }

  // Always show banner on mobile for testing (remove the mobile check temporarily)
  const shouldShowBanner = showBanner || (isMobile && !isInstalled);

  if (shouldShowBanner) {
    return (
      <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-r from-orange-500 to-orange-600 text-white p-4 shadow-lg z-50 animate-slide-up">
        <div className="flex items-center justify-between max-w-sm mx-auto">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center mr-3">
              <span className="text-2xl">🛍️</span>
            </div>
            <div>
              <p className="font-semibold text-sm">Install E-Gura Store</p>
              <p className="text-xs opacity-90">Get the app for faster shopping</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleInstallClick}
              className="bg-white text-orange-600 px-3 py-1 rounded-full text-sm font-semibold hover:bg-gray-100 transition-colors"
            >
              Install
            </button>
            <button
              onClick={handleDismiss}
              className="text-white opacity-70 hover:opacity-100 p-1"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
        
        {/* Debug info - remove in production */}
        <div className="mt-2 text-xs opacity-75 text-center">
          Mobile: {isMobile ? 'Yes' : 'No'} | 
          Installed: {isInstalled ? 'Yes' : 'No'} | 
          Prompt: {deferredPrompt ? 'Ready' : 'None'}
        </div>
      </div>
    );
  }

  return null;
};

export default SimplePWAPrompt;
