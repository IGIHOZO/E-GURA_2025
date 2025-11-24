/**
 * Search Engine V2 - Hybrid search with BM25 + Vector similarity
 * Supports query understanding, faceted filters, and personalization
 */

const Product = require('../models/Product');
const ProductVector = require('../models/ProductVector');
const Synonym = require('../models/Synonym');
const UserEvent = require('../models/UserEvent');
const embeddingService = require('./embeddingService');

class SearchEngineV2 {
  constructor() {
    // BM25 parameters
    this.k1 = 1.5; // Term saturation parameter
    this.b = 0.75; // Length normalization parameter
    
    // Hybrid scoring weights
    this.keywordWeight = 0.6;
    this.vectorWeight = 0.4;
    
    // Cache
    this.cache = new Map();
    this.cacheTTL = 60000; // 60 seconds
  }

  /**
   * Main search method - hybrid keyword + vector search
   */
  async search(params) {
    const {
      query = '',
      filters = {},
      sortBy = 'relevance',
      page = 1,
      limit = 20,
      userId = null,
      deviceId = null
    } = params;

    const startTime = Date.now();

    try {
      // 1. Query understanding
      const processedQuery = await this.processQuery(query);
      
      // 2. Fetch products with DB-level filters
      const dbQuery = this.buildDBQuery(filters);
      const products = await Product.find(dbQuery)
        .select('name description price originalPrice mainImage images category brand gender sizes colors material tags stockQuantity soldCount rating averageRating createdAt isNew isFeatured sku')
        .lean();

      if (products.length === 0) {
        return this.emptyResult(query, filters, sortBy);
      }

      // 3. Apply hybrid search if query exists
      let results = products;
      if (processedQuery.terms.length > 0) {
        results = await this.hybridSearch(products, processedQuery);
      }

      // 4. Apply client-side filters
      results = this.applyFilters(results, filters);

      // 5. Get personalization signals
      const personalizedScores = await this.getPersonalizationScores(
        results,
        userId,
        deviceId
      );

      // 6. Apply personalization boost
      results = this.applyPersonalization(results, personalizedScores);

      // 7. Sort results
      results = this.sortResults(results, sortBy);

      // 8. Pagination
      const total = results.length;
      const paginatedResults = this.paginate(results, page, limit);

      // 9. Get facets
      const facets = this.calculateFacets(products, filters);

      const latency = Date.now() - startTime;

      return {
        success: true,
        data: paginatedResults,
        pagination: {
          total,
          page: Number(page),
          limit: Number(limit),
          totalPages: Math.ceil(total / limit),
          hasMore: page * limit < total
        },
        facets,
        query: processedQuery.original,
        correctedQuery: processedQuery.corrected,
        filters,
        sortBy,
        performance: {
          latency,
          totalProducts: products.length,
          filteredProducts: results.length,
          returnedProducts: paginatedResults.length
        }
      };
    } catch (error) {
      console.error('Search error:', error);
      throw error;
    }
  }

  /**
   * Process query - spell correction, synonym expansion, normalization
   */
  async processQuery(query) {
    if (!query || typeof query !== 'string') {
      return {
        original: '',
        corrected: '',
        terms: [],
        expandedTerms: []
      };
    }

    const original = query.trim();
    
    // Normalize: lowercase, remove special chars
    let normalized = original.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    // Spell correction (simple)
    const corrected = await this.spellCorrect(normalized);

    // Tokenize
    const terms = this.tokenize(corrected);

    // Synonym expansion
    const expandedTerms = await Synonym.expandQuery(corrected);

    // Stemming (simple)
    const stemmedTerms = terms.map(t => this.stem(t));

    return {
      original,
      corrected,
      terms: stemmedTerms,
      expandedTerms: expandedTerms.map(t => this.stem(t))
    };
  }

  /**
   * Hybrid search: BM25 + vector similarity
   */
  async hybridSearch(products, processedQuery) {
    // 1. Calculate BM25 scores
    const bm25Scores = this.calculateBM25(products, processedQuery);

    // 2. Calculate vector similarity scores (if query has semantic meaning)
    let vectorScores = new Map();
    if (processedQuery.terms.length > 0) {
      try {
        vectorScores = await this.calculateVectorSimilarity(
          products,
          processedQuery.original
        );
      } catch (error) {
        console.error('Vector search failed, using keyword only:', error);
      }
    }

    // 3. Combine scores
    const scoredProducts = products.map(product => {
      const bm25Score = bm25Scores.get(product._id.toString()) || 0;
      const vectorScore = vectorScores.get(product._id.toString()) || 0;
      
      const hybridScore = 
        (this.keywordWeight * bm25Score) + 
        (this.vectorWeight * vectorScore);

      return {
        ...product,
        _scores: {
          bm25: bm25Score,
          vector: vectorScore,
          hybrid: hybridScore,
          final: hybridScore
        }
      };
    });

    // Filter out zero scores
    return scoredProducts
      .filter(p => p._scores.final > 0)
      .sort((a, b) => b._scores.final - a._scores.final);
  }

  /**
   * Calculate BM25 scores
   */
  calculateBM25(products, processedQuery) {
    const scores = new Map();
    const avgDocLength = this.calculateAvgDocLength(products);
    const N = products.length;

    // Calculate IDF for each term
    const idf = new Map();
    processedQuery.expandedTerms.forEach(term => {
      const df = products.filter(p => 
        this.getDocumentText(p).includes(term)
      ).length;
      idf.set(term, Math.log((N - df + 0.5) / (df + 0.5) + 1));
    });

    // Calculate BM25 for each product
    products.forEach(product => {
      const docText = this.getDocumentText(product);
      const docLength = docText.split(/\s+/).length;
      
      let score = 0;
      processedQuery.expandedTerms.forEach(term => {
        const tf = (docText.match(new RegExp(term, 'g')) || []).length;
        const idfScore = idf.get(term) || 0;
        
        const numerator = tf * (this.k1 + 1);
        const denominator = tf + this.k1 * (1 - this.b + this.b * (docLength / avgDocLength));
        
        score += idfScore * (numerator / denominator);
      });

      scores.set(product._id.toString(), score);
    });

    return scores;
  }

  /**
   * Calculate vector similarity scores
   */
  async calculateVectorSimilarity(products, query) {
    const scores = new Map();

    try {
      // Generate query embedding
      const queryEmbedding = await embeddingService.generateEmbedding(query);

      // Get product vectors
      const productIds = products.map(p => p._id);
      const productVectors = await ProductVector.find({
        productId: { $in: productIds }
      }).lean();

      // Calculate cosine similarity
      productVectors.forEach(pv => {
        const similarity = this.cosineSimilarity(queryEmbedding, pv.embedding);
        scores.set(pv.productId.toString(), similarity);
      });
    } catch (error) {
      console.error('Vector similarity calculation failed:', error);
    }

    return scores;
  }

  /**
   * Build MongoDB query from filters
   */
  buildDBQuery(filters) {
    const query = { isActive: true };

    if (filters.category && filters.category !== 'all') {
      query.category = new RegExp(filters.category, 'i');
    }

    if (filters.brand && filters.brand !== 'all') {
      query.brand = new RegExp(filters.brand, 'i');
    }

    if (filters.gender && filters.gender !== 'all') {
      query.$or = [
        { gender: new RegExp(filters.gender, 'i') },
        { gender: 'unisex' }
      ];
    }

    if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
      query.price = {};
      if (filters.minPrice !== undefined) query.price.$gte = Number(filters.minPrice);
      if (filters.maxPrice !== undefined) query.price.$lte = Number(filters.maxPrice);
    }

    if (filters.inStock) {
      query.stockQuantity = { $gt: 0 };
    }

    if (filters.minRating) {
      query.averageRating = { $gte: Number(filters.minRating) };
    }

    return query;
  }

  /**
   * Apply client-side filters (arrays)
   */
  applyFilters(products, filters) {
    let results = [...products];

    if (filters.sizes && filters.sizes.length > 0) {
      results = results.filter(p => 
        p.sizes?.some(size => filters.sizes.includes(size))
      );
    }

    if (filters.colors && filters.colors.length > 0) {
      results = results.filter(p => 
        p.colors?.some(color => filters.colors.includes(color))
      );
    }

    if (filters.materials && filters.materials.length > 0) {
      results = results.filter(p => 
        p.material?.some(mat => filters.materials.includes(mat))
      );
    }

    if (filters.tags && filters.tags.length > 0) {
      results = results.filter(p => 
        p.tags?.some(tag => filters.tags.includes(tag))
      );
    }

    return results;
  }

  /**
   * Get personalization scores based on user history
   */
  async getPersonalizationScores(products, userId, deviceId) {
    const scores = new Map();

    if (!userId && !deviceId) {
      return scores;
    }

    try {
      // Get user history
      const history = await UserEvent.getUserHistory(
        { userId, deviceId },
        200
      );

      // Calculate scores based on interactions
      const productInteractions = new Map();
      
      history.forEach(event => {
        if (!event.productId) return;
        
        const pid = event.productId._id.toString();
        const current = productInteractions.get(pid) || { score: 0, category: event.productId.category };
        
        // Weight different event types
        switch (event.eventType) {
          case 'purchase':
            current.score += 10;
            break;
          case 'add_to_cart':
            current.score += 5;
            break;
          case 'click':
            current.score += 2;
            break;
          case 'view':
            current.score += 1;
            break;
        }
        
        productInteractions.set(pid, current);
      });

      // Boost products in same categories
      products.forEach(product => {
        const pid = product._id.toString();
        let score = 0;

        // Direct interaction
        if (productInteractions.has(pid)) {
          score += productInteractions.get(pid).score * 0.5;
        }

        // Category affinity
        const categoryScore = Array.from(productInteractions.values())
          .filter(i => i.category === product.category)
          .reduce((sum, i) => sum + i.score, 0);
        score += categoryScore * 0.1;

        scores.set(pid, score);
      });
    } catch (error) {
      console.error('Personalization scoring failed:', error);
    }

    return scores;
  }

  /**
   * Apply personalization boost to results
   */
  applyPersonalization(products, personalizedScores) {
    if (personalizedScores.size === 0) {
      return products;
    }

    return products.map(product => {
      const pid = product._id.toString();
      const personalizedScore = personalizedScores.get(pid) || 0;
      
      // Boost final score by personalization (10% weight)
      const currentScore = product._scores?.final || 0;
      const boostedScore = currentScore + (personalizedScore * 0.1);

      return {
        ...product,
        _scores: {
          ...(product._scores || {}),
          personalized: personalizedScore,
          final: boostedScore
        }
      };
    });
  }

  /**
   * Sort results
   */
  sortResults(products, sortBy) {
    const sorted = [...products];

    switch (sortBy) {
      case 'relevance':
        return sorted.sort((a, b) => 
          (b._scores?.final || 0) - (a._scores?.final || 0)
        );
      
      case 'price_asc':
        return sorted.sort((a, b) => a.price - b.price);
      
      case 'price_desc':
        return sorted.sort((a, b) => b.price - a.price);
      
      case 'newest':
        return sorted.sort((a, b) => 
          new Date(b.createdAt) - new Date(a.createdAt)
        );
      
      case 'rating':
        return sorted.sort((a, b) => 
          (b.averageRating || 0) - (a.averageRating || 0)
        );
      
      case 'popular':
        return sorted.sort((a, b) => 
          (b.soldCount || 0) - (a.soldCount || 0)
        );
      
      default:
        return sorted;
    }
  }

  /**
   * Paginate results
   */
  paginate(results, page, limit) {
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    return results.slice(startIndex, endIndex);
  }

  /**
   * Calculate facets for filtering
   */
  calculateFacets(products, activeFilters) {
    const facets = {
      categories: new Map(),
      brands: new Map(),
      colors: new Map(),
      sizes: new Map(),
      materials: new Map(),
      priceRanges: {
        '0-10000': 0,
        '10000-25000': 0,
        '25000-50000': 0,
        '50000-100000': 0,
        '100000+': 0
      },
      ratings: {
        '4+': 0,
        '3+': 0,
        '2+': 0,
        '1+': 0
      },
      availability: {
        inStock: 0,
        outOfStock: 0
      }
    };

    products.forEach(product => {
      // Categories
      if (product.category) {
        facets.categories.set(
          product.category,
          (facets.categories.get(product.category) || 0) + 1
        );
      }

      // Brands
      if (product.brand) {
        facets.brands.set(
          product.brand,
          (facets.brands.get(product.brand) || 0) + 1
        );
      }

      // Colors
      product.colors?.forEach(color => {
        facets.colors.set(color, (facets.colors.get(color) || 0) + 1);
      });

      // Sizes
      product.sizes?.forEach(size => {
        facets.sizes.set(size, (facets.sizes.get(size) || 0) + 1);
      });

      // Materials
      product.material?.forEach(mat => {
        facets.materials.set(mat, (facets.materials.get(mat) || 0) + 1);
      });

      // Price ranges
      const price = product.price;
      if (price < 10000) facets.priceRanges['0-10000']++;
      else if (price < 25000) facets.priceRanges['10000-25000']++;
      else if (price < 50000) facets.priceRanges['25000-50000']++;
      else if (price < 100000) facets.priceRanges['50000-100000']++;
      else facets.priceRanges['100000+']++;

      // Ratings
      const rating = product.averageRating || 0;
      if (rating >= 4) facets.ratings['4+']++;
      if (rating >= 3) facets.ratings['3+']++;
      if (rating >= 2) facets.ratings['2+']++;
      if (rating >= 1) facets.ratings['1+']++;

      // Availability
      if (product.stockQuantity > 0) {
        facets.availability.inStock++;
      } else {
        facets.availability.outOfStock++;
      }
    });

    // Convert Maps to arrays
    return {
      categories: Array.from(facets.categories.entries())
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count),
      brands: Array.from(facets.brands.entries())
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count),
      colors: Array.from(facets.colors.entries())
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count),
      sizes: Array.from(facets.sizes.entries())
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count),
      materials: Array.from(facets.materials.entries())
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count),
      priceRanges: facets.priceRanges,
      ratings: facets.ratings,
      availability: facets.availability
    };
  }

  /**
   * Helper methods
   */
  
  getDocumentText(product) {
    return [
      product.name,
      product.description,
      product.category,
      product.brand,
      ...(product.tags || []),
      ...(product.colors || []),
      ...(product.material || [])
    ].filter(Boolean).join(' ').toLowerCase();
  }

  calculateAvgDocLength(products) {
    const totalLength = products.reduce((sum, p) => {
      return sum + this.getDocumentText(p).split(/\s+/).length;
    }, 0);
    return totalLength / products.length;
  }

  tokenize(text) {
    return text.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(t => t.length > 2);
  }

  stem(word) {
    // Simple stemming (remove common suffixes)
    return word
      .replace(/ing$/, '')
      .replace(/ed$/, '')
      .replace(/s$/, '')
      .replace(/es$/, '');
  }

  async spellCorrect(text) {
    // Simple spell correction - can be enhanced with a dictionary
    // For now, just return normalized text
    return text;
  }

  cosineSimilarity(vecA, vecB) {
    if (vecA.length !== vecB.length) return 0;
    
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    
    for (let i = 0; i < vecA.length; i++) {
      dotProduct += vecA[i] * vecB[i];
      normA += vecA[i] * vecA[i];
      normB += vecB[i] * vecB[i];
    }
    
    normA = Math.sqrt(normA);
    normB = Math.sqrt(normB);
    
    if (normA === 0 || normB === 0) return 0;
    
    return dotProduct / (normA * normB);
  }

  emptyResult(query, filters, sortBy) {
    return {
      success: true,
      data: [],
      pagination: {
        total: 0,
        page: 1,
        limit: 20,
        totalPages: 0,
        hasMore: false
      },
      facets: {},
      query,
      filters,
      sortBy,
      performance: {
        latency: 0,
        totalProducts: 0,
        filteredProducts: 0,
        returnedProducts: 0
      }
    };
  }
}

module.exports = new SearchEngineV2();
