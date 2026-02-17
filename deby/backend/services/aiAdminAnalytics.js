/**
 * AI-Powered Admin Analytics Service
 * Provides intelligent insights and predictions for ecommerce admin dashboard
 */

const { Product, Order, User } = require('../models');
const { Op } = require('sequelize');

class AIAdminAnalytics {
  /**
   * AI-Powered Sales Forecasting
   * Predicts future sales based on historical data
   */
  async forecastSales(days = 30) {
    try {
      // Get historical sales data
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const orders = await Order.findAll({
        where: {
          createdAt: { [Op.gte]: thirtyDaysAgo }
        },
        order: [['createdAt', 'ASC']]
      });

      // Calculate daily revenue
      const dailyRevenue = {};
      orders.forEach(order => {
        const date = order.createdAt.toISOString().split('T')[0];
        dailyRevenue[date] = (dailyRevenue[date] || 0) + parseFloat(order.totalAmount || 0);
      });

      // Simple moving average for forecast
      const revenues = Object.values(dailyRevenue);
      const avgDailyRevenue = revenues.reduce((a, b) => a + b, 0) / revenues.length || 0;

      // Calculate trend (linear regression)
      let trend = 0;
      if (revenues.length > 1) {
        const midpoint = revenues.length / 2;
        const firstHalf = revenues.slice(0, Math.floor(midpoint));
        const secondHalf = revenues.slice(Math.floor(midpoint));
        const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
        const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
        trend = ((secondAvg - firstAvg) / firstAvg) * 100;
      }

      // Generate forecast
      const forecast = [];
      let projectedRevenue = avgDailyRevenue;
      const dailyGrowth = trend / 30 / 100;

      for (let i = 1; i <= days; i++) {
        projectedRevenue *= (1 + dailyGrowth);
        const forecastDate = new Date();
        forecastDate.setDate(forecastDate.getDate() + i);
        
        forecast.push({
          date: forecastDate.toISOString().split('T')[0],
          projectedRevenue: Math.round(projectedRevenue),
          confidence: Math.max(0.5, 1 - (i / days) * 0.3) // Confidence decreases over time
        });
      }

      return {
        success: true,
        forecast,
        insights: {
          avgDailyRevenue: Math.round(avgDailyRevenue),
          trend: trend.toFixed(2),
          trendDescription: trend > 5 ? 'Strong Growth' : trend > 0 ? 'Growing' : trend > -5 ? 'Stable' : 'Declining',
          totalProjectedRevenue: Math.round(forecast.reduce((sum, day) => sum + day.projectedRevenue, 0))
        }
      };
    } catch (error) {
      console.error('Sales forecast error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Customer Churn Prediction
   * Identifies customers at risk of churning
   */
  async predictChurn() {
    try {
      const sixtyDaysAgo = new Date();
      sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

      const customers = await User.findAll({
        where: { role: 'customer' }
      });

      const churnRiskCustomers = [];

      for (const customer of customers) {
        // Get customer's orders
        const recentOrders = await Order.count({
          where: {
            userId: customer.id,
            createdAt: { [Op.gte]: sixtyDaysAgo }
          }
        });

        const lastOrder = await Order.findOne({
          where: { userId: customer.id },
          order: [['createdAt', 'DESC']]
        });

        let churnRisk = 0;
        let reasons = [];

        // Factor 1: No recent orders
        if (recentOrders === 0) {
          churnRisk += 40;
          reasons.push('No orders in 60 days');
        }

        // Factor 2: Time since last order
        if (lastOrder) {
          const daysSinceLastOrder = Math.floor(
            (new Date() - new Date(lastOrder.createdAt)) / (1000 * 60 * 60 * 24)
          );
          if (daysSinceLastOrder > 45) {
            churnRisk += 30;
            reasons.push(`Last order ${daysSinceLastOrder} days ago`);
          }
        }

        // Factor 3: Declining order frequency
        const totalOrders = customer.totalOrders || 0;
        if (totalOrders > 0 && recentOrders < totalOrders * 0.2) {
          churnRisk += 20;
          reasons.push('Decreasing order frequency');
        }

        // Factor 4: Low engagement
        if (!customer.lastLogin || new Date() - new Date(customer.lastLogin) > 30 * 24 * 60 * 60 * 1000) {
          churnRisk += 10;
          reasons.push('Low engagement');
        }

        if (churnRisk >= 50) {
          churnRiskCustomers.push({
            id: customer.id,
            name: `${customer.firstName} ${customer.lastName}`,
            email: customer.email,
            phone: customer.phone,
            churnRisk: Math.min(churnRisk, 100),
            riskLevel: churnRisk >= 75 ? 'High' : 'Medium',
            reasons,
            totalOrders: totalOrders,
            totalSpent: parseFloat(customer.totalSpent || 0),
            lastOrderDate: lastOrder?.createdAt
          });
        }
      }

      // Sort by risk level
      churnRiskCustomers.sort((a, b) => b.churnRisk - a.churnRisk);

      return {
        success: true,
        atRiskCustomers: churnRiskCustomers.slice(0, 20), // Top 20
        summary: {
          totalAtRisk: churnRiskCustomers.length,
          highRisk: churnRiskCustomers.filter(c => c.riskLevel === 'High').length,
          mediumRisk: churnRiskCustomers.filter(c => c.riskLevel === 'Medium').length,
          potentialLostRevenue: churnRiskCustomers.reduce((sum, c) => sum + c.totalSpent, 0)
        }
      };
    } catch (error) {
      console.error('Churn prediction error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Product Performance Analysis with AI
   * Identifies best/worst performers and provides recommendations
   */
  async analyzeProductPerformance() {
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const products = await Product.findAll();
      const productAnalysis = [];

      for (const product of products) {
        // Get orders containing this product
        const orders = await Order.findAll({
          where: {
            createdAt: { [Op.gte]: thirtyDaysAgo }
          }
        });

        let totalSold = 0;
        let totalRevenue = 0;
        let viewCount = 0;

        orders.forEach(order => {
          const item = order.items?.find(i => i.productId === product.id);
          if (item) {
            totalSold += item.quantity || 0;
            totalRevenue += (item.price || 0) * (item.quantity || 0);
          }
        });

        // Calculate performance score
        const salesScore = Math.min(totalSold / 10, 1) * 40; // Max 40 points
        const revenueScore = Math.min(totalRevenue / 100000, 1) * 30; // Max 30 points
        const stockScore = product.stockQuantity > 0 ? 15 : 0; // Max 15 points
        const activeScore = product.isActive ? 15 : 0; // Max 15 points

        const performanceScore = salesScore + revenueScore + stockScore + activeScore;

        let status = 'Underperforming';
        let recommendation = [];

        if (performanceScore >= 80) {
          status = 'Star Product';
          recommendation.push('Increase stock levels');
          recommendation.push('Consider upselling opportunities');
        } else if (performanceScore >= 60) {
          status = 'Good Performer';
          recommendation.push('Maintain current strategy');
        } else if (performanceScore >= 40) {
          status = 'Needs Attention';
          recommendation.push('Consider promotional pricing');
          recommendation.push('Improve product images/description');
        } else {
          recommendation.push('Consider discontinuing or heavy discounting');
          recommendation.push('Analyze customer feedback');
        }

        // Out of stock warning
        if (product.stockQuantity === 0 && totalSold > 0) {
          status = 'Out of Stock - High Demand';
          recommendation.push('⚠️ URGENT: Restock immediately!');
        }

        productAnalysis.push({
          id: product.id,
          name: product.name,
          sku: product.sku,
          category: product.category,
          status,
          performanceScore: Math.round(performanceScore),
          metrics: {
            unitsSold: totalSold,
            revenue: Math.round(totalRevenue),
            currentStock: product.stockQuantity,
            price: parseFloat(product.price)
          },
          recommendation
        });
      }

      // Sort by performance score
      productAnalysis.sort((a, b) => b.performanceScore - a.performanceScore);

      return {
        success: true,
        topPerformers: productAnalysis.slice(0, 10),
        underPerformers: productAnalysis.slice(-10).reverse(),
        summary: {
          totalProducts: products.length,
          starProducts: productAnalysis.filter(p => p.status === 'Star Product').length,
          needsAttention: productAnalysis.filter(p => p.status === 'Needs Attention').length,
          outOfStock: productAnalysis.filter(p => p.status.includes('Out of Stock')).length
        }
      };
    } catch (error) {
      console.error('Product performance analysis error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * AI-Powered Pricing Optimization
   * Suggests optimal pricing based on demand, competition, and margins
   */
  async suggestPricing(productId) {
    try {
      const product = await Product.findByPk(productId);
      if (!product) {
        return { success: false, error: 'Product not found' };
      }

      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      // Get sales data
      const orders = await Order.findAll({
        where: {
          createdAt: { [Op.gte]: thirtyDaysAgo }
        }
      });

      let totalSold = 0;
      orders.forEach(order => {
        const item = order.items?.find(i => i.productId === product.id);
        if (item) {
          totalSold += item.quantity || 0;
        }
      });

      const currentPrice = parseFloat(product.price);
      const avgDailySales = totalSold / 30;

      // Price elasticity estimation (simplified)
      let suggestedPrice = currentPrice;
      let reasoning = [];

      // If high sales, can increase price
      if (avgDailySales > 2) {
        suggestedPrice = currentPrice * 1.1; // 10% increase
        reasoning.push('High demand detected - price can be increased');
      } 
      // If low sales, consider price reduction
      else if (avgDailySales < 0.5 && product.stockQuantity > 10) {
        suggestedPrice = currentPrice * 0.9; // 10% decrease
        reasoning.push('Low sales with high stock - consider price reduction');
      } 
      // If no sales, significant price reduction
      else if (avgDailySales === 0 && product.stockQuantity > 5) {
        suggestedPrice = currentPrice * 0.8; // 20% decrease
        reasoning.push('No recent sales - consider promotional pricing');
      } else {
        reasoning.push('Current pricing appears optimal');
      }

      // Ensure minimum margin (example: 30%)
      const minPrice = currentPrice * 0.7; // Don't go below 30% discount
      suggestedPrice = Math.max(suggestedPrice, minPrice);

      return {
        success: true,
        product: {
          id: product.id,
          name: product.name,
          currentPrice: currentPrice
        },
        pricing: {
          currentPrice: currentPrice,
          suggestedPrice: Math.round(suggestedPrice),
          priceChange: Math.round(suggestedPrice - currentPrice),
          priceChangePercent: (((suggestedPrice - currentPrice) / currentPrice) * 100).toFixed(1),
          reasoning,
          salesMetrics: {
            unitsSoldLast30Days: totalSold,
            avgDailySales: avgDailySales.toFixed(2),
            currentStock: product.stockQuantity
          }
        }
      };
    } catch (error) {
      console.error('Pricing optimization error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Inventory Optimization with AI
   * Suggests optimal stock levels based on sales velocity
   */
  async optimizeInventory() {
    try {
      const products = await Product.findAll();
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const inventoryRecommendations = [];

      for (const product of products) {
        const orders = await Order.findAll({
          where: {
            createdAt: { [Op.gte]: thirtyDaysAgo }
          }
        });

        let totalSold = 0;
        orders.forEach(order => {
          const item = order.items?.find(i => i.productId === product.id);
          if (item) {
            totalSold += item.quantity || 0;
          }
        });

        const avgDailySales = totalSold / 30;
        const currentStock = product.stockQuantity || 0;
        const daysOfInventory = avgDailySales > 0 ? currentStock / avgDailySales : 999;

        let action = 'Monitor';
        let urgency = 'Low';
        let recommendedOrder = 0;
        let reasoning = [];

        // Critical: Will run out soon
        if (daysOfInventory < 7 && avgDailySales > 0.5) {
          action = 'Reorder Now';
          urgency = 'Critical';
          recommendedOrder = Math.ceil(avgDailySales * 30); // 30 days of stock
          reasoning.push('⚠️ Critical: Will run out in less than 7 days');
        }
        // Low stock
        else if (daysOfInventory < 14 && avgDailySales > 0.3) {
          action = 'Reorder Soon';
          urgency = 'High';
          recommendedOrder = Math.ceil(avgDailySales * 30);
          reasoning.push('Low stock warning: Less than 2 weeks remaining');
        }
        // Overstocked
        else if (daysOfInventory > 90 && currentStock > 20) {
          action = 'Overstock - Consider Promotion';
          urgency = 'Medium';
          reasoning.push('High inventory levels - consider promotional pricing');
        }
        // Dead stock
        else if (avgDailySales === 0 && currentStock > 10) {
          action = 'Dead Stock - Discount/Remove';
          urgency = 'Medium';
          reasoning.push('No sales in 30 days - consider clearance sale');
        }

        if (action !== 'Monitor') {
          inventoryRecommendations.push({
            product: {
              id: product.id,
              name: product.name,
              sku: product.sku,
              category: product.category
            },
            currentStock,
            salesVelocity: avgDailySales.toFixed(2),
            daysOfInventory: Math.round(daysOfInventory),
            action,
            urgency,
            recommendedOrder,
            reasoning
          });
        }
      }

      // Sort by urgency
      const urgencyOrder = { 'Critical': 0, 'High': 1, 'Medium': 2, 'Low': 3 };
      inventoryRecommendations.sort((a, b) => urgencyOrder[a.urgency] - urgencyOrder[b.urgency]);

      return {
        success: true,
        recommendations: inventoryRecommendations,
        summary: {
          criticalItems: inventoryRecommendations.filter(r => r.urgency === 'Critical').length,
          highPriorityItems: inventoryRecommendations.filter(r => r.urgency === 'High').length,
          overstockedItems: inventoryRecommendations.filter(r => r.action.includes('Overstock')).length,
          deadStockItems: inventoryRecommendations.filter(r => r.action.includes('Dead Stock')).length
        }
      };
    } catch (error) {
      console.error('Inventory optimization error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Customer Lifetime Value (CLV) Prediction
   * Predicts future value of customers
   */
  async predictCustomerLifetimeValue() {
    try {
      const customers = await User.findAll({
        where: { role: 'customer' }
      });

      const clvAnalysis = [];

      for (const customer of customers) {
        const orders = await Order.findAll({
          where: { userId: customer.id },
          order: [['createdAt', 'ASC']]
        });

        if (orders.length === 0) continue;

        const totalSpent = orders.reduce((sum, order) => sum + parseFloat(order.totalAmount || 0), 0);
        const avgOrderValue = totalSpent / orders.length;

        // Calculate customer age in days
        const firstOrder = orders[0];
        const daysSinceFirstOrder = Math.floor(
          (new Date() - new Date(firstOrder.createdAt)) / (1000 * 60 * 60 * 24)
        );
        const monthsSinceFirstOrder = daysSinceFirstOrder / 30;

        // Calculate purchase frequency (orders per month)
        const purchaseFrequency = monthsSinceFirstOrder > 0 ? orders.length / monthsSinceFirstOrder : orders.length;

        // Estimated customer lifespan (assume 2 years for active customers)
        const estimatedLifespan = 24; // months

        // CLV = Avg Order Value × Purchase Frequency × Customer Lifespan
        const predictedCLV = avgOrderValue * purchaseFrequency * estimatedLifespan;

        // Customer segment
        let segment = 'Bronze';
        if (predictedCLV > 1000000) segment = 'Platinum';
        else if (predictedCLV > 500000) segment = 'Gold';
        else if (predictedCLV > 200000) segment = 'Silver';

        clvAnalysis.push({
          customer: {
            id: customer.id,
            name: `${customer.firstName} ${customer.lastName}`,
            email: customer.email,
            phone: customer.phone
          },
          metrics: {
            totalSpent: Math.round(totalSpent),
            orderCount: orders.length,
            avgOrderValue: Math.round(avgOrderValue),
            purchaseFrequency: purchaseFrequency.toFixed(2),
            daysSinceFirstOrder
          },
          predictedCLV: Math.round(predictedCLV),
          segment,
          recommendations: segment === 'Platinum' || segment === 'Gold' 
            ? ['VIP treatment', 'Early access to new products', 'Exclusive discounts']
            : ['Engagement campaigns', 'Loyalty program', 'Personalized offers']
        });
      }

      // Sort by CLV
      clvAnalysis.sort((a, b) => b.predictedCLV - a.predictedCLV);

      return {
        success: true,
        topCustomers: clvAnalysis.slice(0, 20),
        summary: {
          totalCustomers: customers.length,
          platinum: clvAnalysis.filter(c => c.segment === 'Platinum').length,
          gold: clvAnalysis.filter(c => c.segment === 'Gold').length,
          silver: clvAnalysis.filter(c => c.segment === 'Silver').length,
          bronze: clvAnalysis.filter(c => c.segment === 'Bronze').length,
          totalPredictedValue: clvAnalysis.reduce((sum, c) => sum + c.predictedCLV, 0)
        }
      };
    } catch (error) {
      console.error('CLV prediction error:', error);
      return { success: false, error: error.message };
    }
  }
}

module.exports = new AIAdminAnalytics();
