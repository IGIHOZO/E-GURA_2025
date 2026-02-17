import { useEffect } from 'react';

/**
 * Performance monitoring component for tracking Core Web Vitals
 * Integrates with the existing webVitals utility
 */
const PerformanceMonitor = () => {
  useEffect(() => {
    // Enhanced Web Vitals reporting
    const reportWebVitals = async (metric) => {
      console.log('📊 Web Vital:', {
        name: metric.name,
        value: metric.value,
        rating: metric.rating,
        delta: metric.delta,
        id: metric.id
      });

      // Send to analytics (Google Analytics, etc.)
      if (window.gtag) {
        window.gtag('event', metric.name, {
          event_category: 'Web Vitals',
          event_label: metric.id,
          value: Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value),
          non_interaction: true,
        });
      }

      // Performance thresholds and warnings
      const thresholds = {
        FCP: { good: 1800, poor: 3000 }, // First Contentful Paint
        LCP: { good: 2500, poor: 4000 }, // Largest Contentful Paint
        FID: { good: 100, poor: 300 },   // First Input Delay
        CLS: { good: 0.1, poor: 0.25 },  // Cumulative Layout Shift
        TTFB: { good: 800, poor: 1800 }  // Time to First Byte
      };

      const threshold = thresholds[metric.name];
      if (threshold) {
        let status = 'good';
        if (metric.value > threshold.poor) {
          status = 'poor';
          console.warn(`⚠️ Poor ${metric.name}: ${metric.value}ms (threshold: ${threshold.poor}ms)`);
        } else if (metric.value > threshold.good) {
          status = 'needs-improvement';
          console.log(`⚡ ${metric.name} needs improvement: ${metric.value}ms (target: <${threshold.good}ms)`);
        } else {
          console.log(`✅ Good ${metric.name}: ${metric.value}ms`);
        }
      }
    };

    // Dynamic import of web-vitals library
    import('web-vitals').then(({ getCLS, getFID, getFCP, getLCP, getTTFB }) => {
      getCLS(reportWebVitals);
      getFID(reportWebVitals);
      getFCP(reportWebVitals);
      getLCP(reportWebVitals);
      getTTFB(reportWebVitals);
    }).catch(error => {
      console.warn('Web Vitals library not available:', error);
    });

    // Additional performance monitoring
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        // Monitor long tasks (>50ms)
        if (entry.entryType === 'longtask') {
          console.warn('🐌 Long task detected:', {
            duration: entry.duration,
            startTime: entry.startTime,
            name: entry.name
          });
        }

        // Monitor navigation timing
        if (entry.entryType === 'navigation') {
          console.log('🚀 Navigation timing:', {
            domContentLoaded: entry.domContentLoadedEventEnd - entry.domContentLoadedEventStart,
            loadComplete: entry.loadEventEnd - entry.loadEventStart,
            ttfb: entry.responseStart - entry.requestStart,
            domInteractive: entry.domInteractive - entry.fetchStart
          });
        }

        // Monitor resource loading
        if (entry.entryType === 'resource') {
          const duration = entry.responseEnd - entry.startTime;
          if (duration > 1000) { // Resources taking >1s
            console.warn('🐌 Slow resource:', {
              name: entry.name,
              duration: duration,
              size: entry.transferSize,
              type: entry.initiatorType
            });
          }
        }
      }
    });

    // Observe different types of performance entries
    try {
      observer.observe({ entryTypes: ['longtask', 'navigation', 'resource'] });
    } catch (error) {
      console.warn('Performance Observer not fully supported:', error);
    }

    // Memory usage monitoring (if available)
    if ('memory' in performance) {
      const logMemoryUsage = () => {
        const memory = performance.memory;
        console.log('💾 Memory usage:', {
          used: Math.round(memory.usedJSHeapSize / 1024 / 1024) + ' MB',
          total: Math.round(memory.totalJSHeapSize / 1024 / 1024) + ' MB',
          limit: Math.round(memory.jsHeapSizeLimit / 1024 / 1024) + ' MB'
        });

        // Warn if memory usage is high
        const usagePercent = (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100;
        if (usagePercent > 80) {
          console.warn('⚠️ High memory usage:', usagePercent.toFixed(1) + '%');
        }
      };

      // Log memory usage every 30 seconds
      const memoryInterval = setInterval(logMemoryUsage, 30000);
      
      return () => {
        clearInterval(memoryInterval);
        observer.disconnect();
      };
    }

    return () => {
      observer.disconnect();
    };
  }, []);

  return null; // This component doesn't render anything
};

export default PerformanceMonitor;
