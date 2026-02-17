// Performance budget monitoring and enforcement
// Ensures storefront stays under 200KB JS, 100KB CSS

export const PERFORMANCE_BUDGETS = {
  storefront: {
    js: 200 * 1024, // 200KB
    css: 100 * 1024, // 100KB
    images: 500 * 1024, // 500KB total
    fonts: 50 * 1024, // 50KB
    total: 850 * 1024 // 850KB total
  },
  checkout: {
    js: 150 * 1024, // 150KB
    css: 80 * 1024, // 80KB
    total: 230 * 1024
  },
  admin: {
    js: 500 * 1024, // 500KB (admin can be larger)
    css: 150 * 1024, // 150KB
    total: 650 * 1024
  }
};

class PerformanceBudgetMonitor {
  constructor() {
    this.measurements = new Map();
    this.violations = [];
    this.isMonitoring = false;
  }

  startMonitoring() {
    if (this.isMonitoring) return;
    this.isMonitoring = true;

    // Monitor resource loading
    if ('PerformanceObserver' in window) {
      this.observeResources();
    }

    // Monitor bundle sizes
    this.monitorBundleSizes();
    
    // Report violations
    this.scheduleReporting();
  }

  observeResources() {
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        this.recordResource(entry);
      }
    });

    observer.observe({ entryTypes: ['resource'] });
  }

  recordResource(entry) {
    const { name, transferSize, decodedBodySize } = entry;
    const type = this.getResourceType(name);
    
    if (!this.measurements.has(type)) {
      this.measurements.set(type, { size: 0, count: 0, resources: [] });
    }

    const measurement = this.measurements.get(type);
    measurement.size += transferSize || decodedBodySize || 0;
    measurement.count += 1;
    measurement.resources.push({
      name,
      size: transferSize || decodedBodySize || 0,
      timestamp: entry.startTime
    });

    this.checkBudget(type);
  }

  getResourceType(url) {
    if (url.includes('.js')) return 'js';
    if (url.includes('.css')) return 'css';
    if (url.match(/\.(png|jpg|jpeg|gif|webp|svg)$/)) return 'images';
    if (url.match(/\.(woff|woff2|ttf|otf)$/)) return 'fonts';
    return 'other';
  }

  getCurrentPage() {
    const path = window.location.pathname;
    
    if (path.includes('/admin')) return 'admin';
    if (path.includes('/checkout') || path.includes('/cart')) return 'checkout';
    return 'storefront';
  }

  checkBudget(resourceType) {
    const currentPage = this.getCurrentPage();
    const budget = PERFORMANCE_BUDGETS[currentPage];
    const measurement = this.measurements.get(resourceType);

    if (budget && budget[resourceType] && measurement.size > budget[resourceType]) {
      const violation = {
        page: currentPage,
        type: resourceType,
        budget: budget[resourceType],
        actual: measurement.size,
        excess: measurement.size - budget[resourceType],
        timestamp: Date.now(),
        resources: measurement.resources.slice(-5) // Last 5 resources
      };

      this.violations.push(violation);
      this.reportViolation(violation);
    }
  }

  reportViolation(violation) {
    console.warn('🚨 Performance Budget Violation:', {
      page: violation.page,
      type: violation.type,
      budget: `${Math.round(violation.budget / 1024)}KB`,
      actual: `${Math.round(violation.actual / 1024)}KB`,
      excess: `+${Math.round(violation.excess / 1024)}KB over budget`,
      resources: violation.resources
    });

    // Send to analytics (if available)
    if (window.gtag) {
      window.gtag('event', 'performance_budget_violation', {
        page: violation.page,
        resource_type: violation.type,
        excess_kb: Math.round(violation.excess / 1024)
      });
    }
  }

  monitorBundleSizes() {
    // Monitor initial bundle loading
    window.addEventListener('load', () => {
      this.measureInitialBundle();
    });
  }

  measureInitialBundle() {
    const resources = performance.getEntriesByType('resource');
    const currentPage = this.getCurrentPage();
    
    let totalJS = 0;
    let totalCSS = 0;
    
    resources.forEach(resource => {
      const size = resource.transferSize || resource.decodedBodySize || 0;
      
      if (resource.name.includes('.js')) {
        totalJS += size;
      } else if (resource.name.includes('.css')) {
        totalCSS += size;
      }
    });

    console.log('📊 Initial Bundle Sizes:', {
      page: currentPage,
      js: `${Math.round(totalJS / 1024)}KB`,
      css: `${Math.round(totalCSS / 1024)}KB`,
      total: `${Math.round((totalJS + totalCSS) / 1024)}KB`
    });

    // Check against budgets
    const budget = PERFORMANCE_BUDGETS[currentPage];
    if (budget) {
      if (totalJS > budget.js) {
        console.warn(`🚨 JS Budget Exceeded: ${Math.round(totalJS / 1024)}KB > ${Math.round(budget.js / 1024)}KB`);
      }
      if (totalCSS > budget.css) {
        console.warn(`🚨 CSS Budget Exceeded: ${Math.round(totalCSS / 1024)}KB > ${Math.round(budget.css / 1024)}KB`);
      }
    }
  }

  scheduleReporting() {
    // Report budget status every 30 seconds
    setInterval(() => {
      this.generateReport();
    }, 30000);
  }

  generateReport() {
    const currentPage = this.getCurrentPage();
    const budget = PERFORMANCE_BUDGETS[currentPage];
    
    if (!budget) return;

    const report = {
      page: currentPage,
      timestamp: new Date().toISOString(),
      budgets: budget,
      actual: {},
      violations: this.violations.filter(v => v.timestamp > Date.now() - 300000) // Last 5 minutes
    };

    // Calculate actual usage
    for (const [type, measurement] of this.measurements) {
      if (budget[type]) {
        report.actual[type] = {
          size: measurement.size,
          percentage: Math.round((measurement.size / budget[type]) * 100),
          status: measurement.size > budget[type] ? 'over' : 'under'
        };
      }
    }

    // Only log if there are violations or we're over 80% of budget
    const hasViolations = Object.values(report.actual).some(a => a.status === 'over');
    const nearBudget = Object.values(report.actual).some(a => a.percentage > 80);
    
    if (hasViolations || nearBudget) {
      console.log('📊 Performance Budget Report:', report);
    }
  }

  getBudgetStatus() {
    const currentPage = this.getCurrentPage();
    const budget = PERFORMANCE_BUDGETS[currentPage];
    
    if (!budget) return null;

    const status = {};
    for (const [type, measurement] of this.measurements) {
      if (budget[type]) {
        status[type] = {
          budget: budget[type],
          actual: measurement.size,
          percentage: Math.round((measurement.size / budget[type]) * 100),
          remaining: Math.max(0, budget[type] - measurement.size),
          status: measurement.size > budget[type] ? 'exceeded' : 'ok'
        };
      }
    }

    return status;
  }

  reset() {
    this.measurements.clear();
    this.violations = [];
  }
}

// Global monitor instance
const budgetMonitor = new PerformanceBudgetMonitor();

// Auto-start monitoring in development
if (process.env.NODE_ENV === 'development') {
  budgetMonitor.startMonitoring();
}

// Export functions
export const startBudgetMonitoring = () => budgetMonitor.startMonitoring();
export const getBudgetStatus = () => budgetMonitor.getBudgetStatus();
export const resetBudgetMonitor = () => budgetMonitor.reset();

// React hook for budget monitoring
export const useBudgetMonitor = () => {
  const [status, setStatus] = useState(null);

  useEffect(() => {
    budgetMonitor.startMonitoring();
    
    const interval = setInterval(() => {
      setStatus(budgetMonitor.getBudgetStatus());
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return status;
};

export default budgetMonitor;
