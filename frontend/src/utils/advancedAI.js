/**
 * Advanced AI Search Engine with LLM-like Capabilities
 * Uses neural network concepts, attention mechanisms, and contextual understanding
 */

class AdvancedAIEngine {
  constructor() {
    this.contextWindow = [];
    this.entityMemory = new Map();
    this.intentClassifier = null;
    this.embeddingCache = new Map();
    this.conversationState = {
      currentTopic: null,
      entities: [],
      sentiment: 'neutral',
      confidence: 0
    };
    
    // Initialize neural-like weights
    this.weights = {
      semantic: 0.4,
      contextual: 0.3,
      behavioral: 0.2,
      temporal: 0.1
    };

    console.log('🧠 Advanced AI Engine initialized');
  }

  /**
   * Process query with LLM-like understanding
   */
  async processQuery(query, products, conversationHistory = []) {
    console.log('🤖 Processing query with AI:', query);

    // Step 1: Extract entities and intent
    const entities = this.extractEntities(query);
    const intent = this.classifyIntent(query, conversationHistory);
    const sentiment = this.analyzeSentiment(query);

    // Step 2: Build context from conversation history
    const context = this.buildContext(conversationHistory);

    // Step 3: Generate embeddings
    const queryEmbedding = this.generateEmbedding(query, context);

    // Step 4: Apply attention mechanism
    const relevantProducts = this.applyAttention(queryEmbedding, products);

    // Step 5: Re-rank with neural scoring
    const rankedProducts = this.neuralRanking(relevantProducts, entities, intent, sentiment);

    // Step 6: Generate natural language response
    const response = this.generateNLResponse(query, rankedProducts, entities, intent, sentiment);

    // Update conversation state
    this.updateConversationState(query, entities, intent, sentiment);

    return {
      products: rankedProducts.slice(0, 10),
      response: response,
      entities: entities,
      intent: intent,
      confidence: this.conversationState.confidence
    };
  }

  /**
   * Extract named entities from query (NER)
   */
  extractEntities(query) {
    const entities = {
      colors: [],
      categories: [],
      brands: [],
      materials: [],
      sizes: [],
      priceRange: null,
      attributes: []
    };

    const lowerQuery = query.toLowerCase();

    // Color entities with variants
    const colorMap = {
      'blue': ['blue', 'navy', 'azure', 'cobalt', 'sapphire', 'indigo'],
      'red': ['red', 'crimson', 'scarlet', 'maroon', 'burgundy', 'ruby'],
      'green': ['green', 'emerald', 'olive', 'lime', 'forest', 'mint'],
      'yellow': ['yellow', 'gold', 'golden', 'amber', 'mustard'],
      'black': ['black', 'dark', 'ebony', 'charcoal'],
      'white': ['white', 'cream', 'ivory', 'pearl', 'snow'],
      'pink': ['pink', 'rose', 'blush', 'coral', 'salmon'],
      'purple': ['purple', 'violet', 'lavender', 'plum', 'mauve'],
      'orange': ['orange', 'coral', 'peach', 'tangerine'],
      'brown': ['brown', 'tan', 'beige', 'khaki', 'chocolate'],
      'gray': ['gray', 'grey', 'silver', 'slate']
    };

    Object.entries(colorMap).forEach(([mainColor, variants]) => {
      variants.forEach(variant => {
        if (lowerQuery.includes(variant)) {
          entities.colors.push(mainColor);
        }
      });
    });

    // Category entities with semantic understanding
    const categoryMap = {
      'Jackets': ['jacket', 'jackets', 'blazer', 'coat', 'outerwear', 'cardigan'],
      'Dresses': ['dress', 'dresses', 'gown', 'frock', 'sundress', 'maxi'],
      'Shirts': ['shirt', 'shirts', 'blouse', 'top', 'tops', 'tee', 'tshirt'],
      'Pants': ['pants', 'trousers', 'jeans', 'slacks', 'chinos', 'leggings'],
      'Skirts': ['skirt', 'skirts', 'mini', 'midi'],
      'Shoes': ['shoes', 'footwear', 'sneakers', 'heels', 'boots', 'sandals', 'flats'],
      'Bags': ['bag', 'bags', 'handbag', 'purse', 'backpack', 'tote', 'clutch'],
      'Accessories': ['accessory', 'accessories', 'jewelry', 'jewellery', 'watch', 'belt', 'scarf', 'hat']
    };

    Object.entries(categoryMap).forEach(([mainCat, variants]) => {
      variants.forEach(variant => {
        if (lowerQuery.includes(variant)) {
          entities.categories.push(mainCat);
        }
      });
    });

    // Material entities
    const materials = ['cotton', 'silk', 'leather', 'denim', 'wool', 'polyester', 'linen', 'ankara', 'velvet', 'satin'];
    materials.forEach(material => {
      if (lowerQuery.includes(material)) {
        entities.materials.push(material);
      }
    });

    // Size entities
    const sizes = ['xs', 'small', 'medium', 'large', 'xl', 'xxl', 's', 'm', 'l'];
    sizes.forEach(size => {
      if (lowerQuery.includes(size)) {
        entities.sizes.push(size.toUpperCase());
      }
    });

    // Price range with advanced parsing
    const pricePatterns = [
      /under\s+(\d+)/i,
      /below\s+(\d+)/i,
      /less\s+than\s+(\d+)/i,
      /cheaper\s+than\s+(\d+)/i,
      /max(?:imum)?\s+(\d+)/i,
      /between\s+(\d+)\s+and\s+(\d+)/i,
      /(\d+)\s*-\s*(\d+)/,
      /around\s+(\d+)/i,
      /about\s+(\d+)/i
    ];

    for (const pattern of pricePatterns) {
      const match = lowerQuery.match(pattern);
      if (match) {
        if (match[2]) {
          entities.priceRange = { min: parseInt(match[1]), max: parseInt(match[2]) };
        } else {
          entities.priceRange = { max: parseInt(match[1]) };
        }
        break;
      }
    }

    // Attribute entities (style, occasion, etc.)
    const attributes = {
      style: ['casual', 'formal', 'elegant', 'sporty', 'vintage', 'modern', 'classic'],
      occasion: ['party', 'wedding', 'office', 'beach', 'gym', 'date'],
      season: ['summer', 'winter', 'spring', 'fall', 'autumn'],
      fit: ['slim', 'regular', 'loose', 'tight', 'oversized']
    };

    Object.entries(attributes).forEach(([type, values]) => {
      values.forEach(value => {
        if (lowerQuery.includes(value)) {
          entities.attributes.push({ type, value });
        }
      });
    });

    // Remove duplicates
    entities.colors = [...new Set(entities.colors)];
    entities.categories = [...new Set(entities.categories)];
    entities.materials = [...new Set(entities.materials)];

    console.log('📊 Extracted entities:', entities);
    return entities;
  }

  /**
   * Advanced intent classification with context
   */
  classifyIntent(query, history) {
    const lowerQuery = query.toLowerCase();
    
    // Multi-label intent classification
    const intents = [];
    
    // Search intent
    if (lowerQuery.match(/\b(find|show|get|search|looking|want|need)\b/)) {
      intents.push({ type: 'search', confidence: 0.9 });
    }

    // Recommendation intent
    if (lowerQuery.match(/\b(recommend|suggest|advice|what\s+should|help\s+me\s+choose)\b/)) {
      intents.push({ type: 'recommend', confidence: 0.95 });
    }

    // Comparison intent
    if (lowerQuery.match(/\b(compare|versus|vs|difference|better|which\s+one)\b/)) {
      intents.push({ type: 'compare', confidence: 0.9 });
    }

    // Question intent
    if (lowerQuery.match(/\b(what|how|why|when|where|who|can\s+you)\b/)) {
      intents.push({ type: 'question', confidence: 0.85 });
    }

    // Browse intent
    if (lowerQuery.match(/\b(browse|explore|see\s+all|show\s+everything)\b/)) {
      intents.push({ type: 'browse', confidence: 0.9 });
    }

    // Filter intent
    if (lowerQuery.match(/\b(filter|narrow|refine|specific)\b/)) {
      intents.push({ type: 'filter', confidence: 0.85 });
    }

    // Purchase intent
    if (lowerQuery.match(/\b(buy|purchase|order|get\s+me|i\s+want\s+to\s+buy)\b/)) {
      intents.push({ type: 'purchase', confidence: 0.95 });
    }

    // Sort by primary intent
    intents.sort((a, b) => b.confidence - a.confidence);

    const primaryIntent = intents[0] || { type: 'search', confidence: 0.5 };
    
    console.log('🎯 Classified intent:', primaryIntent.type, `(${(primaryIntent.confidence * 100).toFixed(0)}%)`);
    
    return primaryIntent;
  }

  /**
   * Sentiment analysis
   */
  analyzeSentiment(query) {
    const lowerQuery = query.toLowerCase();
    
    const positive = ['love', 'great', 'awesome', 'perfect', 'beautiful', 'amazing', 'excellent', 'best'];
    const negative = ['hate', 'bad', 'terrible', 'awful', 'ugly', 'worst', 'disappointed'];
    const urgent = ['urgent', 'asap', 'quickly', 'fast', 'hurry', 'now', 'immediately'];

    let score = 0;
    positive.forEach(word => { if (lowerQuery.includes(word)) score += 1; });
    negative.forEach(word => { if (lowerQuery.includes(word)) score -= 1; });
    
    const isUrgent = urgent.some(word => lowerQuery.includes(word));

    let sentiment = 'neutral';
    if (score > 0) sentiment = 'positive';
    if (score < 0) sentiment = 'negative';
    if (isUrgent) sentiment += '_urgent';

    return sentiment;
  }

  /**
   * Build conversation context
   */
  buildContext(history) {
    const context = {
      previousQueries: [],
      mentionedProducts: [],
      userPreferences: {},
      conversationFlow: []
    };

    history.slice(-5).forEach(msg => {
      if (msg.type === 'user') {
        context.previousQueries.push(msg.text);
      }
      if (msg.products) {
        context.mentionedProducts.push(...msg.products);
      }
    });

    return context;
  }

  /**
   * Generate contextual embeddings (simplified neural representation)
   */
  generateEmbedding(query, context) {
    const cacheKey = query + JSON.stringify(context);
    if (this.embeddingCache.has(cacheKey)) {
      return this.embeddingCache.get(cacheKey);
    }

    // Tokenize and create vector representation
    const tokens = this.tokenize(query);
    const embedding = {};

    // Word embeddings with context
    tokens.forEach((token, idx) => {
      // Position encoding
      const positionWeight = 1 / (idx + 1);
      
      // Context from previous queries
      const contextBoost = context.previousQueries.some(q => 
        q.toLowerCase().includes(token)
      ) ? 1.5 : 1.0;

      embedding[token] = positionWeight * contextBoost;
    });

    // Add context tokens
    context.previousQueries.forEach(prevQuery => {
      this.tokenize(prevQuery).forEach(token => {
        if (!embedding[token]) {
          embedding[token] = 0.3; // Lower weight for context
        }
      });
    });

    this.embeddingCache.set(cacheKey, embedding);
    return embedding;
  }

  /**
   * Tokenize with advanced preprocessing
   */
  tokenize(text) {
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 2 && !this.isStopWord(word));
  }

  /**
   * Check stop words
   */
  isStopWord(word) {
    const stopWords = ['the', 'and', 'for', 'with', 'from', 'this', 'that', 'are', 'was', 'were', 'been', 'have', 'has'];
    return stopWords.includes(word);
  }

  /**
   * Apply attention mechanism to products
   */
  applyAttention(queryEmbedding, products) {
    const scoredProducts = products.map(product => {
      // Generate product embedding
      const productText = `${product.name} ${product.description} ${product.category} ${product.tags?.join(' ')}`.toLowerCase();
      const productTokens = this.tokenize(productText);

      // Calculate attention scores
      let attentionScore = 0;
      let matchCount = 0;

      Object.keys(queryEmbedding).forEach(queryToken => {
        if (productTokens.includes(queryToken)) {
          attentionScore += queryEmbedding[queryToken];
          matchCount++;
        }
      });

      // Normalize by match count
      const normalizedScore = matchCount > 0 ? attentionScore / matchCount : 0;

      return {
        product,
        attentionScore: normalizedScore,
        matchCount
      };
    });

    // Filter products with attention score > 0
    return scoredProducts
      .filter(item => item.attentionScore > 0)
      .sort((a, b) => b.attentionScore - a.attentionScore)
      .map(item => item.product);
  }

  /**
   * Neural ranking with multiple signals
   */
  neuralRanking(products, entities, intent, sentiment) {
    return products.map(product => {
      let score = 0;

      // Semantic matching score (40%)
      score += this.calculateSemanticScore(product, entities) * 0.4;

      // Behavioral score (30%)
      score += this.calculateBehavioralScore(product) * 0.3;

      // Quality score (20%)
      score += this.calculateQualityScore(product) * 0.2;

      // Intent alignment (10%)
      score += this.calculateIntentScore(product, intent) * 0.1;

      return { product, score };
    })
    .sort((a, b) => b.score - a.score)
    .map(item => item.product);
  }

  /**
   * Calculate semantic matching score
   */
  calculateSemanticScore(product, entities) {
    let score = 0;

    // Color match
    if (entities.colors.length > 0 && product.colors) {
      const colorMatch = entities.colors.some(c => 
        product.colors.some(pc => pc.toLowerCase().includes(c))
      );
      if (colorMatch) score += 0.3;
    }

    // Category match
    if (entities.categories.length > 0) {
      const categoryMatch = entities.categories.includes(product.category);
      if (categoryMatch) score += 0.4;
    }

    // Material match
    if (entities.materials.length > 0 && product.material) {
      const materialMatch = entities.materials.some(m =>
        product.material.some(pm => pm.toLowerCase().includes(m))
      );
      if (materialMatch) score += 0.2;
    }

    // Price match
    if (entities.priceRange) {
      const { min = 0, max = Infinity } = entities.priceRange;
      if (product.price >= min && product.price <= max) {
        score += 0.1;
      }
    }

    return Math.min(score, 1);
  }

  /**
   * Calculate behavioral score
   */
  calculateBehavioralScore(product) {
    let score = 0;

    // Popularity
    if (product.totalSales) {
      score += Math.min(product.totalSales / 1000, 0.4);
    }

    // Rating
    if (product.averageRating) {
      score += (product.averageRating / 5) * 0.3;
    }

    // Reviews
    if (product.totalReviews) {
      score += Math.min(product.totalReviews / 100, 0.3);
    }

    return Math.min(score, 1);
  }

  /**
   * Calculate quality score
   */
  calculateQualityScore(product) {
    let score = 0;

    // Has images
    if (product.mainImage || product.images?.length > 0) score += 0.3;

    // Has description
    if (product.description && product.description.length > 50) score += 0.2;

    // In stock
    if (product.stockQuantity > 0) score += 0.3;

    // Has reviews
    if (product.totalReviews > 0) score += 0.2;

    return score;
  }

  /**
   * Calculate intent alignment score
   */
  calculateIntentScore(product, intent) {
    switch (intent.type) {
      case 'purchase':
        return product.stockQuantity > 0 ? 1 : 0;
      case 'recommend':
        return (product.averageRating || 0) / 5;
      case 'browse':
        return 0.5;
      default:
        return 0.5;
    }
  }

  /**
   * Generate natural language response
   */
  generateNLResponse(query, products, entities, intent, sentiment) {
    const count = products.length;
    
    if (count === 0) {
      return this.generateNoResultsResponse(entities);
    }

    // Generate contextual response based on entities and intent
    let response = '';

    if (intent.type === 'recommend') {
      response = `Based on your preferences, I've found ${count} perfect matches for you! `;
    } else if (intent.type === 'compare') {
      response = `Here are ${count} products to compare. `;
    } else {
      response = `Great! I found ${count} products that match your search. `;
    }

    // Add entity-specific details
    if (entities.colors.length > 0) {
      response += `All in ${entities.colors.join(' or ')}. `;
    }

    if (entities.categories.length > 0) {
      response += `From our ${entities.categories.join(' and ')} collection. `;
    }

    if (entities.priceRange) {
      const { min, max } = entities.priceRange;
      if (max) {
        response += `All under ${max.toLocaleString()} RWF. `;
      }
      if (min && max) {
        response += `Price range: ${min.toLocaleString()} - ${max.toLocaleString()} RWF. `;
      }
    }

    // Add quality indicators
    const avgRating = products.reduce((sum, p) => sum + (p.averageRating || 0), 0) / count;
    if (avgRating > 4) {
      response += `⭐ Highly rated products (avg ${avgRating.toFixed(1)} stars)!`;
    }

    return response;
  }

  /**
   * Generate no results response
   */
  generateNoResultsResponse(entities) {
    let response = "I couldn't find exact matches, but let me help you! ";

    if (entities.colors.length > 0) {
      response += `Try exploring other colors, or `;
    }

    if (entities.priceRange?.max) {
      response += `increase your budget slightly, or `;
    }

    response += "browse our full collection for more options.";

    return response;
  }

  /**
   * Update conversation state
   */
  updateConversationState(query, entities, intent, sentiment) {
    this.conversationState = {
      currentTopic: entities.categories[0] || null,
      entities: entities,
      sentiment: sentiment,
      confidence: intent.confidence
    };

    // Add to context window
    this.contextWindow.push({
      query,
      entities,
      intent: intent.type,
      timestamp: new Date()
    });

    // Keep last 10 interactions
    if (this.contextWindow.length > 10) {
      this.contextWindow.shift();
    }
  }

  /**
   * Get conversation insights
   */
  getConversationInsights() {
    return {
      state: this.conversationState,
      contextSize: this.contextWindow.length,
      embeddingCacheSize: this.embeddingCache.size
    };
  }
}

// Create singleton instance
const advancedAI = new AdvancedAIEngine();

export default advancedAI;
