/**
 * AI-Powered Stock Management System
 * Predictive analytics, auto-reorder, demand forecasting
 */

class AIStockManager {
  constructor() {
    this.reorderThreshold = 10; // Default reorder point
    this.safetyStock = 5; // Safety stock level
    this.leadTime = 7; // Days to restock
  }

  /**
   * Analyze stock levels and provide insights
   */
  async analyzeStock(products) {
    const analysis = {
      critical: [],
      lowStock: [],
      low: [],
      optimal: [],
      overstocked: [],
      outOfStock: [],
      recommendations: [],
      summary: {
        totalProducts: 0,
        outOfStock: 0,
        critical: 0,
        low: 0,
        optimal: 0,
        overstocked: 0
      }
    };

    products.forEach(product => {
      const stockLevel = product.stockQuantity || 0;
      const salesVelocity = this.calculateSalesVelocity(product);
      const daysUntilStockout = this.predictStockoutDate(stockLevel, salesVelocity);

      const productAnalysis = {
        id: product.id || product._id,
        name: product.name,
        currentStock: stockLevel,
        salesVelocity: salesVelocity,
        daysUntilStockout: daysUntilStockout,
        reorderPoint: this.calculateReorderPoint(salesVelocity),
        optimalStock: this.calculateOptimalStock(salesVelocity),
        status: this.getStockStatus(stockLevel, salesVelocity)
      };

      // Categorize products
      if (stockLevel === 0) {
        analysis.outOfStock.push(productAnalysis);
        analysis.summary.outOfStock++;
      } else if (stockLevel <= 5) {
        analysis.critical.push(productAnalysis);
        analysis.lowStock.push(productAnalysis);
        analysis.summary.critical++;
      } else if (stockLevel <= this.calculateReorderPoint(salesVelocity)) {
        analysis.low.push(productAnalysis);
        analysis.lowStock.push(productAnalysis);
        analysis.summary.low++;
      } else if (stockLevel > this.calculateOptimalStock(salesVelocity) * 2) {
        analysis.overstocked.push(productAnalysis);
        analysis.summary.overstocked++;
      } else {
        analysis.optimal.push(productAnalysis);
        analysis.summary.optimal++;
      }
    });

    analysis.summary.totalProducts = products.length;

    // Generate recommendations
    analysis.recommendations = this.generateRecommendations(analysis);

    return analysis;
  }

  /**
   * Calculate sales velocity (units per day)
   */
  calculateSalesVelocity(product) {
    const totalSales = product.salesCount || 0;
    const daysActive = this.getDaysActive(product.createdAt);
    
    if (daysActive === 0) return 0;
    
    return totalSales / daysActive;
  }

  /**
   * Predict stockout date
   */
  predictStockoutDate(currentStock, salesVelocity) {
    if (salesVelocity === 0) return Infinity;
    return Math.floor(currentStock / salesVelocity);
  }

  /**
   * Calculate reorder point
   */
  calculateReorderPoint(salesVelocity) {
    return Math.ceil((salesVelocity * this.leadTime) + this.safetyStock);
  }

  /**
   * Calculate optimal stock level
   */
  calculateOptimalStock(salesVelocity) {
    // Economic Order Quantity (EOQ) simplified
    const dailyDemand = salesVelocity;
    const orderCost = 5000; // RWF per order
    const holdingCost = 100; // RWF per unit per day
    
    if (dailyDemand === 0) return 20; // Default
    
    const eoq = Math.sqrt((2 * dailyDemand * 30 * orderCost) / holdingCost);
    return Math.ceil(eoq);
  }

  /**
   * Get stock status
   */
  getStockStatus(stockLevel, salesVelocity) {
    if (stockLevel === 0) return 'OUT_OF_STOCK';
    if (stockLevel <= 5) return 'CRITICAL';
    if (stockLevel <= this.calculateReorderPoint(salesVelocity)) return 'LOW';
    if (stockLevel > this.calculateOptimalStock(salesVelocity) * 2) return 'OVERSTOCKED';
    return 'OPTIMAL';
  }

  /**
   * Generate AI recommendations
   */
  generateRecommendations(analysis) {
    const recommendations = [];

    // Critical stock alerts
    if (analysis.critical.length > 0) {
      recommendations.push({
        type: 'URGENT',
        priority: 'HIGH',
        message: `${analysis.critical.length} products are critically low. Immediate reorder required!`,
        action: 'REORDER_NOW',
        products: analysis.critical.map(p => p.name)
      });
    }

    // Out of stock alerts
    if (analysis.outOfStock.length > 0) {
      recommendations.push({
        type: 'ALERT',
        priority: 'CRITICAL',
        message: `${analysis.outOfStock.length} products are out of stock. Lost sales opportunity!`,
        action: 'EMERGENCY_REORDER',
        products: analysis.outOfStock.map(p => p.name)
      });
    }

    // Low stock warnings
    if (analysis.low.length > 0) {
      recommendations.push({
        type: 'WARNING',
        priority: 'MEDIUM',
        message: `${analysis.low.length} products need reordering soon.`,
        action: 'PLAN_REORDER',
        products: analysis.low.slice(0, 5).map(p => p.name)
      });
    }

    // Overstocked items
    if (analysis.overstocked.length > 0) {
      recommendations.push({
        type: 'INFO',
        priority: 'LOW',
        message: `${analysis.overstocked.length} products are overstocked. Consider promotions.`,
        action: 'RUN_PROMOTION',
        products: analysis.overstocked.slice(0, 5).map(p => p.name)
      });
    }

    return recommendations;
  }

  /**
   * Forecast demand for next period
   */
  forecastDemand(product, days = 30) {
    const salesVelocity = this.calculateSalesVelocity(product);
    const trend = this.calculateTrend(product);
    const seasonality = this.calculateSeasonality(product);

    // Simple forecasting model
    const baseForecast = salesVelocity * days;
    const trendAdjustment = baseForecast * trend;
    const seasonalAdjustment = baseForecast * seasonality;

    const forecast = Math.ceil(baseForecast + trendAdjustment + seasonalAdjustment);

    return {
      forecast: forecast,
      confidence: this.calculateConfidence(product),
      recommendedOrder: Math.ceil(forecast * 1.2), // 20% buffer
      estimatedRevenue: forecast * product.price
    };
  }

  /**
   * Calculate trend
   */
  calculateTrend(product) {
    // Simplified trend calculation
    const recentSales = product.salesCount || 0;
    const avgSales = recentSales / Math.max(this.getDaysActive(product.createdAt), 1);
    
    if (avgSales > 5) return 0.1; // Growing
    if (avgSales < 2) return -0.1; // Declining
    return 0; // Stable
  }

  /**
   * Calculate seasonality
   */
  calculateSeasonality(product) {
    const month = new Date().getMonth();
    
    // Rwanda shopping seasons
    if ([11, 0].includes(month)) return 0.3; // December-January (holidays)
    if ([5, 6].includes(month)) return 0.2; // June-July (mid-year)
    if ([3, 4].includes(month)) return 0.1; // April-May (Easter)
    
    return 0; // Normal season
  }

  /**
   * Calculate forecast confidence
   */
  calculateConfidence(product) {
    const daysActive = this.getDaysActive(product.createdAt);
    const totalSales = product.salesCount || 0;

    if (daysActive < 30) return 'LOW';
    if (daysActive < 90) return 'MEDIUM';
    if (totalSales > 50) return 'HIGH';
    
    return 'MEDIUM';
  }

  /**
   * Get days since product was created
   */
  getDaysActive(createdAt) {
    if (!createdAt) return 30; // Default
    const now = new Date();
    const created = new Date(createdAt);
    const diffTime = Math.abs(now - created);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  /**
   * Generate auto-reorder list
   */
  generateReorderList(products) {
    const reorderList = [];

    products.forEach(product => {
      const stockLevel = product.stockQuantity || 0;
      const salesVelocity = this.calculateSalesVelocity(product);
      const reorderPoint = this.calculateReorderPoint(salesVelocity);
      const optimalStock = this.calculateOptimalStock(salesVelocity);

      if (stockLevel <= reorderPoint) {
        const orderQuantity = optimalStock - stockLevel;
        const estimatedCost = orderQuantity * (product.price * 0.5); // Assume 50% cost

        reorderList.push({
          product: {
            id: product.id || product._id,
            name: product.name,
            currentStock: stockLevel
          },
          orderQuantity: orderQuantity,
          estimatedCost: estimatedCost,
          priority: stockLevel === 0 ? 'CRITICAL' : stockLevel <= 5 ? 'HIGH' : 'MEDIUM',
          daysUntilStockout: this.predictStockoutDate(stockLevel, salesVelocity)
        });
      }
    });

    // Sort by priority
    reorderList.sort((a, b) => {
      const priorityOrder = { 'CRITICAL': 0, 'HIGH': 1, 'MEDIUM': 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });

    return reorderList;
  }

  /**
   * Calculate inventory value
   */
  calculateInventoryValue(products) {
    let totalValue = 0;
    let totalUnits = 0;

    products.forEach(product => {
      const stockValue = (product.stockQuantity || 0) * product.price;
      totalValue += stockValue;
      totalUnits += product.stockQuantity || 0;
    });

    return {
      totalValue: totalValue,
      totalUnits: totalUnits,
      averageValue: totalUnits > 0 ? totalValue / totalUnits : 0
    };
  }

  /**
   * Identify slow-moving items
   */
  identifySlowMovers(products, threshold = 0.5) {
    const slowMovers = [];

    products.forEach(product => {
      const salesVelocity = this.calculateSalesVelocity(product);
      const daysActive = this.getDaysActive(product.createdAt);

      if (daysActive > 30 && salesVelocity < threshold) {
        slowMovers.push({
          id: product.id || product._id,
          name: product.name,
          stockQuantity: product.stockQuantity,
          salesVelocity: salesVelocity,
          daysActive: daysActive,
          recommendation: 'Consider discount or bundle offer'
        });
      }
    });

    return slowMovers;
  }

  /**
   * Generate stock report
   */
  async generateStockReport(products) {
    const analysis = await this.analyzeStock(products);
    const inventoryValue = this.calculateInventoryValue(products);
    const reorderList = this.generateReorderList(products);
    const slowMovers = this.identifySlowMovers(products);

    return {
      summary: {
        totalProducts: products.length,
        outOfStock: analysis.outOfStock.length,
        critical: analysis.critical.length,
        low: analysis.low.length,
        optimal: analysis.optimal.length,
        overstocked: analysis.overstocked.length,
        inventoryValue: inventoryValue
      },
      recommendations: analysis.recommendations,
      reorderList: reorderList,
      slowMovers: slowMovers,
      generatedAt: new Date()
    };
  }
}

// Create singleton instance
const aiStockManager = new AIStockManager();

module.exports = aiStockManager;
