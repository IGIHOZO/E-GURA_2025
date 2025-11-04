import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { visualizer } from 'rollup-plugin-visualizer'
import viteCompression from 'vite-plugin-compression'

export default defineConfig({
  plugins: [
    react(),
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
    dedupe: ['react', 'react-dom']
  },
  
  optimizeDeps: {
    exclude: [
      '@tensorflow/tfjs',
      '@tensorflow-models/face-landmarks-detection',
      '@tensorflow-models/body-segmentation',
      '@mediapipe/face_mesh',
      '@mediapipe/selfie_segmentation',
      'long'
    ],
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      'axios',
      'framer-motion'
    ],
    esbuildOptions: {
      target: 'es2020',
      treeShaking: true
    }
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
    // Chunk size warning limit
    chunkSizeWarningLimit: 600,
    // Rollup options
    rollupOptions: {
      external: ['long'],
      output: {
        // Simplified chunking to avoid circular dependencies
        manualChunks: undefined,
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
      exclude: [/@tensorflow/, /@mediapipe/, /long/],
      transformMixedEsModules: true
    },
    // CSS code splitting
    cssCodeSplit: true,
    // Report compressed size
    reportCompressedSize: true,
    // Asset inlining threshold (4KB)
    assetsInlineLimit: 4096
  },
  
  server: {
    port: 4000,
    // Enable HTTP/2
    https: false,
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
    // HMR
    hmr: {
      overlay: true
    },
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