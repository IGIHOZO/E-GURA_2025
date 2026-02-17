import React, { useState, useEffect } from 'react';

const RealHomeScreenInstall = () => {
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [deviceInfo, setDeviceInfo] = useState({});
  const [isInstalled, setIsInstalled] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);

  useEffect(() => {
    // Detect device and installation status
    const detectDevice = () => {
      const userAgent = navigator.userAgent.toLowerCase();
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
      const isIOSStandalone = window.navigator.standalone === true;
      const alreadyInstalled = isStandalone || isIOSStandalone;
      
      const info = {
        isMobile: /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent),
        isIOS: /ipad|iphone|ipod/.test(userAgent),
        isAndroid: /android/.test(userAgent),
        isSafari: /safari/.test(userAgent) && !/chrome/.test(userAgent),
        isChrome: /chrome/.test(userAgent),
        screenWidth: window.innerWidth,
        alreadyInstalled: alreadyInstalled
      };
      
      setDeviceInfo(info);
      setIsInstalled(alreadyInstalled);
      
      console.log('Real Home Screen: Device detected:', info);
      
      // Show install prompt for mobile devices that aren't installed
      if (info.isMobile && !alreadyInstalled) {
        setTimeout(() => {
          setShowInstallPrompt(true);
        }, 2000);
      }
      
      return info;
    };

    detectDevice();

    // Listen for beforeinstallprompt event (Android Chrome)
    const handleBeforeInstallPrompt = (e) => {
      console.log('Real Home Screen: beforeinstallprompt event captured');
      e.preventDefault();
      setDeferredPrompt(e);
      
      // Show install prompt
      if (deviceInfo.isMobile && !isInstalled) {
        setShowInstallPrompt(true);
      }
    };

    // Listen for app installed event
    const handleAppInstalled = () => {
      console.log('Real Home Screen: App installed to device home screen');
      setIsInstalled(true);
      setShowInstallPrompt(false);
      setDeferredPrompt(null);
      
      // Show success message
      showRealInstallSuccess();
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleRealInstall = async () => {
    setIsInstalling(true);
    
    try {
      if (deviceInfo.isAndroid && deferredPrompt) {
        // Android Chrome - use native install prompt
        console.log('Real Home Screen: Using Android native install');
        
        const result = await deferredPrompt.prompt();
        console.log('Real Home Screen: Prompt result:', result);
        
        const choiceResult = await deferredPrompt.userChoice;
        console.log('Real Home Screen: User choice:', choiceResult);
        
        if (choiceResult.outcome === 'accepted') {
          console.log('Real Home Screen: User accepted - app will be added to home screen');
          // The appinstalled event will handle success
        } else {
          console.log('Real Home Screen: User declined installation');
          setIsInstalling(false);
        }
        
        setDeferredPrompt(null);
        
      } else if (deviceInfo.isIOS && deviceInfo.isSafari) {
        // iOS Safari - trigger share menu
        console.log('Real Home Screen: Triggering iOS Safari share menu');
        
        // Try to trigger iOS share menu programmatically
        if (navigator.share) {
          try {
            await navigator.share({
              title: 'E-Gura Store',
              text: 'Add E-Gura Store to your home screen',
              url: window.location.href
            });
            
            // Show instructions after share
            setTimeout(() => {
              showIOSAddToHomeInstructions();
            }, 1000);
            
          } catch (err) {
            console.log('Real Home Screen: Web Share failed, showing instructions');
            showIOSAddToHomeInstructions();
          }
        } else {
          showIOSAddToHomeInstructions();
        }
        
        setIsInstalling(false);
        
      } else {
        // Other browsers - show browser-specific instructions
        console.log('Real Home Screen: Showing browser-specific instructions');
        showBrowserSpecificInstructions();
        setIsInstalling(false);
      }
      
    } catch (error) {
      console.error('Real Home Screen: Installation error:', error);
      setIsInstalling(false);
      showBrowserSpecificInstructions();
    }
  };

  const showIOSAddToHomeInstructions = () => {
    const instructionOverlay = document.createElement('div');
    instructionOverlay.className = 'fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center p-4 z-50';
    instructionOverlay.innerHTML = `
      <div class="bg-white rounded-2xl p-6 max-w-sm w-full text-center">
        <div class="mb-4">
          <div class="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <span class="text-3xl">📤</span>
          </div>
          <h3 class="text-xl font-bold text-gray-900 mb-2">Add to Home Screen</h3>
          <p class="text-gray-600 text-sm">Follow these steps to add E-Gura Store to your iPhone home screen:</p>
        </div>
        
        <div class="space-y-4 mb-6 text-left">
          <div class="flex items-start space-x-3">
            <div class="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">1</div>
            <div>
              <p class="font-semibold text-gray-900">Tap the Share button</p>
              <p class="text-gray-600 text-sm">Look for the <strong>📤 Share</strong> button at the bottom of Safari</p>
            </div>
          </div>
          
          <div class="flex items-start space-x-3">
            <div class="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">2</div>
            <div>
              <p class="font-semibold text-gray-900">Find "Add to Home Screen"</p>
              <p class="text-gray-600 text-sm">Scroll down in the share menu and tap <strong>"Add to Home Screen"</strong></p>
            </div>
          </div>
          
          <div class="flex items-start space-x-3">
            <div class="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">3</div>
            <div>
              <p class="font-semibold text-gray-900">Tap "Add"</p>
              <p class="text-gray-600 text-sm">Confirm by tapping <strong>"Add"</strong> - the app will appear on your home screen</p>
            </div>
          </div>
        </div>
        
        <div class="bg-orange-50 border border-orange-200 rounded-lg p-3 mb-4">
          <p class="text-orange-800 text-sm font-semibold">✨ After adding, you can open E-Gura Store directly from your home screen like any other app!</p>
        </div>
        
        <button onclick="this.closest('.fixed').remove()" 
                class="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold text-lg">
          Got It!
        </button>
      </div>
    `;
    
    document.body.appendChild(instructionOverlay);
    setShowInstallPrompt(false);
    
    // Auto-remove after 30 seconds
    setTimeout(() => {
      if (document.body.contains(instructionOverlay)) {
        instructionOverlay.remove();
      }
    }, 30000);
  };

  const showBrowserSpecificInstructions = () => {
    let browserName = 'your browser';
    let instructions = '';
    
    if (deviceInfo.isChrome) {
      browserName = 'Chrome';
      instructions = `1. Tap the menu (⋮) in the top-right corner
2. Look for "Add to Home screen" or "Install app"
3. Tap it and then tap "Add" or "Install"
4. The app icon will appear on your home screen`;
    } else if (deviceInfo.isAndroid) {
      browserName = 'Android Browser';
      instructions = `1. Tap the menu button in your browser
2. Look for "Add to Home screen" option
3. Tap it and confirm the installation
4. The app will be added to your home screen`;
    } else {
      instructions = `1. Look for the menu or options in your browser
2. Find "Add to Home screen" or "Install" option
3. Follow the prompts to install
4. The app will appear on your device's home screen`;
    }
    
    const instructionOverlay = document.createElement('div');
    instructionOverlay.className = 'fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center p-4 z-50';
    instructionOverlay.innerHTML = `
      <div class="bg-white rounded-2xl p-6 max-w-sm w-full text-center">
        <div class="mb-4">
          <div class="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <span class="text-3xl">📱</span>
          </div>
          <h3 class="text-xl font-bold text-gray-900 mb-2">Install E-Gura Store</h3>
          <p class="text-gray-600 text-sm">Add our app to your device's home screen using ${browserName}:</p>
        </div>
        
        <div class="bg-gray-50 rounded-lg p-4 mb-4 text-left">
          <pre class="text-sm text-gray-700 whitespace-pre-line font-medium">${instructions}</pre>
        </div>
        
        <div class="bg-orange-50 border border-orange-200 rounded-lg p-3 mb-4">
          <p class="text-orange-800 text-sm font-semibold">🏠 Once installed, you'll find E-Gura Store on your home screen with other apps!</p>
        </div>
        
        <button onclick="this.closest('.fixed').remove()" 
                class="w-full bg-green-600 text-white py-3 rounded-xl font-semibold text-lg">
          Got It!
        </button>
      </div>
    `;
    
    document.body.appendChild(instructionOverlay);
    setShowInstallPrompt(false);
    
    // Auto-remove after 30 seconds
    setTimeout(() => {
      if (document.body.contains(instructionOverlay)) {
        instructionOverlay.remove();
      }
    }, 30000);
  };

  const showRealInstallSuccess = () => {
    const successOverlay = document.createElement('div');
    successOverlay.className = 'fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center p-4 z-50';
    successOverlay.innerHTML = `
      <div class="bg-white rounded-2xl p-6 max-w-sm w-full text-center">
        <div class="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <span class="text-4xl">🎉</span>
        </div>
        <h3 class="text-2xl font-bold text-gray-900 mb-2">Successfully Installed!</h3>
        <p class="text-gray-600 mb-4">E-Gura Store has been added to your device's home screen. You can now access it like any other app!</p>
        
        <div class="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
          <p class="text-green-800 text-sm font-semibold">🏠 Check your home screen - you'll find the E-Gura Store app icon with other apps!</p>
        </div>
        
        <button onclick="this.closest('.fixed').remove()" 
                class="w-full bg-green-600 text-white py-3 rounded-xl font-semibold text-lg">
          Awesome!
        </button>
      </div>
    `;
    
    document.body.appendChild(successOverlay);
    
    // Auto-close after 5 seconds
    setTimeout(() => {
      if (document.body.contains(successOverlay)) {
        successOverlay.remove();
      }
    }, 5000);
  };

  const handleDismiss = () => {
    setShowInstallPrompt(false);
    localStorage.setItem('install-prompt-dismissed', Date.now().toString());
  };

  // Don't show if already installed or not mobile
  if (isInstalled || !showInstallPrompt || !deviceInfo.isMobile) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white bg-opacity-95 backdrop-blur-sm rounded-2xl shadow-2xl max-w-sm w-full mx-4 animate-scale-in">
        {/* Header */}
        <div className="p-6 text-center border-b border-gray-100">
          <div className="w-20 h-20 bg-gradient-to-br from-orange-400 to-orange-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <span className="text-3xl">🛍️</span>
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            Add to Home Screen
          </h3>
          <p className="text-gray-600 text-sm">
            Install E-Gura Store on your device for quick access
          </p>
        </div>
        
        {/* Content */}
        <div className="p-6">
          {/* Benefits */}
          <div className="space-y-3 mb-6">
            <div className="flex items-center text-sm text-gray-700">
              <span className="text-green-500 mr-3 text-lg">🏠</span>
              <span>Appears on your home screen with other apps</span>
            </div>
            <div className="flex items-center text-sm text-gray-700">
              <span className="text-green-500 mr-3 text-lg">⚡</span>
              <span>Faster loading and offline access</span>
            </div>
            <div className="flex items-center text-sm text-gray-700">
              <span className="text-green-500 mr-3 text-lg">🔔</span>
              <span>Get notifications for deals and orders</span>
            </div>
          </div>
          
          {/* Device-specific hint */}
          {deviceInfo.isIOS && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
              <div className="flex items-center text-blue-800 text-sm">
                <span className="text-lg mr-2">📤</span>
                <span>We'll guide you to use Safari's <strong>Share</strong> button</span>
              </div>
            </div>
          )}
          
          {deviceInfo.isAndroid && deferredPrompt && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
              <div className="flex items-center text-green-800 text-sm">
                <span className="text-lg mr-2">📱</span>
                <span>Your browser supports <strong>one-tap installation</strong></span>
              </div>
            </div>
          )}
          
          {/* Action buttons */}
          <div className="space-y-3">
            <button
              onClick={handleRealInstall}
              disabled={isInstalling}
              className="w-full bg-orange-600 text-white py-3 px-4 rounded-xl text-lg font-bold hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-lg"
            >
              {isInstalling ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Installing...
                </div>
              ) : (
                '🏠 Add to Home Screen'
              )}
            </button>
            
            <button
              onClick={handleDismiss}
              className="w-full bg-gray-100 text-gray-700 py-2 px-4 rounded-xl text-sm font-semibold hover:bg-gray-200 transition-colors"
            >
              Maybe Later
            </button>
          </div>
          
          {/* Debug info */}
          {process.env.NODE_ENV === 'development' && (
            <div className="mt-4 p-3 bg-gray-50 rounded text-xs">
              <div className="font-semibold mb-1">Debug Info:</div>
              <div className="grid grid-cols-2 gap-1">
                <span>iOS: {deviceInfo.isIOS ? '✅' : '❌'}</span>
                <span>Android: {deviceInfo.isAndroid ? '✅' : '❌'}</span>
                <span>Chrome: {deviceInfo.isChrome ? '✅' : '❌'}</span>
                <span>Prompt: {deferredPrompt ? '✅' : '❌'}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RealHomeScreenInstall;
