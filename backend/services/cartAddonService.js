/**
 * Cart Add-On Recommendation Service
 * Intelligent product suggestions for cart/checkout
 * Uses hybrid scoring: co-purchase + category match + compatibility + rules
 */

const { sequelize } = require('../config/database');
const { QueryTypes, Op } = require('sequelize');

// Scoring weights - Essential items get highest priority
const WEIGHTS = {
  COPURCHASE: 0.25,
  CATEGORY_MATCH: 0.15,
  ESSENTIAL: 0.40,  // Highest weight for essential accessories
  PRICE_AFFINITY: 0.10,
  MARGIN_BOOST: 0.05,
  AVAILABILITY: 0.05
};

// Essential product rules (product keyword -> complementary accessories)
// This is a comprehensive mapping that works for ANY product
const ESSENTIAL_RULES = {
  // Electronics
  'phone': ['case', 'screen protector', 'charger', 'earphones', 'power bank', 'holder', 'stand'],
  'iphone': ['case', 'screen protector', 'charger', 'earphones', 'power bank', 'airpods'],
  'smartphone': ['case', 'screen protector', 'charger', 'earphones', 'power bank'],
  'samsung': ['case', 'screen protector', 'charger', 'earphones', 'power bank'],
  'laptop': ['bag', 'mouse', 'keyboard', 'stand', 'hub', 'sleeve', 'charger', 'cooling pad'],
  'computer': ['mouse', 'keyboard', 'monitor', 'speakers', 'webcam'],
  'tablet': ['case', 'stylus', 'keyboard', 'screen protector', 'stand'],
  'ipad': ['case', 'pencil', 'keyboard', 'screen protector', 'stand'],
  'camera': ['bag', 'memory card', 'tripod', 'lens', 'strap', 'cleaning kit'],
  'printer': ['ink', 'paper', 'cable', 'toner'],
  'headphones': ['case', 'ear cushions', 'cable', 'stand'],
  'earphones': ['case', 'tips', 'cable', 'pouch'],
  'airpods': ['case', 'strap', 'cleaning kit'],
  'speaker': ['cable', 'stand', 'mount'],
  'tv': ['mount', 'cable', 'remote', 'soundbar', 'hdmi'],
  'monitor': ['stand', 'cable', 'mount', 'arm'],
  'charger': ['cable', 'stand', 'organizer', 'adapter'],
  'cable': ['organizer', 'clip', 'holder'],
  'keyboard': ['mouse', 'wrist rest', 'cover', 'pad'],
  'mouse': ['pad', 'wrist rest', 'holder'],
  'watch': ['strap', 'charger', 'case', 'stand', 'band'],
  'smartwatch': ['strap', 'charger', 'screen protector', 'band'],
  
  // Fashion - Women
  'dress': ['belt', 'jewelry', 'handbag', 'scarf', 'heels', 'clutch'],
  'skirt': ['blouse', 'belt', 'tights', 'heels'],
  'blouse': ['skirt', 'pants', 'cardigan', 'necklace'],
  'heels': ['bag', 'jewelry', 'dress'],
  'handbag': ['wallet', 'scarf', 'keychain', 'organizer'],
  'jewelry': ['box', 'cleaner', 'pouch'],
  'necklace': ['earrings', 'bracelet', 'box'],
  'earrings': ['necklace', 'bracelet', 'box'],
  
  // Fashion - Men
  'suit': ['tie', 'cufflinks', 'pocket square', 'belt', 'dress shoes'],
  'shirt': ['tie', 'cufflinks', 'undershirt', 'belt'],
  'tie': ['clip', 'pin', 'pocket square'],
  'pants': ['belt', 'socks', 'shoes'],
  'jeans': ['belt', 't-shirt', 'sneakers'],
  
  // Fashion - General
  'shoes': ['socks', 'insoles', 'laces', 'cleaner', 'bag', 'polish'],
  'sneakers': ['socks', 'insoles', 'laces', 'cleaner'],
  'boots': ['socks', 'polish', 'laces', 'waterproof spray'],
  'sandals': ['foot cream', 'pedicure kit'],
  'bag': ['wallet', 'keychain', 'organizer', 'strap'],
  'wallet': ['keychain', 'card holder', 'money clip'],
  'belt': ['wallet', 'buckle'],
  'hat': ['sunglasses', 'scarf'],
  'sunglasses': ['case', 'cleaner', 'strap'],
  'scarf': ['gloves', 'hat', 'pin'],
  'gloves': ['scarf', 'hat'],
  
  // Sports & Fitness
  'yoga mat': ['blocks', 'strap', 'towel', 'bag'],
  'gym': ['bottle', 'towel', 'bag', 'gloves', 'belt'],
  'dumbbell': ['mat', 'gloves', 'bench'],
  'bicycle': ['helmet', 'lock', 'pump', 'light', 'bell'],
  'football': ['pump', 'bag', 'shin guards', 'socks'],
  'basketball': ['pump', 'bag', 'shoes'],
  'tennis': ['balls', 'bag', 'grip', 'shoes'],
  'swimming': ['goggles', 'cap', 'towel', 'bag'],
  'running': ['shoes', 'socks', 'watch', 'bottle', 'armband'],
  
  // Home & Kitchen
  'bed': ['pillows', 'sheets', 'protector', 'blanket', 'duvet'],
  'mattress': ['protector', 'pillows', 'sheets', 'topper'],
  'pillow': ['case', 'protector'],
  'sofa': ['cushions', 'blanket', 'cover', 'table'],
  'chair': ['cushion', 'cover', 'mat'],
  'table': ['cloth', 'mat', 'runner', 'centerpiece'],
  'lamp': ['bulb', 'shade', 'cord'],
  'curtain': ['rod', 'hooks', 'ties'],
  'rug': ['pad', 'cleaner'],
  'pot': ['lid', 'holder', 'trivet'],
  'pan': ['lid', 'spatula', 'oil'],
  'knife': ['sharpener', 'block', 'cover'],
  'blender': ['jar', 'blade', 'lid'],
  'coffee': ['filter', 'mug', 'grinder', 'sugar'],
  
  // Beauty & Personal Care
  'makeup': ['brush', 'sponge', 'remover', 'bag', 'mirror'],
  'lipstick': ['liner', 'gloss', 'balm'],
  'foundation': ['brush', 'sponge', 'primer', 'powder'],
  'mascara': ['curler', 'remover'],
  'perfume': ['lotion', 'deodorant', 'gift set'],
  'skincare': ['cleanser', 'toner', 'moisturizer', 'serum'],
  'hair': ['brush', 'clips', 'ties', 'spray', 'oil'],
  'shampoo': ['conditioner', 'mask', 'brush'],
  'razor': ['blades', 'cream', 'aftershave'],
  
  // Kids & Baby
  'baby': ['diapers', 'wipes', 'cream', 'powder', 'bottle'],
  'diaper': ['wipes', 'cream', 'bag'],
  'bottle': ['nipple', 'brush', 'warmer', 'sterilizer'],
  'stroller': ['cover', 'organizer', 'toy', 'blanket'],
  'toy': ['batteries', 'storage', 'mat'],
  
  // Office & Stationery
  'pen': ['refill', 'case', 'notebook'],
  'notebook': ['pen', 'highlighter', 'sticky notes'],
  'desk': ['organizer', 'lamp', 'mat', 'chair'],
  'file': ['folder', 'label', 'divider'],
  
  // Automotive
  'car': ['freshener', 'cleaner', 'mat', 'cover', 'charger'],
  'tire': ['pump', 'gauge', 'cleaner'],
};

// Products that should NOT be suggested as add-ons (expensive main items)
const MAIN_PRODUCTS = [
  'phone', 'iphone', 'samsung', 'smartphone',
  'laptop', 'computer', 'macbook', 'pc',
  'camera', 'dslr', 'mirrorless',
  'tv', 'television', 'smart tv',
  'tablet', 'ipad',
  'refrigerator', 'fridge', 'washing machine',
  'air conditioner', 'ac',
  'car', 'motorcycle', 'bicycle'
];

class CartAddonService {
  constructor() {
    this.cache = new Map();
    this.cacheTTL = 60000; // 1 minute for cart recommendations
  }

  /**
   * Get add-on recommendations for cart items
   * @param {Array} cartItems - Items in cart [{productId, name, category, price, quantity}]
   * @param {Object} options - {userId, sessionId, limit}
   * @returns {Array} Recommended add-ons with scores and reasons
   */
  async getCartAddons(cartItems, options = {}) {
    const { userId, sessionId, limit = 1 } = options; // Default to 1 recommendation
    
    // Validate input
    if (!cartItems || !Array.isArray(cartItems) || cartItems.length === 0) {
      return [];
    }

    try {
      // Extract cart product IDs safely
      const cartProductIds = cartItems
        .map(item => item.productId || item.id || item._id)
        .filter(Boolean);
      
      if (cartProductIds.length === 0) {
        console.log('📊 No valid product IDs in cart');
        return [];
      }

      const cartPriceRange = this.calculatePriceRange(cartItems);

      // ONLY get essential candidates - truly related products
      const essentialCandidates = await this.getEssentialCandidates(cartItems, cartProductIds, 10);
      
      // If no essential matches, return empty (don't show random category items)
      if (!essentialCandidates || essentialCandidates.length === 0) {
        console.log('📊 No essential add-ons found - hiding section');
        return [];
      }

      // Filter out main products (don't suggest iPhone when buying charger)
      const filteredCandidates = essentialCandidates.filter(candidate => {
        const name = (candidate.name || '').toLowerCase();
        return !MAIN_PRODUCTS.some(mainProd => name.includes(mainProd));
      });

      if (filteredCandidates.length === 0) {
        console.log('📊 All candidates were main products - hiding section');
        return [];
      }
      
      console.log(`📊 Essential candidates: ${essentialCandidates.length}, after filtering: ${filteredCandidates.length}`);

      // Score each candidate
      const scoredCandidates = await this.scoreCandidates(
        filteredCandidates,
        cartItems,
        cartPriceRange,
        [] // No copurchase data needed
      );

      // Add randomization factor to prevent fixed suggestions
      const randomizedCandidates = scoredCandidates.map(candidate => ({
        ...candidate,
        // Add random boost (0-0.3) to mix up results
        randomBoost: Math.random() * 0.3,
        finalScore: candidate.finalScore + (Math.random() * 0.3)
      }));

      // Sort by randomized score and get top candidates
      const sortedCandidates = randomizedCandidates
        .sort((a, b) => b.finalScore - a.finalScore);
      
      // If multiple candidates have similar scores, pick randomly from top 3
      const topCandidates = sortedCandidates.slice(0, Math.min(3, sortedCandidates.length));
      const selectedIndex = Math.floor(Math.random() * topCandidates.length);
      const topRecommendations = [topCandidates[selectedIndex]].filter(Boolean);

      console.log(`📊 Selected add-on: ${topRecommendations[0]?.name || 'none'} (from ${topCandidates.length} candidates)`);

      // Add reason codes for LLM explanation
      return topRecommendations.map(rec => ({
        ...rec,
        reasonCodes: this.getReasonCodes(rec)
      }));

    } catch (error) {
      console.error('CartAddonService.getCartAddons error:', error);
      return [];
    }
  }

  /**
   * Get products frequently bought together (co-purchase analysis)
   */
  async getCopurchaseCandidates(cartProductIds, limit) {
    if (cartProductIds.length === 0) return [];

    try {
      // Query orders containing cart products and find other products in those orders
      const query = `
        WITH cart_orders AS (
          SELECT DISTINCT o.id, o.items
          FROM "Orders" o
          WHERE o.status IN ('delivered', 'shipped', 'confirmed')
            AND o.items IS NOT NULL
            AND EXISTS (
              SELECT 1 FROM jsonb_array_elements(o.items) AS item
              WHERE item->>'productId' = ANY(ARRAY[:cartProductIds]::text[])
                 OR item->>'id' = ANY(ARRAY[:cartProductIds]::text[])
            )
        ),
        copurchased AS (
          SELECT 
            item->>'productId' AS product_id,
            item->>'id' AS alt_id,
            item->>'name' AS product_name,
            COUNT(DISTINCT co.id) AS copurchase_count
          FROM cart_orders co,
               jsonb_array_elements(co.items) AS item
          WHERE (item->>'productId' IS NOT NULL OR item->>'id' IS NOT NULL)
            AND item->>'productId' NOT IN (SELECT unnest(ARRAY[:cartProductIds]::text[]))
            AND (item->>'id' IS NULL OR item->>'id' NOT IN (SELECT unnest(ARRAY[:cartProductIds]::text[])))
          GROUP BY item->>'productId', item->>'id', item->>'name'
          ORDER BY copurchase_count DESC
          LIMIT :limit
        )
        SELECT 
          p.*,
          COALESCE(cp.copurchase_count, 0) AS copurchase_count
        FROM "Products" p
        INNER JOIN copurchased cp ON (p.id::text = cp.product_id OR p.id::text = cp.alt_id)
        WHERE p."isActive" = true
          AND p."stockQuantity" > 0
        ORDER BY cp.copurchase_count DESC
        LIMIT :limit
      `;

      const results = await sequelize.query(query, {
        replacements: { cartProductIds, limit },
        type: QueryTypes.SELECT
      });

      return results.map(r => ({
        ...r,
        source: 'copurchase',
        copurchaseScore: Math.min(1, r.copurchase_count / 10) // Normalize to 0-1
      }));

    } catch (error) {
      console.error('getCopurchaseCandidates error:', error);
      return [];
    }
  }

  /**
   * Get products from same/related categories
   */
  async getCategoryCandidates(categories, excludeIds, limit) {
    if (categories.length === 0) return [];

    try {
      const query = `
        SELECT p.*
        FROM "Products" p
        WHERE p.category = ANY(ARRAY[:categories]::text[])
          AND p."isActive" = true
          AND p."stockQuantity" > 0
          AND p.id::text NOT IN (SELECT unnest(ARRAY[:excludeIds]::text[]))
        ORDER BY p."salesCount" DESC, p."averageRating" DESC
        LIMIT :limit
      `;

      const results = await sequelize.query(query, {
        replacements: { categories, excludeIds, limit },
        type: QueryTypes.SELECT
      });

      return results.map(r => ({
        ...r,
        source: 'category',
        categoryScore: 0.5
      }));

    } catch (error) {
      console.error('getCategoryCandidates error:', error);
      return [];
    }
  }

  /**
   * Get essential/complementary products based on rules
   * Works dynamically for ANY product type
   */
  async getEssentialCandidates(cartItems, excludeIds, limit) {
    const essentialKeywords = [];

    // Build list of essential keywords from cart items
    for (const item of cartItems) {
      const name = (item.name || '').toLowerCase();
      const category = (item.category || '').toLowerCase();
      
      // Check ALL rules - find matches in product name
      for (const [trigger, accessories] of Object.entries(ESSENTIAL_RULES)) {
        const triggerLower = trigger.toLowerCase();
        
        // Match if product name contains the trigger keyword
        if (name.includes(triggerLower)) {
          essentialKeywords.push(...accessories);
          console.log(`🔗 Matched "${trigger}" in "${item.name}" → [${accessories.join(', ')}]`);
        }
      }
      
      // Also check category for broader matches
      for (const [trigger, accessories] of Object.entries(ESSENTIAL_RULES)) {
        const triggerLower = trigger.toLowerCase();
        if (category.includes(triggerLower) && !name.includes(triggerLower)) {
          // Only add if not already matched by name
          essentialKeywords.push(...accessories.slice(0, 2)); // Limit category matches
        }
      }
    }

    // Remove duplicates
    const uniqueKeywords = [...new Set(essentialKeywords)];
    
    if (uniqueKeywords.length === 0) {
      console.log('📊 No essential keywords found for cart items');
      return [];
    }

    try {
      // Search for products matching essential keywords
      const keywordPatterns = uniqueKeywords.map(k => `%${k}%`);
      console.log('🔍 Essential keywords for cart:', uniqueKeywords);
      
      // Add RANDOM() to shuffle results - prevents same product always showing
      const query = `
        SELECT p.*, 'essential' AS match_type
        FROM "Products" p
        WHERE p."isActive" = true
          AND p."stockQuantity" > 0
          AND p.id::text NOT IN (SELECT unnest(ARRAY[:excludeIds]::text[]))
          AND (
            ${keywordPatterns.map((_, i) => `LOWER(p.name) LIKE :kw${i}`).join(' OR ')}
            OR ${keywordPatterns.map((_, i) => `LOWER(p.category) LIKE :kw${i}`).join(' OR ')}
          )
        ORDER BY RANDOM(), p."salesCount" DESC
        LIMIT :limit
      `;

      const replacements = { excludeIds, limit };
      keywordPatterns.forEach((kw, i) => {
        replacements[`kw${i}`] = kw;
      });

      const results = await sequelize.query(query, {
        replacements,
        type: QueryTypes.SELECT
      });

      console.log(`🎯 Essential query found ${results.length} products`);
      return results.map(r => {
        const matchedKw = uniqueKeywords.find(k => 
          r.name.toLowerCase().includes(k) || 
          (r.category || '').toLowerCase().includes(k)
        );
        console.log(`  - ${r.name} matched keyword: ${matchedKw}`);
        return {
          ...r,
          source: 'essential',
          essentialScore: 0.9, // High score for essential items
          matchedKeyword: matchedKw
        };
      });

    } catch (error) {
      console.error('getEssentialCandidates error:', error);
      return [];
    }
  }

  /**
   * Merge and deduplicate candidates
   */
  mergeCandidates(candidates, excludeIds) {
    const seen = new Set(excludeIds.map(id => id.toString()));
    const merged = [];

    for (const candidate of candidates) {
      const id = candidate.id?.toString();
      if (!id || seen.has(id)) continue;
      
      seen.add(id);
      merged.push(candidate);
    }

    return merged;
  }

  /**
   * Score candidates using hybrid scoring
   */
  async scoreCandidates(candidates, cartItems, priceRange, copurchaseData) {
    const copurchaseMap = new Map(
      copurchaseData.map(c => [c.id?.toString(), c.copurchaseScore || 0])
    );

    return candidates.map(candidate => {
      const scores = {
        copurchase: copurchaseMap.get(candidate.id?.toString()) || 0,
        category: candidate.categoryScore || 0,
        essential: candidate.essentialScore || 0,
        priceAffinity: this.calculatePriceAffinity(candidate.price, priceRange),
        availability: candidate.stockQuantity > 10 ? 1 : candidate.stockQuantity / 10,
        marginBoost: this.calculateMarginBoost(candidate)
      };

      // Calculate weighted final score
      const finalScore = 
        (scores.copurchase * WEIGHTS.COPURCHASE) +
        (scores.category * WEIGHTS.CATEGORY_MATCH) +
        (scores.essential * WEIGHTS.ESSENTIAL) +
        (scores.priceAffinity * WEIGHTS.PRICE_AFFINITY) +
        (scores.availability * WEIGHTS.AVAILABILITY) +
        (scores.marginBoost * WEIGHTS.MARGIN_BOOST);

      return {
        ...candidate,
        scores,
        finalScore
      };
    });
  }

  /**
   * Calculate price affinity score (prefer items within cart price range)
   */
  calculatePriceAffinity(candidatePrice, cartPriceRange) {
    if (!candidatePrice || !cartPriceRange) return 0.5;

    const price = parseFloat(candidatePrice);
    const { min, max, avg } = cartPriceRange;

    // Perfect score if within 50% of average cart item price
    if (price >= avg * 0.5 && price <= avg * 1.5) {
      return 1;
    }
    
    // Good score if within cart price range
    if (price >= min * 0.5 && price <= max * 2) {
      return 0.7;
    }

    // Lower score for items far outside range
    return 0.3;
  }

  /**
   * Calculate margin boost (slight preference for higher-margin items)
   */
  calculateMarginBoost(candidate) {
    // If we have discount info, lower margin items get lower boost
    if (candidate.discountPercentage > 50) return 0.3;
    if (candidate.discountPercentage > 30) return 0.5;
    if (candidate.discountPercentage > 0) return 0.7;
    return 1; // Full price items assumed higher margin
  }

  /**
   * Calculate price range from cart items
   */
  calculatePriceRange(cartItems) {
    const prices = cartItems
      .map(item => parseFloat(item.price))
      .filter(p => !isNaN(p) && p > 0);

    if (prices.length === 0) {
      return { min: 0, max: 100000, avg: 50000 };
    }

    return {
      min: Math.min(...prices),
      max: Math.max(...prices),
      avg: prices.reduce((a, b) => a + b, 0) / prices.length
    };
  }

  /**
   * Get reason codes for LLM explanation
   */
  getReasonCodes(recommendation) {
    const codes = [];
    const { scores, source, matchedKeyword } = recommendation;

    if (scores.copurchase > 0.3) {
      codes.push({ code: 'COPURCHASE', weight: scores.copurchase });
    }
    if (scores.essential > 0.5) {
      codes.push({ 
        code: 'ESSENTIAL', 
        weight: scores.essential,
        keyword: matchedKeyword 
      });
    }
    if (scores.category > 0.3) {
      codes.push({ code: 'CATEGORY_MATCH', weight: scores.category });
    }
    if (scores.priceAffinity > 0.8) {
      codes.push({ code: 'PRICE_MATCH', weight: scores.priceAffinity });
    }

    // Add primary reason based on source
    if (source === 'copurchase' && !codes.find(c => c.code === 'COPURCHASE')) {
      codes.unshift({ code: 'COPURCHASE', weight: 0.5 });
    }
    if (source === 'essential' && !codes.find(c => c.code === 'ESSENTIAL')) {
      codes.unshift({ code: 'ESSENTIAL', weight: 0.5 });
    }

    return codes.length > 0 ? codes : [{ code: 'COMPLEMENT', weight: 0.5 }];
  }

  /**
   * Track cart event for future analysis
   */
  async trackCartEvent(eventData) {
    const { sessionId, userId, productId, eventType, quantity, cartSnapshot, metadata } = eventData;

    try {
      await sequelize.query(`
        INSERT INTO "CartEvents" 
        ("id", "sessionId", "userId", "productId", "eventType", "quantity", "cartSnapshot", "metadata", "createdAt", "updatedAt")
        VALUES (
          gen_random_uuid(),
          :sessionId,
          :userId,
          :productId,
          :eventType,
          :quantity,
          :cartSnapshot,
          :metadata,
          NOW(),
          NOW()
        )
      `, {
        replacements: {
          sessionId: sessionId || 'anonymous',
          userId: userId || null,
          productId,
          eventType,
          quantity: quantity || 1,
          cartSnapshot: JSON.stringify(cartSnapshot || []),
          metadata: JSON.stringify(metadata || {})
        },
        type: QueryTypes.INSERT
      });

      return true;
    } catch (error) {
      console.error('trackCartEvent error:', error);
      return false;
    }
  }

  /**
   * Recalculate product relationships (run periodically)
   */
  async recalculateRelationships() {
    try {
      console.log('Starting relationship recalculation...');

      // Calculate co-purchase relationships from orders
      const copurchaseQuery = `
        WITH order_pairs AS (
          SELECT 
            item1->>'productId' AS product1_id,
            item2->>'productId' AS product2_id,
            COUNT(*) AS pair_count
          FROM "Orders" o,
               jsonb_array_elements(o.items) AS item1,
               jsonb_array_elements(o.items) AS item2
          WHERE o.status IN ('delivered', 'shipped', 'confirmed')
            AND item1->>'productId' IS NOT NULL
            AND item2->>'productId' IS NOT NULL
            AND item1->>'productId' != item2->>'productId'
          GROUP BY item1->>'productId', item2->>'productId'
          HAVING COUNT(*) >= 2
        )
        INSERT INTO "ProductRelations" 
        ("id", "productId", "relatedProductId", "relationType", "score", "copurchaseCount", "lastCalculated", "createdAt", "updatedAt")
        SELECT 
          gen_random_uuid(),
          product1_id::uuid,
          product2_id::uuid,
          'copurchase',
          LEAST(1, pair_count::decimal / 10),
          pair_count,
          NOW(),
          NOW(),
          NOW()
        FROM order_pairs
        ON CONFLICT ("productId", "relatedProductId") 
        DO UPDATE SET 
          score = EXCLUDED.score,
          "copurchaseCount" = EXCLUDED."copurchaseCount",
          "lastCalculated" = NOW(),
          "updatedAt" = NOW()
      `;

      await sequelize.query(copurchaseQuery, { type: QueryTypes.INSERT });
      console.log('Relationship recalculation complete');
      return true;

    } catch (error) {
      console.error('recalculateRelationships error:', error);
      return false;
    }
  }
}

module.exports = new CartAddonService();
