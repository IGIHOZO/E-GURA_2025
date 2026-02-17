import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { visualizer } from 'rollup-plugin-visualizer'
import viteCompression from 'vite-plugin-compression'

export default defineConfig({
  base: '/egura/',
  plugins: [
    react(),
    // PWA Configuration
    VitePWA({
      registerType: 'prompt',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
      manifest: {
        name: 'E-Gura Store - Rwanda\'s #1 Online Shopping Platform',
        short_name: 'E-Gura',
        description: 'Shop electronics, fashion, home & kitchen at Rwanda\'s best online store. Free delivery in Kigali, secure mobile money payments.',
        theme_color: '#f97316',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'portrait-primary',
        scope: '/',
        start_url: '/',
        id: 'egura-store-pwa',
        icons: [
          {
            src: 'icon-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'icon-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: 'icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,webp,jpg,jpeg}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/localhost:5001\/api\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 // 24 hours
              }
            }
          },
          {
            urlPattern: /\.(?:png|jpg|jpeg|svg|webp)$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'images-cache',
              expiration: {
                maxEntries: 200,
                maxAgeSeconds: 60 * 60 * 24 * 30 // 30 days
              }
            }
          },
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
              }
            }
          }
        ]
      },
      devOptions: {
        enabled: false, // Disable PWA in development to avoid blocking Vite HMR
        type: 'module'
      }
    }),
    // Gzip compression
    viteCompression({
      verbose: true,
      disable: false,
      threshold: 10240, // 10KB
      algorithm: 'gzip',
      ext: '.gz',
    }),
    // Brotli compression
    viteCompression({
      verbose: true,
      disable: false,
      threshold: 10240,
      algorithm: 'brotliCompress',
      ext: '.br',
    }),
    // Bundle analyzer (only in build)
    process.env.ANALYZE && visualizer({
      open: true,
      gzipSize: true,
      brotliSize: true,
    })
  ].filter(Boolean),

  resolve: {
    alias: {
      'long': false
    },
    dedupe: ['react', 'react-dom', 'react/jsx-runtime']
  },

  optimizeDeps: {
    exclude: [
      'long'
    ],
    include: [
      'react',
      'react-dom',
      'react-dom/client',
      'react/jsx-runtime',
      'react/jsx-dev-runtime',
      'react-router-dom',
      'axios',
      'framer-motion'
    ],
    esbuildOptions: {
      target: 'es2020',
      treeShaking: true
    },
    force: true // Force re-optimization on next start
  },

  build: {
    // Target modern browsers for smaller bundles
    target: 'es2020',
    // Output directory
    outDir: 'dist',
    // Generate sourcemaps for debugging
    sourcemap: false,
    // Minification - use esbuild for React 19 compatibility
    minify: 'esbuild',
    // Performance budgets - strict limits
    chunkSizeWarningLimit: 200, // 200KB max per chunk (storefront budget)

    // Rollup options with performance budget enforcement
    rollupOptions: {
      onwarn(warning, warn) {
        // Enforce performance budgets
        if (warning.code === 'LARGE_BUNDLE') {
          if (warning.message.includes('storefront') && warning.size > 200 * 1024) {
            throw new Error(`Storefront bundle exceeds 200KB budget: ${Math.round(warning.size / 1024)}KB`);
          }
          if (warning.message.includes('checkout') && warning.size > 150 * 1024) {
            throw new Error(`Checkout bundle exceeds 150KB budget: ${Math.round(warning.size / 1024)}KB`);
          }
        }
        warn(warning);
      },
      external: ['long'],
      output: {
        // Aggressive role & route-based code splitting
        manualChunks: (id) => {
          // Core vendor libraries (essential for all)
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom') || id.includes('react-router')) {
              return 'vendor-core';
            }
            if (id.includes('framer-motion') || id.includes('@heroicons') || id.includes('@headlessui')) {
              return 'vendor-ui';
            }
            if (id.includes('axios') || id.includes('crypto-js')) {
              return 'vendor-utils';
            }
            return 'vendor-other';
          }

          // CUSTOMER-FACING ROUTES (Storefront) - Keep minimal
          if (id.includes('/pages/Home') || id.includes('/pages/Shop') || id.includes('/pages/Product')) {
            return 'storefront';
          }
          if (id.includes('/pages/Cart') || id.includes('/pages/Checkout')) {
            return 'checkout';
          }
          if (id.includes('/pages/Auth') || id.includes('/pages/Customer')) {
            return 'customer-auth';
          }

          // ADMIN ROUTES - Completely separate
          if (id.includes('Admin') || id.includes('/admin/')) {
            return 'admin';
          }

          // MARKETING TOOLS - Separate chunk
          if (id.includes('SEO') || id.includes('Analytics') || id.includes('Blog')) {
            return 'marketing';
          }

          // NON-CRITICAL FEATURES - Lazy loaded
          if (id.includes('Modal') || id.includes('Chat') || id.includes('Review') || id.includes('Tracking')) {
            return 'features';
          }

          // Default chunk for everything else
          return 'common';
        },
        // Naming patterns
        chunkFileNames: 'js/[name]-[hash].js',
        entryFileNames: 'js/[name]-[hash].js',
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name.split('.');
          const ext = info[info.length - 1];
          if (/\.(png|jpe?g|svg|gif|webp|ico)$/.test(assetInfo.name)) {
            return `img/[name]-[hash][extname]`;
          } else if (/\.(woff2?|eot|ttf|otf)$/.test(assetInfo.name)) {
            return `fonts/[name]-[hash][extname]`;
          }
          return `assets/[name]-[hash][extname]`;
        }
      }
    },
    commonjsOptions: {
      include: [/node_modules/],
      exclude: [/long/],
      transformMixedEsModules: true,
      defaultIsModuleExports: 'auto'
    },
    // CSS code splitting
    cssCodeSplit: true,
    // Report compressed size
    reportCompressedSize: true,
    // Asset inlining threshold (4KB)
    assetsInlineLimit: 4096
  },

  server: {
    host: 'localhost', // Use localhost for better WebSocket compatibility
    port: 4000, // Use port 4000
    strictPort: false, // Allow fallback to other ports if 4000 is busy
    // Enable HTTP/2
    https: false,
    // Fix HMR WebSocket connection
    hmr: {
      protocol: 'ws',
      host: 'localhost',
      port: 4000,
      clientPort: 4000
    },
    // Warm up frequently used files
    warmup: {
      clientFiles: [
        './src/App.jsx',
        './src/pages/HomeModern.jsx',
        './src/pages/Shop.jsx'
      ]
    },
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
        ws: true,
        // Connection keep-alive
        configure: (proxy, options) => {
          proxy.on('proxyReq', (proxyReq) => {
            proxyReq.setHeader('Connection', 'keep-alive');
          });
        }
      },
      '/zion': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        secure: false,
        ws: true
      }
    },
    // CORS
    cors: true,
    // Pre-transform
    preTransformRequests: true
  },

  // Preview server options (for production preview)
  preview: {
    port: 4173,
    strictPort: true,
    https: false,
    open: true,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true
      }
    },
    // Enable compression
    headers: {
      'Cache-Control': 'public, max-age=31536000, immutable'
    }
  },

  // ESBuild options
  esbuild: {
    logOverride: { 'this-is-undefined-in-esm': 'silent' },
    target: 'es2020',
    treeShaking: true
  },

  // CSS optimization
  css: {
    devSourcemap: false,
    postcss: './postcss.config.js'
  }
}) 