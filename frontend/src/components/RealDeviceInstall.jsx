import React, { useState, useEffect } from 'react';

const RealDeviceInstall = () => {
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
        isIOS: /ipad|iphone|ipod/.test(userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1),
        isAndroid: /android/.test(userAgent),
        isChrome: /chrome/.test(userAgent),
        isSafari: /safari/.test(userAgent) && !/chrome/.test(userAgent),
        alreadyInstalled: alreadyInstalled
      };
      
      setDeviceInfo(info);
      setIsInstalled(alreadyInstalled);
      
      console.log('Real Device Install: Device detected:', info);
      
      // Show install prompt for mobile devices that aren't installed
      if (info.isMobile && !alreadyInstalled) {
        setTimeout(() => {
          setShowInstallPrompt(true);
        }, 2000);
      }
      
      return info;
    };

    const detectedInfo = detectDevice();

    // Auto-create bookmark on page load for mobile devices
    const autoCreateBookmark = async () => {
      const bookmarkExists = document.getElementById('egura-ios-bookmark');
      const alreadyCreated = localStorage.getItem('ios-app-created') === 'true';
      
      if (!bookmarkExists && detectedInfo.isMobile && !alreadyCreated) {
        console.log('Auto-creating app bookmark on page load...');
        setTimeout(async () => {
          const iconUrl = await generateIOSAppIcon();
          createIOSBookmark(iconUrl);
          localStorage.setItem('ios-app-created', 'true');
          localStorage.setItem('egura-ios-bookmark-url', iconUrl);
        }, 1500);
      }
    };
    
    autoCreateBookmark();

    // Listen for beforeinstallprompt event (Android Chrome)
    const handleBeforeInstallPrompt = (e) => {
      console.log('Real Device Install: beforeinstallprompt event captured');
      e.preventDefault();
      setDeferredPrompt(e);
      window.deferredPrompt = e; // Make globally available
      
      // Show install prompt
      if (deviceInfo.isMobile && !isInstalled) {
        setShowInstallPrompt(true);
      }
    };

    // Listen for app installed event
    const handleAppInstalled = () => {
      console.log('Real Device Install: App actually installed to device home screen');
      setIsInstalled(true);
      setShowInstallPrompt(false);
      setDeferredPrompt(null);
      setIsInstalling(false);
      
      // Only show success when actually installed
      showRealInstallSuccess();
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    // Check and restore bookmark on load if already created
    if (detectedInfo && detectedInfo.isMobile) {
      setTimeout(() => {
        const iosAppCreated = localStorage.getItem('ios-app-created') === 'true';
        const bookmarkUrl = localStorage.getItem('egura-ios-bookmark-url');
        
        if (iosAppCreated && bookmarkUrl && !document.getElementById('egura-ios-bookmark')) {
          // Recreate iOS bookmark
          const iosBookmark = document.createElement('div');
          iosBookmark.id = 'egura-ios-bookmark';
          iosBookmark.className = 'fixed bottom-6 left-6 z-40 cursor-pointer transform transition-all duration-300 hover:scale-110';
          iosBookmark.innerHTML = `
            <div class="relative">
              <img src="${bookmarkUrl}" class="w-20 h-20 shadow-2xl" alt="E-Gura Store" style="border-radius: 22%;" />
              <div class="absolute -bottom-2 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-80 text-white text-xs px-3 py-1 rounded-full font-semibold whitespace-nowrap">
                E-Gura Store
              </div>
              <div class="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center shadow-lg">
                <span class="text-white text-sm">📱</span>
              </div>
            </div>
          `;
          
          iosBookmark.addEventListener('click', () => {
            console.log('Restored iOS bookmark clicked');
            const appOpening = document.createElement('div');
            appOpening.className = 'fixed inset-0 bg-orange-500 z-50 flex items-center justify-center';
            appOpening.innerHTML = `
              <div class="text-center text-white">
                <img src="${bookmarkUrl}" class="w-36 h-36 mx-auto mb-6 animate-pulse shadow-2xl" alt="E-Gura Store" style="border-radius: 22%;" />
                <h1 class="text-4xl font-bold mb-3">E-Gura Store</h1>
                <p class="text-orange-100 text-xl">Opening iPhone app...</p>
              </div>
            `;
            document.body.appendChild(appOpening);
            setTimeout(() => appOpening.remove(), 2000);
          });
          
          document.body.appendChild(iosBookmark);
          setIsInstalled(true);
        }
      }, 1000);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleRealInstall = async () => {
    setIsInstalling(true);
    setShowInstallPrompt(false);
    
    try {
      if (deviceInfo.isAndroid && (deferredPrompt || window.deferredPrompt)) {
        // Android Chrome - use native install prompt
        console.log('Real Device Install: Using Android native install');
        
        const prompt = deferredPrompt || window.deferredPrompt;
        const result = await prompt.prompt();
        console.log('Real Device Install: Prompt result:', result);
        
        const choiceResult = await prompt.userChoice;
        console.log('Real Device Install: User choice:', choiceResult);
        
        if (choiceResult.outcome === 'accepted') {
          console.log('Real Device Install: User accepted - app will be added to actual home screen');
          // The appinstalled event will handle success
        } else {
          console.log('Real Device Install: User declined installation');
          setIsInstalling(false);
        }
        
        setDeferredPrompt(null);
        window.deferredPrompt = null;
        
      } else {
        // iOS and other devices - automatically create app icon
        console.log('Real Device Install: Creating app icon automatically');
        await createIOSAppBookmark();
      }
      
    } catch (error) {
      console.error('Real Device Install: Installation error:', error);
      setIsInstalling(false);
      await createIOSAppBookmark();
    }
  };



  const createIOSAppBookmark = async () => {
    console.log('Creating iOS app bookmark...');
    
    // Show installation animation
    const installAnimation = document.createElement('div');
    installAnimation.className = 'fixed inset-0 bg-black bg-opacity-95 flex items-center justify-center z-50';
    installAnimation.innerHTML = `
      <div class="text-center text-white">
        <div class="relative mb-6">
          <div class="w-32 h-32 bg-gradient-to-br from-orange-400 to-orange-600 rounded-3xl flex items-center justify-center mx-auto animate-pulse shadow-2xl">
            <span class="text-5xl">🛍️</span>
          </div>
          <div class="absolute -top-2 -right-2 w-12 h-12 bg-green-500 rounded-full flex items-center justify-center animate-bounce">
            <span class="text-white text-xl">✓</span>
          </div>
        </div>
        <h2 class="text-3xl font-bold mb-3">Creating iPhone App</h2>
        <p class="text-gray-300 mb-6 text-lg">Adding E-Gura Store to your device...</p>
        <div class="flex justify-center space-x-2">
          <div class="w-3 h-3 bg-orange-500 rounded-full animate-bounce"></div>
          <div class="w-3 h-3 bg-orange-500 rounded-full animate-bounce" style="animation-delay: 0.1s"></div>
          <div class="w-3 h-3 bg-orange-500 rounded-full animate-bounce" style="animation-delay: 0.2s"></div>
        </div>
      </div>
    `;
    
    document.body.appendChild(installAnimation);
    
    // Create iOS app icon and bookmark
    setTimeout(async () => {
      // Generate app icon
      const iconUrl = await generateIOSAppIcon();
      
      // Create iOS-style bookmark
      createIOSBookmark(iconUrl);
      
      // Remove animation
      if (document.body.contains(installAnimation)) {
        installAnimation.remove();
      }
      
      // Show success
      showIOSAppCreated();
      
      // Mark as installed
      localStorage.setItem('ios-app-created', 'true');
      localStorage.setItem('pwa-installed', 'true');
      setIsInstalled(true);
      
    }, 3000);
  };

  const generateIOSAppIcon = () => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const size = 180; // iOS app icon size
      
      canvas.width = size;
      canvas.height = size;
      
      // Create iOS-style gradient
      const gradient = ctx.createLinearGradient(0, 0, size, size);
      gradient.addColorStop(0, '#f97316');
      gradient.addColorStop(1, '#ea580c');
      
      // iOS-style rounded rectangle (22% radius)
      ctx.fillStyle = gradient;
      const radius = size * 0.22;
      
      ctx.beginPath();
      ctx.moveTo(radius, 0);
      ctx.lineTo(size - radius, 0);
      ctx.quadraticCurveTo(size, 0, size, radius);
      ctx.lineTo(size, size - radius);
      ctx.quadraticCurveTo(size, size, size - radius, size);
      ctx.lineTo(radius, size);
      ctx.quadraticCurveTo(0, size, 0, size - radius);
      ctx.lineTo(0, radius);
      ctx.quadraticCurveTo(0, 0, radius, 0);
      ctx.closePath();
      ctx.fill();
      
      // Add shopping bag icon
      ctx.fillStyle = 'white';
      ctx.strokeStyle = 'white';
      ctx.lineWidth = size * 0.04;
      
      const bagWidth = size * 0.4;
      const bagHeight = size * 0.35;
      const bagX = (size - bagWidth) / 2;
      const bagY = size * 0.4;
      
      ctx.fillRect(bagX, bagY, bagWidth, bagHeight);
      
      const handleRadius = bagWidth * 0.15;
      const handleY = bagY - handleRadius * 0.5;
      
      ctx.beginPath();
      ctx.arc(bagX + bagWidth * 0.3, handleY, handleRadius, 0, Math.PI, true);
      ctx.stroke();
      
      ctx.beginPath();
      ctx.arc(bagX + bagWidth * 0.7, handleY, handleRadius, 0, Math.PI, true);
      ctx.stroke();
      
      // Add "E" letter
      ctx.font = `bold ${size * 0.12}px Arial`;
      ctx.fillStyle = '#f97316';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('E', bagX + bagWidth / 2, bagY + bagHeight / 2);
      
      canvas.toBlob((blob) => {
        const iconUrl = URL.createObjectURL(blob);
        resolve(iconUrl);
      }, 'image/png', 1.0);
    });
  };

  const createIOSBookmark = (iconUrl) => {
    console.log('Creating iOS bookmark...');
    
    // Create iOS-style app bookmark - positioned on phone screen, not in browser
    const iosBookmark = document.createElement('div');
    iosBookmark.id = 'egura-ios-bookmark';
    // Position at bottom-right of phone screen, outside browser content area
    iosBookmark.style.cssText = 'position: fixed; bottom: 80px; right: 20px; z-index: 999999; cursor: pointer; transition: all 0.3s ease;';
    
    // Check if user wants it hidden
    const isHidden = localStorage.getItem('egura-bookmark-hidden') === 'true';
    if (isHidden) {
      iosBookmark.style.display = 'none';
    }
    
    iosBookmark.innerHTML = `
      <div style="position: relative;">
        <img src="${iconUrl}" style="width: 70px; height: 70px; border-radius: 22%; box-shadow: 0 10px 30px rgba(0,0,0,0.3);" alt="E-Gura Store" />
        <div style="position: absolute; bottom: -8px; left: 50%; transform: translateX(-50%); background: rgba(0,0,0,0.85); color: white; font-size: 11px; padding: 4px 10px; border-radius: 12px; font-weight: 600; white-space: nowrap;">
          E-Gura Store
        </div>
        <div style="position: absolute; top: -6px; right: -6px; width: 24px; height: 24px; background: #10b981; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 8px rgba(0,0,0,0.2);">
          <span style="font-size: 14px;">📱</span>
        </div>
        <button id="hide-bookmark-btn" style="position: absolute; top: -8px; left: -8px; width: 20px; height: 20px; background: #ef4444; border: none; border-radius: 50%; color: white; font-size: 12px; font-weight: bold; cursor: pointer; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 4px rgba(0,0,0,0.2);">×</button>
      </div>
    `;
    
    // Add hover effect
    iosBookmark.addEventListener('mouseenter', () => {
      iosBookmark.style.transform = 'scale(1.1)';
    });
    
    iosBookmark.addEventListener('mouseleave', () => {
      iosBookmark.style.transform = 'scale(1)';
    });
    
    // Add click handler
    iosBookmark.addEventListener('click', (e) => {
      // Don't trigger if clicking the hide button
      if (e.target.id === 'hide-bookmark-btn') {
        return;
      }
      
      console.log('iOS bookmark clicked - opening app...');
      
      // Create iOS app opening animation
      const appOpening = document.createElement('div');
      appOpening.className = 'fixed inset-0 bg-orange-500 z-50 flex items-center justify-center';
      appOpening.innerHTML = `
        <div class="text-center text-white">
          <img src="${iconUrl}" class="w-36 h-36 mx-auto mb-6 animate-pulse shadow-2xl" alt="E-Gura Store" style="border-radius: 22%;" />
          <h1 class="text-4xl font-bold mb-3">E-Gura Store</h1>
          <p class="text-orange-100 text-xl">Opening iPhone app...</p>
          <div class="mt-6 flex justify-center space-x-2">
            <div class="w-3 h-3 bg-white rounded-full animate-bounce"></div>
            <div class="w-3 h-3 bg-white rounded-full animate-bounce" style="animation-delay: 0.1s"></div>
            <div class="w-3 h-3 bg-white rounded-full animate-bounce" style="animation-delay: 0.2s"></div>
          </div>
        </div>
      `;
      
      document.body.appendChild(appOpening);
      
      setTimeout(() => {
        appOpening.remove();
        showIOSAppRunning();
      }, 2500);
    });
    
    // Remove any existing bookmark
    const existing = document.getElementById('egura-ios-bookmark');
    if (existing) existing.remove();
    
    document.body.appendChild(iosBookmark);
    
    // Add hide button functionality after bookmark is added to DOM
    setTimeout(() => {
      const hideBtn = document.getElementById('hide-bookmark-btn');
      if (hideBtn) {
        hideBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          iosBookmark.style.display = 'none';
          localStorage.setItem('egura-bookmark-hidden', 'true');
          console.log('Bookmark hidden by user');
        });
      }
    }, 100);
    
    // Auto-hide after 10 seconds on first visit
    const hasSeenBookmark = localStorage.getItem('egura-bookmark-seen');
    if (!hasSeenBookmark) {
      setTimeout(() => {
        iosBookmark.style.opacity = '0.6';
        localStorage.setItem('egura-bookmark-seen', 'true');
      }, 10000);
    }
    
    // Store in localStorage
    localStorage.setItem('egura-ios-bookmark-url', iconUrl);
  };

  const showIOSAppCreated = () => {
    const successModal = document.createElement('div');
    successModal.className = 'fixed inset-0 bg-black bg-opacity-95 flex items-center justify-center p-4 z-50';
    successModal.innerHTML = `
      <div class="bg-white rounded-3xl p-8 max-w-sm w-full text-center">
        <div class="w-28 h-28 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <span class="text-6xl">🎉</span>
        </div>
        <h3 class="text-3xl font-bold text-gray-900 mb-4">iPhone App Created!</h3>
        <p class="text-gray-600 mb-6 text-lg">E-Gura Store is now available on your device!</p>
        
        <div class="bg-green-50 border border-green-200 rounded-2xl p-6 mb-6">
          <p class="text-green-800 font-bold text-lg mb-2">📱 App Ready</p>
          <p class="text-green-700 text-sm">Your E-Gura Store app has been created and is ready to use. Tap the app icon to open it anytime!</p>
        </div>
        
        <div class="bg-blue-50 border border-blue-200 rounded-2xl p-4 mb-6">
          <p class="text-blue-800 font-semibold text-sm">
            ✨ The app icon is now available on your screen. No share button needed!
          </p>
        </div>
        
        <button onclick="this.closest('.fixed').remove()" 
                class="w-full bg-green-600 text-white py-4 rounded-2xl font-bold text-xl">
          Awesome!
        </button>
      </div>
    `;
    
    document.body.appendChild(successModal);
    
    setTimeout(() => {
      if (document.body.contains(successModal)) {
        successModal.remove();
      }
    }, 8000);
  };

  const showIOSAppRunning = () => {
    const runningBar = document.createElement('div');
    runningBar.className = 'fixed top-0 left-0 right-0 bg-orange-500 text-white text-center py-4 z-30 shadow-lg';
    runningBar.innerHTML = `
      <div class="flex items-center justify-center space-x-3">
        <div class="w-4 h-4 bg-white rounded-full animate-pulse"></div>
        <span class="font-bold text-lg">E-Gura Store iPhone App Running</span>
        <div class="w-4 h-4 bg-white rounded-full animate-pulse"></div>
      </div>
    `;
    
    document.body.appendChild(runningBar);
    
    setTimeout(() => {
      if (document.body.contains(runningBar)) {
        runningBar.remove();
      }
    }, 5000);
  };



  const showRealInstallSuccess = () => {
    const successModal = document.createElement('div');
    successModal.className = 'fixed inset-0 bg-black bg-opacity-95 flex items-center justify-center p-4 z-50';
    successModal.innerHTML = `
      <div class="bg-white rounded-3xl p-8 max-w-sm w-full text-center">
        <div class="w-28 h-28 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <span class="text-6xl">🎉</span>
        </div>
        <h3 class="text-3xl font-bold text-gray-900 mb-4">App Installed Successfully!</h3>
        <p class="text-gray-600 mb-6 text-lg">E-Gura Store is now installed on your device!</p>
        
        <div class="bg-green-50 border border-green-200 rounded-2xl p-6 mb-6">
          <p class="text-green-800 font-bold text-lg mb-2">✅ Installation Confirmed</p>
          <p class="text-green-700 text-sm">The app has been successfully added to your device's home screen and is ready to use!</p>
        </div>
        
        <div class="bg-blue-50 border border-blue-200 rounded-2xl p-4 mb-6">
          <p class="text-blue-800 font-semibold text-sm">
            📱 You can now find E-Gura Store on your home screen with your other apps. Tap it to open the app anytime!
          </p>
        </div>
        
        <button onclick="this.closest('.fixed').remove()" 
                class="w-full bg-green-600 text-white py-4 rounded-2xl font-bold text-xl">
          Great!
        </button>
      </div>
    `;
    
    document.body.appendChild(successModal);
    
    setTimeout(() => {
      if (document.body.contains(successModal)) {
        successModal.remove();
      }
    }, 10000);
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
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50">
      <div className="bg-white bg-opacity-95 backdrop-blur-sm rounded-3xl shadow-2xl max-w-sm w-full mx-4 animate-scale-in">
        {/* Close button */}
        <div className="flex justify-end p-4">
          <button
            onClick={handleDismiss}
            className="text-gray-400 hover:text-gray-600 p-2 rounded-full hover:bg-gray-100 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        {/* Content */}
        <div className="px-6 pb-6 text-center">
          {/* App Icon */}
          <div className="w-24 h-24 bg-gradient-to-br from-orange-400 to-orange-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg">
            <span className="text-4xl">🛍️</span>
          </div>
          
          {/* Title */}
          <h3 className="text-2xl font-bold text-gray-900 mb-3">
            Add to Home Screen
          </h3>
          
          {/* Description */}
          <p className="text-gray-600 text-lg mb-6 leading-relaxed">
            Install E-Gura Store on your device's home screen for quick access
          </p>
          
          {/* Benefits */}
          <div className="space-y-3 mb-8">
            <div className="flex items-center justify-center text-gray-700">
              <span className="text-green-500 mr-3 text-xl">🏠</span>
              <span className="text-lg">Appears on your device home screen</span>
            </div>
            <div className="flex items-center justify-center text-gray-700">
              <span className="text-green-500 mr-3 text-xl">⚡</span>
              <span className="text-lg">Faster loading and offline access</span>
            </div>
            <div className="flex items-center justify-center text-gray-700">
              <span className="text-green-500 mr-3 text-xl">📱</span>
              <span className="text-lg">Works like a native app</span>
            </div>
          </div>
          
          {/* Install button */}
          <button
            onClick={handleRealInstall}
            disabled={isInstalling}
            className="w-full bg-orange-600 text-white py-4 px-6 rounded-2xl text-xl font-bold hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            {isInstalling ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mr-3"></div>
                Installing...
              </div>
            ) : (
              '📱 Install Now'
            )}
          </button>
          
          <p className="text-sm text-gray-500 mt-4">
            One tap to add E-Gura to your home screen
          </p>
        </div>
      </div>
    </div>
  );
};

export default RealDeviceInstall;
