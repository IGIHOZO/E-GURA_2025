/**
 * AI Bargaining Algorithm
 * Smart price negotiation system for E-Gura Store
 */

class AIBargaining {
  constructor() {
    // Bargaining configuration - 10% FINAL OFFER
    this.config = {
      minDiscountPercent: 2,       // Minimum discount we can offer
      maxDiscountPercent: 10,      // FINAL MAXIMUM: 10% discount
      targetProfitMargin: 25,      // Target profit margin % to maintain
      minimumProfitMargin: 15,     // Absolute minimum profit margin %
      counterOfferTimes: 4,        // Max times we counter-offer
      sweetSpotDiscount: 8,        // Ideal discount %
      finalOfferDiscount: 10,      // FINAL OFFER: Always 10%
      costRatio: 0.65,             // Assume product cost is 65% of price
      aggressiveThreshold: 0.8     // If offer is below this ratio, be aggressive
    };
  }

  /**
   * Analyze customer offer and generate AI response
   */
  analyzeOffer(productPrice, customerOffer, offerHistory = []) {
    const originalPrice = parseFloat(productPrice);
    const offeredPrice = parseFloat(customerOffer);
    
    // Validate inputs
    if (isNaN(originalPrice) || isNaN(offeredPrice) || originalPrice <= 0 || offeredPrice <= 0) {
      console.error('❌ Invalid price values:', { originalPrice, offeredPrice });
      return {
        decision: 'reject',
        counterOffer: originalPrice,
        message: 'Invalid offer. Please enter a valid price! 🔢',
        reasoning: 'Invalid input validation failed',
        discount: 0,
        savings: 0,
        offerAttempt: offerHistory.length + 1,
        canNegotiate: true
      };
    }

    const discountRequested = ((originalPrice - offeredPrice) / originalPrice) * 100;

    // Calculate profit-based thresholds
    const estimatedCost = originalPrice * this.config.costRatio;
    const minimumPrice = estimatedCost * (1 + this.config.minimumProfitMargin / 100);
    const targetPrice = estimatedCost * (1 + this.config.targetProfitMargin / 100);
    
    console.log('📊 Analyzing offer:', {
      originalPrice: originalPrice.toLocaleString(),
      offeredPrice: offeredPrice.toLocaleString(),
      discountRequested: discountRequested.toFixed(2) + '%',
      estimatedCost: estimatedCost.toLocaleString(),
      minimumPrice: minimumPrice.toLocaleString(),
      targetPrice: targetPrice.toLocaleString(),
      offerAttempts: offerHistory.length
    });

    // Calculate acceptable price range with profit protection
    const minAcceptablePrice = Math.max(
      minimumPrice,
      originalPrice * (1 - this.config.maxDiscountPercent / 100)
    );
    const maxAcceptablePrice = originalPrice * (1 - this.config.minDiscountPercent / 100);
    const sweetSpotPrice = Math.max(
      targetPrice,
      originalPrice * (1 - this.config.sweetSpotDiscount / 100)
    );

    // Decision logic
    let decision;
    let counterOffer;
    let message;
    let reasoning;

    // 1. If offer is too low (below minimum acceptable)
    if (offeredPrice < minAcceptablePrice) {
      decision = 'reject';
      counterOffer = this.generateCounterOffer(originalPrice, offeredPrice, offerHistory);
      message = this.generateRejectionMessage(discountRequested, counterOffer, originalPrice);
      reasoning = `Offer is ${discountRequested.toFixed(1)}% below price. Below our ${this.config.maxDiscountPercent}% max discount.`;
    }
    // 2. If offer is in acceptable range (above min, below max)
    else if (offeredPrice >= minAcceptablePrice && offeredPrice < sweetSpotPrice) {
      // Check if we should accept or counter based on attempts
      if (offerHistory.length >= this.config.counterOfferTimes - 1) {
        // Final attempt - accept
        decision = 'accept';
        counterOffer = offeredPrice;
        message = this.generateAcceptanceMessage(offeredPrice, originalPrice);
        reasoning = `After ${offerHistory.length + 1} rounds, accepting ${discountRequested.toFixed(1)}% discount.`;
      } else {
        // Still have room to negotiate
        decision = 'counter';
        counterOffer = this.generateCounterOffer(originalPrice, offeredPrice, offerHistory);
        message = this.generateCounterMessage(counterOffer, offeredPrice, offerHistory.length + 1);
        reasoning = `Offer acceptable but countering for better price. Attempt ${offerHistory.length + 1}/${this.config.counterOfferTimes}`;
      }
    }
    // 3. If offer is at sweet spot or higher
    else if (offeredPrice >= sweetSpotPrice) {
      decision = 'accept';
      counterOffer = offeredPrice;
      message = this.generateAcceptanceMessage(offeredPrice, originalPrice);
      reasoning = `Great offer! ${discountRequested.toFixed(1)}% discount is acceptable.`;
    }
    // 4. If offer is above max acceptable (too close to original price)
    else {
      decision = 'accept';
      counterOffer = offeredPrice;
      message = this.generateAcceptanceMessage(offeredPrice, originalPrice);
      reasoning = `Excellent offer with only ${discountRequested.toFixed(1)}% discount.`;
    }

    return {
      decision,          // 'accept', 'reject', 'counter'
      counterOffer,      // AI's counter price
      message,           // Human-readable message
      reasoning,         // AI's reasoning
      discount: ((originalPrice - counterOffer) / originalPrice) * 100,
      savings: originalPrice - counterOffer,
      offerAttempt: offerHistory.length + 1,
      canNegotiate: offerHistory.length < this.config.counterOfferTimes
    };
  }

  /**
   * Generate smart counter-offer with profit protection
   */
  generateCounterOffer(originalPrice, customerOffer, offerHistory) {
    const discountRequested = ((originalPrice - customerOffer) / originalPrice) * 100;
    const offerRatio = customerOffer / originalPrice;
    
    // Calculate profit thresholds
    const estimatedCost = originalPrice * this.config.costRatio;
    const minimumPrice = estimatedCost * (1 + this.config.minimumProfitMargin / 100);
    const targetPrice = estimatedCost * (1 + this.config.targetProfitMargin / 100);
    
    // Progressive discounts leading to 10% final offer
    const attemptNumber = offerHistory.length + 1;
    const finalDiscount = this.config.finalOfferDiscount; // Always 10%
    const minDiscount = this.config.minDiscountPercent;
    
    let counterDiscount;
    
    // FIXED PROGRESSION TO 10% FINAL
    if (attemptNumber === 1) {
      counterDiscount = 3;  // First: 3% discount
    } else if (attemptNumber === 2) {
      counterDiscount = 5;  // Second: 5% discount
    } else if (attemptNumber === 3) {
      counterDiscount = 7;  // Third: 7% discount
    } else {
      counterDiscount = finalDiscount; // FINAL: 10% discount (ALWAYS)
      console.log('🔥 FINAL OFFER: 10% discount - This is our best price!');
    }

    let counterPrice = originalPrice * (1 - counterDiscount / 100);
    
    // PROFIT PROTECTION: Never go below minimum profitable price
    if (counterPrice < minimumPrice) {
      counterPrice = minimumPrice;
      console.log('🛡️ Profit protection activated! Counter adjusted to minimum:', minimumPrice);
    }
    
    // Try to stay near target price if possible
    if (counterPrice < targetPrice && attemptNumber <= 2) {
      counterPrice = Math.max(counterPrice, targetPrice * 0.95);
      console.log('🎯 Staying near target price:', counterPrice);
    }
    
    // Round to nearest 500 RWF for cleaner prices (was 1000, now more flexible)
    const roundedPrice = Math.ceil(counterPrice / 500) * 500;
    
    console.log('💰 Counter offer:', {
      attempt: attemptNumber,
      discount: counterDiscount.toFixed(1) + '%',
      price: roundedPrice.toLocaleString(),
      profitMargin: ((roundedPrice - estimatedCost) / estimatedCost * 100).toFixed(1) + '%'
    });
    
    return roundedPrice;
  }

  /**
   * Generate rejection message (profit-conscious but persuasive)
   */
  generateRejectionMessage(discountRequested, counterOffer, originalPrice) {
    const savingsAmount = originalPrice - counterOffer;
    const messages = [
      `Hey, I love your negotiating spirit! 😄 But ${discountRequested.toFixed(0)}% off? That's a bit too aggressive for us. Here's what I can do - ${counterOffer.toLocaleString()} RWF. You're still saving ${savingsAmount.toLocaleString()} RWF, and honestly, this product is worth every franc!`,
      `Ooh, I wish I could! 😅 But at that price, we'd be losing money. Tell you what - ${counterOffer.toLocaleString()} RWF is as low as I can go. You're getting ${savingsAmount.toLocaleString()} RWF off already! Plus, the quality is unmatched. Trust me on this! 🌟`,
      `I totally get wanting a great deal! 🎯 But between you and me? That price would hurt. How about we meet somewhere more realistic - ${counterOffer.toLocaleString()} RWF? Still ${savingsAmount.toLocaleString()} RWF in your pocket, AND you get premium quality. Win-win!`,
      `Whoa! 😲 You're a tough negotiator! I respect that. But here's the thing - we source the best materials, and ${discountRequested.toFixed(0)}% off just isn't sustainable. Let me offer you ${counterOffer.toLocaleString()} RWF instead. That's ${savingsAmount.toLocaleString()} RWF savings, and you're getting something that'll last!`,
      `I really want to make this work for you! 💪 But ${discountRequested.toFixed(0)}% is beyond what I can approve. Look, ${counterOffer.toLocaleString()} RWF is a fantastic price - ${savingsAmount.toLocaleString()} RWF less than retail! And honestly? Our customers rarely complain about paying full price for this quality. You're already getting a steal!`,
      `Okay, you drive a hard bargain! 😊 I admire that. But let's be real - at that price, my boss would have my head! 😅 Here's my counter: ${counterOffer.toLocaleString()} RWF. You save ${savingsAmount.toLocaleString()} RWF, I keep my job, everyone's happy! Plus, this item's been flying off shelves at full price, so you're lucky we even have stock!`,
      `I see what you're doing there! 🤓 Trying to get me to break, right? Nice try! But seriously, ${counterOffer.toLocaleString()} RWF is the absolute best I can do. That's ${savingsAmount.toLocaleString()} RWF in savings! And between us? I've seen people pay full price for this and come back thanking us. It's THAT good!`
    ];
    
    return messages[Math.floor(Math.random() * messages.length)];
  }

  /**
   * Generate counter-offer message (persuasive & human)
   */
  generateCounterMessage(counterOffer, customerOffer, attemptNumber = 1) {
    // FINAL OFFER (10% discount) - Special messaging
    if (attemptNumber >= 4) {
      const finalMessages = [
        `🔥 FINAL OFFER - ${counterOffer.toLocaleString()} RWF. This is 10% off and absolutely the lowest I can go! I'm already pushing boundaries here. Take it or leave it - but trust me, you won't find a better deal! This is my best price, no more negotiations! 💯`,
        `Okay, you're tough! Here's my FINAL OFFER: ${counterOffer.toLocaleString()} RWF (10% discount). I literally cannot go lower - my boss would have my head! This is it. Yes or no? Because this deal expires now! ⏰`,
        `Alright alright, FINAL PRICE: ${counterOffer.toLocaleString()} RWF. That's a full 10% off! I'm maxing out my authority here. Accept this and you're golden. Reject it and we're back to full price. Your call! 🎯`,
        `🚨 LAST CHANCE: ${counterOffer.toLocaleString()} RWF - 10% discount, rock bottom, final offer! I've bent over backwards here. This is as low as it goes. Accept now or we're done negotiating! ⚡`
      ];
      return finalMessages[Math.floor(Math.random() * finalMessages.length)];
    }
    
    // Regular counter-offers (1st, 2nd, 3rd attempts)
    const messages = [
      `I totally get wanting a great deal! 🎯 But between you and me? That price would hurt. How about we meet somewhere more realistic - ${counterOffer.toLocaleString()} RWF? Still savings in your pocket, AND you get premium quality. Win-win!`,
      `Oof, I appreciate the enthusiasm! 😅 But at that price, we'd be losing money. Tell you what - ${counterOffer.toLocaleString()} RWF is as low as I can go right now. You're already getting a discount! Plus, the quality is unmatched. Trust me on this! 🌟`,
      `Look, I want to help you out, really! 💙 But that offer would put us in the red. Let's be realistic here - ${counterOffer.toLocaleString()} RWF. That's already a sweet discount! You'll thank yourself later when you see the quality! ✨`,
      `How about ${counterOffer.toLocaleString()} RWF? ⚡ That's a fair price for both of us! You get amazing quality, and I don't get fired! 😅 Keep negotiating though, we might find a better spot!`,
      `You drive a hard bargain! Respect! 💪 Let's try ${counterOffer.toLocaleString()} RWF. That's a solid discount! But I believe in customer satisfaction, so keep pushing if you want! 🤝`
    ];
    
    return messages[Math.floor(Math.random() * messages.length)];
  }

  /**
   * Generate acceptance message (enthusiastic & conversational)
   */
  generateAcceptanceMessage(acceptedPrice, originalPrice) {
    const savings = originalPrice - acceptedPrice;
    const discountPercent = ((savings / originalPrice) * 100).toFixed(0);
    const messages = [
      `YES! DEAL! 🎉🎉🎉 ${acceptedPrice.toLocaleString()} RWF it is! You just saved ${savings.toLocaleString()} RWF (that's ${discountPercent}% off!). Honestly? You're a master negotiator! Adding this to your cart right now before I change my mind! 😄`,
      `BOOM! We have a winner! 🏆 ${acceptedPrice.toLocaleString()} RWF - SOLD! You're walking away with ${savings.toLocaleString()} RWF in savings! I've got a good feeling about this purchase. You're going to love it! Let me get this in your cart ASAP! 🛒`,
      `Alright alright, you got me! 🤝 ${acceptedPrice.toLocaleString()} RWF is a fair price. You saved ${savings.toLocaleString()} RWF! That's ${discountPercent}% off! Not many people can negotiate like you! I'm adding this to your cart before my boss sees this deal! 😅`,
      `DONE! 💯 ${acceptedPrice.toLocaleString()} RWF and it's yours! That's ${savings.toLocaleString()} RWF you're keeping in your pocket! You know what? You remind me why I love this job - finding win-win deals! Throwing this in your cart now! ✨`,
      `You know what? SOLD! 🎊 ${acceptedPrice.toLocaleString()} RWF. You've got yourself a fantastic deal - ${savings.toLocaleString()} RWF savings! That's ${discountPercent}% off the original price! I can already tell you're going to be one of our happy customers. Cart time! 🛍️`,
      `Okay, you win! 😊 ${acceptedPrice.toLocaleString()} RWF is yours! Saving ${savings.toLocaleString()} RWF! You know, most people pay full price and still rave about this product. You're getting an absolute steal! Adding to cart before this offer evaporates! 🚀`,
      `Ding ding ding! 🔔 We have a deal! ${acceptedPrice.toLocaleString()} RWF - and you're pocketing ${savings.toLocaleString()} RWF in savings! That's what I call smart shopping! Trust me, you're going to thank yourself later for this purchase. Into the cart it goes! 🎁`
    ];
    
    return messages[Math.floor(Math.random() * messages.length)];
  }

  /**
   * Get AI assistant greeting
   */
  getGreeting() {
    const greetings = [
      "Hi! 👋 I'm your AI shopping assistant. I can help you find products and even negotiate prices! What are you looking for?",
      "Hello! 🌟 Welcome to E-Gura Store! I'm here to help you shop and get the best deals. What can I help you find?",
      "Hey there! 😊 I'm your personal shopping assistant. Looking for something specific? I can also help you bargain for better prices!",
      "Welcome! 🎉 I'm here to make your shopping easier. Ask me about products or let's negotiate some prices together!"
    ];
    
    return greetings[Math.floor(Math.random() * greetings.length)];
  }

  /**
   * Suggest products based on query
   */
  suggestProducts(query, products) {
    const queryLower = query.toLowerCase();
    const suggestions = products.filter(p => 
      p.name.toLowerCase().includes(queryLower) ||
      p.category.toLowerCase().includes(queryLower) ||
      (p.description && p.description.toLowerCase().includes(queryLower))
    ).slice(0, 5);

    return suggestions;
  }

  /**
   * Generate conversation context
   */
  generateContext(product, customerBudget) {
    const affordability = (customerBudget / product.price) * 100;
    
    let context = {
      canAfford: affordability >= 100,
      needsDiscount: affordability < 100,
      discountNeeded: affordability < 100 ? ((product.price - customerBudget) / product.price) * 100 : 0,
      suggestion: ''
    };

    if (affordability >= 100) {
      context.suggestion = "Great news! This is within your budget. Would you like to add it to cart?";
    } else if (affordability >= 75) {
      context.suggestion = `You're close! You need ${(product.price - customerBudget).toLocaleString()} RWF more. Want to negotiate?`;
    } else {
      context.suggestion = `This item is above your budget. Let me help you find alternatives or negotiate a better price!`;
    }

    return context;
  }
}

module.exports = new AIBargaining();
