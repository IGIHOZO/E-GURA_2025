import React, { useState, useEffect } from 'react';

const PWATestBanner = () => {
  const [showBanner, setShowBanner] = useState(false);
  const [deviceInfo, setDeviceInfo] = useState({});

  useEffect(() => {
    // Always show banner for testing
    setShowBanner(true);

    // Collect device info for debugging
    const info = {
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      screenWidth: window.innerWidth,
      screenHeight: window.innerHeight,
      touchPoints: navigator.maxTouchPoints,
      standalone: window.navigator.standalone,
      displayMode: window.matchMedia('(display-mode: standalone)').matches,
      isMobile: /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent),
      isIOS: /iPad|iPhone|iPod/.test(navigator.userAgent),
      isAndroid: /Android/.test(navigator.userAgent)
    };
    
    setDeviceInfo(info);
    console.log('PWA Test - Device Info:', info);
  }, []);

  const handleInstall = () => {
    // Check for beforeinstallprompt event
    if (window.deferredPrompt) {
      window.deferredPrompt.prompt();
      window.deferredPrompt.userChoice.then((choiceResult) => {
        console.log('User choice:', choiceResult);
        window.deferredPrompt = null;
      });
    } else {
      // Show manual instructions
      const isIOS = deviceInfo.isIOS;
      const isAndroid = deviceInfo.isAndroid;
      
      let message = 'To install E-Gura Store:\n\n';
      
      if (isIOS) {
        message += '1. Tap the Share button (📤) in Safari\n';
        message += '2. Scroll down and tap "Add to Home Screen"\n';
        message += '3. Tap "Add" to confirm';
      } else if (isAndroid) {
        message += '1. Tap the menu button (⋮) in your browser\n';
        message += '2. Tap "Add to Home screen" or "Install app"\n';
        message += '3. Tap "Add" or "Install" to confirm';
      } else {
        message += 'Look for the install option in your browser menu\n';
        message += 'or check the address bar for an install icon.';
      }
      
      alert(message);
    }
  };

  if (!showBanner) return null;

  return (
    <>
      {/* PWA Install Banner */}
      <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-r from-orange-500 to-orange-600 text-white p-4 shadow-lg z-50 animate-slide-up">
        <div className="max-w-md mx-auto">
          <div className="flex items-center justify-between mb-2">
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
                onClick={handleInstall}
                className="bg-white text-orange-600 px-4 py-2 rounded-full text-sm font-semibold hover:bg-gray-100 transition-colors"
              >
                Install
              </button>
              <button
                onClick={() => setShowBanner(false)}
                className="text-white opacity-70 hover:opacity-100 p-1"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
          
          {/* Device Debug Info */}
          <div className="text-xs opacity-75 bg-black bg-opacity-20 rounded p-2">
            <div className="grid grid-cols-2 gap-1">
              <span>Mobile: {deviceInfo.isMobile ? '✅' : '❌'}</span>
              <span>iOS: {deviceInfo.isIOS ? '✅' : '❌'}</span>
              <span>Android: {deviceInfo.isAndroid ? '✅' : '❌'}</span>
              <span>Touch: {deviceInfo.touchPoints > 0 ? '✅' : '❌'}</span>
              <span>Width: {deviceInfo.screenWidth}px</span>
              <span>Standalone: {deviceInfo.standalone ? '✅' : '❌'}</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default PWATestBanner;
