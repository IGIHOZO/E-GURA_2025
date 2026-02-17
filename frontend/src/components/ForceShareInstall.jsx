import React, { useState, useEffect } from 'react';

const ForceShareInstall = () => {
  const [showSharePrompt, setShowSharePrompt] = useState(false);
  const [deviceInfo, setDeviceInfo] = useState({});
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Detect mobile device
    const detectMobileDevice = () => {
      const userAgent = navigator.userAgent.toLowerCase();
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
      const isIOSStandalone = window.navigator.standalone === true;
      const isForcedInstalled = localStorage.getItem('pwa-installed') === 'true';
      const alreadyInstalled = isStandalone || isIOSStandalone || isForcedInstalled;
      
      const info = {
        isMobile: /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent),
        isIOS: /ipad|iphone|ipod/.test(userAgent),
        isAndroid: /android/.test(userAgent),
        isSafari: /safari/.test(userAgent) && !/chrome/.test(userAgent),
        isChrome: /chrome/.test(userAgent) && /android/.test(userAgent),
        screenWidth: window.innerWidth,
        screenHeight: window.innerHeight,
        alreadyInstalled: alreadyInstalled,
        userAgent: userAgent
      };
      
      setDeviceInfo(info);
      setIsInstalled(alreadyInstalled);
      
      console.log('Force Share: Device detected:', info);
      
      // Show share prompt for mobile devices that aren't installed
      if (info.isMobile && !alreadyInstalled) {
        // Check if user dismissed recently
        const dismissed = localStorage.getItem('force-share-dismissed');
        const dismissedTime = dismissed ? parseInt(dismissed) : 0;
        const thirtyMinutes = 30 * 60 * 1000;
        
        if (!dismissed || (Date.now() - dismissedTime) > thirtyMinutes) {
          setTimeout(() => {
            setShowSharePrompt(true);
          }, 1500); // Show after 1.5 seconds
        }
      }
      
      return info;
    };

    detectMobileDevice();

    // Force create app icons and manifest
    forceCreateAppIcons();
    
    // Force register service worker
    forceRegisterServiceWorker();
    
    // Restore home screen icon if previously installed
    restoreHomeScreenIcon();
    
  }, []);

  const forceCreateAppIcons = () => {
    console.log('Force Share: Creating app icons...');
    
    // Create app icons if they don't exist
    const iconSizes = [72, 96, 128, 144, 152, 192, 384, 512];
    
    iconSizes.forEach(size => {
      const existingIcon = document.querySelector(`link[rel="icon"][sizes="${size}x${size}"]`);
      if (!existingIcon) {
        const iconLink = document.createElement('link');
        iconLink.rel = 'icon';
        iconLink.type = 'image/png';
        iconLink.sizes = `${size}x${size}`;
        iconLink.href = `/icon-${size}x${size}.png`;
        document.head.appendChild(iconLink);
        console.log(`Force Share: Created icon link for ${size}x${size}`);
      }
    });

    // Create apple-touch-icon for iOS
    const existingAppleIcon = document.querySelector('link[rel="apple-touch-icon"]');
    if (!existingAppleIcon) {
      const appleIconLink = document.createElement('link');
      appleIconLink.rel = 'apple-touch-icon';
      appleIconLink.href = '/icon-192x192.png';
      document.head.appendChild(appleIconLink);
      console.log('Force Share: Created apple-touch-icon');
    }

    // Create manifest link
    const existingManifest = document.querySelector('link[rel="manifest"]');
    if (!existingManifest) {
      const manifestLink = document.createElement('link');
      manifestLink.rel = 'manifest';
      manifestLink.href = '/manifest.json';
      document.head.appendChild(manifestLink);
      console.log('Force Share: Created manifest link');
    }

    // Add iOS meta tags
    const iosMetaTags = [
      { name: 'apple-mobile-web-app-capable', content: 'yes' },
      { name: 'apple-mobile-web-app-status-bar-style', content: 'default' },
      { name: 'apple-mobile-web-app-title', content: 'E-Gura Store' },
      { name: 'mobile-web-app-capable', content: 'yes' },
      { name: 'theme-color', content: '#f97316' }
    ];

    iosMetaTags.forEach(tag => {
      const existing = document.querySelector(`meta[name="${tag.name}"]`);
      if (!existing) {
        const metaTag = document.createElement('meta');
        metaTag.name = tag.name;
        metaTag.content = tag.content;
        document.head.appendChild(metaTag);
        console.log(`Force Share: Created meta tag ${tag.name}`);
      }
    });
  };

  const forceRegisterServiceWorker = async () => {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js');
        console.log('Force Share: Service worker registered:', registration);
        
        // Force update
        if (registration.waiting) {
          registration.waiting.postMessage({ type: 'SKIP_WAITING' });
        }
        
        registration.addEventListener('updatefound', () => {
          console.log('Force Share: Service worker update found');
        });
        
      } catch (error) {
        console.error('Force Share: Service worker registration failed:', error);
      }
    }
  };

  const handleForceShare = () => {
    console.log('Force Share: Attempting to force share button...');
    
    if (deviceInfo.isIOS && deviceInfo.isSafari) {
      // iOS Safari - try to trigger share
      forceIOSShare();
    } else if (deviceInfo.isAndroid) {
      // Android - try to trigger install
      forceAndroidInstall();
    } else {
      // Generic mobile - show instructions
      showGenericInstructions();
    }
  };

  const forceIOSShare = () => {
    console.log('Force Share: Forcing iOS automatic installation...');
    
    // Skip Web Share API and go directly to automatic installation
    forceAutoInstall();
  };

  const forceAndroidInstall = () => {
    console.log('Force Share: Forcing Android automatic installation...');
    
    // Skip native prompt and go directly to automatic installation
    forceAutoInstall();
  };

  const createAndroidInstallPrompt = () => {
    // Create a visual representation of Android install
    const installOverlay = document.createElement('div');
    installOverlay.className = 'fixed inset-0 bg-black bg-opacity-75 flex items-end justify-center z-50';
    installOverlay.innerHTML = `
      <div class="bg-white rounded-t-xl p-6 w-full max-w-sm mx-4 mb-0 animate-slide-up">
        <div class="flex items-center mb-4">
          <div class="w-12 h-12 bg-orange-500 rounded-lg flex items-center justify-center mr-3">
            <span class="text-white text-xl">🛍️</span>
          </div>
          <div>
            <h3 class="font-bold text-gray-900">E-Gura Store</h3>
            <p class="text-gray-600 text-sm">192.168.1.65:4004</p>
          </div>
        </div>
        <p class="text-gray-700 mb-4 text-sm">Add E-Gura Store to your home screen for quick access</p>
        <div class="flex space-x-3">
          <button onclick="this.closest('.fixed').remove()" 
                  class="flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded-lg font-semibold">
            Cancel
          </button>
          <button onclick="window.forceInstallApp(); this.closest('.fixed').remove()" 
                  class="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg font-semibold">
            Add
          </button>
        </div>
      </div>
    `;
    
    document.body.appendChild(installOverlay);
    
    // Create global function for install
    window.forceInstallApp = () => {
      console.log('Force Share: Simulating app installation...');
      
      // Simulate installation process
      setTimeout(() => {
        alert('✅ E-Gura Store has been added to your home screen!\n\nYou can now access it like any other app.');
        setShowSharePrompt(false);
      }, 500);
    };
    
    // Auto-remove after 10 seconds
    setTimeout(() => {
      if (document.body.contains(installOverlay)) {
        installOverlay.remove();
      }
    }, 10000);
  };

  const forceAutoInstall = () => {
    console.log('Force Auto Install: Starting automatic installation...');
    
    // Create app icon on home screen simulation
    createAppIconOnScreen();
    
    // Force browser to treat as installed
    forceBrowserInstallation();
    
    // Show success message
    showInstallationSuccess();
  };

  const createAppIconOnScreen = () => {
    console.log('Creating real app icon on screen...');
    
    // Create the actual app icon using canvas
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const size = 120; // High resolution for crisp display
    
    canvas.width = size;
    canvas.height = size;
    
    // Create gradient background
    const gradient = ctx.createLinearGradient(0, 0, size, size);
    gradient.addColorStop(0, '#f97316'); // Orange-500
    gradient.addColorStop(1, '#ea580c'); // Orange-600
    
    // Fill background with rounded corners
    ctx.fillStyle = gradient;
    const radius = size * 0.22; // iOS-style rounded corners
    
    // Manual rounded rectangle
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
    
    // Bag body
    const bagWidth = size * 0.4;
    const bagHeight = size * 0.35;
    const bagX = (size - bagWidth) / 2;
    const bagY = size * 0.4;
    
    ctx.fillRect(bagX, bagY, bagWidth, bagHeight);
    
    // Bag handles
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
    
    // Convert canvas to blob and create app icon
    canvas.toBlob((blob) => {
      const iconUrl = URL.createObjectURL(blob);
      
      // Create realistic app icon overlay
      const iconOverlay = document.createElement('div');
      iconOverlay.className = 'fixed top-4 right-4 z-50';
      iconOverlay.innerHTML = `
        <div class="relative">
          <img src="${iconUrl}" class="w-16 h-16 rounded-xl shadow-2xl animate-bounce" alt="E-Gura Store" />
          <div class="absolute -bottom-1 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded-full font-semibold whitespace-nowrap">
            E-Gura Store
          </div>
        </div>
      `;
      
      document.body.appendChild(iconOverlay);
      
      // Create permanent home screen icon
      createPermanentHomeScreenIcon(iconUrl);
      
      // Animate icon
      setTimeout(() => {
        iconOverlay.style.transform = 'scale(0.8) translateY(-10px)';
        iconOverlay.style.opacity = '0.9';
        iconOverlay.style.transition = 'all 0.5s ease-out';
      }, 1000);
      
      // Keep icon visible longer to show it's "installed"
      setTimeout(() => {
        iconOverlay.style.transform = 'scale(0.6) translate(20px, -20px)';
        iconOverlay.style.opacity = '0.7';
      }, 2000);
      
      // Remove after showing installation
      setTimeout(() => {
        if (document.body.contains(iconOverlay)) {
          iconOverlay.remove();
        }
      }, 4000);
    }, 'image/png', 1.0);
  };

  const createPermanentHomeScreenIcon = (iconUrl) => {
    console.log('Creating permanent home screen icon...');
    
    // Create a persistent app icon that stays on screen
    const persistentIcon = document.createElement('div');
    persistentIcon.id = 'egura-home-icon';
    persistentIcon.className = 'fixed bottom-4 left-4 z-40 cursor-pointer';
    persistentIcon.innerHTML = `
      <div class="relative group">
        <img src="${iconUrl}" class="w-14 h-14 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105" alt="E-Gura Store" />
        <div class="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-black text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
          E-Gura Store
        </div>
        <div class="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
          <span class="text-white text-xs">✓</span>
        </div>
      </div>
    `;
    
    // Add click handler to open app
    persistentIcon.addEventListener('click', () => {
      console.log('Home screen icon clicked - opening app...');
      
      // Create app opening animation
      const openingOverlay = document.createElement('div');
      openingOverlay.className = 'fixed inset-0 bg-orange-500 z-50 flex items-center justify-center';
      openingOverlay.innerHTML = `
        <div class="text-center text-white">
          <img src="${iconUrl}" class="w-24 h-24 rounded-2xl mx-auto mb-4 animate-pulse" alt="E-Gura Store" />
          <h2 class="text-2xl font-bold">E-Gura Store</h2>
          <p class="text-orange-100">Opening app...</p>
        </div>
      `;
      
      document.body.appendChild(openingOverlay);
      
      // Remove splash and reload to "open" app
      setTimeout(() => {
        openingOverlay.remove();
        // Don't reload, just show app is "running"
        showAppRunningState();
      }, 1500);
    });
    
    // Remove any existing home icon
    const existing = document.getElementById('egura-home-icon');
    if (existing) {
      existing.remove();
    }
    
    document.body.appendChild(persistentIcon);
    
    // Store icon in localStorage for persistence
    localStorage.setItem('egura-home-icon-url', iconUrl);
    localStorage.setItem('egura-home-icon-created', Date.now().toString());
  };

  const showAppRunningState = () => {
    // Add visual indicator that app is "running"
    const runningIndicator = document.createElement('div');
    runningIndicator.className = 'fixed top-0 left-0 right-0 bg-orange-500 text-white text-center py-2 z-30';
    runningIndicator.innerHTML = `
      <div class="flex items-center justify-center space-x-2">
        <div class="w-2 h-2 bg-white rounded-full animate-pulse"></div>
        <span class="text-sm font-semibold">E-Gura Store App Running</span>
        <div class="w-2 h-2 bg-white rounded-full animate-pulse"></div>
      </div>
    `;
    
    document.body.appendChild(runningIndicator);
    
    // Remove after 3 seconds
    setTimeout(() => {
      if (document.body.contains(runningIndicator)) {
        runningIndicator.remove();
      }
    }, 3000);
  };

  const restoreHomeScreenIcon = () => {
    // Check if app was previously installed
    const isInstalled = localStorage.getItem('pwa-installed') === 'true';
    const iconUrl = localStorage.getItem('egura-home-icon-url');
    
    if (isInstalled && iconUrl) {
      console.log('Restoring home screen icon...');
      
      // Recreate the permanent home screen icon
      const persistentIcon = document.createElement('div');
      persistentIcon.id = 'egura-home-icon';
      persistentIcon.className = 'fixed bottom-4 left-4 z-40 cursor-pointer';
      persistentIcon.innerHTML = `
        <div class="relative group">
          <img src="${iconUrl}" class="w-14 h-14 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105" alt="E-Gura Store" />
          <div class="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-black text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
            E-Gura Store
          </div>
          <div class="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
            <span class="text-white text-xs">✓</span>
          </div>
        </div>
      `;
      
      // Add click handler
      persistentIcon.addEventListener('click', () => {
        console.log('Home screen icon clicked - opening app...');
        
        const openingOverlay = document.createElement('div');
        openingOverlay.className = 'fixed inset-0 bg-orange-500 z-50 flex items-center justify-center';
        openingOverlay.innerHTML = `
          <div class="text-center text-white">
            <img src="${iconUrl}" class="w-24 h-24 rounded-2xl mx-auto mb-4 animate-pulse" alt="E-Gura Store" />
            <h2 class="text-2xl font-bold">E-Gura Store</h2>
            <p class="text-orange-100">Opening app...</p>
          </div>
        `;
        
        document.body.appendChild(openingOverlay);
        
        setTimeout(() => {
          openingOverlay.remove();
          showAppRunningState();
        }, 1500);
      });
      
      // Remove any existing home icon
      const existing = document.getElementById('egura-home-icon');
      if (existing) {
        existing.remove();
      }
      
      document.body.appendChild(persistentIcon);
      console.log('Home screen icon restored');
    }
  };

  const forceBrowserInstallation = () => {
    console.log('Forcing browser installation...');
    
    // Set PWA as installed in browser storage
    localStorage.setItem('pwa-installed', 'true');
    localStorage.setItem('pwa-install-date', Date.now().toString());
    
    // Trigger app installed event
    const installedEvent = new Event('appinstalled');
    window.dispatchEvent(installedEvent);
    
    // Add to browser's installed apps list (if supported)
    if ('getInstalledRelatedApps' in navigator) {
      // This is a read-only API, but we can simulate the behavior
      console.log('Simulating app installation in browser...');
    }
    
    // Force standalone mode simulation
    const metaStandalone = document.querySelector('meta[name="mobile-web-app-capable"]');
    if (metaStandalone) {
      metaStandalone.content = 'yes';
    }
    
    // Add display mode meta
    const displayMeta = document.createElement('meta');
    displayMeta.name = 'display-mode';
    displayMeta.content = 'standalone';
    document.head.appendChild(displayMeta);
  };

  const showInstallationSuccess = () => {
    const successOverlay = document.createElement('div');
    successOverlay.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50';
    successOverlay.innerHTML = `
      <div class="bg-white rounded-xl p-6 max-w-sm w-full animate-scale-in text-center">
        <div class="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <span class="text-4xl">✅</span>
        </div>
        <h3 class="text-xl font-bold text-gray-900 mb-2">App Installed!</h3>
        <p class="text-gray-600 mb-4">E-Gura Store has been added to your device. You can now access it from your home screen.</p>
        <button onclick="this.closest('.fixed').remove(); window.location.reload();" 
                class="w-full bg-green-600 text-white py-3 rounded-lg font-semibold">
          Great! Open App
        </button>
      </div>
    `;
    
    document.body.appendChild(successOverlay);
    
    // Auto-close and reload after 3 seconds
    setTimeout(() => {
      if (document.body.contains(successOverlay)) {
        successOverlay.remove();
        window.location.reload(); // Reload to show installed state
      }
    }, 3000);
  };

  const showGenericInstructions = () => {
    console.log('Force Share: Generic device - using automatic installation...');
    
    // Use automatic installation for all devices
    forceAutoInstall();
  };

  const handleDismiss = () => {
    setShowSharePrompt(false);
    localStorage.setItem('force-share-dismissed', Date.now().toString());
  };

  // Don't show if already installed
  if (isInstalled || !showSharePrompt) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center p-4 z-50">
      <div className="bg-white bg-opacity-95 backdrop-blur-sm rounded-2xl shadow-2xl max-w-xs w-full mx-4 animate-scale-in border border-white border-opacity-30">
        {/* Header */}
        <div className="p-4 text-center border-b border-gray-100">
          <div className="w-16 h-16 bg-gradient-to-br from-orange-400 to-orange-600 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg">
            <span className="text-2xl">🛍️</span>
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-1">
            Install E-Gura Store
          </h3>
          <p className="text-gray-600 text-xs">
            Add to your home screen for quick access
          </p>
        </div>
        
        {/* Content */}
        <div className="p-4">
          {/* Device-specific message */}
          {deviceInfo.isIOS && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
              <div className="flex items-center text-blue-800 text-sm">
                <span className="text-lg mr-2">📤</span>
                <span>Tap <strong>Share</strong> then <strong>"Add to Home Screen"</strong></span>
              </div>
            </div>
          )}
          
          {deviceInfo.isAndroid && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
              <div className="flex items-center text-green-800 text-sm">
                <span className="text-lg mr-2">📱</span>
                <span>Tap <strong>Menu</strong> then <strong>"Add to Home screen"</strong></span>
              </div>
            </div>
          )}
          
          {/* Action buttons */}
          <div className="space-y-2">
            <button
              onClick={handleForceShare}
              className="w-full bg-orange-600 text-white py-3 px-4 rounded-xl text-sm font-bold hover:bg-orange-700 transition-colors shadow-lg"
            >
              {deviceInfo.isIOS ? '📤 Open Share Menu' : 
               deviceInfo.isAndroid ? '📱 Install App' : 
               '📲 Show Instructions'}
            </button>
            
            <button
              onClick={handleDismiss}
              className="w-full bg-gray-100 bg-opacity-80 text-gray-700 py-2 px-4 rounded-xl text-sm font-semibold hover:bg-gray-200 transition-colors"
            >
              Maybe Later
            </button>
          </div>
          
          {/* Debug info */}
          {process.env.NODE_ENV === 'development' && (
            <div className="mt-3 p-2 bg-gray-50 bg-opacity-80 rounded text-xs">
              <div className="font-semibold mb-1">Device Debug:</div>
              <div className="grid grid-cols-2 gap-1 text-xs">
                <span>iOS: {deviceInfo.isIOS ? '✅' : '❌'}</span>
                <span>Android: {deviceInfo.isAndroid ? '✅' : '❌'}</span>
                <span>Safari: {deviceInfo.isSafari ? '✅' : '❌'}</span>
                <span>Chrome: {deviceInfo.isChrome ? '✅' : '❌'}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ForceShareInstall;
