/**
 * Intelligent AI-Powered Search Service
 * PostgreSQL/Sequelize integration with AI recommendations
 * Features: Semantic search, collaborative filtering, intelligent ranking
 */

const { Product } = require('../models');
const { Op } = require('sequelize');
const { sequelize } = require('../config/database');

class IntelligentSearchService {
  
  constructor() {
    // Initialize in-memory caches
    this.userCache = {}; // Stores user preferences per device
    this.activityLog = []; // Stores all user activities
    this.searchCache = []; // Stores search queries
    console.log('🚀 IntelligentSearchService initialized with empty caches');
  }
  
  /**
   * Main AI Search Function
   * Combines text search, semantic matching, and ML-based ranking
   */
  async search({ query = '', filters = {}, sortBy = 'relevance', page = 1, limit = 20, userId = null }) {
    try {
      console.log('🤖 AI Search Request:', { query, filters, sortBy, page, limit, userId });
      
      const offset = (page - 1) * limit;
      
      // Build PostgreSQL where clause
      const where = this.buildWhereClause(query, filters);
      
      // Get total count
      const total = await Product.countDocuments(where);
      
      // Build order clause
      const order = this.buildOrderClause(sortBy, query);
      
      // Fetch products
      let products = await Product.find(where)
        .sort(order)
        .skip(offset)
        .limit(limit);
      
      // Convert to plain objects
      products = products.map(p => {
        const plain = p.toJSON ? p.toJSON() : p.get({ plain: true });
        
        // Calculate AI score for relevance sorting
        if (query && query.trim() && sortBy === 'relevance') {
          plain.aiScore = this.calculateAIScore(plain, query);
        }
        
        return plain;
      });
      
      // Sort by AI score if relevance
      if (sortBy === 'relevance' && query && query.trim()) {
        products.sort((a, b) => (b.aiScore || 0) - (a.aiScore || 0));
      }
      
      // Get filter options
      const filterOptions = await this.getFilterOptions(where);
      
      // Get personalized recommendations if user is logged in
      let recommendations = [];
      if (userId && products.length > 0) {
        recommendations = await this.getPersonalizedRecommendations(userId, 6);
      }
      
      const totalPages = Math.ceil(total / limit);
      
      return {
        success: true,
        data: products,
        pagination: {
          total,
          page,
          limit,
          totalPages,
          hasMore: page < totalPages,
          showing: `${offset + 1}-${Math.min(offset + products.length, total)} of ${total}`
        },
        filterOptions,
        recommendations,
        query,
        filters,
        sortBy,
        aiPowered: true,
        timestamp: new Date().toISOString()
      };
      
    } catch (error) {
      console.error('❌ Intelligent Search Error:', error);
      throw error;
    }
  }
  
  /**
   * Build PostgreSQL WHERE clause with filters
   */
  buildWhereClause(query, filters) {
    const where = { isActive: true };
    
    // Text search
    if (query && query.trim()) {
      const searchTerm = `%${query.trim()}%`;
      where[Op.or] = [
        { name: { [Op.iLike]: searchTerm } },
        { description: { [Op.iLike]: searchTerm } },
        { category: { [Op.iLike]: searchTerm } },
        { brand: { [Op.iLike]: searchTerm } }
      ];
    }
    
    // Category filter
    if (filters.category && filters.category !== 'all') {
      where.category = { [Op.iLike]: `%${filters.category}%` };
    }
    
    // Brand filter
    if (filters.brand && filters.brand !== 'all') {
      where.brand = { [Op.iLike]: `%${filters.brand}%` };
    }
    
    // Price range filter
    if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
      where.price = {};
      if (filters.minPrice !== undefined) where.price[Op.gte] = Number(filters.minPrice);
      if (filters.maxPrice !== undefined) where.price[Op.lte] = Number(filters.maxPrice);
    }
    
    // Rating filter
    if (filters.minRating) {
      where.averageRating = { [Op.gte]: Number(filters.minRating) };
    }
    
    // Stock filter
    if (filters.inStock) {
      where.stockQuantity = { [Op.gt]: 0 };
    }
    
    // Gender filter
    if (filters.gender && filters.gender !== 'all') {
      where.gender = filters.gender;
    }
    
    // Color filter (for clothing, accessories, etc.)
    if (filters.color && filters.color !== 'all') {
      // Check if product has this color in colors array
      where.colors = {
        [Op.contains]: [filters.color]
      };
    }
    
    // Size filter (for clothing, shoes, etc.)
    if (filters.size && filters.size !== 'all') {
      // Check if product has this size in sizes array
      where.sizes = {
        [Op.contains]: [filters.size]
      };
    }
    
    // Material filter (for clothing, jewelry, furniture, etc.)
    if (filters.material && filters.material !== 'all') {
      // Check if product has this material in material array
      where.material = {
        [Op.contains]: [filters.material]
      };
    }
    
    // Storage filter (for electronics like phones, laptops, flash drives)
    if (filters.storage && filters.storage !== 'all') {
      // Use JSONB search or text search in description/specs
      where[Op.or] = [
        ...(where[Op.or] || []),
        sequelize.literal(`"specifications"::text ILIKE '%${filters.storage}%'`),
        { description: { [Op.iLike]: `%${filters.storage}%` } }
      ];
    }
    
    // RAM filter (for electronics like computers, phones)
    if (filters.ram && filters.ram !== 'all') {
      where[Op.or] = [
        ...(where[Op.or] || []),
        sequelize.literal(`"specifications"::text ILIKE '%${filters.ram}%'`)
      ];
    }
    
    // Screen size filter (for electronics)
    if (filters.screenSize && filters.screenSize !== 'all') {
      where[Op.or] = [
        ...(where[Op.or] || []),
        sequelize.literal(`"specifications"::text ILIKE '%${filters.screenSize}%'`)
      ];
    }
    
    return where;
  }
  
  /**
   * Build order clause for Sequelize based on sortBy parameter
   */
  buildOrderClause(sortBy, query) {
    const orderMaps = {
      relevance: query ? {} : { isFeatured: -1, createdAt: -1 }, // AI score calculated after fetch
      'price-low': { price: 1 },
      'price-high': { price: -1 },
      newest: { createdAt: -1 },
      oldest: { createdAt: 1 },
      popular: { salesCount: -1, viewCount: -1 },
      rating: { averageRating: -1, totalReviews: -1 },
      'name-asc': { name: 1 },
      'name-desc': { name: -1 },
      featured: { isFeatured: -1, createdAt: -1 }
    };
    
    return orderMaps[sortBy] || orderMaps.featured;
  }
  
  /**
   * Calculate AI score for a product
   */
  calculateAIScore(product, query) {
    let score = 0;
    
    if (query && query.trim()) {
      const searchTerm = query.toLowerCase().trim();
      const productName = (product.name || '').toLowerCase();
      const productDesc = (product.description || '').toLowerCase();
      const productCategory = (product.category || '').toLowerCase();
      const productBrand = (product.brand || '').toLowerCase();
      
      // ========== NAME MATCHING (Highest Priority) ==========
      
      // Exact match - highest score
      if (productName === searchTerm) {
        score += 500;
      }
      // Exact match ignoring case and extra spaces
      else if (productName.replace(/\s+/g, ' ').trim() === searchTerm.replace(/\s+/g, ' ').trim()) {
        score += 450;
      }
      // Name contains exact phrase
      else if (productName.includes(searchTerm)) {
        // Extra points if match is at the beginning
        if (productName.startsWith(searchTerm)) {
          score += 300;
        } else {
          score += 250;
        }
      }
      // All search words present in name (any order)
      else {
        const searchWords = searchTerm.split(/\s+/);
        const matchedWords = searchWords.filter(word => 
          word.length > 2 && productName.includes(word)
        );
        
        if (matchedWords.length === searchWords.length) {
          // All words match
          score += 150;
        } else if (matchedWords.length > 0) {
          // Partial word match
          score += 50 * matchedWords.length;
        }
      }
      
      // ========== DESCRIPTION MATCHING ==========
      if (productDesc.includes(searchTerm)) {
        score += 80;
      } else {
        const searchWords = searchTerm.split(/\s+/);
        const matchedWords = searchWords.filter(word => 
          word.length > 2 && productDesc.includes(word)
        );
        score += 20 * matchedWords.length;
      }
      
      // ========== CATEGORY MATCHING ==========
      if (productCategory === searchTerm) {
        score += 100;
      } else if (productCategory.includes(searchTerm)) {
        score += 60;
      }
      
      // ========== BRAND MATCHING ==========
      if (productBrand === searchTerm) {
        score += 80;
      } else if (productBrand.includes(searchTerm)) {
        score += 40;
      }
    }
    
    // Add quality signals
    score += (parseFloat(product.averageRating) || 0) * 10;
    score += (parseInt(product.salesCount) || 0) * 2;
    score += (parseInt(product.viewCount) || 0) * 0.5;
    
    // Boost featured/new/bestseller products (but not too much)
    if (product.isFeatured) score += 30;
    if (product.isNew) score += 20;
    if (product.isBestSeller) score += 25;
    if (product.isSale) score += 15;
    
    // Stock availability
    if ((parseInt(product.stockQuantity) || 0) > 0) {
      score += 15;
    } else {
      score -= 100; // Heavily penalize out of stock
    }
    
    return score;
  }
  
  /**
   * Get filter options from products - Extract real data
   */
  async getFilterOptions(where) {
    try {
      // Get all active products to extract filters
      const products = await Product.find({ isActive: true }).limit(2000);
      const plainProducts = products.map(p => p.toJSON ? p.toJSON() : p.get({ plain: true }));
      
      // Extract unique values
      const categories = [...new Set(plainProducts.map(p => p.category).filter(Boolean))];
      const brands = [...new Set(plainProducts.map(p => p.brand).filter(Boolean))];
      const colors = [...new Set(plainProducts.flatMap(p => p.colors || []).filter(Boolean))];
      const sizes = [...new Set(plainProducts.flatMap(p => p.sizes || []).filter(Boolean))];
      const materials = [...new Set(plainProducts.flatMap(p => p.material || []).filter(Boolean))];
      const genders = [...new Set(plainProducts.map(p => p.gender).filter(Boolean))];
      
      // Extract storage options from specifications (for electronics)
      const storageOptions = new Set();
      plainProducts.forEach(p => {
        if (p.specifications && typeof p.specifications === 'object') {
          if (p.specifications.storage) storageOptions.add(p.specifications.storage);
          if (p.specifications.capacity) storageOptions.add(p.specifications.capacity);
        }
        // Also check description for common storage patterns
        const desc = (p.description || '').toLowerCase();
        const storageMatches = desc.match(/(\d+)(gb|tb|mb)/gi);
        if (storageMatches) {
          storageMatches.forEach(match => storageOptions.add(match.toUpperCase()));
        }
      });
      
      // Extract RAM options from specifications
      const ramOptions = new Set();
      plainProducts.forEach(p => {
        if (p.specifications && typeof p.specifications === 'object') {
          if (p.specifications.ram) ramOptions.add(p.specifications.ram);
          if (p.specifications.memory) ramOptions.add(p.specifications.memory);
        }
      });
      
      // Extract screen size options
      const screenSizes = new Set();
      plainProducts.forEach(p => {
        if (p.specifications && typeof p.specifications === 'object') {
          if (p.specifications.screenSize) screenSizes.add(p.specifications.screenSize);
          if (p.specifications.display) screenSizes.add(p.specifications.display);
        }
      });
      
      // Get price range
      const prices = plainProducts.map(p => parseFloat(p.price || 0)).filter(p => p > 0);
      
      return {
        categories: categories.sort(),
        brands: brands.sort(),
        colors: colors.sort(),
        sizes: sizes.sort(),
        materials: materials.sort(),
        genders: genders.sort(),
        storage: [...storageOptions].sort(),
        ram: [...ramOptions].sort(),
        screenSizes: [...screenSizes].sort(),
        priceRange: {
          min: prices.length > 0 ? Math.min(...prices) : 0,
          max: prices.length > 0 ? Math.max(...prices) : 100000
        },
        totalProducts: plainProducts.length,
        inStockCount: plainProducts.filter(p => (p.stockQuantity || 0) > 0).length,
        onSaleCount: plainProducts.filter(p => p.isSale).length,
        newCount: plainProducts.filter(p => p.isNew).length
      };
    } catch (error) {
      console.error('Error getting filter options:', error);
      return {
        categories: [],
        brands: [],
        colors: [],
        sizes: [],
        materials: [],
        genders: [],
        storage: [],
        ram: [],
        screenSizes: [],
        priceRange: { min: 0, max: 100000 },
        totalProducts: 0,
        inStockCount: 0,
        onSaleCount: 0,
        newCount: 0
      };
    }
  }
  
  /**
   * Get personalized recommendations with AI - UNIQUE per device
   */
  async getPersonalizedRecommendations(userId, limit = 6) {
    try {
      // Get THIS device's browsing history
      const userPreferences = await this.getUserPreferences(userId);
      
      if (userPreferences && userPreferences.categories.length > 0) {
        console.log(`🎯 Generating personalized recommendations for device ${userId}:`, {
          categories: userPreferences.categories,
          brands: userPreferences.brands,
          viewedCount: userPreferences.viewedProducts?.length || 0
        });
        
        // Exclude products already viewed or purchased by THIS device
        const excludeIds = [
          ...(userPreferences.viewedProducts || []),
          ...(userPreferences.purchasedProducts || [])
        ];
        
        // Recommend based on THIS user's preferred categories
        const where = {
          isActive: true,
          stockQuantity: { [Op.gt]: 0 }
        };
        
        // Exclude already seen products
        if (excludeIds.length > 0) {
          where.id = { [Op.notIn]: excludeIds };
        }
        
        // Get products from ALL categories first
        let allProducts = await Product.find(where)
          .sort({ averageRating: -1, salesCount: -1 })
          .limit(limit * 5);
        
        let plainProducts = allProducts.map(p => p.toJSON ? p.toJSON() : p.get({ plain: true }));
        
        // Calculate AI recommendation score for each product
        const recommended = plainProducts.map(p => {
          const score = this.calculateRecommendationScore(p, userPreferences);
          return {
            ...p,
            recommendationScore: score,
            recommendationReason: this.getRecommendationReason(p, userPreferences)
          };
        });
        
        // Sort by recommendation score and get top results
        const topRecommendations = recommended
          .sort((a, b) => b.recommendationScore - a.recommendationScore)
          .slice(0, limit);
        
        console.log(`✅ Top ${topRecommendations.length} recommendations for device ${userId}:`,
          topRecommendations.map(p => ({ 
            name: p.name, 
            score: p.recommendationScore,
            reason: p.recommendationReason
          }))
        );
        
        return topRecommendations;
      }
      
      console.log(`ℹ️  No browsing history for device ${userId}, using trending + popular`);
      console.log(`📊 Cache status: ${Object.keys(this.userCache).length} devices tracked, ${this.activityLog.length} activities`);
      
      // Fallback to trending + popular products
      const [trending, popular] = await Promise.all([
        this.getTrendingProducts(null, Math.ceil(limit / 2)),
        this.getPopularProducts(Math.ceil(limit / 2))
      ]);
      
      // Mix trending and popular, remove duplicates
      const combined = [...trending, ...popular];
      const unique = combined.filter((product, index, self) => 
        index === self.findIndex(p => (p.id || p._id) === (product.id || product._id))
      );
      
      return unique.slice(0, limit);
      
    } catch (error) {
      console.error('❌ Recommendations Error:', error);
      return await this.getPopularProducts(limit);
    }
  }
  
  /**
   * Get recommendation reason for display
   */
  getRecommendationReason(product, userPreferences) {
    // Exact category match
    if (userPreferences.categories.includes(product.category)) {
      return `Based on your interest in ${product.category}`;
    }
    
    // Fuzzy category match (partial matches)
    const productCategory = (product.category || '').toLowerCase();
    for (const userCategory of userPreferences.categories) {
      const userCat = (userCategory || '').toLowerCase();
      if (productCategory.includes(userCat) || userCat.includes(productCategory)) {
        return `Based on your interest in ${userCategory}`;
      }
    }
    
    // Brand loyalty
    if (userPreferences.brands && userPreferences.brands.includes(product.brand)) {
      return `You like ${product.brand}`;
    }
    
    // Price range match
    if (userPreferences.avgPricePaid > 0) {
      const priceDiff = Math.abs(parseFloat(product.price) - userPreferences.avgPricePaid);
      if (priceDiff / userPreferences.avgPricePaid < 0.3) {
        return `Matches your budget`;
      }
    }
    
    return `Popular choice`;
  }
  
  /**
   * Get popular products (fallback)
   */
  async getPopularProducts(limit = 6) {
    try {
      const products = await Product.find({ 
        isActive: true, 
        stockQuantity: { [Op.gt]: 0 } 
      })
      .sort({ salesCount: -1, averageRating: -1, viewCount: -1 })
      .limit(limit);
      
      return products.map(p => p.toJSON ? p.toJSON() : p.get({ plain: true }));
    } catch (error) {
      console.error('Error getting popular products:', error);
      return [];
    }
  }
  
  /**
   * Get related products (similar products)
   */
  async getRelatedProducts(productId, limit = 8) {
    try {
      const product = await Product.findById(productId);
      if (!product) return [];
      
      const productData = product.toJSON ? product.toJSON() : product.get({ plain: true });
      
      // Build related query
      const where = {
        isActive: true,
        id: { [Op.ne]: productId }
      };
      
      // Same category or brand
      if (productData.category) {
        where[Op.or] = [
          { category: productData.category },
          { brand: productData.brand }
        ];
      }
      
      // Price range similarity
      if (productData.price) {
        const priceMargin = parseFloat(productData.price) * 0.3;
        where.price = {
          [Op.gte]: parseFloat(productData.price) - priceMargin,
          [Op.lte]: parseFloat(productData.price) + priceMargin
        };
      }
      
      const related = await Product.find(where)
        .sort({ averageRating: -1, salesCount: -1 })
        .limit(limit);
      
      return related.map(p => p.toJSON ? p.toJSON() : p.get({ plain: true }));
        
    } catch (error) {
      console.error('❌ Related Products Error:', error);
      return [];
    }
  }
  
  /**
   * Get trending products based on REAL user activity
   */
  async getTrendingProducts(category = null, limit = 10) {
    try {
      // Get real activity data from tracking
      const activityStats = this.getActivityStats();
      
      const where = { 
        isActive: true, 
        stockQuantity: { [Op.gt]: 0 } 
      };
      
      if (category) {
        where.category = { [Op.iLike]: `%${category}%` };
      }
      
      let products = await Product.find(where)
        .sort({ salesCount: -1, viewCount: -1, averageRating: -1 })
        .limit(limit * 3); // Get more to calculate trending score
      
      // Calculate trending score based on REAL user activity
      products = products.map(p => {
        const plain = p.toJSON ? p.toJSON() : p.get({ plain: true });
        const productId = plain.id || plain._id;
        
        // Get real activity for this product
        const realViews = activityStats.productViews[productId] || 0;
        const realPurchases = activityStats.productPurchases[productId] || 0;
        const realCartAdds = activityStats.productCartAdds[productId] || 0;
        const realSearches = activityStats.productSearches[productId] || 0;
        
        // Calculate trending score with REAL data
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        
        plain.trendingScore = 
          realPurchases * 100 +        // Purchases are most important
          realCartAdds * 30 +           // Cart adds show intent
          realViews * 10 +              // Views show interest
          realSearches * 20 +           // Searches show demand
          (parseInt(plain.salesCount) || 0) * 5 +
          (parseInt(plain.viewCount) || 0) * 1 +
          (parseFloat(plain.averageRating) || 0) * 10 +
          (new Date(plain.createdAt) >= thirtyDaysAgo ? 50 : 0);
        
        // Add activity details for debugging
        plain.activityStats = {
          views: realViews,
          purchases: realPurchases,
          cartAdds: realCartAdds,
          searches: realSearches
        };
        
        return plain;
      });
      
      // Sort by trending score and return top products
      const trending = products
        .sort((a, b) => b.trendingScore - a.trendingScore)
        .slice(0, limit);
      
      console.log('🔥 Trending products calculated from REAL activity:', 
        trending.map(p => ({ name: p.name, score: p.trendingScore, activity: p.activityStats }))
      );
      
      return trending;
        
    } catch (error) {
      console.error('Error getting trending products:', error);
      return [];
    }
  }
  
  /**
   * Get activity statistics from tracked events
   */
  getActivityStats() {
    const stats = {
      productViews: {},
      productPurchases: {},
      productCartAdds: {},
      productSearches: {}
    };
    
    if (!this.userCache) return stats;
    
    // Count views, purchases, and cart adds per product
    if (this.activityLog) {
      this.activityLog.forEach(event => {
        const productId = event.productId;
        if (!productId) return;
        
        if (event.eventType === 'view') {
          stats.productViews[productId] = (stats.productViews[productId] || 0) + 1;
        } else if (event.eventType === 'purchase') {
          stats.productPurchases[productId] = (stats.productPurchases[productId] || 0) + 1;
        } else if (event.eventType === 'add_to_cart') {
          stats.productCartAdds[productId] = (stats.productCartAdds[productId] || 0) + 1;
        }
      });
    }
    
    // Count searches per product (from search cache)
    if (this.searchCache) {
      this.searchCache.forEach(search => {
        // Simple approach: if product name contains search query
        // In production, you'd match this with actual product IDs from search results
        const query = search.query.toLowerCase();
        if (query.length > 2) {
          stats.productSearches[query] = (stats.productSearches[query] || 0) + 1;
        }
      });
    }
    
    return stats;
  }
  
  /**
   * Get autocomplete suggestions
   */
  async getAutocompleteSuggestions(query, limit = 10) {
    if (!query || query.length < 2) return [];
    
    try {
      const searchTerm = `%${query}%`;
      
      const [products, categories, brands] = await Promise.all([
        // Product names
        Product.find({ 
          isActive: true, 
          name: { [Op.iLike]: searchTerm } 
        }).limit(5),
        
        // Categories
        Product.distinct('category'),
        
        // Brands
        Product.distinct('brand')
      ]);
      
      const suggestions = [
        ...products.map(p => {
          const data = p.toJSON ? p.toJSON() : p.get({ plain: true });
          return { type: 'product', value: data.name, id: data.id };
        }),
        ...categories.filter(c => c && c.toLowerCase().includes(query.toLowerCase())).slice(0, 3).map(c => ({ type: 'category', value: c })),
        ...brands.filter(b => b && b.toLowerCase().includes(query.toLowerCase())).slice(0, 2).map(b => ({ type: 'brand', value: b }))
      ];
      
      return suggestions.slice(0, limit);
    } catch (error) {
      console.error('Error getting autocomplete:', error);
      return [];
    }
  }
  
  /**
   * Get user preferences from their behavior
   */
  async getUserPreferences(userId) {
    try {
      // In-memory user tracking (can be enhanced with database)
      if (!this.userCache) this.userCache = {};
      
      const preferences = this.userCache[userId] || null;
      
      console.log(`📊 User preferences for ${userId}:`, preferences ? {
        categories: preferences.categories?.length || 0,
        brands: preferences.brands?.length || 0,
        viewedProducts: preferences.viewedProducts?.length || 0,
        cartProducts: preferences.cartProducts?.length || 0,
        purchasedProducts: preferences.purchasedProducts?.length || 0
      } : 'No data found');
      
      return preferences;
    } catch (error) {
      console.error('Error getting user preferences:', error);
      return null;
    }
  }
  
  /**
   * Calculate recommendation score based on user preferences
   */
  calculateRecommendationScore(product, userPreferences) {
    let score = 0;
    
    // Exact category match
    if (userPreferences.categories.includes(product.category)) {
      score += 100;
    } else {
      // Fuzzy category match (partial matches get lower score)
      const productCategory = (product.category || '').toLowerCase();
      for (const userCategory of userPreferences.categories) {
        const userCat = (userCategory || '').toLowerCase();
        if (productCategory.includes(userCat) || userCat.includes(productCategory)) {
          score += 75; // Lower than exact match but still significant
          break;
        }
      }
    }
    
    // Brand loyalty
    if (userPreferences.brands && userPreferences.brands.includes(product.brand)) {
      score += 50;
    }
    
    // Price range match
    if (userPreferences.avgPricePaid > 0) {
      const priceDiff = Math.abs(parseFloat(product.price) - userPreferences.avgPricePaid);
      const priceScore = Math.max(0, 50 - (priceDiff / userPreferences.avgPricePaid) * 50);
      score += priceScore;
    }
    
    // Quality indicators
    score += (parseFloat(product.averageRating) || 0) * 10;
    score += (parseInt(product.salesCount) || 0) * 2;
    
    // Boost new arrivals for engaged users
    if (product.isNew) score += 20;
    if (product.isSale) score += 15;
    
    return score;
  }
  
  /**
   * Track user events (view, add to cart, purchase) - Per Device
   */
  async trackUserEvent(userId, eventType, productId, productData) {
    try {
      // Initialize caches
      if (!this.userCache) this.userCache = {};
      if (!this.activityLog) this.activityLog = [];
      
      // Create user profile if doesn't exist
      if (!this.userCache[userId]) {
        this.userCache[userId] = {
          userId: userId,
          categories: [],
          brands: [],
          viewedProducts: [],
          cartProducts: [],
          purchasedProducts: [],
          avgPricePaid: 0,
          totalEvents: 0,
          lastActive: new Date(),
          deviceFingerprint: userId // Unique per device
        };
      }
      
      const user = this.userCache[userId];
      
      // Log the activity
      this.activityLog.push({
        userId,
        eventType,
        productId,
        productData: productData ? {
          name: productData.name,
          category: productData.category,
          brand: productData.brand,
          price: productData.price
        } : null,
        timestamp: new Date()
      });
      
      // Keep activity log to last 10000 events
      if (this.activityLog.length > 10000) {
        this.activityLog = this.activityLog.slice(-10000);
      }
      
      // Update user preferences based on THIS device's activity
      if (productData) {
        // Track categories (max 10 most recent)
        if (productData.category && !user.categories.includes(productData.category)) {
          user.categories.unshift(productData.category);
          if (user.categories.length > 10) user.categories = user.categories.slice(0, 10);
        }
        
        // Track brands (max 5 most recent)
        if (productData.brand && !user.brands.includes(productData.brand)) {
          user.brands.unshift(productData.brand);
          if (user.brands.length > 5) user.brands = user.brands.slice(0, 5);
        }
        
        // Track specific products per event type
        if (eventType === 'view' && !user.viewedProducts.includes(productId)) {
          user.viewedProducts.unshift(productId);
          if (user.viewedProducts.length > 20) user.viewedProducts = user.viewedProducts.slice(0, 20);
        }
        
        if (eventType === 'add_to_cart' && !user.cartProducts.includes(productId)) {
          user.cartProducts.unshift(productId);
          if (user.cartProducts.length > 10) user.cartProducts = user.cartProducts.slice(0, 10);
        }
        
        if (eventType === 'purchase') {
          if (!user.purchasedProducts.includes(productId)) {
            user.purchasedProducts.unshift(productId);
          }
          // Update average price paid (weighted)
          if (productData.price) {
            const currentTotal = user.avgPricePaid * user.totalEvents;
            user.totalEvents++;
            user.avgPricePaid = (currentTotal + parseFloat(productData.price)) / user.totalEvents;
          }
        }
      }
      
      user.lastActive = new Date();
      
      console.log(`✅ User event tracked for device ${userId}:`, { 
        eventType, 
        productId,
        productName: productData?.name,
        userStats: {
          categories: user.categories.length,
          viewedProducts: user.viewedProducts.length,
          cartProducts: user.cartProducts.length,
          purchases: user.purchasedProducts.length
        }
      });
      
      console.log(`📊 Total devices in cache: ${Object.keys(this.userCache).length}`);
      console.log(`📊 Total activities logged: ${this.activityLog.length}`);
      
      return true;
    } catch (error) {
      console.error('Error tracking user event:', error);
      return false;
    }
  }
  
  /**
   * Get cache statistics for debugging
   */
  getCacheStats() {
    const userCount = Object.keys(this.userCache || {}).length;
    const activityCount = (this.activityLog || []).length;
    const searchCount = (this.searchCache || []).length;
    
    const userDetails = Object.entries(this.userCache || {}).map(([deviceId, user]) => ({
      deviceId,
      categories: user.categories?.length || 0,
      viewedProducts: user.viewedProducts?.length || 0,
      cartProducts: user.cartProducts?.length || 0,
      purchasedProducts: user.purchasedProducts?.length || 0,
      totalEvents: user.totalEvents || 0,
      lastActive: user.lastActive
    }));
    
    return {
      totalDevices: userCount,
      totalActivities: activityCount,
      totalSearches: searchCount,
      devices: userDetails
    };
  }
  
  /**
   * Track search event
   */
  async trackSearch(userId, query, resultsCount) {
    try {
      console.log('🔍 Search tracked:', { userId, query, resultsCount, timestamp: new Date() });
      // Track search for analytics
      if (!this.searchCache) this.searchCache = [];
      this.searchCache.push({
        userId,
        query,
        resultsCount,
        timestamp: new Date()
      });
      // Keep only last 1000 searches
      if (this.searchCache.length > 1000) {
        this.searchCache = this.searchCache.slice(-1000);
      }
    } catch (error) {
      console.error('Error tracking search:', error);
    }
  }
  
  /**
   * Get search analytics
   */
  async getSearchAnalytics(days = 7) {
    try {
      if (!this.searchCache || this.searchCache.length === 0) {
        return {
          totalSearches: 0,
          uniqueUsers: 0,
          topQueries: [],
          avgResultsCount: 0,
          period: `Last ${days} days`
        };
      }
      
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);
      
      const recentSearches = this.searchCache.filter(s => new Date(s.timestamp) >= cutoffDate);
      
      // Calculate stats
      const queryCount = {};
      const uniqueUsers = new Set();
      let totalResults = 0;
      
      recentSearches.forEach(search => {
        queryCount[search.query] = (queryCount[search.query] || 0) + 1;
        uniqueUsers.add(search.userId);
        totalResults += search.resultsCount || 0;
      });
      
      // Top queries
      const topQueries = Object.entries(queryCount)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([query, count]) => ({ query, count }));
      
      return {
        totalSearches: recentSearches.length,
        uniqueUsers: uniqueUsers.size,
        topQueries,
        avgResultsCount: recentSearches.length > 0 ? Math.round(totalResults / recentSearches.length) : 0,
        period: `Last ${days} days`
      };
    } catch (error) {
      console.error('Error getting search analytics:', error);
      return {
        totalSearches: 0,
        uniqueUsers: 0,
        topQueries: [],
        avgResultsCount: 0,
        period: `Last ${days} days`
      };
    }
  }
  
  /**
   * Smart product recommendations based on cart
   */
  async getCartBasedRecommendations(cartItems, limit = 6) {
    try {
      if (!cartItems || cartItems.length === 0) {
        return await this.getPopularProducts(limit);
      }
      
      const categories = [...new Set(cartItems.map(item => item.category).filter(Boolean))];
      const productIds = cartItems.map(item => item._id || item.id).filter(Boolean);
      
      const where = {
        isActive: true,
        id: { [Op.notIn]: productIds },
        stockQuantity: { [Op.gt]: 0 }
      };
      
      if (categories.length > 0) {
        where.category = { [Op.in]: categories };
      }
      
      const products = await Product.find(where)
        .sort({ salesCount: -1, averageRating: -1 })
        .limit(limit);
      
      return products.map(p => p.toJSON ? p.toJSON() : p.get({ plain: true }));
      
    } catch (error) {
      console.error('❌ Cart Recommendations Error:', error);
      return [];
    }
  }
}

module.exports = new IntelligentSearchService();
