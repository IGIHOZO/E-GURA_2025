// PWA Utilities for service worker registration and management

import React, { useState, useEffect } from 'react';
import { Workbox } from 'workbox-window';

class PWAManager {
  constructor() {
    this.wb = null;
    this.registration = null;
    this.isUpdateAvailable = false;
    this.callbacks = {
      onUpdateAvailable: [],
      onUpdateReady: [],
      onOfflineReady: []
    };
  }

  // Initialize PWA and register service worker
  async init() {
    if ('serviceWorker' in navigator) {
      try {
        this.wb = new Workbox('/sw.js');
        
        // Add event listeners
        this.setupEventListeners();
        
        // Register the service worker
        this.registration = await this.wb.register();
        
        console.log('PWA: Service worker registered successfully');
        return true;
      } catch (error) {
        console.error('PWA: Service worker registration failed:', error);
        return false;
      }
    } else {
      console.log('PWA: Service workers not supported');
      return false;
    }
  }

  setupEventListeners() {
    if (!this.wb) return;

    // Service worker installed for the first time
    this.wb.addEventListener('installed', (event) => {
      console.log('PWA: Service worker installed');
      if (!event.isUpdate) {
        this.triggerCallbacks('onOfflineReady');
      }
    });

    // Service worker is waiting to activate (update available)
    this.wb.addEventListener('waiting', (event) => {
      console.log('PWA: Service worker waiting (update available)');
      this.isUpdateAvailable = true;
      this.triggerCallbacks('onUpdateAvailable', event);
    });

    // Service worker has been updated and is ready
    this.wb.addEventListener('controlling', (event) => {
      console.log('PWA: Service worker controlling');
      this.triggerCallbacks('onUpdateReady', event);
      
      // Only reload if this is an actual update (not initial load)
      // Check if we've already reloaded to prevent infinite loops
      if (!sessionStorage.getItem('pwa-reloaded')) {
        sessionStorage.setItem('pwa-reloaded', 'true');
        window.location.reload();
      }
    });

    // Service worker activation
    this.wb.addEventListener('activated', (event) => {
      console.log('PWA: Service worker activated');
      if (event.isUpdate) {
        // Show update ready message
        this.showUpdateMessage();
      }
    });
  }

  // Skip waiting and activate new service worker
  async skipWaiting() {
    if (this.wb && this.isUpdateAvailable) {
      this.wb.addEventListener('controlling', () => {
        window.location.reload();
      });
      
      this.wb.messageSkipWaiting();
    }
  }

  // Add callback for PWA events
  on(event, callback) {
    if (this.callbacks[event]) {
      this.callbacks[event].push(callback);
    }
  }

  // Trigger callbacks
  triggerCallbacks(event, data = null) {
    if (this.callbacks[event]) {
      this.callbacks[event].forEach(callback => callback(data));
    }
  }

  // Show update available message
  showUpdateMessage() {
    const updateBanner = document.createElement('div');
    updateBanner.className = 'fixed top-0 left-0 right-0 bg-blue-600 text-white p-3 text-center z-50';
    updateBanner.innerHTML = `
      <div class="flex items-center justify-center space-x-4">
        <span>A new version of E-Gura Store is available!</span>
        <button id="update-btn" class="bg-white text-blue-600 px-3 py-1 rounded text-sm font-semibold">
          Update Now
        </button>
        <button id="dismiss-btn" class="text-white opacity-75 hover:opacity-100">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
          </svg>
        </button>
      </div>
    `;

    document.body.appendChild(updateBanner);

    // Handle update button click
    document.getElementById('update-btn').addEventListener('click', () => {
      this.skipWaiting();
      updateBanner.remove();
    });

    // Handle dismiss button click
    document.getElementById('dismiss-btn').addEventListener('click', () => {
      updateBanner.remove();
    });

    // Auto-dismiss after 10 seconds
    setTimeout(() => {
      if (document.body.contains(updateBanner)) {
        updateBanner.remove();
      }
    }, 10000);
  }

  // Check if app is running in PWA mode
  isPWA() {
    return window.matchMedia('(display-mode: standalone)').matches || 
           window.navigator.standalone === true;
  }

  // Get installation status
  getInstallStatus() {
    return {
      isPWA: this.isPWA(),
      canInstall: 'beforeinstallprompt' in window,
      hasServiceWorker: 'serviceWorker' in navigator,
      isOnline: navigator.onLine
    };
  }

  // Cache management
  async clearCache() {
    if ('caches' in window) {
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames.map(cacheName => caches.delete(cacheName))
      );
      console.log('PWA: All caches cleared');
    }
  }

  // Get cache usage
  async getCacheUsage() {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      const estimate = await navigator.storage.estimate();
      return {
        used: estimate.usage,
        available: estimate.quota,
        percentage: Math.round((estimate.usage / estimate.quota) * 100)
      };
    }
    return null;
  }
}

// Create singleton instance
const pwaManager = new PWAManager();

// Auto-initialize PWA
if (typeof window !== 'undefined') {
  pwaManager.init();
}

// Offline/Online status management
class NetworkManager {
  constructor() {
    this.isOnline = navigator.onLine;
    this.callbacks = {
      onOnline: [],
      onOffline: []
    };
    
    this.setupEventListeners();
  }

  setupEventListeners() {
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.triggerCallbacks('onOnline');
      this.showNetworkStatus('online');
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      this.triggerCallbacks('onOffline');
      this.showNetworkStatus('offline');
    });
  }

  on(event, callback) {
    if (this.callbacks[event]) {
      this.callbacks[event].push(callback);
    }
  }

  triggerCallbacks(event) {
    if (this.callbacks[event]) {
      this.callbacks[event].forEach(callback => callback());
    }
  }

  showNetworkStatus(status) {
    const existingBanner = document.getElementById('network-status-banner');
    if (existingBanner) {
      existingBanner.remove();
    }

    const banner = document.createElement('div');
    banner.id = 'network-status-banner';
    banner.className = `fixed top-0 left-0 right-0 p-2 text-center text-white z-50 ${
      status === 'online' ? 'bg-green-600' : 'bg-red-600'
    }`;
    
    banner.textContent = status === 'online' 
      ? 'You\'re back online!' 
      : 'You\'re offline. Some features may not work.';

    document.body.appendChild(banner);

    // Auto-remove after 3 seconds for online, keep offline banner
    if (status === 'online') {
      setTimeout(() => {
        if (document.body.contains(banner)) {
          banner.remove();
        }
      }, 3000);
    }
  }
}

const networkManager = new NetworkManager();

// React hooks for PWA functionality

export const usePWA = () => {
  const [isUpdateAvailable, setIsUpdateAvailable] = useState(false);
  const [isOfflineReady, setIsOfflineReady] = useState(false);

  useEffect(() => {
    pwaManager.on('onUpdateAvailable', () => setIsUpdateAvailable(true));
    pwaManager.on('onOfflineReady', () => setIsOfflineReady(true));
  }, []);

  return {
    isUpdateAvailable,
    isOfflineReady,
    isPWA: pwaManager.isPWA(),
    skipWaiting: () => pwaManager.skipWaiting(),
    clearCache: () => pwaManager.clearCache(),
    getInstallStatus: () => pwaManager.getInstallStatus()
  };
};

export const useNetworkStatus = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    networkManager.on('onOnline', handleOnline);
    networkManager.on('onOffline', handleOffline);
    
    // Cleanup is not needed as networkManager persists across renders
    // But we prevent duplicate listeners by checking if already added
    return () => {
      // Note: No cleanup needed as callbacks are reused
    };
  }, []);

  return { isOnline };
};

// Utility functions
export const preloadRoute = async (routePath) => {
  try {
    // Preload route component
    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.href = routePath;
    document.head.appendChild(link);
  } catch (error) {
    console.warn('Failed to preload route:', routePath, error);
  }
};

export const preloadImage = (src) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = resolve;
    img.onerror = reject;
    img.src = src;
  });
};

export const getCacheSize = async () => {
  if ('caches' in window) {
    const cacheNames = await caches.keys();
    let totalSize = 0;
    
    for (const cacheName of cacheNames) {
      const cache = await caches.open(cacheName);
      const requests = await cache.keys();
      
      for (const request of requests) {
        const response = await cache.match(request);
        if (response) {
          const blob = await response.blob();
          totalSize += blob.size;
        }
      }
    }
    
    return totalSize;
  }
  return 0;
};

export default pwaManager;
export { networkManager };
