const crypto = require('crypto');
const Negotiation = require('../models/Negotiation');
const NegotiationRule = require('../models/NegotiationRule');
const FeatureFlag = require('../models/FeatureFlag');
const llmService = require('./llmService');

class NegotiationService {
  constructor() {
    this.rateLimitMap = new Map(); // userId -> { count, resetTime }
    this.replayProtection = new Map(); // sessionId -> Set of offer hashes
  }

  /**
   * Get user segment based on purchase history
   */
  async getUserSegment(userId) {
    // Simple logic based on userId pattern
    if (userId.startsWith('vip_')) return 'vip';
    if (userId.startsWith('new_')) return 'new';
    
    try {
      // Try to check if user has orders (MongoDB only)
      const Order = require('../models/Order');
      
      // Skip if using PostgreSQL (Order.countDocuments is MongoDB-specific)
      if (!Order.countDocuments) {
        console.log('⚠️ MongoDB not available, using default segment');
        return 'returning';
      }
      
      const orderCount = await Promise.race([
        Order.countDocuments({ 
          $or: [
            { userId },
            { 'customer.phone': userId }
          ]
        }),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout')), 2000)
        )
      ]);
      
      if (orderCount === 0) return 'new';
      if (orderCount >= 5) return 'vip';
      return 'returning';
    } catch (error) {
      console.log('⚠️ Could not fetch user segment, using default:', error.message);
      // Default to returning customer if can't check
      return 'returning';
    }
  }

  /**
   * Check rate limits
   */
  checkRateLimit(userId) {
    const now = Date.now();
    const limit = parseInt(process.env.NEGOTIATION_RATE_LIMIT || '10'); // per hour
    const windowMs = 60 * 60 * 1000; // 1 hour

    if (!this.rateLimitMap.has(userId)) {
      this.rateLimitMap.set(userId, { count: 1, resetTime: now + windowMs });
      return { allowed: true, remaining: limit - 1 };
    }

    const userData = this.rateLimitMap.get(userId);
    
    if (now > userData.resetTime) {
      // Reset window
      this.rateLimitMap.set(userId, { count: 1, resetTime: now + windowMs });
      return { allowed: true, remaining: limit - 1 };
    }

    if (userData.count >= limit) {
      return { 
        allowed: false, 
        remaining: 0,
        resetAt: new Date(userData.resetTime)
      };
    }

    userData.count += 1;
    return { allowed: true, remaining: limit - userData.count };
  }

  /**
   * Detect replay attacks
   */
  checkReplayProtection(sessionId, offerPrice) {
    const offerHash = crypto.createHash('md5').update(`${offerPrice}`).digest('hex');
    
    if (!this.replayProtection.has(sessionId)) {
      this.replayProtection.set(sessionId, new Set([offerHash]));
      return true;
    }

    const hashes = this.replayProtection.get(sessionId);
    if (hashes.has(offerHash)) {
      return false; // Replay detected
    }

    hashes.add(offerHash);
    return true;
  }

  /**
   * Fraud detection heuristics
   */
  async detectFraud(userId, sku, offerPrice, basePrice, ipAddress) {
    const flags = [];

    // Check for lowballing (offer < 50% of base)
    if (offerPrice < basePrice * 0.5) {
      flags.push({
        flag: 'extreme_lowball',
        severity: 'medium',
        timestamp: new Date()
      });
    }

    // Check for multiple sessions from same user (skip if MongoDB unavailable)
    try {
      if (Negotiation && Negotiation.countDocuments) {
        const recentNegotiations = await Promise.race([
          Negotiation.countDocuments({
            userId,
            createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
          }),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 1000))
        ]);

        if (recentNegotiations > 20) {
          flags.push({
            flag: 'excessive_negotiations',
            severity: 'high',
            timestamp: new Date()
          });
        }

        // Check for same IP with multiple userIds
        if (ipAddress) {
          const ipCount = await Promise.race([
            Negotiation.countDocuments({
              ipAddress,
              userId: { $ne: userId },
              createdAt: { $gte: new Date(Date.now() - 60 * 60 * 1000) }
            }),
            new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 1000))
          ]);

          if (ipCount > 5) {
            flags.push({
              flag: 'multi_account_ip',
              severity: 'high',
              timestamp: new Date()
            });
          }
        }
      }
    } catch (error) {
      console.log('⚠️ Skipping fraud check (MongoDB unavailable)');
    }

    return flags;
  }

  /**
   * Check feature flag
   */
  async isNegotiationEnabled(userId, sku, userSegment) {
    try {
      if (!FeatureFlag || !FeatureFlag.findOne) {
        // MongoDB not available, enable by default
        return true;
      }
      
      const flag = await Promise.race([
        FeatureFlag.findOne({ name: 'ai_negotiation' }),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 2000))
      ]);
      
      if (!flag) {
        // Default: enabled for all
        return true;
      }

      // Check SKU targeting
      if (flag.targetSkus.length > 0 && !flag.targetSkus.includes(sku)) {
        return false;
      }

      return flag.isEnabledForUser(userId, userSegment);
    } catch (error) {
      console.log('⚠️ Could not check feature flag, enabling by default');
      return true;
    }
  }

  /**
   * Start a new negotiation
   */
  async startNegotiation({ sku, userId, offerPrice, quantity = 1, metadata = {} }) {
    // Rate limiting
    const rateLimit = this.checkRateLimit(userId);
    if (!rateLimit.allowed) {
      throw new Error(`Rate limit exceeded. Try again after ${rateLimit.resetAt.toISOString()}`);
    }

    // Get user segment
    const userSegment = await this.getUserSegment(userId);

    // Check feature flag
    const isEnabled = await this.isNegotiationEnabled(userId, sku, userSegment);
    if (!isEnabled) {
      throw new Error('Negotiation feature not available for this user/product');
    }

    // Get negotiation rules
    let rule = null;
    let product = null;
    
    try {
      if (NegotiationRule && NegotiationRule.findOne) {
        rule = await Promise.race([
          NegotiationRule.findOne({ sku, enabled: true }),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 2000))
        ]);
      }
    } catch (error) {
      console.log('⚠️ Could not fetch negotiation rule from MongoDB, will create default');
    }
    
    if (!rule) {
      // Try to get product info
      const Product = require('../models/Product');
      
      try {
        // Try PostgreSQL first
        if (Product.findOne && !Product.countDocuments) {
          // Sequelize/PostgreSQL
          const { Op } = require('sequelize');
          product = await Product.findOne({
            where: {
              [Op.or]: [
                { sku: sku },
                { id: sku }
              ]
            }
          });
        } else if (Product.findOne) {
          // MongoDB
          const mongoose = require('mongoose');
          const query = { $or: [{ sku }] };
          if (mongoose.Types.ObjectId.isValid(sku) && String(new mongoose.Types.ObjectId(sku)) === sku) {
            query.$or.push({ _id: sku });
          }
          
          product = await Promise.race([
            Product.findOne(query),
            new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 2000))
          ]);
        }
      } catch (error) {
        console.log('⚠️ Could not fetch product, using defaults');
      }
      
      // Create default rule object (in-memory, not saved to DB)
      const basePrice = product?.price || 50000;
      const minPrice = product?.minBargainPrice || Math.floor(basePrice * 0.75);
      const maxDiscountPct = product?.maxBargainDiscount || 25;
      
      rule = {
        sku: sku,
        productName: {
          en: product?.name || 'Product',
          rw: product?.name || 'Product'
        },
        basePrice: basePrice,
        minPrice: minPrice,
        maxDiscountPct: maxDiscountPct,
        maxRounds: 3,
        clearanceFlag: product?.isSale || false,
        stockLevel: product?.stockQuantity || 100,
        bundlePairs: [],
        segmentRules: [
          { segment: 'new', maxDiscountPct: Math.max(maxDiscountPct - 8, 10), minPurchaseCount: 0, maxPurchaseCount: 0 },
          { segment: 'returning', maxDiscountPct: maxDiscountPct, minPurchaseCount: 1, maxPurchaseCount: 4 },
          { segment: 'vip', maxDiscountPct: Math.min(maxDiscountPct + 3, 40), minPurchaseCount: 5, maxPurchaseCount: null }
        ],
        fallbackPerks: {
          freeShipping: { enabled: true, threshold: null },
          freeGift: { enabled: true, giftDescription: { en: 'Free gift with purchase', rw: 'Impano ubuntu' } },
          extendedWarranty: { enabled: true, months: 12 }
        },
        enabled: true,
        priority: 1,
        metadata: {
          category: product?.category || 'General',
          margin: 35,
          costPrice: Math.floor(basePrice * 0.65)
        }
      };
      
      console.log(`✓ Using default negotiation rule for SKU: ${sku}`);
    }

    // Check stock
    if (rule.stockLevel < quantity) {
      throw new Error('Insufficient stock for negotiation');
    }

    // Get segment-specific rules
    let maxDiscountPct = rule.maxDiscountPct;
    const segmentRule = rule.segmentRules.find(sr => sr.segment === userSegment);
    if (segmentRule) {
      maxDiscountPct = Math.max(maxDiscountPct, segmentRule.maxDiscountPct);
    }

    const basePrice = rule.basePrice * quantity;
    const floorPrice = Math.max(
      rule.minPrice * quantity,
      basePrice * (1 - maxDiscountPct / 100)
    );

    // Fraud detection
    const fraudFlags = await this.detectFraud(
      userId, 
      sku, 
      offerPrice, 
      basePrice,
      metadata.ipAddress
    );

    // Block if high severity fraud
    if (fraudFlags.some(f => f.severity === 'high')) {
      throw new Error('Negotiation blocked due to suspicious activity');
    }

    // Create session
    const sessionId = crypto.randomBytes(16).toString('hex');
    
    const negotiation = new Negotiation({
      sessionId,
      sku,
      userId,
      userSegment,
      quantity,
      basePrice,
      floorPrice,
      maxRounds: rule.maxRounds,
      expiresAt: new Date(Date.now() + 30 * 60 * 1000), // 30 minutes
      fraudFlags,
      ipAddress: metadata.ipAddress,
      userAgent: metadata.userAgent,
      metadata: {
        language: metadata.language || 'en',
        deviceType: metadata.deviceType,
        referrer: metadata.referrer
      },
      analytics: {
        initialOffer: offerPrice,
        conversionSource: metadata.conversionSource || 'product_page'
      }
    });

    // Process first offer
    const response = await this.processOffer(
      negotiation,
      rule,
      offerPrice,
      metadata.language || 'en'
    );

    await negotiation.save();

    return {
      sessionId,
      status: response.status,
      counterPrice: response.counterPrice,
      justification: response.justification,
      altPerks: response.altPerks,
      bundleSuggestions: response.bundleSuggestions,
      currentRound: negotiation.currentRound,
      maxRounds: negotiation.maxRounds,
      expiresAt: negotiation.expiresAt,
      rateLimitRemaining: rateLimit.remaining
    };
  }

  /**
   * Continue negotiation
   */
  async continueNegotiation({ sessionId, offerPrice, metadata = {} }) {
    const negotiation = await Negotiation.findOne({ sessionId });
    
    if (!negotiation) {
      throw new Error('Negotiation session not found');
    }

    if (!negotiation.canNegotiate()) {
      throw new Error('Negotiation has ended or expired');
    }

    // Replay protection
    if (!this.checkReplayProtection(sessionId, offerPrice)) {
      throw new Error('Duplicate offer detected');
    }

    // Rate limiting
    const rateLimit = this.checkRateLimit(negotiation.userId);
    if (!rateLimit.allowed) {
      throw new Error(`Rate limit exceeded. Try again after ${rateLimit.resetAt.toISOString()}`);
    }

    // Get rules
    const rule = await NegotiationRule.findOne({ sku: negotiation.sku, enabled: true });
    if (!rule) {
      throw new Error('Product no longer available for negotiation');
    }

    // Process offer
    const response = await this.processOffer(
      negotiation,
      rule,
      offerPrice,
      metadata.language || negotiation.metadata.language || 'en'
    );

    await negotiation.save();

    return {
      sessionId,
      status: response.status,
      counterPrice: response.counterPrice,
      justification: response.justification,
      altPerks: response.altPerks,
      bundleSuggestions: response.bundleSuggestions,
      currentRound: negotiation.currentRound,
      maxRounds: negotiation.maxRounds,
      expiresAt: negotiation.expiresAt,
      rateLimitRemaining: rateLimit.remaining
    };
  }

  /**
   * Process an offer using LLM or fallback
   */
  async processOffer(negotiation, rule, offerPrice, language) {
    const context = {
      sku: rule.sku,
      productName: rule.productName,
      basePrice: negotiation.basePrice,
      floorPrice: negotiation.floorPrice,
      userOffer: offerPrice,
      currentRound: negotiation.currentRound + 1,
      maxRounds: negotiation.maxRounds,
      userSegment: negotiation.userSegment,
      stockLevel: rule.stockLevel,
      clearanceFlag: rule.clearanceFlag,
      bundlePairs: rule.bundlePairs,
      fallbackPerks: rule.fallbackPerks,
      priorRounds: negotiation.rounds,
      language
    };

    let aiResponse;
    let llmData = null;

    try {
      // Try LLM first
      const result = await llmService.negotiate(context);
      aiResponse = result.response;
      llmData = result.llmData;
    } catch (error) {
      console.error('LLM failed, using fallback:', error.message);
      // Fallback to rule-based
      aiResponse = llmService.fallbackNegotiate(context);
    }

    // Translate justification if needed
    const justification = {
      en: aiResponse.justification,
      rw: language === 'rw' ? aiResponse.justification : null
    };

    // Add round to negotiation
    negotiation.addRound(offerPrice, {
      status: aiResponse.status,
      counterPrice: aiResponse.counterPrice,
      justification,
      altPerks: aiResponse.altPerks || [],
      bundleSuggestions: aiResponse.bundleSuggestions || []
    }, llmData);

    // Update analytics
    negotiation.analytics.finalOffer = offerPrice;
    negotiation.analytics.roundsUsed = negotiation.currentRound;

    // Handle acceptance
    if (aiResponse.status === 'accept') {
      negotiation.status = 'accepted';
      negotiation.finalPrice = offerPrice;
      negotiation.acceptedAt = new Date();
      negotiation.discountToken = this.generateDiscountToken(negotiation);
      
      negotiation.analytics.discountGiven = negotiation.basePrice - offerPrice;
      negotiation.analytics.discountPct = (negotiation.analytics.discountGiven / negotiation.basePrice) * 100;
      
      // Calculate timeToDecision safely, ensuring valid date
      const createdTime = negotiation.createdAt ? new Date(negotiation.createdAt).getTime() : Date.now();
      negotiation.analytics.timeToDecision = Math.floor((Date.now() - createdTime) / 1000);
    }

    // Handle rejection
    if (aiResponse.status === 'reject') {
      negotiation.status = 'rejected';
      negotiation.analytics.abandonedAtRound = negotiation.currentRound;
    }

    return {
      ...aiResponse,
      justification: justification[language] || justification.en
    };
  }

  /**
   * Accept a negotiation
   */
  async acceptNegotiation({ token }) {
    const negotiation = await Negotiation.findOne({ discountToken: token });
    
    if (!negotiation) {
      throw new Error('Invalid discount token');
    }

    if (negotiation.discountApplied) {
      throw new Error('Discount already applied');
    }

    if (negotiation.isExpired()) {
      throw new Error('Discount has expired');
    }

    negotiation.discountApplied = true;
    await negotiation.save();

    return {
      sku: negotiation.sku,
      originalPrice: negotiation.basePrice,
      discountedPrice: negotiation.finalPrice,
      discount: negotiation.basePrice - negotiation.finalPrice,
      quantity: negotiation.quantity,
      expiresAt: negotiation.expiresAt,
      perks: negotiation.finalPerks
    };
  }

  /**
   * Get negotiation rules
   */
  async getRules(sku = null) {
    const query = { enabled: true };
    if (sku) {
      query.sku = sku;
    }

    const rules = await NegotiationRule.find(query).select('-__v');
    return rules;
  }

  /**
   * Generate discount token
   */
  generateDiscountToken(negotiation) {
    const payload = `${negotiation.sessionId}:${negotiation.finalPrice}:${Date.now()}`;
    return crypto.createHash('sha256').update(payload).digest('hex').substring(0, 32);
  }

  /**
   * Clean up expired negotiations (run periodically)
   */
  async cleanupExpired() {
    const result = await Negotiation.updateMany(
      {
        status: 'active',
        expiresAt: { $lt: new Date() }
      },
      {
        $set: { status: 'expired' }
      }
    );

    return result.modifiedCount;
  }
}

module.exports = new NegotiationService();
