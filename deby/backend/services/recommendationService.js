/**
 * Recommendation Service - Personalized product recommendations
 * Uses collaborative filtering + content-based filtering
 */

const Product = require('../models/Product');
const UserEvent = require('../models/UserEvent');
const ProductVector = require('../models/ProductVector');

class RecommendationService {
  constructor() {
    this.cache = new Map();
    this.cacheTTL = 300000; // 5 minutes
  }

  /**
   * Get personalized recommendations for home page
   */
  async getHomeRecommendations(userId, deviceId, limit = 20) {
    const cacheKey = `home:${userId || deviceId}`;
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    try {
      const recommendations = [];

      // 1. Get user history
      const history = await UserEvent.getUserHistory({ userId, deviceId }, 100);

      if (history.length === 0) {
        // Cold start: return trending + featured
        const trending = await this.getTrendingProducts(null, 10);
        const featured = await Product.find({ isFeatured: true, isActive: true })
          .limit(10)
          .lean();
        
        recommendations.push(...trending, ...featured);
      } else {
        // 2. Collaborative filtering: users who bought X also bought Y
        const collaborative = await this.getCollaborativeRecommendations(
          history,
          limit / 2
        );
        recommendations.push(...collaborative);

        // 3. Content-based: similar to viewed/purchased products
        const contentBased = await this.getContentBasedRecommendations(
          history,
          limit / 2
        );
        recommendations.push(...contentBased);
      }

      // 4. Deduplicate and limit
      const uniqueRecs = this.deduplicateProducts(recommendations);
      const result = uniqueRecs.slice(0, limit);

      this.setCache(cacheKey, result);
      return result;
    } catch (error) {
      console.error('Home recommendations error:', error);
      return this.getFallbackRecommendations(limit);
    }
  }

  /**
   * Get related products (similar to current product)
   */
  async getRelatedProducts(productId, limit = 10) {
    const cacheKey = `related:${productId}`;
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    try {
      const product = await Product.findById(productId).lean();
      if (!product) return [];

      const related = [];

      // 1. Same category products
      const sameCategory = await Product.find({
        category: product.category,
        _id: { $ne: productId },
        isActive: true
      })
        .limit(limit)
        .sort({ soldCount: -1, averageRating: -1 })
        .lean();
      
      related.push(...sameCategory);

      // 2. Vector similarity (if available)
      try {
        const productVector = await ProductVector.findOne({ productId });
        if (productVector) {
          const similar = await ProductVector.findSimilar(
            productVector.embedding,
            limit,
            [productId]
          );
          
          const similarProducts = await Product.find({
            _id: { $in: similar.map(s => s.productId) },
            isActive: true
          }).lean();
          
          related.push(...similarProducts);
        }
      } catch (error) {
        console.error('Vector similarity failed:', error);
      }

      // 3. Deduplicate and limit
      const uniqueRelated = this.deduplicateProducts(related);
      const result = uniqueRelated.slice(0, limit);

      this.setCache(cacheKey, result);
      return result;
    } catch (error) {
      console.error('Related products error:', error);
      return [];
    }
  }

  /**
   * Get "Because you viewed..." recommendations
   */
  async getBecauseYouViewed(userId, deviceId, limit = 10) {
    try {
      const history = await UserEvent.find({
        $or: [
          { userId },
          { deviceId }
        ],
        eventType: 'view',
        productId: { $exists: true }
      })
        .sort({ timestamp: -1 })
        .limit(20)
        .populate('productId')
        .lean();

      if (history.length === 0) return [];

      // Get products from same categories
      const categories = [...new Set(
        history
          .filter(h => h.productId)
          .map(h => h.productId.category)
      )];

      const viewedProductIds = history
        .filter(h => h.productId)
        .map(h => h.productId._id);

      const recommendations = await Product.find({
        category: { $in: categories },
        _id: { $nin: viewedProductIds },
        isActive: true
      })
        .limit(limit)
        .sort({ soldCount: -1, averageRating: -1 })
        .lean();

      return recommendations;
    } catch (error) {
      console.error('Because you viewed error:', error);
      return [];
    }
  }

  /**
   * Get "Trending now" products
   */
  async getTrendingProducts(category = null, limit = 10) {
    const cacheKey = `trending:${category || 'all'}`;
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    try {
      // Get trending from events
      const trending = await UserEvent.getTrending(category, 24);
      
      if (trending.length === 0) {
        // Fallback to best sellers
        const query = { isActive: true };
        if (category) query.category = category;
        
        const result = await Product.find(query)
          .sort({ soldCount: -1, averageRating: -1 })
          .limit(limit)
          .lean();
        
        this.setCache(cacheKey, result);
        return result;
      }

      const productIds = trending.map(t => t._id);
      const products = await Product.find({
        _id: { $in: productIds },
        isActive: true
      }).lean();

      // Sort by trending score
      const sorted = products.sort((a, b) => {
        const scoreA = trending.find(t => t._id.toString() === a._id.toString())?.score || 0;
        const scoreB = trending.find(t => t._id.toString() === b._id.toString())?.score || 0;
        return scoreB - scoreA;
      });

      const result = sorted.slice(0, limit);
      this.setCache(cacheKey, result);
      return result;
    } catch (error) {
      console.error('Trending products error:', error);
      return this.getFallbackRecommendations(limit);
    }
  }

  /**
   * Collaborative filtering recommendations
   */
  async getCollaborativeRecommendations(userHistory, limit) {
    try {
      // Get products user interacted with
      const userProductIds = userHistory
        .filter(h => h.productId)
        .map(h => h.productId._id);

      if (userProductIds.length === 0) return [];

      // Find other users who interacted with same products
      const similarUsers = await UserEvent.aggregate([
        {
          $match: {
            productId: { $in: userProductIds },
            eventType: { $in: ['purchase', 'add_to_cart', 'view'] }
          }
        },
        {
          $group: {
            _id: { $ifNull: ['$userId', '$deviceId'] },
            commonProducts: { $addToSet: '$productId' },
            count: { $sum: 1 }
          }
        },
        {
          $match: {
            count: { $gte: 2 } // At least 2 common products
          }
        },
        { $sort: { count: -1 } },
        { $limit: 50 }
      ]);

      if (similarUsers.length === 0) return [];

      // Get products these similar users liked
      const similarUserIds = similarUsers.map(u => u._id);
      const recommendations = await UserEvent.aggregate([
        {
          $match: {
            $or: [
              { userId: { $in: similarUserIds.filter(id => id) } },
              { deviceId: { $in: similarUserIds.filter(id => id) } }
            ],
            productId: { $exists: true, $nin: userProductIds },
            eventType: { $in: ['purchase', 'add_to_cart'] }
          }
        },
        {
          $group: {
            _id: '$productId',
            score: {
              $sum: {
                $cond: [{ $eq: ['$eventType', 'purchase'] }, 3, 1]
              }
            }
          }
        },
        { $sort: { score: -1 } },
        { $limit: limit }
      ]);

      const productIds = recommendations.map(r => r._id);
      const products = await Product.find({
        _id: { $in: productIds },
        isActive: true
      }).lean();

      return products;
    } catch (error) {
      console.error('Collaborative filtering error:', error);
      return [];
    }
  }

  /**
   * Content-based recommendations
   */
  async getContentBasedRecommendations(userHistory, limit) {
    try {
      // Get categories and attributes user prefers
      const preferences = this.extractUserPreferences(userHistory);

      // Find products matching preferences
      const query = {
        isActive: true,
        _id: { $nin: preferences.viewedProductIds }
      };

      if (preferences.categories.length > 0) {
        query.category = { $in: preferences.categories };
      }

      if (preferences.priceRange.min > 0 || preferences.priceRange.max < Infinity) {
        query.price = {
          $gte: preferences.priceRange.min,
          $lte: preferences.priceRange.max
        };
      }

      const recommendations = await Product.find(query)
        .limit(limit * 2) // Get more for filtering
        .sort({ soldCount: -1, averageRating: -1 })
        .lean();

      // Score by attribute match
      const scored = recommendations.map(product => {
        let score = 0;

        // Category match
        if (preferences.categories.includes(product.category)) {
          score += 10;
        }

        // Color match
        const colorMatch = product.colors?.some(c => 
          preferences.colors.includes(c)
        );
        if (colorMatch) score += 5;

        // Brand match
        if (preferences.brands.includes(product.brand)) {
          score += 5;
        }

        // Price range match
        if (product.price >= preferences.priceRange.min && 
            product.price <= preferences.priceRange.max) {
          score += 3;
        }

        return { ...product, _recScore: score };
      });

      return scored
        .sort((a, b) => b._recScore - a._recScore)
        .slice(0, limit);
    } catch (error) {
      console.error('Content-based recommendations error:', error);
      return [];
    }
  }

  /**
   * Extract user preferences from history
   */
  extractUserPreferences(history) {
    const preferences = {
      categories: [],
      colors: [],
      brands: [],
      priceRange: { min: 0, max: Infinity },
      viewedProductIds: []
    };

    const categoryCount = new Map();
    const colorCount = new Map();
    const brandCount = new Map();
    const prices = [];

    history.forEach(event => {
      if (!event.productId) return;

      const product = event.productId;
      preferences.viewedProductIds.push(product._id);

      // Count categories
      if (product.category) {
        categoryCount.set(
          product.category,
          (categoryCount.get(product.category) || 0) + 1
        );
      }

      // Count colors
      product.colors?.forEach(color => {
        colorCount.set(color, (colorCount.get(color) || 0) + 1);
      });

      // Count brands
      if (product.brand) {
        brandCount.set(
          product.brand,
          (brandCount.get(product.brand) || 0) + 1
        );
      }

      // Track prices
      if (product.price) {
        prices.push(product.price);
      }
    });

    // Get top categories
    preferences.categories = Array.from(categoryCount.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([cat]) => cat);

    // Get top colors
    preferences.colors = Array.from(colorCount.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([color]) => color);

    // Get top brands
    preferences.brands = Array.from(brandCount.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([brand]) => brand);

    // Calculate price range (with 20% buffer)
    if (prices.length > 0) {
      const avgPrice = prices.reduce((a, b) => a + b, 0) / prices.length;
      const buffer = avgPrice * 0.2;
      preferences.priceRange = {
        min: Math.max(0, avgPrice - buffer),
        max: avgPrice + buffer
      };
    }

    return preferences;
  }

  /**
   * Fallback recommendations (no personalization)
   */
  async getFallbackRecommendations(limit) {
    return Product.find({ isActive: true })
      .sort({ isFeatured: -1, soldCount: -1, averageRating: -1 })
      .limit(limit)
      .lean();
  }

  /**
   * Deduplicate products
   */
  deduplicateProducts(products) {
    const seen = new Set();
    return products.filter(product => {
      const id = product._id.toString();
      if (seen.has(id)) return false;
      seen.add(id);
      return true;
    });
  }

  /**
   * Cache helpers
   */
  getFromCache(key) {
    const cached = this.cache.get(key);
    if (!cached) return null;
    
    if (Date.now() - cached.timestamp > this.cacheTTL) {
      this.cache.delete(key);
      return null;
    }
    
    return cached.data;
  }

  setCache(key, data) {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  clearCache() {
    this.cache.clear();
  }
}

module.exports = new RecommendationService();
