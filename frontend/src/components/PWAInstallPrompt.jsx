import React, { useState, useEffect } from 'react';
import { useDeviceDetection } from '../utils/deviceDetection';

const PWAInstallPrompt = () => {
  const { device } = useDeviceDetection();
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    // Check if app is already installed
    const checkIfInstalled = () => {
      // Check if running in standalone mode (installed PWA)
      if (window.matchMedia('(display-mode: standalone)').matches) {
        setIsInstalled(true);
        return;
      }
      
      // Check if running in PWA mode on iOS
      if (window.navigator.standalone === true) {
        setIsInstalled(true);
        return;
      }
    };

    checkIfInstalled();

    // Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (e) => {
      console.log('PWA: beforeinstallprompt event fired');
      e.preventDefault();
      setDeferredPrompt(e);
      
      // Only show prompt on mobile devices
      if (device.isMobile || device.isTablet) {
        // Show banner after 3 seconds on mobile
        setTimeout(() => {
          setShowBanner(true);
        }, 3000);
      }
    };

    // Listen for app installed event
    const handleAppInstalled = () => {
      console.log('PWA: App was installed');
      setIsInstalled(true);
      setShowInstallPrompt(false);
      setShowBanner(false);
      setDeferredPrompt(null);
      
      // Show success message
      showInstallSuccessMessage();
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, [device]);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      // Fallback for iOS or browsers without native prompt
      setShowInstallPrompt(true);
      return;
    }

    try {
      // Show the install prompt
      const result = await deferredPrompt.prompt();
      console.log('PWA: User response to install prompt:', result);
      
      // Wait for the user to respond to the prompt
      const choiceResult = await deferredPrompt.userChoice;
      
      if (choiceResult.outcome === 'accepted') {
        console.log('PWA: User accepted the install prompt');
      } else {
        console.log('PWA: User dismissed the install prompt');
      }
      
      setDeferredPrompt(null);
      setShowBanner(false);
    } catch (error) {
      console.error('PWA: Error showing install prompt:', error);
    }
  };

  const handleDismissBanner = () => {
    setShowBanner(false);
    // Don't show again for 24 hours
    localStorage.setItem('pwa-banner-dismissed', Date.now().toString());
  };

  const showInstallSuccessMessage = () => {
    // Create a temporary success notification
    const notification = document.createElement('div');
    notification.className = 'fixed top-4 right-4 bg-green-500 text-white p-4 rounded-lg shadow-lg z-50 animate-slide-in';
    notification.innerHTML = `
      <div class="flex items-center">
        <svg class="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
        </svg>
        <div>
          <p class="font-semibold">E-Gura Store Installed!</p>
          <p class="text-sm">You can now access the app from your home screen</p>
        </div>
      </div>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.remove();
    }, 5000);
  };

  // Check if banner was recently dismissed
  const wasBannerRecentlyDismissed = () => {
    const dismissed = localStorage.getItem('pwa-banner-dismissed');
    if (!dismissed) return false;
    
    const dismissedTime = parseInt(dismissed);
    const now = Date.now();
    const twentyFourHours = 24 * 60 * 60 * 1000;
    
    return (now - dismissedTime) < twentyFourHours;
  };

  // Don't show anything if already installed or recently dismissed
  if (isInstalled || wasBannerRecentlyDismissed()) {
    return null;
  }

  // Mobile install banner
  if (showBanner && (device.isMobile || device.isTablet)) {
    return (
      <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-r from-orange-500 to-orange-600 text-white p-4 shadow-lg z-50 animate-slide-up">
        <div className="flex items-center justify-between max-w-sm mx-auto">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center mr-3">
              <img 
                src="/icon-192x192.png" 
                alt="E-Gura Store" 
                className="w-8 h-8"
                onError={(e) => {
                  e.target.src = '/favicon.ico';
                }}
              />
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
              onClick={handleDismissBanner}
              className="text-white opacity-70 hover:opacity-100 p-1"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Manual install prompt modal (for iOS and fallback)
  if (showInstallPrompt) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg p-6 max-w-sm w-full">
          <div className="text-center">
            <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <img 
                src="/icon-192x192.png" 
                alt="E-Gura Store" 
                className="w-10 h-10"
                onError={(e) => {
                  e.target.src = '/favicon.ico';
                }}
              />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Install E-Gura Store
            </h3>
            <p className="text-gray-600 mb-6 text-sm">
              Add E-Gura Store to your home screen for quick access and a better shopping experience.
            </p>
            
            {/* iOS Instructions */}
            {device.isMobile && navigator.userAgent.includes('iPhone') && (
              <div className="text-left mb-6">
                <p className="text-sm font-semibold mb-2">To install on iPhone:</p>
                <ol className="text-xs text-gray-600 space-y-1">
                  <li>1. Tap the Share button <span className="inline-block">📤</span></li>
                  <li>2. Scroll down and tap "Add to Home Screen"</li>
                  <li>3. Tap "Add" to confirm</li>
                </ol>
              </div>
            )}
            
            {/* Android Instructions */}
            {device.isMobile && navigator.userAgent.includes('Android') && (
              <div className="text-left mb-6">
                <p className="text-sm font-semibold mb-2">To install on Android:</p>
                <ol className="text-xs text-gray-600 space-y-1">
                  <li>1. Tap the menu button (⋮)</li>
                  <li>2. Tap "Add to Home screen"</li>
                  <li>3. Tap "Add" to confirm</li>
                </ol>
              </div>
            )}
            
            <div className="flex space-x-3">
              <button
                onClick={() => setShowInstallPrompt(false)}
                className="flex-1 px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Maybe Later
              </button>
              <button
                onClick={() => setShowInstallPrompt(false)}
                className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
              >
                Got It
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

// Hook for PWA installation status
export const usePWAInstall = () => {
  const [isInstalled, setIsInstalled] = useState(false);
  const [canInstall, setCanInstall] = useState(false);

  useEffect(() => {
    // Check if PWA is installed
    const checkInstallStatus = () => {
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
      const isIOSStandalone = window.navigator.standalone === true;
      setIsInstalled(isStandalone || isIOSStandalone);
    };

    // Check if PWA can be installed
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setCanInstall(true);
    };

    checkInstallStatus();
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  return { isInstalled, canInstall };
};

export default PWAInstallPrompt;
