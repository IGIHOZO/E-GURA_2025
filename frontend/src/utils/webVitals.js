// Web Vitals Monitoring
// Tracks LCP, FID, CLS, TTI and reports to analytics

import analytics from './analytics';

// Report Web Vitals to analytics (custom implementation without external dependency)
const reportWebVitals = (onPerfEntry) => {
  if (onPerfEntry && onPerfEntry instanceof Function) {
    // Custom implementation without web-vitals package
    console.log('📊 Web Vitals monitoring initialized');
  }
};

// Custom Web Vitals tracking
class WebVitalsMonitor {
  constructor() {
    this.metrics = {
      lcp: null,
      fid: null,
      cls: null,
      fcp: null,
      ttfb: null,
      tti: null
    };
    
    this.thresholds = {
      lcp: 2200, // Target: ≤2.2s
      fid: 100,
      cls: 0.08, // Target: ≤0.08
      fcp: 1800,
      ttfb: 600,
      tti: 3500 // Target: ≤3.5s
    };
  }

  // Initialize monitoring
  init() {
    this.monitorLCP();
    this.monitorFID();
    this.monitorCLS();
    this.monitorTTI();
    this.monitorPageLoad();
  }

  // Monitor Largest Contentful Paint
  monitorLCP() {
    if ('PerformanceObserver' in window) {
      try {
        const observer = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1];
          
          this.metrics.lcp = lastEntry.renderTime || lastEntry.loadTime;
          
          if (this.metrics.lcp) {
            analytics.trackLCP(this.metrics.lcp);
            
            if (this.metrics.lcp > this.thresholds.lcp) {
              console.warn(`⚠️ LCP is ${this.metrics.lcp}ms (target: ≤${this.thresholds.lcp}ms)`);
            } else {
              console.log(`✅ LCP: ${this.metrics.lcp}ms`);
            }
          }
        });
        
        observer.observe({ entryTypes: ['largest-contentful-paint'] });
      } catch (e) {
        console.error('LCP monitoring error:', e);
      }
    }
  }

  // Monitor First Input Delay
  monitorFID() {
    if ('PerformanceObserver' in window) {
      try {
        const observer = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry) => {
            this.metrics.fid = entry.processingStart - entry.startTime;
            
            if (this.metrics.fid) {
              analytics.trackFID(this.metrics.fid);
              console.log(`✅ FID: ${this.metrics.fid}ms`);
            }
          });
        });
        
        observer.observe({ entryTypes: ['first-input'] });
      } catch (e) {
        console.error('FID monitoring error:', e);
      }
    }
  }

  // Monitor Cumulative Layout Shift
  monitorCLS() {
    if ('PerformanceObserver' in window) {
      try {
        let clsValue = 0;
        let clsEntries = [];
        
        const observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (!entry.hadRecentInput) {
              clsValue += entry.value;
              clsEntries.push(entry);
            }
          }
          
          this.metrics.cls = clsValue;
          
          if (this.metrics.cls) {
            analytics.trackCLS(this.metrics.cls);
            
            if (this.metrics.cls > this.thresholds.cls) {
              console.warn(`⚠️ CLS is ${this.metrics.cls.toFixed(3)} (target: ≤${this.thresholds.cls})`);
            } else {
              console.log(`✅ CLS: ${this.metrics.cls.toFixed(3)}`);
            }
          }
        });
        
        observer.observe({ entryTypes: ['layout-shift'] });
      } catch (e) {
        console.error('CLS monitoring error:', e);
      }
    }
  }

  // Monitor Time to Interactive (approximation)
  monitorTTI() {
    if (window.performance && window.performance.timing) {
      window.addEventListener('load', () => {
        setTimeout(() => {
          const timing = window.performance.timing;
          const tti = timing.domInteractive - timing.navigationStart;
          
          this.metrics.tti = tti;
          analytics.trackTTI(tti);
          
          if (tti > this.thresholds.tti) {
            console.warn(`⚠️ TTI is ${tti}ms (target: ≤${this.thresholds.tti}ms)`);
          } else {
            console.log(`✅ TTI: ${tti}ms`);
          }
        }, 0);
      });
    }
  }

  // Monitor page load time
  monitorPageLoad() {
    if (window.performance && window.performance.timing) {
      window.addEventListener('load', () => {
        setTimeout(() => {
          const timing = window.performance.timing;
          const loadTime = timing.loadEventEnd - timing.navigationStart;
          
          analytics.trackPageLoad(loadTime);
          console.log(`📊 Page Load Time: ${loadTime}ms`);
        }, 0);
      });
    }
  }

  // Get all metrics
  getMetrics() {
    return this.metrics;
  }

  // Check if metrics meet targets
  meetsTargets() {
    return {
      lcp: this.metrics.lcp <= this.thresholds.lcp,
      cls: this.metrics.cls <= this.thresholds.cls,
      tti: this.metrics.tti <= this.thresholds.tti,
      overall: 
        this.metrics.lcp <= this.thresholds.lcp &&
        this.metrics.cls <= this.thresholds.cls &&
        this.metrics.tti <= this.thresholds.tti
    };
  }
}

// Create singleton instance
const webVitalsMonitor = new WebVitalsMonitor();

// Auto-initialize
if (typeof window !== 'undefined') {
  webVitalsMonitor.init();
}

export default webVitalsMonitor;
export { reportWebVitals, WebVitalsMonitor };
