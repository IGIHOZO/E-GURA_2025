/**
 * Add-On Explanation Service
 * Generates human-readable explanations for product recommendations
 * Uses LLM for natural language, but product selection is deterministic
 */

const REASON_TEMPLATES = {
  COPURCHASE: [
    "Frequently bought together",
    "Customers who bought this also got",
    "Popular combo with your items",
    "Often purchased as a set"
  ],
  ESSENTIAL: [
    "Completes your {category} setup",
    "Essential accessory for your purchase",
    "Don't forget this companion item",
    "Recommended to go with your {item}"
  ],
  CATEGORY_MATCH: [
    "More from {category}",
    "You might also like",
    "Similar items you'll love",
    "Matches your style"
  ],
  COMPATIBILITY: [
    "Compatible with your {item}",
    "Works perfectly with your selection",
    "Designed to pair with your items"
  ],
  PRICE_MATCH: [
    "Great value addition",
    "Fits your budget",
    "Affordable add-on"
  ],
  COMPLEMENT: [
    "Pairs well with your cart",
    "Complete your order",
    "Suggested for you"
  ]
};

const SECTION_HEADLINES = [
  "Complete Your Order",
  "Frequently Bought Together",
  "You Might Also Need",
  "Don't Forget These",
  "Recommended Add-Ons"
];

class AddonExplanationService {
  constructor() {
    this.openaiApiKey = process.env.OPENAI_API_KEY;
    this.useAI = !!this.openaiApiKey;
  }

  /**
   * Generate explanations for recommended add-ons
   * @param {Array} cartItems - Items in cart
   * @param {Array} recommendations - Scored recommendations with reasonCodes
   * @returns {Object} {headline, items: [{productId, reasonShort, reasonDetail}]}
   */
  async generateExplanations(cartItems, recommendations) {
    if (!recommendations || recommendations.length === 0) {
      return { headline: '', items: [] };
    }

    // Try AI-powered explanations first
    if (this.useAI) {
      try {
        const aiExplanations = await this.generateAIExplanations(cartItems, recommendations);
        if (aiExplanations) return aiExplanations;
      } catch (error) {
        console.error('AI explanation failed, using templates:', error.message);
      }
    }

    // Fallback to template-based explanations
    return this.generateTemplateExplanations(cartItems, recommendations);
  }

  /**
   * Generate AI-powered explanations using OpenAI
   */
  async generateAIExplanations(cartItems, recommendations) {
    const prompt = this.buildAIPrompt(cartItems, recommendations);
    
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.openaiApiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: `You are an e-commerce assistant that generates concise, helpful product recommendation explanations. 
              Output ONLY valid JSON. Keep explanations short (under 10 words for short, under 25 for detail).
              Be helpful but not pushy. Focus on practical value.`
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.7,
          max_tokens: 500
        })
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`);
      }

      const data = await response.json();
      const content = data.choices[0]?.message?.content;
      
      if (!content) {
        throw new Error('Empty response from OpenAI');
      }

      // Parse JSON response
      const parsed = JSON.parse(content);
      return this.validateAndCleanAIResponse(parsed, recommendations);

    } catch (error) {
      console.error('generateAIExplanations error:', error);
      return null;
    }
  }

  /**
   * Build prompt for AI explanation generation
   */
  buildAIPrompt(cartItems, recommendations) {
    const cartSummary = cartItems.map(item => ({
      name: item.name,
      category: item.category,
      price: item.price
    }));

    const recSummary = recommendations.map(rec => ({
      id: rec.id,
      name: rec.name,
      category: rec.category,
      price: rec.price,
      reasonCodes: rec.reasonCodes
    }));

    return `Generate product recommendation explanations.

CART ITEMS:
${JSON.stringify(cartSummary, null, 2)}

RECOMMENDED ADD-ONS:
${JSON.stringify(recSummary, null, 2)}

Output JSON format:
{
  "headline": "Short catchy headline for the section",
  "items": [
    {
      "productId": "product-uuid",
      "reasonShort": "Under 10 words",
      "reasonDetail": "Under 25 words explaining why this complements the cart"
    }
  ]
}

Rules:
- Use the exact productId from recommendations
- reasonShort must be catchy and under 10 words
- reasonDetail should explain value to customer
- Don't be pushy or use hard-sell language
- Focus on practical benefits`;
  }

  /**
   * Validate and clean AI response
   */
  validateAndCleanAIResponse(aiResponse, recommendations) {
    const validIds = new Set(recommendations.map(r => r.id?.toString()));
    
    const validItems = (aiResponse.items || [])
      .filter(item => validIds.has(item.productId?.toString()))
      .map(item => ({
        productId: item.productId,
        reasonShort: (item.reasonShort || 'Recommended for you').slice(0, 50),
        reasonDetail: (item.reasonDetail || '').slice(0, 100)
      }));

    return {
      headline: (aiResponse.headline || 'Complete Your Order').slice(0, 50),
      items: validItems
    };
  }

  /**
   * Generate template-based explanations (no AI)
   */
  generateTemplateExplanations(cartItems, recommendations) {
    const cartCategories = [...new Set(cartItems.map(i => i.category).filter(Boolean))];
    const cartItemNames = cartItems.map(i => i.name).filter(Boolean);
    
    // Pick headline based on primary reason
    const primaryReason = this.getPrimaryReason(recommendations);
    const headline = this.selectHeadline(primaryReason);

    const items = recommendations.map(rec => {
      const reasonCode = rec.reasonCodes?.[0]?.code || 'COMPLEMENT';
      const template = this.selectTemplate(reasonCode);
      
      // Fill in template variables
      const reasonShort = this.fillTemplate(template, {
        category: rec.category || cartCategories[0] || 'items',
        item: cartItemNames[0] || 'your purchase'
      });

      const reasonDetail = this.generateDetailedReason(rec, cartItems);

      return {
        productId: rec.id,
        reasonShort,
        reasonDetail
      };
    });

    return { headline, items };
  }

  /**
   * Get primary reason from recommendations
   */
  getPrimaryReason(recommendations) {
    const reasonCounts = {};
    
    for (const rec of recommendations) {
      const code = rec.reasonCodes?.[0]?.code || 'COMPLEMENT';
      reasonCounts[code] = (reasonCounts[code] || 0) + 1;
    }

    return Object.entries(reasonCounts)
      .sort((a, b) => b[1] - a[1])[0]?.[0] || 'COMPLEMENT';
  }

  /**
   * Select appropriate headline
   */
  selectHeadline(primaryReason) {
    switch (primaryReason) {
      case 'COPURCHASE':
        return 'Frequently Bought Together';
      case 'ESSENTIAL':
        return "Don't Forget These";
      case 'CATEGORY_MATCH':
        return 'You Might Also Like';
      default:
        return 'Complete Your Order';
    }
  }

  /**
   * Select template for reason code
   */
  selectTemplate(reasonCode) {
    const templates = REASON_TEMPLATES[reasonCode] || REASON_TEMPLATES.COMPLEMENT;
    return templates[Math.floor(Math.random() * templates.length)];
  }

  /**
   * Fill template variables
   */
  fillTemplate(template, vars) {
    let result = template;
    for (const [key, value] of Object.entries(vars)) {
      result = result.replace(`{${key}}`, value);
    }
    return result;
  }

  /**
   * Generate detailed reason based on scores
   */
  generateDetailedReason(recommendation, cartItems) {
    const { scores, matchedKeyword, category } = recommendation;
    
    if (scores?.copurchase > 0.5) {
      return `Customers who bought similar items often add this ${category || 'product'} to their order.`;
    }
    
    if (scores?.essential > 0.5 && matchedKeyword) {
      return `This ${matchedKeyword} pairs perfectly with your selection.`;
    }
    
    if (scores?.category > 0.3) {
      return `A popular choice in ${category || 'this category'} that matches your taste.`;
    }

    return `A great addition to complete your shopping.`;
  }

  /**
   * Format final response for API
   */
  formatResponse(explanations, recommendations) {
    const explanationMap = new Map(
      explanations.items.map(e => [e.productId?.toString(), e])
    );

    return {
      headline: explanations.headline,
      recommendations: recommendations.map(rec => {
        const explanation = explanationMap.get(rec.id?.toString()) || {};
        
        return {
          id: rec.id,
          name: rec.name,
          price: parseFloat(rec.price),
          originalPrice: rec.originalPrice ? parseFloat(rec.originalPrice) : null,
          discountPercentage: rec.discountPercentage || 0,
          mainImage: rec.mainImage,
          category: rec.category,
          stockQuantity: rec.stockQuantity,
          averageRating: parseFloat(rec.averageRating) || 0,
          totalReviews: rec.totalReviews || 0,
          reasonShort: explanation.reasonShort || 'Recommended for you',
          reasonDetail: explanation.reasonDetail || '',
          score: rec.finalScore,
          reasonCodes: rec.reasonCodes
        };
      })
    };
  }
}

module.exports = new AddonExplanationService();
