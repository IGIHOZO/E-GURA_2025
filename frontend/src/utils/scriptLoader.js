// Aggressive third-party script management
// Load scripts only when needed, defer until after interaction or idle

class ScriptLoader {
  constructor() {
    this.loadedScripts = new Set();
    this.loadingScripts = new Map();
    this.userHasInteracted = false;
    this.isIdle = false;
    
    this.initInteractionTracking();
    this.initIdleTracking();
  }

  initInteractionTracking() {
    const events = ['mousedown', 'keydown', 'touchstart', 'scroll'];
    const markInteraction = () => {
      this.userHasInteracted = true;
      events.forEach(event => {
        document.removeEventListener(event, markInteraction, { passive: true });
      });
    };

    events.forEach(event => {
      document.addEventListener(event, markInteraction, { passive: true });
    });
  }

  initIdleTracking() {
    // Mark as idle after 3 seconds of no activity
    let idleTimer;
    const resetIdleTimer = () => {
      clearTimeout(idleTimer);
      idleTimer = setTimeout(() => {
        this.isIdle = true;
      }, 3000);
    };

    ['mousedown', 'keydown', 'touchstart', 'scroll'].forEach(event => {
      document.addEventListener(event, resetIdleTimer, { passive: true });
    });
    
    resetIdleTimer();
  }

  async loadScript(src, options = {}) {
    const {
      async = true,
      defer = true,
      onlyAfterInteraction = false,
      onlyWhenIdle = false,
      critical = false,
      attributes = {}
    } = options;

    // If script already loaded, return immediately
    if (this.loadedScripts.has(src)) {
      return Promise.resolve();
    }

    // If script is currently loading, return existing promise
    if (this.loadingScripts.has(src)) {
      return this.loadingScripts.get(src);
    }

    // Check loading conditions
    if (!critical) {
      if (onlyAfterInteraction && !this.userHasInteracted) {
        return this.waitForInteraction().then(() => this.loadScript(src, options));
      }
      
      if (onlyWhenIdle && !this.isIdle) {
        return this.waitForIdle().then(() => this.loadScript(src, options));
      }
    }

    // Create loading promise
    const loadingPromise = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = src;
      script.async = async;
      script.defer = defer;

      // Add custom attributes
      Object.entries(attributes).forEach(([key, value]) => {
        script.setAttribute(key, value);
      });

      script.onload = () => {
        this.loadedScripts.add(src);
        this.loadingScripts.delete(src);
        resolve();
      };

      script.onerror = () => {
        this.loadingScripts.delete(src);
        reject(new Error(`Failed to load script: ${src}`));
      };

      document.head.appendChild(script);
    });

    this.loadingScripts.set(src, loadingPromise);
    return loadingPromise;
  }

  waitForInteraction() {
    if (this.userHasInteracted) {
      return Promise.resolve();
    }

    return new Promise(resolve => {
      const events = ['mousedown', 'keydown', 'touchstart', 'scroll'];
      const handler = () => {
        events.forEach(event => {
          document.removeEventListener(event, handler, { passive: true });
        });
        resolve();
      };

      events.forEach(event => {
        document.addEventListener(event, handler, { passive: true });
      });
    });
  }

  waitForIdle() {
    if (this.isIdle) {
      return Promise.resolve();
    }

    return new Promise(resolve => {
      const checkIdle = () => {
        if (this.isIdle) {
          resolve();
        } else {
          setTimeout(checkIdle, 100);
        }
      };
      checkIdle();
    });
  }

  // Preload critical scripts
  preloadScript(src) {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'script';
    link.href = src;
    document.head.appendChild(link);
  }

  // Remove/disable tracking scripts (for privacy/performance)
  blockScript(src) {
    this.loadedScripts.add(src); // Mark as "loaded" to prevent actual loading
  }
}

// Global script loader instance
const scriptLoader = new ScriptLoader();

// Third-party script configurations
export const THIRD_PARTY_SCRIPTS = {
  // Analytics - Load after interaction
  googleAnalytics: {
    src: 'https://www.googletagmanager.com/gtag/js?id=GA_MEASUREMENT_ID',
    onlyAfterInteraction: true,
    attributes: { 'data-category': 'analytics' }
  },

  // Chat widgets - Load after interaction
  intercom: {
    src: 'https://widget.intercom.io/widget/APP_ID',
    onlyAfterInteraction: true,
    attributes: { 'data-category': 'chat' }
  },

  // Heatmap tools - Load when idle
  hotjar: {
    src: 'https://static.hotjar.com/c/hotjar-ID.js',
    onlyWhenIdle: true,
    attributes: { 'data-category': 'heatmap' }
  },

  // A/B testing - Load when idle
  optimizely: {
    src: 'https://cdn.optimizely.com/js/PROJECT_ID.js',
    onlyWhenIdle: true,
    attributes: { 'data-category': 'testing' }
  },

  // Social media - Load on demand
  facebookPixel: {
    src: 'https://connect.facebook.net/en_US/fbevents.js',
    onlyAfterInteraction: true,
    attributes: { 'data-category': 'social' }
  }
};

// Utility functions
export const loadThirdPartyScript = (scriptName, customOptions = {}) => {
  const config = THIRD_PARTY_SCRIPTS[scriptName];
  if (!config) {
    console.warn(`Unknown third-party script: ${scriptName}`);
    return Promise.reject(new Error(`Unknown script: ${scriptName}`));
  }

  return scriptLoader.loadScript(config.src, { ...config, ...customOptions });
};

export const preloadCriticalScripts = () => {
  // Only preload truly critical scripts
  // Most third-party scripts are NOT critical
};

export const loadAnalyticsAfterInteraction = () => {
  return loadThirdPartyScript('googleAnalytics');
};

export const loadChatWhenNeeded = () => {
  return loadThirdPartyScript('intercom');
};

export const loadHeatmapWhenIdle = () => {
  return loadThirdPartyScript('hotjar');
};

// Performance monitoring
export const getScriptLoadingStats = () => {
  return {
    loaded: scriptLoader.loadedScripts.size,
    loading: scriptLoader.loadingScripts.size,
    userInteracted: scriptLoader.userHasInteracted,
    isIdle: scriptLoader.isIdle
  };
};

// Block harmful scripts
export const blockUnnecessaryScripts = () => {
  // Block scripts that are not essential for core functionality
  const scriptsToBlock = [
    'https://www.google-analytics.com/analytics.js', // Old GA
    'https://googleads.g.doubleclick.net/', // Ads
    'https://connect.facebook.net/en_US/fbevents.js', // FB Pixel (unless needed)
  ];

  scriptsToBlock.forEach(src => {
    scriptLoader.blockScript(src);
  });
};

export default scriptLoader;
