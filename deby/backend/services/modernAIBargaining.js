/**
 * Modern AI Bargaining System
 * LLM-Inspired Intelligent Negotiation Algorithm
 * Uses advanced NLP techniques and psychological negotiation strategies
 */

class ModernAIBargaining {
  constructor() {
    this.config = {
      minProfitMargin: 15,        // Absolute minimum profit (15%)
      targetProfitMargin: 25,     // Ideal profit margin (25%)
      maxDiscount: 10,            // Maximum discount allowed (10%)
      costRatio: 0.65,            // Estimated cost (65% of price)
      maxNegotiationRounds: 4     // Max back-and-forth rounds
    };

    // Personality traits (makes AI feel more human)
    this.personality = {
      tone: 'friendly',           // friendly, professional, casual
      empathy: 0.7,               // 0-1 scale
      firmness: 0.6,              // 0-1 scale (how hard we push back)
      humor: 0.5                  // 0-1 scale (occasional humor)
    };

    // Negotiation tactics library
    this.tactics = {
      'anchor': 'Setting a reference point',
      'scarcity': 'Emphasizing limited availability',
      'reciprocity': 'Give and take',
      'social_proof': 'Others bought at this price',
      'authority': 'Quality justification',
      'commitment': 'Building agreement progressively'
    };
  }

  /**
   * Main AI negotiation engine
   * Analyzes offer using contextual understanding and strategic thinking
   */
  negotiate(productPrice, customerOffer, negotiationHistory = [], productContext = {}) {
    const price = parseFloat(productPrice);
    const offer = parseFloat(customerOffer);

    // Validate inputs
    if (!this._validateInputs(price, offer)) {
      return this._createErrorResponse();
    }

    // Calculate key metrics
    const metrics = this._calculateMetrics(price, offer);
    
    // Analyze negotiation context
    const context = this._analyzeContext(negotiationHistory, metrics, productContext);
    
    // Make strategic decision
    const decision = this._makeStrategicDecision(metrics, context);
    
    // Generate natural language response
    const response = this._generateResponse(decision, metrics, context, productContext);
    
    return response;
  }

  /**
   * Calculate important pricing metrics
   */
  _calculateMetrics(price, offer) {
    const discountRequested = ((price - offer) / price) * 100;
    const estimatedCost = price * this.config.costRatio;
    const minimumAcceptable = estimatedCost * (1 + this.config.minProfitMargin / 100);
    const targetPrice = estimatedCost * (1 + this.config.targetProfitMargin / 100);
    const maxDiscountPrice = price * (1 - this.config.maxDiscount / 100);
    const offerRatio = offer / price;
    const profitAtOffer = offer > estimatedCost ? ((offer - estimatedCost) / offer) * 100 : 0;

    return {
      price,
      offer,
      discountRequested: Math.abs(discountRequested),
      estimatedCost,
      minimumAcceptable: Math.max(minimumAcceptable, maxDiscountPrice),
      targetPrice,
      offerRatio,
      profitAtOffer,
      isReasonable: offer >= minimumAcceptable,
      isGoodDeal: offer >= targetPrice,
      isLowball: offer < minimumAcceptable * 0.7
    };
  }

  /**
   * Analyze negotiation context and customer behavior
   */
  _analyzeContext(history, metrics, productContext) {
    const roundNumber = history.length + 1;
    const isFirstOffer = roundNumber === 1;
    const isFinalRound = roundNumber >= this.config.maxNegotiationRounds;
    
    // Analyze customer behavior pattern
    let customerPattern = 'testing'; // Default
    if (history.length > 0) {
      const lastOffer = history[history.length - 1];
      const improvement = metrics.offer - lastOffer.customerOffer;
      
      if (improvement > 0) {
        customerPattern = 'improving'; // Customer is moving up
      } else if (improvement === 0) {
        customerPattern = 'stubborn'; // Not budging
      } else {
        customerPattern = 'confused'; // Moving down (rare)
      }
    }

    // Determine negotiation phase
    let phase;
    if (isFirstOffer) phase = 'opening';
    else if (isFinalRound) phase = 'closing';
    else if (metrics.isReasonable) phase = 'agreement';
    else phase = 'negotiation';

    return {
      roundNumber,
      isFirstOffer,
      isFinalRound,
      customerPattern,
      phase,
      productContext,
      urgency: isFinalRound ? 'high' : 'medium'
    };
  }

  /**
   * Make strategic decision based on AI analysis
   */
  _makeStrategicDecision(metrics, context) {
    // Extreme lowball (less than 70% of minimum)
    if (metrics.isLowball) {
      return {
        action: 'reject_firm',
        counterOffer: metrics.targetPrice,
        tactic: 'authority',
        reasoning: 'Offer too low - educate customer on value'
      };
    }

    // Below minimum acceptable
    if (!metrics.isReasonable) {
      // On final round, meet in middle if close
      if (context.isFinalRound && metrics.offer >= metrics.minimumAcceptable * 0.85) {
        return {
          action: 'accept_conditional',
          counterOffer: metrics.minimumAcceptable,
          tactic: 'reciprocity',
          reasoning: 'Final round compromise'
        };
      }
      
      return {
        action: 'counter',
        counterOffer: this._calculateSmartCounter(metrics, context),
        tactic: this._selectTactic(context),
        reasoning: 'Below target - counter with psychology'
      };
    }

    // Within acceptable range but below target
    if (metrics.isReasonable && !metrics.isGoodDeal) {
      // Accept if customer is improving and we're near final round
      if (context.customerPattern === 'improving' && context.roundNumber >= 3) {
        return {
          action: 'accept',
          counterOffer: metrics.offer,
          tactic: 'commitment',
          reasoning: 'Good progress - seal the deal'
        };
      }

      // Counter one more time for better price
      return {
        action: 'counter_soft',
        counterOffer: this._calculateSmartCounter(metrics, context),
        tactic: 'reciprocity',
        reasoning: 'Close to deal - gentle nudge upward'
      };
    }

    // At or above target - ACCEPT!
    return {
      action: 'accept',
      counterOffer: metrics.offer,
      tactic: 'commitment',
      reasoning: 'Excellent offer - accept immediately'
    };
  }

  /**
   * Calculate smart counter-offer using AI strategy
   */
  _calculateSmartCounter(metrics, context) {
    const { price, offer, minimumAcceptable, targetPrice } = metrics;
    
    // Strategy: Move toward target in diminishing steps
    const gap = targetPrice - offer;
    const step = gap * (0.7 - (context.roundNumber * 0.15)); // Decrease step each round
    
    let counter = offer + step;
    
    // Ensure we don't go below minimum
    counter = Math.max(counter, minimumAcceptable);
    
    // Add psychological pricing (end in 00, 50, 99)
    counter = this._applyPsychologicalPricing(counter);
    
    return Math.round(counter);
  }

  /**
   * Apply psychological pricing (ends in 00, 50, or 99)
   */
  _applyPsychologicalPricing(price) {
    const rounded = Math.round(price / 100) * 100; // Round to nearest 100
    
    // If very close to a round number, use that
    if (Math.abs(price - rounded) < 30) {
      return rounded;
    }
    
    // Otherwise use .50 or .99 ending
    const base = Math.floor(price / 100) * 100;
    const remainder = price - base;
    
    if (remainder < 30) return base;
    if (remainder < 75) return base + 50;
    return base + 100;
  }

  /**
   * Select negotiation tactic based on context
   */
  _selectTactic(context) {
    const { phase, roundNumber, customerPattern } = context;
    
    if (phase === 'opening') return 'anchor';
    if (phase === 'closing') return 'scarcity';
    if (customerPattern === 'improving') return 'reciprocity';
    if (roundNumber <= 2) return 'authority';
    
    return 'social_proof';
  }

  /**
   * Generate natural, human-like response using NLP techniques
   */
  _generateResponse(decision, metrics, context, productContext) {
    const { action, counterOffer, tactic } = decision;
    const productName = productContext.name || 'this item';
    
    let message = '';
    let emoji = '';

    switch (action) {
      case 'reject_firm':
        message = this._generateFirmRejection(metrics, productName, counterOffer);
        emoji = '🤔';
        break;
        
      case 'counter':
        message = this._generateCounterOffer(metrics, counterOffer, context, productName, tactic);
        emoji = '💭';
        break;
        
      case 'counter_soft':
        message = this._generateSoftCounter(metrics, counterOffer, context, productName);
        emoji = '😊';
        break;
        
      case 'accept':
        message = this._generateAcceptance(metrics, context, productName);
        emoji = '🎉';
        break;
        
      case 'accept_conditional':
        message = this._generateConditionalAccept(metrics, counterOffer, productName);
        emoji = '🤝';
        break;
    }

    return {
      decision: action.includes('accept') ? 'accept' : 'counter',
      counterOffer: Math.round(counterOffer),
      message: message,
      emoji: emoji,
      discount: ((metrics.price - counterOffer) / metrics.price * 100), // Return as number for route
      savings: Math.round(metrics.price - counterOffer),
      roundNumber: context.roundNumber,
      offerAttempt: context.roundNumber, // Add for compatibility
      canNegotiate: context.roundNumber < this.config.maxNegotiationRounds, // Add for compatibility
      tactic: tactic,
      confidence: this._calculateConfidence(metrics),
      reasoning: decision.reasoning
    };
  }

  /**
   * Generate firm rejection message (for lowball offers)
   */
  _generateFirmRejection(metrics, productName, counter) {
    const templates = [
      `I appreciate your interest, but ${metrics.offer.toLocaleString()} RWF is quite low for ${productName}. The quality and value justify ${counter.toLocaleString()} RWF. This is premium stuff! 💎`,
      
      `Hmm, ${metrics.offer.toLocaleString()} RWF? I wish I could! 😅 But at that price, we'd lose money. How about ${counter.toLocaleString()} RWF? That's already a great price for what you're getting.`,
      
      `I get it, everyone loves a good deal! But ${metrics.offer.toLocaleString()} RWF is too low for this quality. Let's meet at ${counter.toLocaleString()} RWF - that's fair for both of us! 🤝`,
      
      `${productName} is high-quality, and ${metrics.offer.toLocaleString()} RWF doesn't reflect that. I can do ${counter.toLocaleString()} RWF - that's ${((metrics.price - counter) / metrics.price * 100).toFixed(0)}% off! Pretty good deal, right? ✨`
    ];
    
    return templates[Math.floor(Math.random() * templates.length)];
  }

  /**
   * Generate counter-offer message with psychological tactics
   */
  _generateCounterOffer(metrics, counter, context, productName, tactic) {
    const discount = ((metrics.price - counter) / metrics.price * 100).toFixed(0);
    const savings = Math.round(metrics.price - counter);
    
    const tacticMessages = {
      anchor: `I love your enthusiasm! For ${productName}, I can offer ${counter.toLocaleString()} RWF - that's ${savings.toLocaleString()} RWF off! That's a solid ${discount}% discount. What do you say? 🎯`,
      
      scarcity: `Great choice! ${productName} is popular. I can do ${counter.toLocaleString()} RWF (${discount}% off), but I can only hold this price for a short time. Interested? ⏰`,
      
      authority: `This is quality merchandise! ${counter.toLocaleString()} RWF reflects the true value. You're getting ${savings.toLocaleString()} RWF off - that's ${discount}%! Premium quality at a discount. 👌`,
      
      social_proof: `Many customers have been happy with ${productName} at ${counter.toLocaleString()} RWF. You're saving ${savings.toLocaleString()} RWF (${discount}% off). Join them? 🌟`,
      
      reciprocity: `I see you're serious! Let me work with you - ${counter.toLocaleString()} RWF and we have a deal. That's ${discount}% off just for you. Fair? 🤝`
    };
    
    return tacticMessages[tactic] || tacticMessages.reciprocity;
  }

  /**
   * Generate soft counter (when close to deal)
   */
  _generateSoftCounter(metrics, counter, context, productName) {
    const templates = [
      `We're really close! Your offer of ${metrics.offer.toLocaleString()} RWF is good, but can we meet at ${counter.toLocaleString()} RWF? Just ${(counter - metrics.offer).toLocaleString()} RWF more and it's yours! 😊`,
      
      `Almost there! I really want to make this work. ${counter.toLocaleString()} RWF and ${productName} is yours. That's only ${(counter - metrics.offer).toLocaleString()} RWF more than your offer. Deal? 🎁`,
      
      `You drive a hard bargain! 😄 Let's seal this at ${counter.toLocaleString()} RWF. You're getting an amazing deal on quality ${productName}. Final offer!`,
      
      `Wow, you're good at this! ${counter.toLocaleString()} RWF is my absolute best price. Take it before I change my mind! 😉`
    ];
    
    return templates[Math.floor(Math.random() * templates.length)];
  }

  /**
   * Generate acceptance message (deal made!)
   */
  _generateAcceptance(metrics, context, productName) {
    const savings = Math.round(metrics.price - metrics.offer);
    const discount = ((savings / metrics.price) * 100).toFixed(0);
    
    const templates = [
      `Deal! 🎉 ${productName} is yours for ${metrics.offer.toLocaleString()} RWF. You saved ${savings.toLocaleString()} RWF (${discount}% off)! Adding to your cart now... 🛒`,
      
      `You got it! ${metrics.offer.toLocaleString()} RWF it is! That's ${savings.toLocaleString()} RWF in savings. Great negotiation! Let's complete this order. ✅`,
      
      `Excellent! We have a deal at ${metrics.offer.toLocaleString()} RWF. You're saving ${discount}%! I'll add this to your cart right away. Happy shopping! 🎊`,
      
      `Sold! ${productName} for ${metrics.offer.toLocaleString()} RWF. Smart negotiating - you saved ${savings.toLocaleString()} RWF! Let's wrap this up. 💼`
    ];
    
    return templates[Math.floor(Math.random() * templates.length)];
  }

  /**
   * Generate conditional acceptance (final compromise)
   */
  _generateConditionalAccept(metrics, counter, productName) {
    return `Alright, final offer: ${counter.toLocaleString()} RWF for ${productName}. This is my absolute lowest. It's a great deal for you, and fair for us. Can we shake on it? 🤝`;
  }

  /**
   * Calculate AI confidence level
   */
  _calculateConfidence(metrics) {
    if (metrics.isGoodDeal) return 0.95;
    if (metrics.isReasonable) return 0.75;
    if (metrics.isLowball) return 0.3;
    return 0.6;
  }

  /**
   * Validate inputs
   */
  _validateInputs(price, offer) {
    return !isNaN(price) && !isNaN(offer) && price > 0 && offer > 0;
  }

  /**
   * Create error response
   */
  _createErrorResponse() {
    return {
      decision: 'reject',
      counterOffer: 0,
      message: "Hmm, I didn't catch that. Could you enter a valid price? 🤔",
      emoji: '❓',
      discount: 0,
      savings: 0,
      offerAttempt: 1,
      canNegotiate: true,
      reasoning: 'Invalid input',
      error: true
    };
  }
}

module.exports = new ModernAIBargaining();
