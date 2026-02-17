/**
 * Semantic Search & Recommendation Engine
 * Uses TF-IDF and cosine similarity for intelligent product matching
 */

class SemanticSearchEngine {
  constructor() {
    this.productVectors = new Map();
    this.userProfile = {
      viewedProducts: [],
      searchHistory: [],
      preferredCategories: {},
      preferredColors: {},
      priceRange: { min: 0, max: Infinity },
      lastInteraction: null
    };
  }

  /**
   * Build TF-IDF vectors for products
   */
  buildProductVectors(products) {
    const documents = products.map(p => this.getProductText(p));
    const vocabulary = this.buildVocabulary(documents);
    const idf = this.calculateIDF(documents, vocabulary);

    products.forEach((product, idx) => {
      const vector = this.calculateTFIDF(documents[idx], vocabulary, idf);
      this.productVectors.set(product._id || product.id, {
        vector,
        product
      });
    });

    console.log('✅ Semantic vectors built for', products.length, 'products');
  }

  /**
   * Get searchable text from product
   */
  getProductText(product) {
    return `
      ${product.name} 
      ${product.description} 
      ${product.category} 
      ${product.subcategory || ''} 
      ${product.tags?.join(' ') || ''} 
      ${product.colors?.join(' ') || ''}
      ${product.material?.join(' ') || ''}
    `.toLowerCase();
  }

  /**
   * Build vocabulary from documents
   */
  buildVocabulary(documents) {
    const words = new Set();
    documents.forEach(doc => {
      const tokens = this.tokenize(doc);
      tokens.forEach(token => words.add(token));
    });
    return Array.from(words);
  }

  /**
   * Tokenize text
   */
  tokenize(text) {
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 2 && !this.isStopWord(word));
  }

  /**
   * Check if word is a stop word
   */
  isStopWord(word) {
    const stopWords = ['the', 'and', 'for', 'with', 'from', 'this', 'that', 'are', 'was', 'were'];
    return stopWords.includes(word);
  }

  /**
   * Calculate IDF (Inverse Document Frequency)
   */
  calculateIDF(documents, vocabulary) {
    const idf = {};
    const N = documents.length;

    vocabulary.forEach(term => {
      const df = documents.filter(doc => doc.includes(term)).length;
      idf[term] = Math.log(N / (df + 1));
    });

    return idf;
  }

  /**
   * Calculate TF-IDF vector for a document
   */
  calculateTFIDF(document, vocabulary, idf) {
    const tokens = this.tokenize(document);
    const tf = {};
    
    // Calculate term frequency
    tokens.forEach(token => {
      tf[token] = (tf[token] || 0) + 1;
    });

    // Calculate TF-IDF
    const vector = {};
    vocabulary.forEach(term => {
      const termFreq = tf[term] || 0;
      vector[term] = termFreq * (idf[term] || 0);
    });

    return vector;
  }

  /**
   * Semantic search using cosine similarity
   */
  semanticSearch(query, products, topK = 10) {
    if (this.productVectors.size === 0) {
      this.buildProductVectors(products);
    }

    const queryVector = this.calculateTFIDF(
      query.toLowerCase(),
      Array.from(this.productVectors.values())[0]?.vector ? 
        Object.keys(Array.from(this.productVectors.values())[0].vector) : [],
      {}
    );

    const similarities = [];
    this.productVectors.forEach((data, productId) => {
      const similarity = this.cosineSimilarity(queryVector, data.vector);
      similarities.push({
        product: data.product,
        score: similarity
      });
    });

    // Sort by similarity score
    similarities.sort((a, b) => b.score - a.score);

    console.log('🔍 Semantic search results:', similarities.slice(0, 5).map(s => ({
      name: s.product.name,
      score: s.score.toFixed(3)
    })));

    return similarities.slice(0, topK).map(s => s.product);
  }

  /**
   * Calculate cosine similarity between two vectors
   */
  cosineSimilarity(vec1, vec2) {
    let dotProduct = 0;
    let mag1 = 0;
    let mag2 = 0;

    const allKeys = new Set([...Object.keys(vec1), ...Object.keys(vec2)]);

    allKeys.forEach(key => {
      const v1 = vec1[key] || 0;
      const v2 = vec2[key] || 0;
      dotProduct += v1 * v2;
      mag1 += v1 * v1;
      mag2 += v2 * v2;
    });

    if (mag1 === 0 || mag2 === 0) return 0;
    return dotProduct / (Math.sqrt(mag1) * Math.sqrt(mag2));
  }

  /**
   * Collaborative filtering recommendations
   */
  getRecommendations(products, count = 5) {
    // Update user profile
    this.updateUserProfile();

    // Score products based on user preferences
    const scoredProducts = products.map(product => ({
      product,
      score: this.calculateRecommendationScore(product)
    }));

    // Sort by score
    scoredProducts.sort((a, b) => b.score - a.score);

    console.log('🎯 Personalized recommendations:', scoredProducts.slice(0, 5).map(s => ({
      name: s.product.name,
      score: s.score.toFixed(2)
    })));

    return scoredProducts.slice(0, count).map(s => s.product);
  }

  /**
   * Calculate recommendation score for a product
   */
  calculateRecommendationScore(product) {
    let score = 0;

    // Category preference (40%)
    const categoryScore = this.userProfile.preferredCategories[product.category] || 0;
    score += categoryScore * 0.4;

    // Color preference (20%)
    if (product.colors) {
      const colorScore = product.colors.reduce((sum, color) => 
        sum + (this.userProfile.preferredColors[color.toLowerCase()] || 0), 0
      ) / (product.colors.length || 1);
      score += colorScore * 0.2;
    }

    // Price preference (20%)
    const priceScore = this.calculatePriceScore(product.price);
    score += priceScore * 0.2;

    // Popularity (10%)
    const popularityScore = (product.totalSales || 0) / 100;
    score += Math.min(popularityScore, 1) * 0.1;

    // Rating (10%)
    const ratingScore = (product.averageRating || 0) / 5;
    score += ratingScore * 0.1;

    return score;
  }

  /**
   * Calculate price preference score
   */
  calculatePriceScore(price) {
    const { min, max } = this.userProfile.priceRange;
    if (price < min || price > max) return 0;
    
    const range = max - min;
    if (range === 0) return 1;
    
    // Prefer middle of price range
    const middle = (min + max) / 2;
    const distance = Math.abs(price - middle);
    return 1 - (distance / (range / 2));
  }

  /**
   * Find similar products using content-based filtering
   */
  findSimilarProducts(productId, products, count = 5) {
    if (this.productVectors.size === 0) {
      this.buildProductVectors(products);
    }

    const targetData = this.productVectors.get(productId);
    if (!targetData) return [];

    const similarities = [];
    this.productVectors.forEach((data, id) => {
      if (id === productId) return; // Skip same product
      
      const similarity = this.cosineSimilarity(targetData.vector, data.vector);
      similarities.push({
        product: data.product,
        score: similarity
      });
    });

    similarities.sort((a, b) => b.score - a.score);

    console.log('🔗 Similar products:', similarities.slice(0, 3).map(s => ({
      name: s.product.name,
      score: s.score.toFixed(3)
    })));

    return similarities.slice(0, count).map(s => s.product);
  }

  /**
   * Update user profile based on interactions
   */
  updateUserProfile() {
    // Update category preferences
    this.userProfile.viewedProducts.forEach(product => {
      const category = product.category;
      this.userProfile.preferredCategories[category] = 
        (this.userProfile.preferredCategories[category] || 0) + 1;
    });

    // Normalize category scores
    const maxCategoryCount = Math.max(...Object.values(this.userProfile.preferredCategories), 1);
    Object.keys(this.userProfile.preferredCategories).forEach(cat => {
      this.userProfile.preferredCategories[cat] /= maxCategoryCount;
    });

    // Update color preferences
    this.userProfile.viewedProducts.forEach(product => {
      if (product.colors) {
        product.colors.forEach(color => {
          const colorLower = color.toLowerCase();
          this.userProfile.preferredColors[colorLower] = 
            (this.userProfile.preferredColors[colorLower] || 0) + 1;
        });
      }
    });

    // Normalize color scores
    const maxColorCount = Math.max(...Object.values(this.userProfile.preferredColors), 1);
    Object.keys(this.userProfile.preferredColors).forEach(color => {
      this.userProfile.preferredColors[color] /= maxColorCount;
    });

    // Update price range
    if (this.userProfile.viewedProducts.length > 0) {
      const prices = this.userProfile.viewedProducts.map(p => p.price);
      this.userProfile.priceRange = {
        min: Math.min(...prices) * 0.8,
        max: Math.max(...prices) * 1.2
      };
    }
  }

  /**
   * Track user interaction
   */
  trackInteraction(type, data) {
    this.userProfile.lastInteraction = new Date();

    switch (type) {
      case 'view':
        this.userProfile.viewedProducts.push(data.product);
        // Keep only last 20 views
        if (this.userProfile.viewedProducts.length > 20) {
          this.userProfile.viewedProducts.shift();
        }
        break;
      
      case 'search':
        this.userProfile.searchHistory.push(data.query);
        // Keep only last 10 searches
        if (this.userProfile.searchHistory.length > 10) {
          this.userProfile.searchHistory.shift();
        }
        break;
    }

    console.log('📊 User profile updated:', {
      views: this.userProfile.viewedProducts.length,
      searches: this.userProfile.searchHistory.length,
      categories: Object.keys(this.userProfile.preferredCategories).length
    });
  }

  /**
   * Get personalized search results
   */
  personalizedSearch(query, products, topK = 10) {
    // Semantic search
    const semanticResults = this.semanticSearch(query, products, topK * 2);

    // Re-rank based on user preferences
    const reranked = semanticResults.map(product => ({
      product,
      score: this.calculateRecommendationScore(product)
    }));

    reranked.sort((a, b) => b.score - a.score);

    return reranked.slice(0, topK).map(r => r.product);
  }

  /**
   * Smart query expansion
   */
  expandQuery(query) {
    const synonyms = {
      'cheap': ['affordable', 'budget', 'inexpensive', 'low price'],
      'expensive': ['premium', 'luxury', 'high end', 'costly'],
      'new': ['latest', 'recent', 'fresh', 'just in'],
      'popular': ['trending', 'bestseller', 'hot', 'top'],
      'jacket': ['blazer', 'coat', 'outerwear'],
      'dress': ['gown', 'frock'],
      'shoes': ['footwear', 'sneakers', 'boots']
    };

    let expandedQuery = query;
    Object.keys(synonyms).forEach(word => {
      if (query.toLowerCase().includes(word)) {
        expandedQuery += ' ' + synonyms[word].join(' ');
      }
    });

    return expandedQuery;
  }

  /**
   * Get user insights
   */
  getUserInsights() {
    return {
      topCategories: Object.entries(this.userProfile.preferredCategories)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([cat, score]) => ({ category: cat, score: score.toFixed(2) })),
      topColors: Object.entries(this.userProfile.preferredColors)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([color, score]) => ({ color, score: score.toFixed(2) })),
      priceRange: this.userProfile.priceRange,
      totalViews: this.userProfile.viewedProducts.length,
      totalSearches: this.userProfile.searchHistory.length
    };
  }
}

// Create singleton instance
const semanticEngine = new SemanticSearchEngine();

export default semanticEngine;
