/**
 * Professional AI-Powered Search Service
 * Provides intelligent search, filtering, and sorting capabilities
 * Integrated with entire database ecosystem
 */

const Product = require('../models/Product');
const Order = require('../models/Order');
const Customer = require('../models/Customer');

class AISearchService {
  /**
   * Intelligent product search with AI-powered relevance scoring
   */
  searchProducts(products, query, filters = {}) {
    if (!query && Object.keys(filters).length === 0) {
      return products;
    }

    let results = [...products];

    // Apply AI search if query exists
    if (query && query.trim()) {
      results = this.aiSearch(results, query);
    }

    // Apply filters
    if (filters.category && filters.category !== 'all') {
      results = results.filter(p => 
        p.category?.toLowerCase() === filters.category.toLowerCase()
      );
    }

    if (filters.minPrice !== undefined) {
      results = results.filter(p => p.price >= filters.minPrice);
    }

    if (filters.maxPrice !== undefined) {
      results = results.filter(p => p.price <= filters.maxPrice);
    }

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

    if (filters.inStock !== undefined) {
      results = results.filter(p => 
        filters.inStock ? (p.stockQuantity > 0) : true
      );
    }

    if (filters.gender && filters.gender !== 'all') {
      results = results.filter(p => 
        p.gender?.toLowerCase() === filters.gender.toLowerCase() ||
        p.gender?.toLowerCase() === 'unisex'
      );
    }

    return results;
  }

  /**
   * Enhanced AI-powered search with flexible relevance scoring
   */
  aiSearch(products, query) {
    if (!query || query.trim() === '') {
      return products; // Return all if no query
    }
    
    const searchTerms = query.toLowerCase().trim().split(/\s+/).filter(term => term.length > 2);
    const queryLower = query.toLowerCase().trim();
    
    // If query is very long (like a product name), be more flexible
    const isLongQuery = searchTerms.length > 5;
    
    const scoredProducts = products.map(product => {
      let score = 0;
      const searchableText = this.getSearchableText(product).toLowerCase();
      const nameLower = (product.name || '').toLowerCase();
      const descLower = (product.description || '').toLowerCase();
      const categoryLower = (product.category || '').toLowerCase();

      // EXACT FULL MATCH (highest priority) - must match entire query
      if (nameLower === queryLower) {
        score += 1000; // Perfect match
      } else if (nameLower.includes(queryLower)) {
        score += 500; // Exact phrase in name
      }

      if (descLower.includes(queryLower)) {
        score += 200; // Exact phrase in description
      }

      if (categoryLower === queryLower) {
        score += 300; // Exact category match
      }

      // FLEXIBLE TERM MATCHING with typo tolerance
      let matchedTerms = 0;
      searchTerms.forEach(term => {
        let termMatched = false;

        // Name matches (highest weight) - includes typo tolerance
        if (nameLower.includes(term)) {
          score += 100;
          termMatched = true;
        } else {
          // Check for typos in name words
          const nameWords = nameLower.split(/\s+/);
          for (const word of nameWords) {
            if (this.isSimilar(word, term, 2)) {
              score += 80; // Slightly lower for fuzzy match
              termMatched = true;
              break;
            }
          }
        }

        // Category matches
        if (categoryLower.includes(term)) {
          score += 80;
          termMatched = true;
        } else if (this.isSimilar(categoryLower, term, 2)) {
          score += 60;
          termMatched = true;
        }

        // Brand matches
        if (product.brand?.toLowerCase().includes(term)) {
          score += 70;
          termMatched = true;
        } else if (product.brand && this.isSimilar(product.brand.toLowerCase(), term, 2)) {
          score += 50;
          termMatched = true;
        }

        // Tags matches with typo tolerance
        if (product.tags?.some(tag => {
          const tagLower = tag.toLowerCase();
          return tagLower === term || tagLower.includes(term) || this.isSimilar(tagLower, term, 2);
        })) {
          score += 60;
          termMatched = true;
        }

        // Description matches
        if (descLower.includes(term)) {
          score += 40;
          termMatched = true;
        } else {
          // Check description words for typos
          const descWords = descLower.split(/\s+/);
          for (const word of descWords) {
            if (word.length >= 4 && this.isSimilar(word, term, 2)) {
              score += 30;
              termMatched = true;
              break;
            }
          }
        }

        // Color matches
        if (product.colors?.some(color => {
          const colorLower = color.toLowerCase();
          return colorLower === term || this.isSimilar(colorLower, term, 1);
        })) {
          score += 50;
          termMatched = true;
        }

        // Material matches
        if (product.material?.some(mat => {
          const matLower = mat.toLowerCase();
          return matLower === term || matLower.includes(term) || this.isSimilar(matLower, term, 2);
        })) {
          score += 45;
          termMatched = true;
        }

        // Gender matches
        if (product.gender?.toLowerCase() === term || this.isSimilar(product.gender?.toLowerCase() || '', term, 1)) {
          score += 30;
          termMatched = true;
        }

        if (termMatched) {
          matchedTerms++;
        }
      });

      // FLEXIBLE: Allow partial matches with smart thresholds
      const matchPercentage = matchedTerms / searchTerms.length;
      
      if (searchTerms.length === 0) {
        // No valid search terms, return all
        score = 1;
      } else if (searchTerms.length === 1 && matchedTerms === 0) {
        score = 0; // Single word must match
      } else if (isLongQuery) {
        // For long queries (like full product names), require only 30% match
        if (matchPercentage < 0.3) {
          score = 0;
        } else if (matchPercentage < 1.0) {
          score = score * (0.5 + matchPercentage * 0.5); // Less penalty
        }
      } else if (searchTerms.length > 1 && matchPercentage < 0.4) {
        // For normal queries, require at least 40% match
        score = 0;
      } else if (matchPercentage < 1.0) {
        // Penalize partial matches less
        score = score * (0.6 + matchPercentage * 0.4);
      }

      // Boost for popular/featured products (only if relevant)
      if (score > 0) {
        if (product.isFeatured) score += 20;
        if (product.isNewProduct) score += 15;
        if (product.soldCount > 10) score += 10;
        if (product.rating >= 4) score += 5;
      }

      return { ...product, searchScore: score };
    });

    // Filter out products with zero or very low scores
    // Very low threshold to be inclusive
    const filtered = scoredProducts
      .filter(p => p.searchScore > 0) // Show anything with any score
      .sort((a, b) => b.searchScore - a.searchScore);
    
    console.log(`🔍 Search "${query}": ${products.length} products checked, ${filtered.length} matched`);
    if (filtered.length > 0) {
      console.log(`📊 Top match: "${filtered[0].name}" (score: ${filtered[0].searchScore})`);
    }
    
    return filtered;
  }

  /**
   * Get all searchable text from a product
   */
  getSearchableText(product) {
    return [
      product.name,
      product.description,
      product.category,
      product.brand,
      product.gender,
      ...(product.tags || []),
      ...(product.colors || []),
      ...(product.material || []),
      ...(product.sizes || [])
    ].filter(Boolean).join(' ');
  }

  /**
   * Enhanced fuzzy matching with Levenshtein distance for typos
   */
  fuzzyMatch(query, text) {
    // Simple character sequence matching
    let score = 0;
    let queryIndex = 0;

    for (let i = 0; i < text.length && queryIndex < query.length; i++) {
      if (text[i] === query[queryIndex]) {
        score++;
        queryIndex++;
      }
    }

    return (score / query.length) * 100;
  }

  /**
   * Levenshtein distance for typo tolerance
   */
  levenshteinDistance(str1, str2) {
    const len1 = str1.length;
    const len2 = str2.length;
    const matrix = [];

    for (let i = 0; i <= len1; i++) {
      matrix[i] = [i];
    }

    for (let j = 0; j <= len2; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= len1; i++) {
      for (let j = 1; j <= len2; j++) {
        if (str1[i - 1] === str2[j - 1]) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }

    return matrix[len1][len2];
  }

  /**
   * Check if two words are similar (typo tolerance)
   */
  isSimilar(word1, word2, maxDistance = 2) {
    if (word1 === word2) return true;
    if (word1.includes(word2) || word2.includes(word1)) return true;
    
    const distance = this.levenshteinDistance(word1.toLowerCase(), word2.toLowerCase());
    return distance <= maxDistance;
  }

  /**
   * Sort products with AI-powered recommendations
   */
  sortProducts(products, sortBy, userPreferences = {}) {
    const sorted = [...products];

    switch (sortBy) {
      case 'relevance':
        // Already sorted by search score
        return sorted;

      case 'price-low':
        return sorted.sort((a, b) => a.price - b.price);

      case 'price-high':
        return sorted.sort((a, b) => b.price - a.price);

      case 'name-asc':
        return sorted.sort((a, b) => a.name.localeCompare(b.name));

      case 'name-desc':
        return sorted.sort((a, b) => b.name.localeCompare(a.name));

      case 'newest':
        return sorted.sort((a, b) => 
          new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
        );

      case 'popular':
        return sorted.sort((a, b) => 
          (b.soldCount || 0) - (a.soldCount || 0)
        );

      case 'rating':
        return sorted.sort((a, b) => 
          (b.rating || 0) - (a.rating || 0)
        );

      case 'stock':
        return sorted.sort((a, b) => 
          (b.stockQuantity || 0) - (a.stockQuantity || 0)
        );

      case 'ai-recommended':
        return this.aiRecommendedSort(sorted, userPreferences);

      default:
        return sorted;
    }
  }

  /**
   * AI-powered recommendation sorting
   */
  aiRecommendedSort(products, userPreferences) {
    return products.map(product => {
      let score = 0;

      // Price preference
      if (userPreferences.preferredPriceRange) {
        const { min, max } = userPreferences.preferredPriceRange;
        if (product.price >= min && product.price <= max) {
          score += 30;
        }
      }

      // Category preference
      if (userPreferences.preferredCategories?.includes(product.category)) {
        score += 25;
      }

      // Color preference
      if (userPreferences.preferredColors?.some(c => 
        product.colors?.includes(c)
      )) {
        score += 15;
      }

      // Popularity
      score += (product.soldCount || 0) * 0.1;

      // Rating
      score += (product.rating || 0) * 5;

      // Stock availability
      if (product.stockQuantity > 0) {
        score += 10;
      }

      // Recency
      const daysSinceCreation = product.createdAt 
        ? (Date.now() - new Date(product.createdAt)) / (1000 * 60 * 60 * 24)
        : 999;
      if (daysSinceCreation < 30) {
        score += 20 - (daysSinceCreation * 0.5);
      }

      return { ...product, aiScore: score };
    }).sort((a, b) => b.aiScore - a.aiScore);
  }

  /**
   * Search orders with AI
   */
  searchOrders(orders, query, filters = {}) {
    if (!query && Object.keys(filters).length === 0) {
      return orders;
    }

    let results = [...orders];

    // Apply AI search if query exists
    if (query && query.trim()) {
      const searchTerms = query.toLowerCase().trim().split(/\s+/);
      
      results = results.filter(order => {
        const searchableText = [
          order.orderNumber,
          order.referenceNumber,
          order.status,
          order.paymentMethod,
          order.shippingAddress?.firstName,
          order.shippingAddress?.lastName,
          order.shippingAddress?.phone,
          order.shippingAddress?.email,
          order.shippingAddress?.city,
          order.customerInfo?.firstName,
          order.customerInfo?.lastName,
          order.customerInfo?.phone,
          order.customerInfo?.email
        ].filter(Boolean).join(' ').toLowerCase();

        return searchTerms.some(term => searchableText.includes(term));
      });
    }

    // Apply filters
    if (filters.status && filters.status !== 'all') {
      results = results.filter(o => o.status === filters.status);
    }

    if (filters.paymentMethod && filters.paymentMethod !== 'all') {
      results = results.filter(o => o.paymentMethod === filters.paymentMethod);
    }

    if (filters.minAmount !== undefined) {
      results = results.filter(o => o.total >= filters.minAmount);
    }

    if (filters.maxAmount !== undefined) {
      results = results.filter(o => o.total <= filters.maxAmount);
    }

    if (filters.dateFrom) {
      results = results.filter(o => 
        new Date(o.createdAt) >= new Date(filters.dateFrom)
      );
    }

    if (filters.dateTo) {
      results = results.filter(o => 
        new Date(o.createdAt) <= new Date(filters.dateTo)
      );
    }

    if (filters.city && filters.city !== 'all') {
      results = results.filter(o => 
        o.shippingAddress?.city?.toLowerCase() === filters.city.toLowerCase()
      );
    }

    return results;
  }

  /**
   * Sort orders
   */
  sortOrders(orders, sortBy) {
    const sorted = [...orders];

    switch (sortBy) {
      case 'date-newest':
        return sorted.sort((a, b) => 
          new Date(b.createdAt) - new Date(a.createdAt)
        );

      case 'date-oldest':
        return sorted.sort((a, b) => 
          new Date(a.createdAt) - new Date(b.createdAt)
        );

      case 'amount-high':
        return sorted.sort((a, b) => b.total - a.total);

      case 'amount-low':
        return sorted.sort((a, b) => a.total - b.total);

      case 'status':
        const statusOrder = ['pending', 'processing', 'paid', 'shipped', 'delivered', 'cancelled'];
        return sorted.sort((a, b) => 
          statusOrder.indexOf(a.status) - statusOrder.indexOf(b.status)
        );

      case 'customer':
        return sorted.sort((a, b) => {
          const nameA = `${a.shippingAddress?.firstName} ${a.shippingAddress?.lastName}`;
          const nameB = `${b.shippingAddress?.firstName} ${b.shippingAddress?.lastName}`;
          return nameA.localeCompare(nameB);
        });

      default:
        return sorted;
    }
  }

  /**
   * Get search suggestions
   */
  getSearchSuggestions(products, query) {
    if (!query || query.length < 2) {
      return [];
    }

    const suggestions = new Set();
    const queryLower = query.toLowerCase();

    products.forEach(product => {
      // Product names
      if (product.name?.toLowerCase().includes(queryLower)) {
        suggestions.add(product.name);
      }

      // Categories
      if (product.category?.toLowerCase().includes(queryLower)) {
        suggestions.add(product.category);
      }

      // Brands
      if (product.brand?.toLowerCase().includes(queryLower)) {
        suggestions.add(product.brand);
      }

      // Tags
      product.tags?.forEach(tag => {
        if (tag.toLowerCase().includes(queryLower)) {
          suggestions.add(tag);
        }
      });
    });

    return Array.from(suggestions).slice(0, 10);
  }

  /**
   * Get filter options from products
   */
  getFilterOptions(products) {
    const categories = new Set();
    const colors = new Set();
    const sizes = new Set();
    const materials = new Set();
    const brands = new Set();
    const genders = new Set();
    let minPrice = Infinity;
    let maxPrice = 0;

    products.forEach(product => {
      if (product.category) categories.add(product.category);
      if (product.brand) brands.add(product.brand);
      if (product.gender) genders.add(product.gender);
      
      product.colors?.forEach(c => colors.add(c));
      product.sizes?.forEach(s => sizes.add(s));
      product.material?.forEach(m => materials.add(m));

      if (product.price < minPrice) minPrice = product.price;
      if (product.price > maxPrice) maxPrice = product.price;
    });

    return {
      categories: Array.from(categories).sort(),
      colors: Array.from(colors).sort(),
      sizes: Array.from(sizes).sort(),
      materials: Array.from(materials).sort(),
      brands: Array.from(brands).sort(),
      genders: Array.from(genders).sort(),
      priceRange: { min: minPrice, max: maxPrice }
    };
  }
}

module.exports = new AISearchService();
