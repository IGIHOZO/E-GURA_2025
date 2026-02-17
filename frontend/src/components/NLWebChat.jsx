import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChatBubbleLeftRightIcon,
  XMarkIcon,
  PaperAirplaneIcon,
  SparklesIcon,
  ShoppingBagIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline';
import { useNavigate } from 'react-router-dom';
import semanticEngine from '../utils/semanticSearch';
import advancedAI from '../utils/advancedAI';

const NLWebChat = ({ products = [] }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      type: 'bot',
      text: "Hi! 👋 I'm your AI shopping assistant. I can help you find products, compare prices, get recommendations, and answer questions. Try asking me something!",
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [conversationContext, setConversationContext] = useState({
    lastQuery: null,
    lastFilters: null,
    lastResults: [],
    userPreferences: {
      priceRange: null,
      favoriteCategories: [],
      favoriteColors: []
    }
  });
  const messagesEndRef = useRef(null);
  const navigate = useNavigate();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Initialize semantic engine when products load
  useEffect(() => {
    if (products.length > 0) {
      semanticEngine.buildProductVectors(products);
      console.log('🤖 Semantic search engine initialized with', products.length, 'products');
    }
  }, [products]);

  // Advanced Natural Language Processing - Parse user queries with context
  const parseQuery = (query) => {
    const lowerQuery = query.toLowerCase();
    
    // Detect query intent
    const intent = detectIntent(lowerQuery);
    
    // Extract filters from natural language
    const filters = {
      color: null,
      category: null,
      maxPrice: null,
      minPrice: null,
      keywords: [],
      isNew: false,
      isSale: false,
      isFeatured: false,
      gender: null,
      material: null,
      size: null,
      sortBy: null,
      intent: intent
    };

    // Color detection (expanded)
    const colors = {
      'blue': ['blue', 'navy', 'azure', 'cobalt'],
      'red': ['red', 'crimson', 'scarlet', 'maroon'],
      'green': ['green', 'emerald', 'olive', 'lime'],
      'yellow': ['yellow', 'gold', 'golden'],
      'black': ['black', 'dark'],
      'white': ['white', 'cream', 'ivory'],
      'pink': ['pink', 'rose'],
      'purple': ['purple', 'violet', 'lavender'],
      'orange': ['orange', 'coral'],
      'brown': ['brown', 'tan', 'beige'],
      'gray': ['gray', 'grey', 'silver']
    };

    Object.keys(colors).forEach(mainColor => {
      colors[mainColor].forEach(variant => {
        if (lowerQuery.includes(variant)) {
          filters.color = mainColor;
        }
      });
    });

    // Category detection (expanded with synonyms)
    const categories = {
      'Jackets': ['jacket', 'jackets', 'blazer', 'coat', 'outerwear'],
      'Dresses': ['dress', 'dresses', 'gown', 'frock'],
      'Shirts': ['shirt', 'shirts', 'blouse', 'top', 'tops'],
      'Pants': ['pants', 'trousers', 'jeans', 'slacks'],
      'Skirts': ['skirt', 'skirts'],
      'Shoes': ['shoes', 'footwear', 'sneakers', 'heels', 'boots', 'sandals'],
      'Bags': ['bag', 'bags', 'handbag', 'purse', 'backpack'],
      'Accessories': ['accessory', 'accessories', 'jewelry', 'jewellery', 'watch', 'belt', 'scarf']
    };

    Object.keys(categories).forEach(mainCategory => {
      categories[mainCategory].forEach(variant => {
        if (lowerQuery.includes(variant)) {
          filters.category = mainCategory;
        }
      });
    });

    // Price detection (multiple formats)
    const pricePatterns = [
      /under\s+(\d+)/i,
      /below\s+(\d+)/i,
      /less\s+than\s+(\d+)/i,
      /cheaper\s+than\s+(\d+)/i,
      /max\s+(\d+)/i,
      /maximum\s+(\d+)/i,
      /(\d+)\s+or\s+less/i
    ];
    
    for (const pattern of pricePatterns) {
      const match = lowerQuery.match(pattern);
      if (match) {
        filters.maxPrice = parseInt(match[1]);
        break;
      }
    }

    const minPricePatterns = [
      /above\s+(\d+)/i,
      /over\s+(\d+)/i,
      /more\s+than\s+(\d+)/i,
      /expensive\s+than\s+(\d+)/i,
      /min\s+(\d+)/i,
      /minimum\s+(\d+)/i
    ];

    for (const pattern of minPricePatterns) {
      const match = lowerQuery.match(pattern);
      if (match) {
        filters.minPrice = parseInt(match[1]);
        break;
      }
    }

    // Price range detection
    const rangeMatch = lowerQuery.match(/between\s+(\d+)\s+and\s+(\d+)/i);
    if (rangeMatch) {
      filters.minPrice = parseInt(rangeMatch[1]);
      filters.maxPrice = parseInt(rangeMatch[2]);
    }

    // Special filters
    if (lowerQuery.match(/\b(new|latest|recent|newest|just\s+in)\b/)) {
      filters.isNew = true;
    }
    if (lowerQuery.match(/\b(sale|discount|offer|deal|promo|clearance)\b/)) {
      filters.isSale = true;
    }
    if (lowerQuery.match(/\b(popular|trending|featured|bestseller|best\s+selling|hot)\b/)) {
      filters.isFeatured = true;
    }

    // Gender detection
    if (lowerQuery.match(/\b(women|woman|female|ladies|lady)\b/)) {
      filters.gender = 'female';
    }
    if (lowerQuery.match(/\b(men|man|male|guys|gentleman)\b/)) {
      filters.gender = 'male';
    }
    if (lowerQuery.match(/\b(unisex|both|everyone)\b/)) {
      filters.gender = 'unisex';
    }

    // Material detection
    const materials = ['cotton', 'silk', 'leather', 'denim', 'wool', 'polyester', 'linen', 'ankara'];
    materials.forEach(material => {
      if (lowerQuery.includes(material)) {
        filters.material = material;
      }
    });

    // Size detection
    const sizes = ['xs', 'small', 'medium', 'large', 'xl', 'xxl', 's', 'm', 'l'];
    sizes.forEach(size => {
      if (lowerQuery.includes(size)) {
        filters.size = size.toUpperCase();
      }
    });

    // Sorting detection
    if (lowerQuery.match(/\b(cheapest|lowest\s+price|most\s+affordable)\b/)) {
      filters.sortBy = 'price_asc';
    }
    if (lowerQuery.match(/\b(expensive|highest\s+price|premium)\b/)) {
      filters.sortBy = 'price_desc';
    }
    if (lowerQuery.match(/\b(newest|latest|recent)\b/)) {
      filters.sortBy = 'newest';
    }
    if (lowerQuery.match(/\b(popular|best\s+selling|top\s+rated)\b/)) {
      filters.sortBy = 'popular';
    }

    // Extract keywords
    const stopWords = ['find', 'show', 'me', 'get', 'search', 'for', 'under', 'above', 'below', 'the', 'a', 'an', 'rwf', 'frw', 'want', 'need', 'looking', 'like', 'would'];
    const words = lowerQuery.split(/\s+/).filter(word => 
      word.length > 2 && !stopWords.includes(word)
    );
    filters.keywords = words;

    return filters;
  };

  // Detect user intent
  const detectIntent = (query) => {
    if (query.match(/\b(compare|versus|vs|difference|better)\b/)) return 'compare';
    if (query.match(/\b(recommend|suggest|advice|what\s+should)\b/)) return 'recommend';
    if (query.match(/\b(price|cost|how\s+much|expensive|cheap)\b/)) return 'price_inquiry';
    if (query.match(/\b(available|stock|in\s+stock|have)\b/)) return 'availability';
    if (query.match(/\b(similar|like|related|alternative)\b/)) return 'similar';
    if (query.match(/\b(best|top|highest\s+rated)\b/)) return 'best';
    if (query.match(/\b(help|how|what|why|when)\b/)) return 'help';
    return 'search';
  };

  // Advanced search with multiple filters and sorting
  const searchProducts = (filters) => {
    let results = [...products];

    // If no filters applied, return all products
    const hasFilters = filters.color || filters.category || filters.maxPrice || filters.minPrice || 
                       filters.isNew || filters.isSale || filters.isFeatured || filters.gender || 
                       filters.material || filters.size || (filters.keywords && filters.keywords.length > 0);

    if (!hasFilters) {
      console.log('No filters applied, returning all products');
      return results;
    }

    // Filter by color
    if (filters.color) {
      results = results.filter(p => 
        p.colors?.some(c => c.toLowerCase().includes(filters.color)) ||
        p.name?.toLowerCase().includes(filters.color) ||
        p.description?.toLowerCase().includes(filters.color)
      );
    }

    // Filter by category
    if (filters.category) {
      results = results.filter(p => 
        p.category === filters.category ||
        p.subcategory === filters.category ||
        p.name?.toLowerCase().includes(filters.category.toLowerCase())
      );
    }

    // Filter by gender
    if (filters.gender) {
      results = results.filter(p => 
        p.gender === filters.gender ||
        p.gender === 'unisex'
      );
    }

    // Filter by material
    if (filters.material) {
      results = results.filter(p =>
        p.material?.some(m => m.toLowerCase().includes(filters.material)) ||
        p.description?.toLowerCase().includes(filters.material)
      );
    }

    // Filter by size
    if (filters.size) {
      results = results.filter(p =>
        p.sizes?.includes(filters.size)
      );
    }

    // Filter by price
    if (filters.maxPrice) {
      results = results.filter(p => p.price <= filters.maxPrice);
    }
    if (filters.minPrice) {
      results = results.filter(p => p.price >= filters.minPrice);
    }

    // Filter by special flags
    if (filters.isNew) {
      results = results.filter(p => p.isNew === true);
    }
    if (filters.isSale) {
      results = results.filter(p => p.isSale === true || (p.discountPercentage && p.discountPercentage > 0));
    }
    if (filters.isFeatured) {
      results = results.filter(p => p.isFeatured === true || p.isBestSeller === true);
    }

    // Filter by keywords (only if specific keywords exist)
    if (filters.keywords && filters.keywords.length > 0) {
      const meaningfulKeywords = filters.keywords.filter(k => 
        !['products', 'items', 'things', 'stuff'].includes(k)
      );
      
      if (meaningfulKeywords.length > 0) {
        results = results.filter(p => {
          const searchText = `${p.name} ${p.description} ${p.category} ${p.subcategory} ${p.tags?.join(' ')}`.toLowerCase();
          return meaningfulKeywords.some(keyword => searchText.includes(keyword));
        });
      }
    }

    // Apply sorting
    if (filters.sortBy) {
      switch (filters.sortBy) {
        case 'price_asc':
          results.sort((a, b) => a.price - b.price);
          break;
        case 'price_desc':
          results.sort((a, b) => b.price - a.price);
          break;
        case 'newest':
          results.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
          break;
        case 'popular':
          results.sort((a, b) => (b.totalSales || 0) - (a.totalSales || 0));
          break;
        default:
          break;
      }
    }

    console.log('Search filters:', filters);
    console.log('Results found:', results.length);

    return results;
  };

  // Intelligent response generation based on intent
  const generateResponse = (query, results, filters) => {
    // Handle different intents
    switch (filters.intent) {
      case 'recommend':
        return generateRecommendation(results, filters);
      case 'compare':
        return generateComparison(results, filters);
      case 'price_inquiry':
        return generatePriceInfo(results, filters);
      case 'availability':
        return generateAvailabilityInfo(results, filters);
      case 'similar':
        return generateSimilarProducts(results, filters);
      case 'best':
        return generateBestProducts(results, filters);
      case 'help':
        return generateHelpResponse(query);
      default:
        return generateSearchResponse(query, results, filters);
    }
  };

  // Generate search response
  const generateSearchResponse = (query, results, filters) => {
    if (results.length === 0) {
      const suggestions = generateSmartSuggestions(filters);
      return {
        text: `I couldn't find any products matching "${query}". ${suggestions.helpText}`,
        products: [],
        suggestions: suggestions.buttons
      };
    }

    let responseText = '';
    const priceRange = results.length > 0 ? {
      min: Math.min(...results.map(p => p.price)),
      max: Math.max(...results.map(p => p.price))
    } : null;
    
    // Build natural response
    if (filters.color && filters.category && filters.maxPrice) {
      responseText = `Perfect! I found ${results.length} ${filters.color} ${filters.category.toLowerCase()} under ${filters.maxPrice.toLocaleString()} RWF. Prices range from ${priceRange.min.toLocaleString()} to ${priceRange.max.toLocaleString()} RWF.`;
    } else if (filters.color && filters.category) {
      responseText = `Great! I found ${results.length} ${filters.color} ${filters.category.toLowerCase()} for you. Prices start at ${priceRange.min.toLocaleString()} RWF.`;
    } else if (filters.category && filters.maxPrice) {
      responseText = `I found ${results.length} ${filters.category.toLowerCase()} under ${filters.maxPrice.toLocaleString()} RWF. Here are the best options:`;
    } else if (filters.maxPrice) {
      responseText = `I found ${results.length} products under ${filters.maxPrice.toLocaleString()} RWF. Check out these great deals:`;
    } else if (filters.isNew) {
      responseText = `Here are ${results.length} new arrivals just for you! Fresh styles starting at ${priceRange.min.toLocaleString()} RWF:`;
    } else if (filters.isSale) {
      responseText = `Amazing! I found ${results.length} items on sale. Save up to ${Math.max(...results.map(p => p.discountPercentage || 0))}%:`;
    } else {
      responseText = `I found ${results.length} products matching your search. Here are my top picks:`;
    }

    // Generate contextual suggestions
    const suggestions = [];
    if (filters.category) {
      suggestions.push(`Show me ${filters.category.toLowerCase()} on sale`);
      suggestions.push(`Find cheaper ${filters.category.toLowerCase()}`);
    }
    if (filters.maxPrice) {
      suggestions.push(`Show items under ${Math.floor(filters.maxPrice * 0.7).toLocaleString()} RWF`);
    }
    suggestions.push('Show me new arrivals');
    suggestions.push('What are your bestsellers?');

    return {
      text: responseText,
      products: results.slice(0, 5),
      suggestions: suggestions.slice(0, 3)
    };
  };

  // Generate recommendations using semantic engine
  const generateRecommendation = (results, filters) => {
    // Use semantic engine for personalized recommendations
    const recommended = semanticEngine.getRecommendations(products, 5);
    
    if (recommended.length === 0) {
      // Fallback to traditional method
      const topRated = [...results].sort((a, b) => (b.averageRating || 0) - (a.averageRating || 0));
      const bestValue = [...results].sort((a, b) => {
        const aValue = (a.averageRating || 0) / (a.price / 10000);
        const bValue = (b.averageRating || 0) / (b.price / 10000);
        return bValue - aValue;
      });

      return {
        text: `Based on ratings and value, I recommend these products. The top pick has ${topRated[0]?.averageRating} stars and ${topRated[0]?.totalReviews} reviews!`,
        products: bestValue.slice(0, 5),
        suggestions: [
          'Show me more recommendations',
          'Find similar products',
          'What are the bestsellers?'
        ]
      };
    }

    // Get user insights
    const insights = semanticEngine.getUserInsights();
    const topCategory = insights.topCategories[0]?.category || 'products';
    
    return {
      text: `Based on your browsing history (you love ${topCategory}!), here are my personalized recommendations just for you:`,
      products: recommended,
      suggestions: [
        'Show me more like this',
        `Find more ${topCategory}`,
        'What else matches my style?'
      ]
    };
  };

  // Generate comparison
  const generateComparison = (results, filters) => {
    if (results.length < 2) {
      return {
        text: "I need at least 2 products to compare. Try searching for a specific category first!",
        products: results,
        suggestions: ['Show me jackets', 'Find dresses', 'Show me shoes']
      };
    }

    const top2 = results.slice(0, 2);
    const priceDiff = Math.abs(top2[0].price - top2[1].price);
    
    return {
      text: `Here's a comparison: "${top2[0].name}" (${top2[0].price.toLocaleString()} RWF) vs "${top2[1].name}" (${top2[1].price.toLocaleString()} RWF). Price difference: ${priceDiff.toLocaleString()} RWF.`,
      products: top2,
      suggestions: [
        'Show me more options',
        'Which one is better?',
        'Find cheaper alternatives'
      ]
    };
  };

  // Generate price information
  const generatePriceInfo = (results, filters) => {
    if (results.length === 0) {
      return {
        text: "I don't have pricing information for that. Try asking about a specific product or category!",
        products: [],
        suggestions: ['Show me all products', 'Find sale items', 'What are your prices?']
      };
    }

    const avgPrice = results.reduce((sum, p) => sum + p.price, 0) / results.length;
    const minPrice = Math.min(...results.map(p => p.price));
    const maxPrice = Math.max(...results.map(p => p.price));

    return {
      text: `Price range: ${minPrice.toLocaleString()} - ${maxPrice.toLocaleString()} RWF. Average price: ${Math.round(avgPrice).toLocaleString()} RWF. Here are some options:`,
      products: results.slice(0, 5),
      suggestions: [
        `Show items under ${Math.round(avgPrice).toLocaleString()} RWF`,
        'Find the cheapest option',
        'Show me premium items'
      ]
    };
  };

  // Generate availability info
  const generateAvailabilityInfo = (results, filters) => {
    const inStock = results.filter(p => p.stockQuantity > 0);
    const lowStock = results.filter(p => p.stockQuantity > 0 && p.stockQuantity <= 5);

    return {
      text: `${inStock.length} items are in stock. ${lowStock.length > 0 ? `⚠️ ${lowStock.length} items have limited stock - order soon!` : ''}`,
      products: inStock.slice(0, 5),
      suggestions: [
        'Show me items in stock',
        'Find alternatives',
        'What else do you have?'
      ]
    };
  };

  // Generate similar products
  const generateSimilarProducts = (results, filters) => {
    if (conversationContext.lastResults.length === 0) {
      return {
        text: "I need to know what product you're interested in first. Try searching for something specific!",
        products: [],
        suggestions: ['Show me jackets', 'Find dresses', 'Browse all products']
      };
    }

    const lastProduct = conversationContext.lastResults[0];
    const similar = results.filter(p => 
      p.category === lastProduct.category &&
      p._id !== lastProduct._id &&
      Math.abs(p.price - lastProduct.price) < lastProduct.price * 0.3
    );

    return {
      text: `Here are products similar to "${lastProduct.name}". Same category, similar price range:`,
      products: similar.slice(0, 5),
      suggestions: [
        'Show me cheaper options',
        'Find exact matches',
        'What else is popular?'
      ]
    };
  };

  // Generate best products
  const generateBestProducts = (results, filters) => {
    const best = [...results]
      .filter(p => p.averageRating >= 4.5)
      .sort((a, b) => (b.averageRating || 0) - (a.averageRating || 0));

    if (best.length === 0) {
      return {
        text: "Let me show you our most popular products instead:",
        products: results.slice(0, 5),
        suggestions: ['Show me new arrivals', 'Find sale items', 'Browse all']
      };
    }

    return {
      text: `These are our top-rated products! All have 4.5+ star ratings. The best one has ${best[0].averageRating} stars from ${best[0].totalReviews} customers:`,
      products: best.slice(0, 5),
      suggestions: [
        'Show me more top-rated items',
        'Find bestsellers',
        'What are customers buying?'
      ]
    };
  };

  // Generate help response
  const generateHelpResponse = (query) => {
    const helpTopics = {
      'shipping': "We offer FREE shipping on all orders! Delivery takes 1-3 business days in Kigali.",
      'payment': "We accept MTN Mobile Money and Airtel Money. Payment is secure and instant.",
      'return': "30-day return policy on all items. Contact us if you're not satisfied!",
      'size': "Check our size guide on each product page. We offer XS to XXL sizes.",
      'track': "Track your order in 'My Orders' section. You'll receive SMS updates!"
    };

    for (const [topic, response] of Object.entries(helpTopics)) {
      if (query.includes(topic)) {
        return {
          text: response,
          products: [],
          suggestions: [
            'Show me products',
            'Find new arrivals',
            'Browse sale items'
          ]
        };
      }
    }

    return {
      text: "I can help you with:\n• Finding products by color, category, price\n• Recommendations and comparisons\n• Shipping, payment, and returns\n• Order tracking\n\nWhat would you like to know?",
      products: [],
      suggestions: [
        'Find me products',
        'Show me new arrivals',
        'What are your bestsellers?'
      ]
    };
  };

  // Generate smart suggestions based on context
  const generateSmartSuggestions = (filters) => {
    const suggestions = [];
    let helpText = '';

    if (filters.color && !filters.category) {
      helpText = `Try adding a category like "jackets" or "dresses".`;
      suggestions.push(`Show me ${filters.color} dresses`);
      suggestions.push(`Find ${filters.color} jackets`);
    } else if (filters.category && !filters.maxPrice) {
      helpText = `Try adding a price range.`;
      suggestions.push(`Show ${filters.category} under 50000 RWF`);
      suggestions.push(`Find cheap ${filters.category}`);
    } else {
      helpText = `Try browsing our collections.`;
      suggestions.push('Show me new arrivals');
      suggestions.push('Find sale items');
    }

    suggestions.push('Browse all products');

    return { helpText, buttons: suggestions.slice(0, 3) };
  };

  // Handle user message with context awareness
  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    const userMessage = {
      type: 'user',
      text: inputValue,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    const currentQuery = inputValue;
    setInputValue('');
    setIsTyping(true);

    // Simulate AI processing delay
    setTimeout(async () => {
      // Check for special commands
      if (currentQuery.toLowerCase().includes('browse all') || currentQuery.toLowerCase().includes('show all') || currentQuery.toLowerCase().includes('view all')) {
        const botMessage = {
          type: 'bot',
          text: `I'll take you to our shop where you can browse all ${products.length} products! 🛍️`,
          products: products.slice(0, 5),
          suggestions: [
            'Show me new arrivals',
            'Find sale items',
            'What are bestsellers?'
          ],
          timestamp: new Date()
        };
        setMessages(prev => [...prev, botMessage]);
        setIsTyping(false);
        setTimeout(() => navigate('/shop'), 1500);
        return;
      }

      // Use Advanced AI Engine for processing
      try {
        const aiResult = await advancedAI.processQuery(currentQuery, products, messages);
        
        const botMessage = {
          type: 'bot',
          text: aiResult.response,
          products: aiResult.products,
          suggestions: generateSmartSuggestions(aiResult.entities, aiResult.intent).buttons,
          timestamp: new Date(),
          confidence: aiResult.confidence
        };

        setMessages(prev => [...prev, botMessage]);
        setIsTyping(false);

        console.log('🤖 AI Response:', {
          intent: aiResult.intent.type,
          confidence: (aiResult.confidence * 100).toFixed(0) + '%',
          entities: aiResult.entities,
          results: aiResult.products.length
        });

        // Update conversation context
        setConversationContext(prev => ({
          lastQuery: currentQuery,
          lastFilters: aiResult.entities,
          lastResults: aiResult.products,
          userPreferences: prev.userPreferences
        }));

        return;
      } catch (error) {
        console.error('AI processing error, falling back to traditional search:', error);
      }

      // Fallback to traditional search if AI fails
      const filters = parseQuery(currentQuery);
      const results = searchProducts(filters);
      const response = generateResponse(currentQuery, results, filters);

      // Update conversation context
      setConversationContext(prev => ({
        lastQuery: currentQuery,
        lastFilters: filters,
        lastResults: results,
        userPreferences: {
          ...prev.userPreferences,
          favoriteCategories: filters.category 
            ? [...new Set([...prev.userPreferences.favoriteCategories, filters.category])]
            : prev.userPreferences.favoriteCategories,
          favoriteColors: filters.color
            ? [...new Set([...prev.userPreferences.favoriteColors, filters.color])]
            : prev.userPreferences.favoriteColors,
          priceRange: filters.maxPrice || prev.userPreferences.priceRange
        }
      }));

      const botMessage = {
        type: 'bot',
        text: response.text,
        products: response.products,
        suggestions: response.suggestions,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, botMessage]);
      setIsTyping(false);

      console.log('🤖 NLWeb Query:', currentQuery);
      console.log('🎯 Detected Intent:', filters.intent);
      console.log('🔍 Filters:', filters);
      console.log('📦 Results:', results.length);
    }, 1000);
  };

  // Handle suggestion click
  const handleSuggestionClick = (suggestion) => {
    setInputValue(suggestion);
    setTimeout(() => handleSendMessage(), 100);
  };

  // Quick actions
  const quickActions = [
    { text: 'Show me new arrivals', icon: SparklesIcon },
    { text: 'Find sale items', icon: ShoppingBagIcon },
    { text: 'What are your bestsellers?', icon: MagnifyingGlassIcon }
  ];

  return (
    <>
      {/* Chat Button */}
      <motion.button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 bg-gradient-to-r from-red-600 to-orange-600 text-white p-4 rounded-full shadow-lg hover:shadow-xl transition-all z-50"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        animate={!isOpen ? { y: [0, -10, 0] } : {}}
        transition={{ repeat: Infinity, duration: 2 }}
      >
        <ChatBubbleLeftRightIcon className="h-6 w-6" />
        <span className="absolute -top-1 -right-1 bg-green-500 h-3 w-3 rounded-full animate-pulse"></span>
      </motion.button>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 100, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 100, scale: 0.8 }}
            className="fixed bottom-6 right-6 w-96 h-[600px] bg-white rounded-2xl shadow-2xl flex flex-col z-50 overflow-hidden"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-red-600 to-orange-600 text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <SparklesIcon className="h-6 w-6" />
                <div>
                  <h3 className="font-semibold">Shopping Assistant</h3>
                  <p className="text-xs opacity-90">Powered by NLWeb</p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="hover:bg-white/20 p-1 rounded-lg transition-colors"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
              {messages.map((message, index) => (
                <div key={index}>
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                        message.type === 'user'
                          ? 'bg-red-600 text-white'
                          : 'bg-white text-gray-900 shadow-sm'
                      }`}
                    >
                      <p className="text-sm">{message.text}</p>
                      <p className="text-xs opacity-70 mt-1">
                        {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </motion.div>

                  {/* Product Results */}
                  {message.products && message.products.length > 0 && (
                    <div className="mt-3 space-y-2">
                      {message.products.map((product, idx) => (
                        <motion.div
                          key={idx}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.1 }}
                          onClick={() => {
                            navigate(`/product/${product._id || product.id}`);
                            setIsOpen(false);
                          }}
                          className="bg-white rounded-lg p-3 shadow-sm hover:shadow-md transition-all cursor-pointer flex gap-3"
                        >
                          <img
                            src={product.mainImage || product.image}
                            alt={product.name}
                            className="w-16 h-16 object-cover rounded-lg"
                          />
                          <div className="flex-1">
                            <h4 className="font-medium text-sm text-gray-900 line-clamp-1">
                              {product.name}
                            </h4>
                            <p className="text-xs text-gray-600 line-clamp-1">
                              {product.category}
                            </p>
                            <p className="text-sm font-bold text-red-600 mt-1">
                              {product.price?.toLocaleString()} RWF
                            </p>
                          </div>
                        </motion.div>
                      ))}
                      {message.products.length === 5 && (
                        <button
                          onClick={() => navigate('/shop')}
                          className="w-full text-center text-sm text-red-600 hover:text-red-700 font-medium py-2"
                        >
                          View all results →
                        </button>
                      )}
                    </div>
                  )}

                  {/* Suggestions */}
                  {message.suggestions && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {message.suggestions.map((suggestion, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleSuggestionClick(suggestion)}
                          className="text-xs bg-white text-gray-700 px-3 py-1.5 rounded-full hover:bg-red-50 hover:text-red-600 transition-colors shadow-sm"
                        >
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}

              {isTyping && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex justify-start"
                >
                  <div className="bg-white rounded-2xl px-4 py-3 shadow-sm">
                    <div className="flex gap-1">
                      <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></span>
                      <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></span>
                      <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></span>
                    </div>
                  </div>
                </motion.div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Quick Actions */}
            {messages.length === 1 && (
              <div className="px-4 py-2 bg-white border-t border-gray-200">
                <p className="text-xs text-gray-600 mb-2">Quick actions:</p>
                <div className="flex gap-2">
                  {quickActions.map((action, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSuggestionClick(action.text)}
                      className="flex-1 flex items-center justify-center gap-1 bg-gray-100 hover:bg-red-50 text-gray-700 hover:text-red-600 px-3 py-2 rounded-lg text-xs font-medium transition-colors"
                    >
                      <action.icon className="h-4 w-4" />
                      {action.text}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Input */}
            <div className="p-4 bg-white border-t border-gray-200">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder="Ask me anything..."
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:ring-2 focus:ring-red-600 focus:border-transparent text-sm"
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!inputValue.trim()}
                  className="bg-red-600 text-white p-2 rounded-full hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <PaperAirplaneIcon className="h-5 w-5" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default NLWebChat;
