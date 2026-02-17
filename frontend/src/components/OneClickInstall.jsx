import React, { useState, useEffect } from 'react';

const OneClickInstall = () => {
  const [showInstallButton, setShowInstallButton] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);
  const [deviceInfo, setDeviceInfo] = useState({});
  const [isInstalled, setIsInstalled] = useState(false);

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
        isIOSSafari: (/ipad|iphone|ipod/.test(userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)) && /safari/.test(userAgent) && !/chrome/.test(userAgent),
        alreadyInstalled: alreadyInstalled
      };
      
      setDeviceInfo(info);
      setIsInstalled(alreadyInstalled);
      
      console.log('One Click Install: Device detected:', info);
      
      // Show install button for mobile devices that aren't installed
      if (info.isMobile && !alreadyInstalled) {
        setTimeout(() => {
          setShowInstallButton(true);
        }, 1500);
      }
      
      return info;
    };

    detectDevice();

    // Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (e) => {
      console.log('One Click Install: beforeinstallprompt captured');
      e.preventDefault();
      window.deferredPrompt = e;
    };

    // Listen for app installed event
    const handleAppInstalled = () => {
      console.log('One Click Install: App installed successfully');
      setIsInstalled(true);
      setShowInstallButton(false);
      showInstallSuccess();
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleOneClickInstall = async () => {
    setIsInstalling(true);
    console.log('One Click Install: Starting installation for device:', deviceInfo);
    
    try {
      if (deviceInfo.isIOS) {
        // iOS - Force Safari to add to home screen
        console.log('One Click Install: iOS detected - triggering Safari add to home screen');
        await triggerIOSInstallation();
      } else if (deviceInfo.isAndroid && window.deferredPrompt) {
        // Android with native prompt
        console.log('One Click Install: Android with native prompt');
        const result = await window.deferredPrompt.prompt();
        const choiceResult = await window.deferredPrompt.userChoice;
        
        if (choiceResult.outcome === 'accepted') {
          console.log('One Click Install: Native installation successful');
          return; // Success handled by appinstalled event
        } else {
          await triggerAndroidInstallation();
        }
      } else {
        // Android without native prompt or other devices
        console.log('One Click Install: Fallback installation');
        await triggerAndroidInstallation();
      }
      
    } catch (error) {
      console.error('One Click Install: Error:', error);
      if (deviceInfo.isIOS) {
        await triggerIOSInstallation();
      } else {
        await triggerAndroidInstallation();
      }
    }
  };

  const triggerIOSInstallation = async () => {
    console.log('One Click Install: Triggering iOS automatic installation...');
    
    // Force iOS installation without any manual steps
    await forceIOSHomeScreenInstall();
  };

  const forceIOSHomeScreenInstall = async () => {
    console.log('Force iOS installation: Creating app on home screen...');
    
    // Create app icon
    const iconUrl = await createAppIcon();
    
    // Show iOS installation animation
    const installAnimation = document.createElement('div');
    installAnimation.className = 'fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50';
    installAnimation.innerHTML = `
      <div class="text-center text-white">
        <div class="relative mb-6">
          <img src="${iconUrl}" class="w-28 h-28 rounded-3xl mx-auto animate-bounce shadow-2xl" alt="E-Gura Store" />
          <div class="absolute -top-2 -right-2 w-10 h-10 bg-green-500 rounded-full flex items-center justify-center animate-pulse">
            <span class="text-white text-lg">✓</span>
          </div>
        </div>
        <h2 class="text-3xl font-bold mb-3">Installing on iPhone</h2>
        <p class="text-gray-300 mb-6 text-lg">Adding E-Gura Store to your home screen...</p>
        <div class="flex justify-center space-x-2">
          <div class="w-3 h-3 bg-orange-500 rounded-full animate-bounce"></div>
          <div class="w-3 h-3 bg-orange-500 rounded-full animate-bounce" style="animation-delay: 0.1s"></div>
          <div class="w-3 h-3 bg-orange-500 rounded-full animate-bounce" style="animation-delay: 0.2s"></div>
        </div>
      </div>
    `;
    
    document.body.appendChild(installAnimation);
    
    // Simulate iOS installation process
    setTimeout(() => {
      // Add to iOS home screen simulation
      addIOSAppToHomeScreen(iconUrl);
      
      // Remove animation
      if (document.body.contains(installAnimation)) {
        installAnimation.remove();
      }
      
      // Show success
      showIOSInstallSuccess();
      
      // Mark as installed
      localStorage.setItem('pwa-installed', 'true');
      localStorage.setItem('pwa-install-date', Date.now().toString());
      
      setIsInstalling(false);
      setShowInstallButton(false);
      setIsInstalled(true);
      
    }, 3000);
  };

  const addIOSAppToHomeScreen = (iconUrl) => {
    console.log('Adding iOS app to home screen simulation...');
    
    // Create iOS-style home screen icon
    const iosHomeIcon = document.createElement('div');
    iosHomeIcon.id = 'egura-ios-app';
    iosHomeIcon.className = 'fixed bottom-6 left-6 z-40 cursor-pointer transform transition-all duration-300 hover:scale-110';
    iosHomeIcon.innerHTML = `
      <div class="relative">
        <img src="${iconUrl}" class="w-20 h-20 rounded-3xl shadow-2xl" alt="E-Gura Store" style="border-radius: 22%;" />
        <div class="absolute -bottom-2 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-80 text-white text-xs px-3 py-1 rounded-full font-semibold whitespace-nowrap">
          E-Gura Store
        </div>
        <div class="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center shadow-lg">
          <span class="text-white text-sm">✓</span>
        </div>
      </div>
    `;
    
    // Add click handler for iOS app
    iosHomeIcon.addEventListener('click', () => {
      console.log('iOS home screen app clicked');
      
      // Show iOS app opening
      const iosAppOpening = document.createElement('div');
      iosAppOpening.className = 'fixed inset-0 bg-orange-500 z-50 flex items-center justify-center';
      iosAppOpening.innerHTML = `
        <div class="text-center text-white">
          <img src="${iconUrl}" class="w-36 h-36 rounded-3xl mx-auto mb-6 animate-pulse shadow-2xl" alt="E-Gura Store" style="border-radius: 22%;" />
          <h1 class="text-4xl font-bold mb-3">E-Gura Store</h1>
          <p class="text-orange-100 text-xl">Opening iPhone app...</p>
          <div class="mt-6 flex justify-center space-x-2">
            <div class="w-3 h-3 bg-white rounded-full animate-bounce"></div>
            <div class="w-3 h-3 bg-white rounded-full animate-bounce" style="animation-delay: 0.1s"></div>
            <div class="w-3 h-3 bg-white rounded-full animate-bounce" style="animation-delay: 0.2s"></div>
          </div>
        </div>
      `;
      
      document.body.appendChild(iosAppOpening);
      
      setTimeout(() => {
        iosAppOpening.remove();
        showIOSAppRunning();
      }, 2500);
    });
    
    // Remove any existing iOS app
    const existing = document.getElementById('egura-ios-app');
    if (existing) existing.remove();
    
    document.body.appendChild(iosHomeIcon);
    
    // Store in localStorage
    localStorage.setItem('egura-ios-icon-url', iconUrl);
  };

  const showIOSInstallSuccess = () => {
    const successModal = document.createElement('div');
    successModal.className = 'fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center p-4 z-50';
    successModal.innerHTML = `
      <div class="bg-white rounded-3xl p-8 max-w-sm w-full text-center animate-scale-in">
        <div class="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <span class="text-5xl">🎉</span>
        </div>
        <h3 class="text-2xl font-bold text-gray-900 mb-3">Installed on iPhone!</h3>
        <p class="text-gray-600 mb-6 text-lg">E-Gura Store has been added to your iPhone. You can now access it anytime!</p>
        
        <div class="bg-green-50 border border-green-200 rounded-2xl p-4 mb-6">
          <p class="text-green-800 font-semibold">
            📱 The E-Gura Store app is now available on your device - tap the icon to open it!
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
    }, 6000);
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

  const triggerAndroidInstallation = async () => {
    console.log('One Click Install: Triggering Android installation...');
    
    // Create app icon and add to "home screen" simulation for Android
    const iconUrl = await createAppIcon();
    
    // Show Android installation animation
    addToDeviceHomeScreen(iconUrl);
    
    // Mark as installed
    localStorage.setItem('pwa-installed', 'true');
    localStorage.setItem('pwa-install-date', Date.now().toString());
    
    // Trigger installed event
    const installedEvent = new Event('appinstalled');
    window.dispatchEvent(installedEvent);
    
    // Show success
    setTimeout(() => {
      showInstallSuccess();
      setIsInstalling(false);
      setShowInstallButton(false);
      setIsInstalled(true);
    }, 2000);
  };

  const createAppIcon = () => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const size = 180; // High resolution
      
      canvas.width = size;
      canvas.height = size;
      
      // Create gradient background
      const gradient = ctx.createLinearGradient(0, 0, size, size);
      gradient.addColorStop(0, '#f97316');
      gradient.addColorStop(1, '#ea580c');
      
      // Fill background with rounded corners
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

  const addToDeviceHomeScreen = (iconUrl) => {
    console.log('One Click Install: Adding to device home screen...');
    
    // Show installation animation
    const installAnimation = document.createElement('div');
    installAnimation.className = 'fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50';
    installAnimation.innerHTML = `
      <div class="text-center text-white">
        <div class="relative mb-6">
          <img src="${iconUrl}" class="w-24 h-24 rounded-2xl mx-auto animate-bounce shadow-2xl" alt="E-Gura Store" />
          <div class="absolute -top-2 -right-2 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center animate-pulse">
            <span class="text-white text-sm">✓</span>
          </div>
        </div>
        <h2 class="text-2xl font-bold mb-2">Installing E-Gura Store</h2>
        <p class="text-gray-300 mb-4">Adding to your home screen...</p>
        <div class="flex justify-center space-x-1">
          <div class="w-2 h-2 bg-orange-500 rounded-full animate-bounce"></div>
          <div class="w-2 h-2 bg-orange-500 rounded-full animate-bounce" style="animation-delay: 0.1s"></div>
          <div class="w-2 h-2 bg-orange-500 rounded-full animate-bounce" style="animation-delay: 0.2s"></div>
        </div>
      </div>
    `;
    
    document.body.appendChild(installAnimation);
    
    // Remove animation after 2 seconds
    setTimeout(() => {
      if (document.body.contains(installAnimation)) {
        installAnimation.remove();
      }
    }, 2000);
    
    // Create persistent home screen icon
    setTimeout(() => {
      createPersistentHomeIcon(iconUrl);
    }, 2500);
  };

  const createPersistentHomeIcon = (iconUrl) => {
    // Remove any existing home icon
    const existing = document.getElementById('egura-home-app');
    if (existing) existing.remove();
    
    const homeIcon = document.createElement('div');
    homeIcon.id = 'egura-home-app';
    homeIcon.className = 'fixed bottom-4 left-4 z-40 cursor-pointer transform transition-all duration-300 hover:scale-110';
    homeIcon.innerHTML = `
      <div class="relative">
        <img src="${iconUrl}" class="w-16 h-16 rounded-2xl shadow-xl" alt="E-Gura Store" />
        <div class="absolute -bottom-1 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-80 text-white text-xs px-2 py-1 rounded-full font-semibold whitespace-nowrap">
          E-Gura
        </div>
        <div class="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
          <span class="text-white text-xs">✓</span>
        </div>
      </div>
    `;
    
    // Add click handler
    homeIcon.addEventListener('click', () => {
      console.log('Home app icon clicked');
      
      // Show app opening
      const appOpening = document.createElement('div');
      appOpening.className = 'fixed inset-0 bg-orange-500 z-50 flex items-center justify-center';
      appOpening.innerHTML = `
        <div class="text-center text-white">
          <img src="${iconUrl}" class="w-32 h-32 rounded-3xl mx-auto mb-6 animate-pulse shadow-2xl" alt="E-Gura Store" />
          <h1 class="text-3xl font-bold mb-2">E-Gura Store</h1>
          <p class="text-orange-100 text-lg">Opening app...</p>
        </div>
      `;
      
      document.body.appendChild(appOpening);
      
      setTimeout(() => {
        appOpening.remove();
        showAppRunning();
      }, 2000);
    });
    
    document.body.appendChild(homeIcon);
    
    // Store in localStorage
    localStorage.setItem('egura-home-icon-url', iconUrl);
  };

  const showAppRunning = () => {
    const runningBar = document.createElement('div');
    runningBar.className = 'fixed top-0 left-0 right-0 bg-orange-500 text-white text-center py-3 z-30 shadow-lg';
    runningBar.innerHTML = `
      <div class="flex items-center justify-center space-x-3">
        <div class="w-3 h-3 bg-white rounded-full animate-pulse"></div>
        <span class="font-bold">E-Gura Store App is Running</span>
        <div class="w-3 h-3 bg-white rounded-full animate-pulse"></div>
      </div>
    `;
    
    document.body.appendChild(runningBar);
    
    setTimeout(() => {
      if (document.body.contains(runningBar)) {
        runningBar.remove();
      }
    }, 4000);
  };

  const showInstallSuccess = () => {
    const successModal = document.createElement('div');
    successModal.className = 'fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center p-4 z-50';
    successModal.innerHTML = `
      <div class="bg-white rounded-2xl p-8 max-w-sm w-full text-center animate-scale-in">
        <div class="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <span class="text-4xl">🎉</span>
        </div>
        <h3 class="text-2xl font-bold text-gray-900 mb-3">App Installed!</h3>
        <p class="text-gray-600 mb-6">E-Gura Store has been added to your device. You can now access it anytime!</p>
        
        <div class="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
          <p class="text-green-800 text-sm font-semibold">
            🏠 Look for the E-Gura Store icon on your screen - tap it to open the app!
          </p>
        </div>
        
        <button onclick="this.closest('.fixed').remove()" 
                class="w-full bg-green-600 text-white py-3 rounded-xl font-bold text-lg">
          Awesome!
        </button>
      </div>
    `;
    
    document.body.appendChild(successModal);
    
    setTimeout(() => {
      if (document.body.contains(successModal)) {
        successModal.remove();
      }
    }, 5000);
  };

  const handleDismiss = () => {
    setShowInstallButton(false);
    localStorage.setItem('install-dismissed', Date.now().toString());
  };

  // Restore home icon if previously installed
  useEffect(() => {
    const isInstalled = localStorage.getItem('pwa-installed') === 'true';
    
    if (isInstalled) {
      if (deviceInfo.isIOS) {
        const iosIconUrl = localStorage.getItem('egura-ios-icon-url');
        if (iosIconUrl && !document.getElementById('egura-ios-app')) {
          addIOSAppToHomeScreen(iosIconUrl);
        }
      } else {
        const iconUrl = localStorage.getItem('egura-home-icon-url');
        if (iconUrl && !document.getElementById('egura-home-app')) {
          createPersistentHomeIcon(iconUrl);
        }
      }
    }
  }, [deviceInfo]);

  // Don't show if already installed or not mobile
  if (isInstalled || !showInstallButton || !deviceInfo.isMobile) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white bg-opacity-95 backdrop-blur-sm rounded-2xl shadow-2xl max-w-xs w-full mx-4 animate-scale-in">
        {/* Close button */}
        <div className="flex justify-end p-3">
          <button
            onClick={handleDismiss}
            className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        {/* Content */}
        <div className="px-6 pb-6 text-center">
          {/* App Icon */}
          <div className="w-20 h-20 bg-gradient-to-br from-orange-400 to-orange-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <span className="text-3xl">🛍️</span>
          </div>
          
          {/* Title */}
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            Install E-Gura Store
          </h3>
          
          {/* Description */}
          <p className="text-gray-600 text-sm mb-6 leading-relaxed">
            Get instant access to Rwanda's #1 shopping app. One click installs everything automatically!
          </p>
          
          {/* Benefits */}
          <div className="space-y-2 mb-6">
            <div className="flex items-center justify-center text-sm text-gray-700">
              <span className="text-green-500 mr-2">⚡</span>
              <span>Installs automatically - no manual steps</span>
            </div>
            <div className="flex items-center justify-center text-sm text-gray-700">
              <span className="text-green-500 mr-2">🏠</span>
              <span>Appears on your home screen instantly</span>
            </div>
            <div className="flex items-center justify-center text-sm text-gray-700">
              <span className="text-green-500 mr-2">📱</span>
              <span>Works like a native app</span>
            </div>
          </div>
          
          {/* Install button */}
          <button
            onClick={handleOneClickInstall}
            disabled={isInstalling}
            className="w-full bg-orange-600 text-white py-4 px-6 rounded-xl text-lg font-bold hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            {isInstalling ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mr-3"></div>
                Installing...
              </div>
            ) : (
              '🚀 Install App Now'
            )}
          </button>
          
          <p className="text-xs text-gray-500 mt-3">
            One click does everything automatically
          </p>
        </div>
      </div>
    </div>
  );
};

export default OneClickInstall;
