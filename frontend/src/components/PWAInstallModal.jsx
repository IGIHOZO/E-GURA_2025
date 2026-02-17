import React, { useState, useEffect } from 'react';
import { forceBrowserInstall, simulateInstallPrompt } from '../utils/forceInstall';

const PWAInstallModal = () => {
  const [showModal, setShowModal] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstalling, setIsInstalling] = useState(false);
  const [deviceInfo, setDeviceInfo] = useState({});
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Detect device and check if already installed
    const detectDevice = () => {
      const userAgent = navigator.userAgent.toLowerCase();
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
      const isIOSStandalone = window.navigator.standalone === true;
      const alreadyInstalled = isStandalone || isIOSStandalone;
      
      const info = {
        userAgent: navigator.userAgent,
        isMobile: /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent),
        isIOS: /ipad|iphone|ipod/.test(userAgent),
        isAndroid: /android/.test(userAgent),
        screenWidth: window.innerWidth,
        touchPoints: navigator.maxTouchPoints,
        isStandalone: isStandalone,
        isIOSStandalone: isIOSStandalone,
        alreadyInstalled: alreadyInstalled
      };
      
      setDeviceInfo(info);
      setIsInstalled(alreadyInstalled);
      
      console.log('PWA: Device detection:', info);
      
      // Show modal if mobile and not installed
      if (info.isMobile && !alreadyInstalled) {
        // Check if user dismissed recently
        const dismissed = localStorage.getItem('pwa-modal-dismissed');
        const dismissedTime = dismissed ? parseInt(dismissed) : 0;
        const oneHour = 60 * 60 * 1000;
        
        if (!dismissed || (Date.now() - dismissedTime) > oneHour) {
          setTimeout(() => {
            setShowModal(true);
          }, 2000); // Show after 2 seconds
        }
      }
      
      return info;
    };

    detectDevice();

    // Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (e) => {
      console.log('PWA: beforeinstallprompt event captured');
      e.preventDefault();
      setDeferredPrompt(e);
      
      // Show modal if mobile and not already shown
      if (deviceInfo.isMobile && !isInstalled && !showModal) {
        setShowModal(true);
      }
    };

    // Listen for app installed event
    const handleAppInstalled = () => {
      console.log('PWA: App installed successfully');
      setIsInstalled(true);
      setShowModal(false);
      setDeferredPrompt(null);
      
      // Show success message
      setTimeout(() => {
        alert('🎉 E-Gura Store installed successfully!\nYou can now access it from your home screen.');
      }, 500);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallYes = async () => {
    setIsInstalling(true);
    
    try {
      // First try native prompt if available
      if (deferredPrompt) {
        console.log('PWA: Using native install prompt');
        
        const result = await deferredPrompt.prompt();
        console.log('PWA: Prompt result:', result);
        
        const choiceResult = await deferredPrompt.userChoice;
        console.log('PWA: User choice:', choiceResult);
        
        if (choiceResult.outcome === 'accepted') {
          console.log('PWA: User accepted installation');
          setShowModal(false);
          return;
        } else {
          console.log('PWA: User declined installation');
          setIsInstalling(false);
          return;
        }
      }
      
      // If no native prompt, try to force install
      console.log('PWA: No native prompt, attempting force install');
      
      // For testing, simulate install prompt
      if (process.env.NODE_ENV === 'development') {
        console.log('PWA: Development mode - simulating install prompt');
        simulateInstallPrompt();
        
        // Try again with simulated prompt
        if (window.deferredPrompt) {
          const result = await window.deferredPrompt.prompt();
          console.log('PWA: Simulated prompt result:', result);
          setShowModal(false);
          return;
        }
      }
      
      // Force browser-specific install
      const forceResult = await forceBrowserInstall();
      console.log('PWA: Force install result:', forceResult);
      
      if (forceResult.success) {
        setShowModal(false);
      } else {
        setIsInstalling(false);
      }
      
    } catch (error) {
      console.error('PWA: Installation error:', error);
      setIsInstalling(false);
      
      // Fallback to manual instructions
      showManualInstructions();
    }
  };

  const showManualInstructions = () => {
    setShowModal(false);
    
    let title = 'Install E-Gura Store';
    let instructions = '';
    
    if (deviceInfo.isIOS) {
      instructions = `To install E-Gura Store on your iPhone/iPad:

1. Tap the Share button (📤) at the bottom of Safari
2. Scroll down and tap "Add to Home Screen"
3. Tap "Add" to confirm
4. The app icon will appear on your home screen

You can then open E-Gura Store like any other app!`;
    } else if (deviceInfo.isAndroid) {
      instructions = `To install E-Gura Store on your Android device:

1. Tap the menu button (⋮) in your browser
2. Look for "Add to Home screen" or "Install app"
3. Tap it and then tap "Add" or "Install"
4. The app icon will appear on your home screen

You can then open E-Gura Store like any other app!`;
    } else {
      instructions = `To install E-Gura Store:

1. Look for an install icon in your browser's address bar
2. Or check your browser's menu for "Install" option
3. Follow the prompts to install
4. The app will be available in your applications

You can then open E-Gura Store like any other app!`;
    }
    
    // Create a custom modal for instructions
    const instructionModal = document.createElement('div');
    instructionModal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50';
    instructionModal.innerHTML = `
      <div class="bg-white rounded-lg p-6 max-w-sm w-full">
        <div class="text-center mb-4">
          <div class="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span class="text-3xl">🛍️</span>
          </div>
          <h3 class="text-lg font-bold text-gray-900">${title}</h3>
        </div>
        <div class="text-sm text-gray-600 whitespace-pre-line mb-6">${instructions}</div>
        <button onclick="this.parentElement.parentElement.remove()" 
                class="w-full bg-orange-600 text-white py-3 rounded-lg font-semibold hover:bg-orange-700">
          Got It!
        </button>
      </div>
    `;
    
    document.body.appendChild(instructionModal);
    
    // Auto-remove after 30 seconds
    setTimeout(() => {
      if (document.body.contains(instructionModal)) {
        instructionModal.remove();
      }
    }, 30000);
  };

  const handleInstallNo = () => {
    console.log('PWA: User declined installation');
    setShowModal(false);
    
    // Remember dismissal for 1 hour
    localStorage.setItem('pwa-modal-dismissed', Date.now().toString());
  };

  const handleClose = () => {
    console.log('PWA: Modal closed');
    setShowModal(false);
    
    // Remember dismissal for 1 hour
    localStorage.setItem('pwa-modal-dismissed', Date.now().toString());
  };

  // Don't show if already installed
  if (isInstalled || !showModal) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center p-4 z-50">
      <div className="bg-white bg-opacity-95 backdrop-blur-sm rounded-xl shadow-2xl max-w-xs w-full mx-4 animate-scale-in border border-white border-opacity-20">
        {/* Close button */}
        <div className="flex justify-end p-2">
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        {/* Content */}
        <div className="px-4 pb-4 text-center">
          {/* App Icon */}
          <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-orange-600 rounded-lg flex items-center justify-center mx-auto mb-3 shadow-lg">
            <span className="text-xl">🛍️</span>
          </div>
          
          {/* Title */}
          <h3 className="text-lg font-bold text-gray-900 mb-2">
            Install E-Gura Store
          </h3>
          
          {/* Description */}
          <p className="text-gray-600 mb-4 text-xs leading-relaxed">
            Get the app for faster shopping and offline access
          </p>
          
          {/* Buttons */}
          <div className="space-y-2">
            <button
              onClick={handleInstallYes}
              disabled={isInstalling}
              className="w-full bg-orange-600 text-white py-2 px-3 rounded-lg text-sm font-semibold hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isInstalling ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-2"></div>
                  Installing...
                </div>
              ) : (
                'Install App'
              )}
            </button>
            
            <button
              onClick={handleInstallNo}
              className="w-full bg-gray-100 bg-opacity-80 text-gray-700 py-2 px-3 rounded-lg text-sm font-semibold hover:bg-gray-200 transition-colors"
            >
              Maybe Later
            </button>
          </div>
          
          {/* Debug info and force install (development only) */}
          {process.env.NODE_ENV === 'development' && (
            <div className="mt-3 p-2 bg-gray-50 bg-opacity-80 rounded text-xs">
              <div className="font-semibold mb-1">Debug:</div>
              <div className="grid grid-cols-2 gap-1 text-xs mb-2">
                <span>Mobile: {deviceInfo.isMobile ? '✅' : '❌'}</span>
                <span>Prompt: {deferredPrompt ? '✅' : '❌'}</span>
              </div>
              <button
                onClick={() => {
                  console.log('Force install triggered manually');
                  forceBrowserInstall();
                }}
                className="w-full bg-blue-500 text-white py-1 px-2 rounded text-xs font-semibold hover:bg-blue-600 transition-colors"
              >
                Force Install (Test)
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PWAInstallModal;
