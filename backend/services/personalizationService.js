/**
 * Personalization Service
 * Tracks user behavior and provides personalized product recommendations
 */

const { Product } = require('../models');
const { Op } = require('sequelize');

class PersonalizationService {
  constructor() {
    // In-memory store for user activity (can be moved to Redis/DB later)
    this.userActivity = new Map();
    this.MAX_HISTORY = 50;
    this.ACTIVITY_EXPIRY = 30 * 24 * 60 * 60 * 1000; // 30 days
  }

  /**
   * Track product view
   */
  trackView(userId, productData) {
    if (!userId || !productData) return;

    const activity = this.getUserActivity(userId);
    
    const viewEvent = {
      type: 'view',
      productId: productData.id,
      category: productData.category,
      brand: productData.brand,
      price: productData.price,
      tags: productData.tags || [],
      timestamp: Date.now()
    };

    activity.views.unshift(viewEvent);
    
    // Keep only recent views
    if (activity.views.length > this.MAX_HISTORY) {
      activity.views = activity.views.slice(0, this.MAX_HISTORY);
    }

    // Update category interests
    if (productData.category) {
      activity.categoryInterests[productData.category] = 
        (activity.categoryInterests[productData.category] || 0) + 1;
    }

    // Update brand preferences
    if (productData.brand) {
      activity.brandPreferences[productData.brand] = 
        (activity.brandPreferences[productData.brand] || 0) + 1;
    }

    // Update price range
    if (productData.price) {
      activity.priceHistory.push(productData.price);
      if (activity.priceHistory.length > 20) {
        activity.priceHistory.shift();
      }
    }

    activity.lastActive = Date.now();
    this.userActivity.set(userId, activity);
  }

  /**
   * Track search query
   */
  trackSearch(userId, query) {
    if (!userId || !query) return;

    const activity = this.getUserActivity(userId);
    activity.searches.unshift({
      query: query.toLowerCase(),
      timestamp: Date.now()
    });

    if (activity.searches.length > 20) {
      activity.searches = activity.searches.slice(0, 20);
    }

    activity.lastActive = Date.now();
    this.userActivity.set(userId, activity);
  }

  /**
   * Track purchase
   */
  trackPurchase(userId, productData) {
    if (!userId || !productData) return;

    const activity = this.getUserActivity(userId);
    activity.purchases.unshift({
      productId: productData.id,
      category: productData.category,
      brand: productData.brand,
      price: productData.price,
      timestamp: Date.now()
    });

    if (activity.purchases.length > 30) {
      activity.purchases = activity.purchases.slice(0, 30);
    }

    activity.lastActive = Date.now();
    this.userActivity.set(userId, activity);
  }

  /**
   * Get user activity profile
   */
  getUserActivity(userId) {
    if (!this.userActivity.has(userId)) {
      this.userActivity.set(userId, {
        views: [],
        searches: [],
        purchases: [],
        categoryInterests: {},
        brandPreferences: {},
        priceHistory: [],
        lastActive: Date.now()
      });
    }
    return this.userActivity.get(userId);
  }

  /**
   * Get personalized product recommendations
   */
  async getPersonalizedRecommendations(userId, limit = 12) {
    const activity = this.getUserActivity(userId);
    
    // If no activity, return trending/featured products
    if (activity.views.length === 0 && activity.searches.length === 0) {
      return this.getFallbackRecommendations(limit);
    }

    // Build recommendation query based on user interests
    const whereConditions = { isActive: true };
    const scoringFactors = [];

    // Get top categories
    const topCategories = Object.entries(activity.categoryInterests)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([cat]) => cat);

    // Get top brands
    const topBrands = Object.entries(activity.brandPreferences)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([brand]) => brand);

    // Calculate average price range
    let avgPrice = null;
    if (activity.priceHistory.length > 0) {
      avgPrice = activity.priceHistory.reduce((sum, p) => sum + p, 0) / activity.priceHistory.length;
    }

    // Get recently viewed product IDs to exclude
    const recentlyViewedIds = activity.views.slice(0, 10).map(v => v.productId);

    try {
      // Fetch products matching user preferences
      const recommendations = await Product.findAll({
        where: {
          isActive: true,
          id: { [Op.notIn]: recentlyViewedIds.length > 0 ? recentlyViewedIds : [0] },
          [Op.or]: [
            topCategories.length > 0 ? { category: { [Op.in]: topCategories } } : {},
            topBrands.length > 0 ? { brand: { [Op.in]: topBrands } } : {}
          ]
        },
        limit: limit * 2, // Fetch more for scoring
        order: [
          ['isFeatured', 'DESC'],
          ['averageRating', 'DESC'],
          ['salesCount', 'DESC']
        ]
      });

      // Score and rank recommendations
      const scored = recommendations.map(product => {
        let score = 0;
        const plain = product.toJSON ? product.toJSON() : product;

        // Category match
        const categoryScore = activity.categoryInterests[plain.category] || 0;
        score += categoryScore * 3;

        // Brand match
        const brandScore = activity.brandPreferences[plain.brand] || 0;
        score += brandScore * 2;

        // Price similarity
        if (avgPrice && plain.price) {
          const priceDiff = Math.abs(plain.price - avgPrice);
          const priceScore = Math.max(0, 1 - (priceDiff / avgPrice));
          score += priceScore * 1.5;
        }

        // Boost featured and highly rated
        if (plain.isFeatured) score += 2;
        if (plain.averageRating >= 4) score += 1;
        if (plain.isSale) score += 0.5;

        return { ...plain, _score: score };
      });

      // Sort by score and return top results
      return scored
        .sort((a, b) => b._score - a._score)
        .slice(0, limit)
        .map(({ _score, ...product }) => product);

    } catch (error) {
      console.error('Error fetching personalized recommendations:', error);
      return this.getFallbackRecommendations(limit);
    }
  }

  /**
   * Get fallback recommendations for new users
   */
  async getFallbackRecommendations(limit = 12) {
    try {
      const products = await Product.findAll({
        where: { isActive: true },
        limit,
        order: [
          ['isFeatured', 'DESC'],
          ['salesCount', 'DESC'],
          ['averageRating', 'DESC']
        ]
      });
      return products.map(p => p.toJSON ? p.toJSON() : p);
    } catch (error) {
      console.error('Error fetching fallback recommendations:', error);
      return [];
    }
  }

  /**
   * Get "You May Also Like" recommendations based on current product
   */
  async getSimilarProducts(productId, userId, limit = 6) {
    try {
      const currentProduct = await Product.findOne({ where: { id: productId } });
      if (!currentProduct) return [];

      const plain = currentProduct.toJSON ? currentProduct.toJSON() : currentProduct;
      const activity = this.getUserActivity(userId);

      // Find similar products
      const similar = await Product.findAll({
        where: {
          isActive: true,
          id: { [Op.ne]: productId },
          [Op.or]: [
            { category: plain.category },
            { brand: plain.brand },
            plain.tags && plain.tags.length > 0 ? { tags: { [Op.overlap]: plain.tags } } : {}
          ]
        },
        limit: limit * 2
      });

      // Score based on similarity and user preferences
      const scored = similar.map(product => {
        let score = 0;
        const p = product.toJSON ? product.toJSON() : product;

        if (p.category === plain.category) score += 3;
        if (p.brand === plain.brand) score += 2;
        
        // User preference boost
        if (activity.categoryInterests[p.category]) score += activity.categoryInterests[p.category];
        if (activity.brandPreferences[p.brand]) score += activity.brandPreferences[p.brand];

        // Price similarity
        if (plain.price && p.price) {
          const priceDiff = Math.abs(p.price - plain.price);
          const priceScore = Math.max(0, 1 - (priceDiff / plain.price));
          score += priceScore;
        }

        return { ...p, _score: score };
      });

      return scored
        .sort((a, b) => b._score - a._score)
        .slice(0, limit)
        .map(({ _score, ...product }) => product);

    } catch (error) {
      console.error('Error fetching similar products:', error);
      return [];
    }
  }

  /**
   * Clean up old activity data
   */
  cleanupOldActivity() {
    const now = Date.now();
    for (const [userId, activity] of this.userActivity.entries()) {
      if (now - activity.lastActive > this.ACTIVITY_EXPIRY) {
        this.userActivity.delete(userId);
      }
    }
  }
}

// Singleton instance
const personalizationService = new PersonalizationService();

// Cleanup old data every 24 hours
setInterval(() => {
  personalizationService.cleanupOldActivity();
}, 24 * 60 * 60 * 1000);

module.exports = personalizationService;
