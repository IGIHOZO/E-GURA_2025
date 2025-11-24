/**
 * Performance Configuration
 * Centralized settings for optimization strategies
 */

export const PERFORMANCE_CONFIG = {
  // ==================== Cache Settings ====================
  cache: {
    enabled: true,
    strategies: {
      api: {
        products: 300000,      // 5 min
        categories: 600000,    // 10 min
        user: 60000,           // 1 min
        static: 3600000,       // 1 hour
        search: 180000         // 3 min
      },
      images: {
        enabled: true,
        lazyLoad: true,
        preload: ['hero', 'featured'],
        formats: ['webp', 'jpg'],
        sizes: [320, 640, 960, 1280, 1920]
      },
      storage: {
        maxSize: 50 * 1024 * 1024, // 50MB
        cleanupThreshold: 40 * 1024 * 1024 // 40MB
      }
    }
  },

  // ==================== Loading Strategy ====================
  loading: {
    // Initial page load
    initialBatch: 10,
    // Progressive loading
    progressive: true,
    batchSize: 20,
    delay: 1000,
    // Skeleton loaders
    skeleton: true,
    // Prefetching
    prefetch: {
      enabled: true,
      onHover: true,
      onVisible: true
    }
  },

  // ==================== Image Optimization ====================
  images: {
    lazyLoad: {
      enabled: true,
      threshold: 0.1,
      rootMargin: '50px'
    },
    optimization: {
      quality: 80,
      format: 'webp',
      resize: true,
      compress: true
    },
    placeholder: {
      type: 'blur', // 'blur', 'shimmer', 'solid'
      color: '#f0f0f0'
    }
  },

  // ==================== Bundle Optimization ====================
  bundle: {
    splitting: true,
    chunks: {
      vendor: ['react', 'react-dom', 'react-router-dom'],
      ui: ['framer-motion', '@heroicons/react'],
      utils: ['axios']
    },
    treeshaking: true,
    minify: true,
    compression: 'gzip' // 'gzip' or 'brotli'
  },

  // ==================== Network Optimization ====================
  network: {
    timeout: 10000,
    retries: 3,
    backoff: true,
    // Connection type handling
    adaptive: {
      enabled: true,
      strategies: {
        '4g': { quality: 'high', batchSize: 50 },
        '3g': { quality: 'medium', batchSize: 20 },
        '2g': { quality: 'low', batchSize: 10 },
        'slow-2g': { quality: 'low', batchSize: 5 }
      }
    },
    // Request deduplication
    deduplication: true,
    // Batch requests
    batching: {
      enabled: true,
      maxBatchSize: 5,
      delay: 50
    }
  },

  // ==================== Rendering Optimization ====================
  rendering: {
    // Virtual scrolling for large lists
    virtualScroll: {
      enabled: true,
      itemHeight: 200,
      overscan: 3
    },
    // React optimizations
    react: {
      memo: true,
      lazyComponents: true,
      suspense: true,
      concurrent: true
    },
    // Animation optimization
    animation: {
      reducedMotion: true,
      gpuAcceleration: true,
      fps: 60
    }
  },

  // ==================== Monitoring ====================
  monitoring: {
    enabled: true,
    metrics: {
      pageLoad: true,
      apiCalls: true,
      renders: true,
      memory: true
    },
    thresholds: {
      pageLoad: 2000,      // 2 seconds
      apiResponse: 500,    // 500ms
      render: 16,          // 60fps
      memory: 100          // 100MB
    },
    reporting: {
      console: true,
      analytics: false
    }
  },

  // ==================== Service Worker ====================
  serviceWorker: {
    enabled: true,
    strategies: {
      images: 'cacheFirst',
      api: 'networkFirst',
      static: 'cacheFirst',
      dynamic: 'staleWhileRevalidate'
    },
    precache: [
      '/',
      '/shop',
      '/manifest.json'
    ]
  },

  // ==================== Preloading ====================
  preload: {
    critical: {
      fonts: ['/fonts/inter.woff2'],
      styles: ['/css/critical.css'],
      scripts: []
    },
    prefetch: {
      routes: ['/shop', '/product'],
      data: ['products', 'categories']
    },
    dns: [
      'https://images.unsplash.com',
      'https://res.cloudinary.com'
    ]
  },

  // ==================== Code Splitting ====================
  codeSplitting: {
    enabled: true,
    routes: true,
    components: {
      threshold: 50 * 1024, // 50KB
      dynamic: true
    },
    vendor: true
  },

  // ==================== Compression ====================
  compression: {
    enabled: true,
    algorithms: ['gzip', 'brotli'],
    threshold: 1024, // 1KB
    level: 9
  },

  // ==================== Resource Hints ====================
  resourceHints: {
    preconnect: ['https://fonts.googleapis.com'],
    dnsPrefetch: [
      'https://images.unsplash.com',
      'https://res.cloudinary.com'
    ],
    preload: {
      fonts: true,
      images: ['hero', 'logo'],
      critical: true
    }
  },

  // ==================== Experimental ====================
  experimental: {
    // HTTP/2 Server Push
    http2Push: false,
    // WebAssembly
    wasm: false,
    // Web Workers
    workers: false,
    // Streaming SSR
    streaming: false
  }
};

// ==================== Performance Targets ====================

export const PERFORMANCE_TARGETS = {
  // Core Web Vitals
  LCP: 2500,      // Largest Contentful Paint
  FID: 100,       // First Input Delay
  CLS: 0.1,       // Cumulative Layout Shift
  
  // Custom metrics
  TTI: 2000,      // Time to Interactive
  FCP: 1000,      // First Contentful Paint
  TTFB: 200,      // Time to First Byte
  
  // Page-specific
  pageLoad: {
    home: 2000,
    shop: 2000,
    product: 1500,
    checkout: 1500
  }
};

// ==================== Feature Flags ====================

export const FEATURE_FLAGS = {
  // Enable/disable features based on performance
  enableAnimations: true,
  enableVideoAutoplay: false,
  enableHeavyComponents: true,
  enableBackgroundSync: true,
  enablePredictivePreloading: true
};

// ==================== Export ====================

export default PERFORMANCE_CONFIG;
