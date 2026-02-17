/**
 * Intelligent AI Assistant with Learning Capabilities
 * Context-aware, learns from conversations, provides personalized responses
 */

class IntelligentAI {
  constructor() {
    // Conversation memory
    this.conversationHistory = new Map();
    this.userPreferences = new Map();
    this.productInteractions = new Map();
    
    // Learning parameters
    this.learningRate = 0.1;
    this.confidence = new Map();
    
    // Enhanced responses database
    this.responses = {
      greetings: {
        newUser: [
          "Hi there! 👋 Welcome to E-Gura Store! I'm your personal AI shopping assistant. I learn about your preferences to help you better. What brings you here today?",
          "Hello! 🌟 Great to meet you! I'm here to help you shop smarter. The more we chat, the better I understand what you like. What can I help you find?",
          "Hey! 😊 I'm excited to help you shop! I'll remember your preferences to make your experience better each time. What are you looking for?"
        ],
        returningUser: [
          "Welcome back! 😊 I remember you were interested in {category}. Found something new for you! What can I help with today?",
          "Hi again! 🎉 Based on our last chat about {interest}, I have some great recommendations. What would you like to explore?",
          "Hey! Good to see you again! 👋 I've been learning your style - {preference}. Ready to find something amazing?"
        ]
      },
      productRecommendations: {
        based_on_history: "Based on your interest in {previous_category}, I think you'll love these {current_category}! 🎯",
        similar_products: "Since you liked {product_name}, here are similar items that match your taste! ✨",
        trending: "These are trending in {category} right now, and they match your style preferences! 🔥",
        budget_aware: "I remember your budget preference around {budget} RWF. Here are perfect matches! 💰"
      },
      learning: [
        "Got it! I'm learning that you prefer {preference}. I'll remember this for next time! 🧠",
        "Thanks for letting me know! I'll keep {preference} in mind for your future recommendations. 📝",
        "Perfect! I've noted that you like {preference}. This helps me serve you better! ✅"
      ],
      empathy: {
        price_concern: "I understand budget is important. Let me find you the best value options! 💡",
        quality_seeker: "Quality matters! I'll show you our premium collection that lasts. ⭐",
        bargain_hunter: "You like great deals! Let me find products where I can negotiate the best prices for you! 🤝",
        indecisive: "No worries! Take your time. I'm here to help you explore until you find the perfect match. 😊"
      }
    };

    // Last shown products (context tracking)
    this.lastShownProducts = new Map();
    
    // Intent classification
    this.intents = {
      greeting: ['hi', 'hello', 'hey', 'greetings', 'good morning', 'good afternoon'],
      product_search: ['find', 'show', 'looking for', 'need', 'want', 'search', 'browse'],
      price_inquiry: ['price', 'cost', 'how much', 'expensive', 'cheap', 'affordable'],
      comparison: ['compare', 'difference', 'better', 'versus', 'vs', 'which one'],
      bargain: ['bargain', 'negotiate', 'discount', 'deal', 'offer', 'cheaper'],
      purchase: ['buy', 'purchase', 'pay', 'get it', 'take it', 'order', 'cart', 'checkout'],
      affirmative: ['yes', 'yeah', 'yep', 'sure', 'ok', 'okay', 'perfect', 'great', 'sounds good'],
      help: ['help', 'assist', 'support', 'how', 'what can you do'],
      feedback: ['good', 'bad', 'love', 'hate', 'like', 'dislike', 'prefer']
    };

    // Sentiment analysis keywords
    this.sentiments = {
      positive: ['good', 'great', 'excellent', 'love', 'perfect', 'amazing', 'wonderful', 'nice', 'beautiful'],
      negative: ['bad', 'poor', 'hate', 'terrible', 'awful', 'disappointed', 'expensive', 'cheap quality'],
      neutral: ['okay', 'fine', 'alright', 'maybe', 'not sure', 'thinking']
    };
  }

  /**
   * Main conversation handler with learning
   */
  async handleConversation(userId, message, context = {}) {
    console.log('🤖 Intelligent AI processing:', { userId, message });

    // Get or create user profile
    let userProfile = this.getUserProfile(userId);
    
    // Analyze message
    const intent = this.classifyIntent(message);
    const sentiment = this.analyzeSentiment(message);
    const entities = this.extractEntities(message);

    console.log('📊 Analysis:', { intent, sentiment, entities });

    // Update user profile based on interaction
    this.learnFromInteraction(userId, {
      message,
      intent,
      sentiment,
      entities,
      timestamp: new Date()
    });

    // Generate intelligent response
    const response = await this.generateResponse(userId, message, intent, sentiment, entities, context);

    // Store conversation
    this.storeConversation(userId, message, response);

    return response;
  }

  /**
   * Classify user intent
   */
  classifyIntent(message) {
    const messageLower = message.toLowerCase();
    
    // Check for combined intents (e.g., "perfect can I pay?")
    const hasPurchaseIntent = this.intents.purchase.some(kw => messageLower.includes(kw));
    const hasAffirmative = this.intents.affirmative.some(kw => messageLower.includes(kw));
    
    // If both affirmative and purchase words, it's a purchase intent
    if (hasPurchaseIntent || (hasAffirmative && (messageLower.includes('pay') || messageLower.includes('buy')))) {
      return 'purchase';
    }
    
    for (const [intent, keywords] of Object.entries(this.intents)) {
      for (const keyword of keywords) {
        if (messageLower.includes(keyword)) {
          return intent;
        }
      }
    }
    
    return 'general_query';
  }

  /**
   * Analyze sentiment
   */
  analyzeSentiment(message) {
    const messageLower = message.toLowerCase();
    let positiveCount = 0;
    let negativeCount = 0;

    this.sentiments.positive.forEach(word => {
      if (messageLower.includes(word)) positiveCount++;
    });

    this.sentiments.negative.forEach(word => {
      if (messageLower.includes(word)) negativeCount++;
    });

    if (positiveCount > negativeCount) return 'positive';
    if (negativeCount > positiveCount) return 'negative';
    return 'neutral';
  }

  /**
   * Extract entities (categories, price ranges, preferences)
   */
  extractEntities(message) {
    const entities = {
      categories: [],
      priceRange: null,
      preferences: []
    };

    const messageLower = message.toLowerCase();

    // Expanded category detection with brands and specific items
    const categories = [
      'laptop', 'phone', 'smartphone', 'tablet', 'computer', 'pc',
      'dress', 'shoes', 'bag', 'watch', 'headphones', 'earphones', 'speaker',
      'electronics', 'fashion', 'accessories', 'clothing', 'furniture',
      'tv', 'television', 'camera', 'monitor', 'keyboard', 'mouse',
      'charger', 'cable', 'case', 'cover', 'screen protector',
      // Brands
      'jbl', 'sony', 'samsung', 'apple', 'dell', 'hp', 'lenovo', 'nike', 'adidas'
    ];
    
    categories.forEach(cat => {
      if (messageLower.includes(cat)) {
        entities.categories.push(cat);
      }
    });

    // Extract product names from common patterns
    const productPatterns = [
      /(?:want|need|looking for|find|show me|search for)\s+(.+?)(?:\s|$)/i,
      /(?:i want|i need)\s+(?:a|an)?\s*(.+?)(?:\s|$)/i
    ];
    
    for (const pattern of productPatterns) {
      const match = message.match(pattern);
      if (match && match[1]) {
        const productName = match[1].trim();
        // Add as category if not already found
        if (entities.categories.length === 0) {
          entities.categories.push(productName);
        }
      }
    }

    // Price range detection
    const priceMatches = messageLower.match(/(\d+)\s*(k|thousand|rwf)?/gi);
    if (priceMatches) {
      entities.priceRange = priceMatches[0];
    }

    // Preference detection
    const preferences = ['cheap', 'expensive', 'quality', 'branded', 'original', 'new', 'used', 'premium', 'affordable', 'budget'];
    preferences.forEach(pref => {
      if (messageLower.includes(pref)) {
        entities.preferences.push(pref);
      }
    });

    return entities;
  }

  /**
   * Generate intelligent response
   */
  async generateResponse(userId, message, intent, sentiment, entities, context) {
    const userProfile = this.getUserProfile(userId);
    let response = {
      text: '',
      suggestions: [],
      action: intent,
      personalized: false
    };

    // Handle different intents
    switch (intent) {
      case 'greeting':
        response.text = this.getGreeting(userProfile);
        response.personalized = userProfile.interactions > 0;
        break;

      case 'product_search':
        response = await this.handleProductSearch(userId, message, entities);
        break;

      case 'price_inquiry':
        response.text = this.handlePriceInquiry(entities, userProfile);
        break;

      case 'comparison':
        response.text = this.handleComparison(message);
        break;

      case 'bargain':
        response.text = this.handleBargainIntent(userProfile);
        break;

      case 'purchase':
      case 'affirmative':
        response = this.handlePurchaseIntent(userId, userProfile);
        break;

      case 'help':
        response.text = this.getHelpMessage(userProfile);
        break;

      case 'feedback':
        response.text = this.handleFeedback(sentiment, userProfile);
        break;

      default:
        response = await this.handleGeneral(userId, message, entities);
    }

    // Add personality based on sentiment
    if (sentiment === 'positive') {
      response.text += " 😊";
    } else if (sentiment === 'negative') {
      response.text += " I'm here to help make it better! 💪";
    }

    return response;
  }

  /**
   * Get personalized greeting
   */
  getGreeting(userProfile) {
    if (userProfile.interactions === 0) {
      return this.responses.greetings.newUser[Math.floor(Math.random() * this.responses.greetings.newUser.length)];
    } else {
      let greeting = this.responses.greetings.returningUser[Math.floor(Math.random() * this.responses.greetings.returningUser.length)];
      
      // Personalize with user data
      if (userProfile.preferredCategory) {
        greeting = greeting.replace('{category}', userProfile.preferredCategory);
        greeting = greeting.replace('{interest}', userProfile.preferredCategory);
      }
      
      if (userProfile.preferences.length > 0) {
        greeting = greeting.replace('{preference}', userProfile.preferences[0]);
      }
      
      return greeting;
    }
  }

  /**
   * Handle product search with learning
   */
  async handleProductSearch(userId, message, entities) {
    const userProfile = this.getUserProfile(userId);
    let responseText = '';
    let searchQuery = message;

    // Extract the actual product name from message
    const productMatch = message.match(/(?:want|need|looking for|find|show me|search for)\s+(.+?)(?:\s|$)/i);
    if (productMatch) {
      searchQuery = productMatch[1].trim();
    }

    // Personalize based on history
    if (userProfile.preferredCategory && entities.categories.length === 0) {
      responseText = this.responses.productRecommendations.based_on_history
        .replace('{previous_category}', userProfile.preferredCategory)
        .replace('{current_category}', userProfile.preferredCategory);
    } else if (entities.categories.length > 0) {
      responseText = `Great! Looking for ${entities.categories.join(', ')}. Here's what I found! 🎯`;
      searchQuery = entities.categories[0]; // Use category for search
      
      // Add budget awareness
      if (userProfile.averageBudget) {
        responseText += ` (Around ${userProfile.averageBudget.toLocaleString()} RWF)`;
      }
    } else {
      responseText = `Searching for "${searchQuery}"... Here's what I found! 🔍`;
    }

    const response = {
      text: responseText,
      action: 'product_search',
      searchQuery: searchQuery,
      shouldSearch: true, // Flag to trigger product fetch
      personalized: true
    };
    
    return response;
  }

  /**
   * Handle price inquiry
   */
  handlePriceInquiry(entities, userProfile) {
    if (entities.priceRange) {
      return `Looking for items around ${entities.priceRange}? I'll find the best value products in that range! 💰`;
    }
    
    if (userProfile.averageBudget) {
      return `Based on your usual budget of ${userProfile.averageBudget.toLocaleString()} RWF, I can show you perfect matches! Would you like to see them?`;
    }
    
    return "I can help you find products in any price range! What's your budget? 💵";
  }

  /**
   * Handle comparison requests
   */
  handleComparison(message) {
    return "I'd love to help you compare! Could you tell me which products you're considering? I'll analyze features, prices, and quality to help you decide! 🔍";
  }

  /**
   * Handle bargain intent
   */
  handleBargainIntent(userProfile) {
    if (userProfile.preferences.includes('bargain_hunter')) {
      return "I know you love great deals! 😄 Click 'Make Offer' on any product, and let's negotiate the best price together! 🤝";
    }
    return "Want to negotiate? I'm great at that! Click 'Make Offer' on any product, and we'll work together to get you the best deal! 💰";
  }

  /**
   * Handle purchase intent - context-aware
   */
  handlePurchaseIntent(userId, userProfile) {
    const lastProducts = this.lastShownProducts.get(userId);
    
    if (lastProducts && lastProducts.length > 0) {
      const product = lastProducts[0];
      return {
        text: `Awesome! 🎉 Ready to get the ${product.name}? \n\nYou have two options:\n\n💰 **Make an Offer** - Click "Make Offer" on the product to negotiate a better price with me!\n\n🛒 **Buy Now** - Add it to cart at ${product.price?.toLocaleString() || 'current'} RWF\n\nWhich would you prefer?`,
        action: 'purchase_guidance',
        personalized: true,
        suggestions: lastProducts
      };
    }
    
    // No context - ask for clarification
    return {
      text: "I'd love to help you purchase! Which product are you interested in? You can search for it or tell me what you're looking for! 🔍",
      action: 'clarification',
      personalized: false
    };
  }

  /**
   * Get help message
   */
  getHelpMessage(userProfile) {
    let help = "I'm your intelligent shopping assistant! I can:\n\n";
    help += "• Find products tailored to your taste\n";
    help += "• Negotiate prices with you\n";
    help += "• Remember your preferences\n";
    help += "• Compare products\n";
    help += "• Suggest based on your history\n";
    help += "• Help you stay in budget\n\n";
    
    if (userProfile.interactions > 5) {
      help += "Fun fact: We've chatted " + userProfile.interactions + " times! I'm getting to know your style better! 🎯";
    } else {
      help += "The more we chat, the better I understand what you like! 🧠";
    }
    
    return help;
  }

  /**
   * Handle feedback
   */
  handleFeedback(sentiment, userProfile) {
    if (sentiment === 'positive') {
      return "Thank you! 🎉 Your feedback helps me improve. I'm learning what you like to serve you better!";
    } else if (sentiment === 'negative') {
      return "I'm sorry to hear that. 😔 Please tell me what went wrong so I can improve and help you better!";
    }
    return "Thanks for your feedback! It helps me learn and improve. 📝";
  }

  /**
   * Handle general queries
   */
  async handleGeneral(userId, message, entities) {
    // Check if message might be a product query
    const productKeywords = ['want', 'need', 'looking', 'buy', 'get', 'purchase', 'order'];
    const messageLower = message.toLowerCase();
    const hasProductIntent = productKeywords.some(keyword => messageLower.includes(keyword));
    
    // Check if user has context from previous search
    const lastProducts = this.lastShownProducts.get(userId);
    const hasContext = lastProducts && lastProducts.length > 0;
    
    // If it seems like they're looking for a product, trigger search
    if (hasProductIntent || entities.categories.length > 0) {
      return await this.handleProductSearch(userId, message, entities);
    }
    
    // If we have context and message seems like continuation
    if (hasContext && (messageLower.includes('it') || messageLower.includes('that') || messageLower.includes('this'))) {
      return this.handlePurchaseIntent(userId, this.getUserProfile(userId));
    }
    
    // Otherwise, ask for clarification
    const responses = [
      "I want to help! Could you tell me what you're looking for? 🤔",
      "I'm here for you! Could you give me a bit more detail? 💡",
      "Let me assist you! What can I help you find today? 😊"
    ];
    
    return {
      text: responses[Math.floor(Math.random() * responses.length)],
      action: 'clarification',
      personalized: false
    };
  }

  /**
   * Get or create user profile
   */
  getUserProfile(userId) {
    if (!this.userPreferences.has(userId)) {
      this.userPreferences.set(userId, {
        interactions: 0,
        preferredCategory: null,
        preferences: [],
        averageBudget: null,
        searchHistory: [],
        purchaseHistory: [],
        sentimentHistory: [],
        lastSeen: new Date()
      });
    }
    return this.userPreferences.get(userId);
  }

  /**
   * Learn from interaction
   */
  learnFromInteraction(userId, interaction) {
    const profile = this.getUserProfile(userId);
    
    // Update interaction count
    profile.interactions++;
    profile.lastSeen = new Date();
    
    // Learn categories
    if (interaction.entities.categories.length > 0) {
      const category = interaction.entities.categories[0];
      profile.searchHistory.push(category);
      
      // Determine preferred category (most searched)
      const categoryCounts = {};
      profile.searchHistory.forEach(cat => {
        categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
      });
      profile.preferredCategory = Object.keys(categoryCounts).reduce((a, b) => 
        categoryCounts[a] > categoryCounts[b] ? a : b
      );
    }
    
    // Learn preferences
    if (interaction.entities.preferences.length > 0) {
      interaction.entities.preferences.forEach(pref => {
        if (!profile.preferences.includes(pref)) {
          profile.preferences.push(pref);
        }
      });
    }
    
    // Learn budget
    if (interaction.entities.priceRange) {
      const price = parseInt(interaction.entities.priceRange.replace(/\D/g, ''));
      if (price && !isNaN(price)) {
        if (!profile.averageBudget) {
          profile.averageBudget = price;
        } else {
          // Moving average
          profile.averageBudget = Math.round((profile.averageBudget + price) / 2);
        }
      }
    }
    
    // Track sentiment
    profile.sentimentHistory.push(interaction.sentiment);
    
    // Learn personality traits
    if (interaction.intent === 'bargain') {
      if (!profile.preferences.includes('bargain_hunter')) {
        profile.preferences.push('bargain_hunter');
      }
    }
    
    console.log('🧠 Learned from user:', {
      interactions: profile.interactions,
      preferredCategory: profile.preferredCategory,
      preferences: profile.preferences,
      averageBudget: profile.averageBudget
    });
    
    this.userPreferences.set(userId, profile);
  }

  /**
   * Store conversation
   */
  storeConversation(userId, message, response) {
    if (!this.conversationHistory.has(userId)) {
      this.conversationHistory.set(userId, []);
    }
    
    const conversation = this.conversationHistory.get(userId);
    conversation.push({
      timestamp: new Date(),
      userMessage: message,
      aiResponse: response,
      context: this.getUserProfile(userId)
    });
    
    // Keep only last 50 messages
    if (conversation.length > 50) {
      conversation.shift();
    }
    
    this.conversationHistory.set(userId, conversation);
  }

  /**
   * Get conversation context
   */
  getConversationContext(userId, messages = 5) {
    const history = this.conversationHistory.get(userId) || [];
    return history.slice(-messages);
  }

  /**
   * Reset user profile (for testing)
   */
  resetUserProfile(userId) {
    this.userPreferences.delete(userId);
    this.conversationHistory.delete(userId);
    console.log('🔄 User profile reset:', userId);
  }
}

module.exports = new IntelligentAI();
