const { Product } = require('../models');
const { Op } = require('sequelize');

/**
 * Advanced AI-Powered Search Service
 * Features: Smart search, recommendations, personalization, typo tolerance
 */
class AdvancedSearchService {
  constructor() {
    this.searchHistory = new Map(); // Store user search history
    this.popularSearches = new Map(); // Track popular searches
    this.productInteractions = new Map(); // Track product views/clicks
  }

  /**
   * Main search function with AI-powered ranking
   */
  async search(options) {
    const {
      query = '',
      category = '',
      subcategory = '',
      minPrice = 0,
      maxPrice = 10000000,
      colors = [],
      sizes = [],
      materials = [],
      brands = [],
      tags = [],
      gender = '',
      ageGroup = '',
      inStock = false,
      isNew = false,
      isSale = false,
      isFeatured = false,
      sortBy = 'relevance',
      page = 1,
      limit = 20,
      userId = null
    } = options;

    try {
      // Build base query
      let whereClause = { isActive: true };
      let searchTerms = [];

      // Process search query with AI enhancement
      if (query) {
        const enhancedQuery = this.enhanceSearchQuery(query);
        searchTerms = enhancedQuery.terms;
        
        // Create flexible search conditions
        const searchConditions = [];
        
        for (const term of searchTerms) {
          searchConditions.push(
            { name: { [Op.iLike]: `%${term}%` } },
            { description: { [Op.iLike]: `%${term}%` } },
            { shortDescription: { [Op.iLike]: `%${term}%` } },
            { category: { [Op.iLike]: `%${term}%` } },
            { subcategory: { [Op.iLike]: `%${term}%` } },
            { brand: { [Op.iLike]: `%${term}%` } }
          );
        }
        
        whereClause[Op.or] = searchConditions;
        
        // Track search
        this.trackSearch(query, userId);
      }

      // Category filters
      if (category) whereClause.category = category;
      if (subcategory) whereClause.subcategory = subcategory;

      // Price range
      whereClause.price = {
        [Op.gte]: parseFloat(minPrice),
        [Op.lte]: parseFloat(maxPrice)
      };

      // Array filters
      if (colors.length > 0) {
        whereClause.colors = { [Op.overlap]: colors };
      }
      if (sizes.length > 0) {
        whereClause.sizes = { [Op.overlap]: sizes };
      }
      if (materials.length > 0) {
        whereClause.material = { [Op.overlap]: materials };
      }
      if (brands.length > 0) {
        whereClause.brand = { [Op.in]: brands };
      }
      if (tags.length > 0) {
        whereClause.tags = { [Op.overlap]: tags };
      }

      // Additional filters
      if (gender) whereClause.gender = gender;
      if (ageGroup) whereClause.ageGroup = ageGroup;
      if (inStock) whereClause.stockQuantity = { [Op.gt]: 0 };
      if (isNew) whereClause.isNew = true;
      if (isSale) whereClause.isSale = true;
      if (isFeatured) whereClause.isFeatured = true;

      // Sorting logic
      let order = [];
      switch (sortBy) {
        case 'price_asc':
          order = [['price', 'ASC']];
          break;
        case 'price_desc':
          order = [['price', 'DESC']];
          break;
        case 'newest':
          order = [['createdAt', 'DESC']];
          break;
        case 'rating':
          order = [['averageRating', 'DESC'], ['totalReviews', 'DESC']];
          break;
        case 'popular':
          order = [['salesCount', 'DESC'], ['viewCount', 'DESC']];
          break;
        case 'relevance':
        default:
          // AI-powered relevance ranking
          order = [
            ['isFeatured', 'DESC'],
            ['averageRating', 'DESC'],
            ['salesCount', 'DESC'],
            ['createdAt', 'DESC']
          ];
          break;
      }

      // Execute query
      const offset = (page - 1) * limit;
      const products = await Product.findAll({
        where: whereClause,
        order: order,
        limit: parseInt(limit),
        offset: parseInt(offset)
      });

      const total = await Product.count({ where: whereClause });

      // Apply AI scoring if query exists
      let rankedProducts = products;
      if (query && searchTerms.length > 0) {
        rankedProducts = this.rankProductsByRelevance(products, searchTerms, userId);
      }

      // Get recommendations
      const recommendations = await this.getRecommendations(query, userId, products);

      // Get trending searches
      const trendingSearches = this.getTrendingSearches();

      return {
        success: true,
        data: rankedProducts,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: total,
          pages: Math.ceil(total / limit)
        },
        metadata: {
          searchTerms: searchTerms,
          appliedFilters: this.getAppliedFilters(options),
          recommendations: recommendations,
          trendingSearches: trendingSearches,
          suggestedFilters: await this.getSuggestedFilters(products)
        }
      };

    } catch (error) {
      console.error('Advanced search error:', error);
      throw error;
    }
  }

  /**
   * Enhance search query with AI
   */
  enhanceSearchQuery(query) {
    const original = query.toLowerCase().trim();
    const terms = [];

    // Split into words
    const words = original.split(/\s+/);
    
    // Add original terms
    terms.push(...words);
    
    // Add full query
    if (words.length > 1) {
      terms.push(original);
    }

    // Handle common typos and variations
    const corrections = this.getTypoCorrections(original);
    terms.push(...corrections);

    // Add synonyms
    const synonyms = this.getSynonyms(original);
    terms.push(...synonyms);

    // Remove duplicates
    return {
      terms: [...new Set(terms)],
      original: original
    };
  }

  /**
   * Get typo corrections
   */
  getTypoCorrections(query) {
    const corrections = [];
    const commonTypos = {
      'dress': ['dres', 'drees', 'drss'],
      'shirt': ['shrt', 'shrit'],
      'shoes': ['shose', 'shos'],
      'bag': ['abg', 'bga'],
      'jacket': ['jaket', 'jackt'],
      'pants': ['pant', 'pnts'],
      'skirt': ['skrt', 'skit']
    };

    for (const [correct, typos] of Object.entries(commonTypos)) {
      if (typos.includes(query) || query.includes(typos.join('|'))) {
        corrections.push(correct);
      }
      if (correct === query || query.includes(correct)) {
        corrections.push(...typos);
      }
    }

    return corrections;
  }

  /**
   * Get search synonyms
   */
  getSynonyms(query) {
    const synonymMap = {
      'dress': ['gown', 'frock', 'outfit'],
      'shirt': ['blouse', 'top', 'tee'],
      'bag': ['purse', 'handbag', 'clutch'],
      'shoes': ['footwear', 'sandals', 'heels'],
      'cheap': ['affordable', 'budget', 'economical'],
      'expensive': ['premium', 'luxury', 'high-end'],
      'new': ['latest', 'fresh', 'recent'],
      'traditional': ['ethnic', 'cultural', 'classic']
    };

    const synonyms = [];
    for (const [word, syns] of Object.entries(synonymMap)) {
      if (query.includes(word)) {
        synonyms.push(...syns);
      }
    }

    return synonyms;
  }

  /**
   * Rank products by AI relevance score
   */
  rankProductsByRelevance(products, searchTerms, userId) {
    return products.map(product => {
      let score = 0;
      const productData = product.toJSON ? product.toJSON() : product;
      const searchableText = `${productData.name} ${productData.description} ${productData.category} ${productData.subcategory} ${productData.brand} ${productData.tags?.join(' ')}`.toLowerCase();

      // Term matching score
      for (const term of searchTerms) {
        const termLower = term.toLowerCase();
        
        // Exact match in name (highest weight)
        if (productData.name?.toLowerCase().includes(termLower)) {
          score += 100;
        }
        
        // Match in description
        if (productData.description?.toLowerCase().includes(termLower)) {
          score += 50;
        }
        
        // Match in category
        if (productData.category?.toLowerCase().includes(termLower)) {
          score += 30;
        }
        
        // Match in tags
        if (productData.tags?.some(tag => tag.toLowerCase().includes(termLower))) {
          score += 20;
        }
      }

      // Quality score
      score += (productData.averageRating || 0) * 10;
      score += (productData.totalReviews || 0) * 2;
      
      // Popularity score
      score += (productData.salesCount || 0) * 5;
      score += (productData.viewCount || 0) * 1;
      
      // Availability bonus
      if (productData.stockQuantity > 0) score += 20;
      
      // Featured bonus
      if (productData.isFeatured) score += 30;
      if (productData.isNew) score += 15;
      if (productData.isSale) score += 10;

      // User personalization
      if (userId) {
        const userInteraction = this.productInteractions.get(`${userId}_${productData.id}`);
        if (userInteraction) {
          score += userInteraction.views * 5;
          score += userInteraction.clicks * 10;
        }
      }

      return {
        ...productData,
        _relevanceScore: score
      };
    }).sort((a, b) => b._relevanceScore - a._relevanceScore);
  }

  /**
   * Get personalized recommendations
   */
  async getRecommendations(query, userId, currentProducts) {
    const recommendations = [];

    try {
      // Get user's search history
      const userHistory = userId ? this.searchHistory.get(userId) : null;
      
      // Collaborative filtering - find similar users' preferences
      if (userHistory && userHistory.length > 0) {
        const recentSearches = userHistory.slice(-5);
        const historyQuery = {
          [Op.or]: recentSearches.map(term => ({
            name: { [Op.iLike]: `%${term}%` }
          }))
        };

        const historyProducts = await Product.findAll({
          where: {
            isActive: true,
            ...historyQuery
          },
          order: [['averageRating', 'DESC']],
          limit: 5
        });

        recommendations.push(...historyProducts.map(p => ({
          ...p.toJSON(),
          reason: 'Based on your search history'
        })));
      }

      // Content-based filtering - similar products
      if (currentProducts.length > 0) {
        const topProduct = currentProducts[0];
        const similarProducts = await Product.findAll({
          where: {
            isActive: true,
            category: topProduct.category,
            id: { [Op.ne]: topProduct.id }
          },
          order: [['averageRating', 'DESC']],
          limit: 5
        });

        recommendations.push(...similarProducts.map(p => ({
          ...p.toJSON(),
          reason: `Similar to ${topProduct.name}`
        })));
      }

      // Trending products
      const trending = await Product.findAll({
        where: { isActive: true },
        order: [['salesCount', 'DESC'], ['viewCount', 'DESC']],
        limit: 5
      });

      recommendations.push(...trending.map(p => ({
        ...p.toJSON(),
        reason: 'Trending now'
      })));

      // Remove duplicates
      const uniqueRecommendations = recommendations.reduce((acc, curr) => {
        if (!acc.find(item => item.id === curr.id)) {
          acc.push(curr);
        }
        return acc;
      }, []);

      return uniqueRecommendations.slice(0, 10);

    } catch (error) {
      console.error('Recommendations error:', error);
      return [];
    }
  }

  /**
   * Track search queries
   */
  trackSearch(query, userId) {
    // Track in popular searches
    const count = this.popularSearches.get(query) || 0;
    this.popularSearches.set(query, count + 1);

    // Track user search history
    if (userId) {
      const history = this.searchHistory.get(userId) || [];
      history.push(query);
      this.searchHistory.set(userId, history.slice(-50)); // Keep last 50 searches
    }
  }

  /**
   * Track product interactions
   */
  trackProductInteraction(userId, productId, type = 'view') {
    if (!userId) return;

    const key = `${userId}_${productId}`;
    const interaction = this.productInteractions.get(key) || {
      views: 0,
      clicks: 0,
      addToCart: 0
    };

    if (type === 'view') interaction.views++;
    if (type === 'click') interaction.clicks++;
    if (type === 'cart') interaction.addToCart++;

    this.productInteractions.set(key, interaction);
  }

  /**
   * Get trending searches
   */
  getTrendingSearches(limit = 10) {
    return Array.from(this.popularSearches.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([query, count]) => ({ query, count }));
  }

  /**
   * Get applied filters summary
   */
  getAppliedFilters(options) {
    const filters = [];
    
    if (options.category) filters.push({ type: 'category', value: options.category });
    if (options.subcategory) filters.push({ type: 'subcategory', value: options.subcategory });
    if (options.minPrice > 0 || options.maxPrice < 10000000) {
      filters.push({ type: 'price', value: `${options.minPrice} - ${options.maxPrice}` });
    }
    if (options.colors?.length) filters.push({ type: 'colors', value: options.colors });
    if (options.sizes?.length) filters.push({ type: 'sizes', value: options.sizes });
    if (options.materials?.length) filters.push({ type: 'materials', value: options.materials });
    if (options.gender) filters.push({ type: 'gender', value: options.gender });
    if (options.inStock) filters.push({ type: 'availability', value: 'In Stock' });
    if (options.isNew) filters.push({ type: 'condition', value: 'New' });
    if (options.isSale) filters.push({ type: 'promotion', value: 'On Sale' });

    return filters;
  }

  /**
   * Get suggested filters based on results
   */
  async getSuggestedFilters(products) {
    const suggestions = {
      categories: new Set(),
      brands: new Set(),
      colors: new Set(),
      sizes: new Set(),
      priceRanges: []
    };

    products.forEach(product => {
      const p = product.toJSON ? product.toJSON() : product;
      if (p.category) suggestions.categories.add(p.category);
      if (p.brand) suggestions.brands.add(p.brand);
      if (p.colors) p.colors.forEach(c => suggestions.colors.add(c));
      if (p.sizes) p.sizes.forEach(s => suggestions.sizes.add(s));
    });

    // Calculate price ranges
    const prices = products.map(p => parseFloat((p.toJSON ? p.toJSON() : p).price)).sort((a, b) => a - b);
    if (prices.length > 0) {
      const min = prices[0];
      const max = prices[prices.length - 1];
      const step = (max - min) / 4;
      
      for (let i = 0; i < 4; i++) {
        suggestions.priceRanges.push({
          min: Math.floor(min + (step * i)),
          max: Math.floor(min + (step * (i + 1))),
          count: prices.filter(p => p >= min + (step * i) && p < min + (step * (i + 1))).length
        });
      }
    }

    return {
      categories: Array.from(suggestions.categories),
      brands: Array.from(suggestions.brands),
      colors: Array.from(suggestions.colors),
      sizes: Array.from(suggestions.sizes),
      priceRanges: suggestions.priceRanges
    };
  }

  /**
   * Get autocomplete suggestions
   */
  async getAutocompleteSuggestions(query, limit = 10) {
    if (!query || query.length < 2) return [];

    try {
      // Get product name suggestions
      const products = await Product.findAll({
        where: {
          isActive: true,
          [Op.or]: [
            { name: { [Op.iLike]: `%${query}%` } },
            { category: { [Op.iLike]: `%${query}%` } },
            { tags: { [Op.overlap]: [query] } }
          ]
        },
        limit: limit,
        order: [['salesCount', 'DESC']]
      });

      const suggestions = products.map(p => {
        const product = p.toJSON ? p.toJSON() : p;
        return {
          type: 'product',
          text: product.name,
          category: product.category,
          image: product.mainImage,
          price: product.price
        };
      });

      // Add popular searches
      const popularMatches = this.getTrendingSearches(20)
        .filter(s => s.query.toLowerCase().includes(query.toLowerCase()))
        .slice(0, 3)
        .map(s => ({
          type: 'popular',
          text: s.query,
          count: s.count
        }));

      return [...popularMatches, ...suggestions].slice(0, limit);

    } catch (error) {
      console.error('Autocomplete error:', error);
      return [];
    }
  }
}

// Singleton instance
const advancedSearchService = new AdvancedSearchService();

module.exports = advancedSearchService;
