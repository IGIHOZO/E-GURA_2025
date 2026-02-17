const axios = require('axios');

/**
 * LLM Service for AI Negotiation
 * Supports OpenAI, Anthropic, or local models
 */

class LLMService {
  constructor() {
    this.provider = process.env.LLM_PROVIDER || 'groq';
    this.apiKey = process.env.LLM_API_KEY;
    this.model = process.env.LLM_MODEL || this.getDefaultModel();
    this.endpoint = this.getEndpoint();
    this.maxTokens = parseInt(process.env.LLM_MAX_TOKENS || '800');
    this.temperature = parseFloat(process.env.LLM_TEMPERATURE || '0.8');
  }

  getDefaultModel() {
    const defaults = {
      groq: 'llama-3.1-70b-versatile',
      openai: 'gpt-4o-mini',
      anthropic: 'claude-3-haiku-20240307',
      together: 'meta-llama/Meta-Llama-3.1-70B-Instruct-Turbo',
      huggingface: 'meta-llama/Meta-Llama-3-70B-Instruct',
      local: 'llama2'
    };
    return defaults[this.provider] || 'llama-3.1-70b-versatile';
  }

  getEndpoint() {
    if (process.env.LLM_ENDPOINT) return process.env.LLM_ENDPOINT;
    
    const endpoints = {
      groq: 'https://api.groq.com/openai/v1/chat/completions',
      openai: 'https://api.openai.com/v1/chat/completions',
      anthropic: 'https://api.anthropic.com/v1/messages',
      together: 'https://api.together.xyz/v1/chat/completions',
      huggingface: 'https://api-inference.huggingface.co/models',
      local: 'http://localhost:11434/api/generate'
    };
    return endpoints[this.provider] || endpoints.groq;
  }

  /**
   * Generate negotiation prompt
   */
  generatePrompt(context) {
    const {
      sku,
      productName,
      basePrice,
      floorPrice,
      userOffer,
      currentRound,
      maxRounds,
      userSegment,
      stockLevel,
      clearanceFlag,
      bundlePairs,
      fallbackPerks,
      priorRounds,
      language
    } = context;

    const isKinyarwanda = language === 'rw';
    
    const systemPrompt = isKinyarwanda 
      ? `Uri RutzBot, umufasha w'ubucuruzi mu Rwanda ukora nk'umuntu. Ufasha abakiriya gushaka ibiciro byiza kandi bikwiye. Kora nk'umucuruzi w'ukuri - koresha imvugo ikurura, sobanura agaciro k'ibicuruzwa, kandi ugire ubwenge mu gutanga ibiciro. Ntugire ubwoba kuvuga "oya" niba icyifuzo kiri hasi cyane. Gerageza gutanga ibiciro bike gusa iyo bibaye ngombwa.`
      : `You are RutzBot, a skilled human negotiator and sales expert for Rwanda's e-commerce market. You understand customer psychology and use persuasive techniques naturally. 

Your negotiation style:
- Be warm, friendly, and conversational like a real person
- Use persuasive language: emphasize product value, quality, and benefits
- Build rapport by acknowledging customer concerns
- Create urgency subtly (limited stock, special deals)
- Use social proof when relevant ("popular item", "best seller")
- Be strategic: start with minimal discounts and only increase if necessary
- Show reluctance when giving discounts - make customers feel they're getting a special deal
- Use phrases like "I can do this for you", "Let me see what I can do", "You're getting a great deal"
- Don't be afraid to say no politely if offer is too low
- Protect margins: give smallest discount possible while keeping customer happy
- Offer perks (free shipping, gifts) before deeper price cuts

Remember: Every discount reduces profit. Be generous with words, strategic with discounts.`;

    const userPrompt = `
${isKinyarwanda ? 'IBISOBANURO' : 'CONTEXT'}:
- ${isKinyarwanda ? 'Igicuruzwa' : 'Product'}: ${productName.rw || productName.en} (SKU: ${sku})
- ${isKinyarwanda ? 'Igiciro cy\'ibanze' : 'Base Price'}: ${basePrice.toLocaleString()} RWF
- ${isKinyarwanda ? 'Igiciro ntarengwa' : 'Floor Price'}: ${floorPrice.toLocaleString()} RWF (${isKinyarwanda ? 'ntushobora kugabanuka' : 'cannot go below'})
- ${isKinyarwanda ? 'Icyifuzo cy\'umukiriya' : 'Customer Offer'}: ${userOffer.toLocaleString()} RWF
- ${isKinyarwanda ? 'Urwego' : 'Round'}: ${currentRound}/${maxRounds}
- ${isKinyarwanda ? 'Ubwoko bw\'umukiriya' : 'Customer Segment'}: ${userSegment}
- ${isKinyarwanda ? 'Ibicuruzwa bisigaye' : 'Stock Level'}: ${stockLevel}
${clearanceFlag ? `- ${isKinyarwanda ? 'IGURISHA RYA NYUMA' : 'CLEARANCE SALE'} (${isKinyarwanda ? 'ushobora gutanga igabanuka rinini' : 'can offer bigger discount'})` : ''}

${priorRounds && priorRounds.length > 0 ? `
${isKinyarwanda ? 'IBIGANIRO BYABANJE' : 'PRIOR ROUNDS'}:
${priorRounds.map(r => `- ${isKinyarwanda ? 'Urwego' : 'Round'} ${r.roundNumber}: ${isKinyarwanda ? 'Umukiriya yatanze' : 'Customer offered'} ${r.userOffer.toLocaleString()} RWF, ${isKinyarwanda ? 'Wasubije' : 'You countered'} ${r.aiCounter?.toLocaleString() || 'N/A'} RWF`).join('\n')}
` : ''}

${bundlePairs && bundlePairs.length > 0 ? `
${isKinyarwanda ? 'AMAHURIRO YEMEWE' : 'AVAILABLE BUNDLES'}:
${bundlePairs.map(b => `- ${b.bundleSku}: ${b.bundlePrice.toLocaleString()} RWF`).join('\n')}
` : ''}

${isKinyarwanda ? 'INYUNGU ZEMEWE' : 'AVAILABLE PERKS'}:
${fallbackPerks.freeShipping?.enabled ? `- ${isKinyarwanda ? 'Kohereza ubuntu' : 'Free shipping'}` : ''}
${fallbackPerks.freeGift?.enabled ? `- ${isKinyarwanda ? 'Impano yubusa' : 'Free gift'}: ${fallbackPerks.freeGift.giftDescription?.rw || fallbackPerks.freeGift.giftDescription?.en}` : ''}
${fallbackPerks.extendedWarranty?.enabled ? `- ${isKinyarwanda ? 'Garanti yongerewe' : 'Extended warranty'}: ${fallbackPerks.extendedWarranty.months} ${isKinyarwanda ? 'amezi' : 'months'}` : ''}

${isKinyarwanda ? 'AMABWIRIZA Y\'INGENZI' : 'CRITICAL NEGOTIATION STRATEGY'}:

1. ${isKinyarwanda ? 'NTUSHOBORA gutanga igiciro kiri munsi ya' : 'ABSOLUTE FLOOR PRICE'}: ${floorPrice.toLocaleString()} RWF - ${isKinyarwanda ? 'ntushobora kugabanuka' : 'NEVER go below this'}

2. ${isKinyarwanda ? 'INGAMBA ZO GUTANGA IBICIRO' : 'DISCOUNT STRATEGY'}:
   - ${isKinyarwanda ? 'Tangira hafi y\'igiciro cy\'ibanze' : 'Start close to base price'} (${basePrice.toLocaleString()} RWF)
   - ${isKinyarwanda ? 'Gusa tanga igabanuka rito cyane (2-5%)' : 'Give tiny discounts first (2-5%)'}
   - ${isKinyarwanda ? 'Erekana ko bigoye gutanga igabanuka' : 'Show reluctance - make discounts feel special'}
   - ${isKinyarwanda ? 'Koresha inyungu mbere y\'igabanuka' : 'Offer perks BEFORE deeper discounts'}
   - ${isKinyarwanda ? 'Gusa emeza niba icyifuzo kiri hafi y\'igiciro ntarengwa' : 'Only accept if offer is very close to floor'}
   - ${isKinyarwanda ? '⚠️ INGENZI: Igiciro cyawe NTIKIGOMBA kuba munsi y\'icyifuzo cy\'umukiriya' : '⚠️ CRITICAL: Your counterPrice must ALWAYS be HIGHER than customer offer'} (${userOffer.toLocaleString()} RWF)

3. ${isKinyarwanda ? 'IMVUGO IKURURA' : 'PERSUASIVE TECHNIQUES'}:
   - ${isKinyarwanda ? 'Sobanura agaciro k\'igicuruzwa' : 'Emphasize product value and quality'}
   - ${isKinyarwanda ? 'Koresha "Ndashobora gukora ibi kuberako..."' : 'Use "I can do this because..." to justify offers'}
   - ${isKinyarwanda ? 'Vuga ko ari igicuruzwa gikomeye' : 'Mention if it\'s popular/bestseller'}
   - ${isKinyarwanda ? 'Erekana ko ibicuruzwa bisigaye bike' : 'Create urgency if low stock'} ${stockLevel < 10 ? `(${isKinyarwanda ? 'Bisigaye' : 'Only'} ${stockLevel}!)` : ''}
   - ${isKinyarwanda ? 'Koresha "Urabona amahirwe meza"' : 'Use "You\'re getting a great deal"'}

4. ${isKinyarwanda ? 'IBIGANIRO' : 'CONVERSATION FLOW'}:
   - ${isKinyarwanda ? 'Urwego 1' : 'Round 1'}: ${isKinyarwanda ? 'Tanga igabanuka rito (2-3%)' : 'Minimal discount (2-3%), emphasize value'}
   - ${isKinyarwanda ? 'Urwego 2' : 'Round 2'}: ${isKinyarwanda ? 'Tanga igabanuka rito (5-7%)' : 'Small discount (5-7%), show reluctance'}
   - ${isKinyarwanda ? 'Urwego rwa nyuma' : 'Final round'}: ${isKinyarwanda ? 'Tanga icyifuzo cyawe cya nyuma' : 'Best offer, make it feel special'}

5. ${isKinyarwanda ? 'IGIHE CYO KWANGA' : 'WHEN TO REJECT'}:
   - ${isKinyarwanda ? 'Niba icyifuzo kiri munsi ya' : 'If offer is below'} ${Math.round(floorPrice * 1.05).toLocaleString()} RWF ${isKinyarwanda ? 'kandi ari urwego rwa nyuma' : 'and it\'s final round'}
   - ${isKinyarwanda ? 'Kora neza ariko ube uhamye' : 'Be polite but firm'}
   - ${isKinyarwanda ? 'Tanga inyungu nk\'uburyo bwo kubungabunga' : 'Offer perks as consolation'}

${isKinyarwanda ? 'SUBIZA MU BURYO BWA JSON' : 'RESPOND IN JSON FORMAT'}:
{
  "status": "counter|accept|reject|final",
  "counterPrice": ${isKinyarwanda ? 'umubare (niba status ari counter cyangwa final)' : 'number (if status is counter or final)'},
  "justification": "${isKinyarwanda ? 'Koresha imvugo y\'umuntu - iba nziza, ikurura, kandi isobanura agaciro' : 'Use natural, persuasive human language - be warm, emphasize value, show personality. 2-3 sentences max.'}",
  "altPerks": [
    {
      "type": "freeShipping|freeGift|extendedWarranty",
      "description": "${isKinyarwanda ? 'sobanura inyungu mu buryo bukurura' : 'describe perk persuasively'}"
    }
  ],
  "bundleSuggestions": [
    {
      "sku": "SKU",
      "discount": ${isKinyarwanda ? 'igabanuka mu RWF' : 'discount in RWF'}
    }
  ]
}

${isKinyarwanda ? 'INGENZI' : 'CRITICAL'}: 
- ${isKinyarwanda ? 'Koresha imvugo y\'umuntu nyayo' : 'Use natural human language, not robotic'}
- ${isKinyarwanda ? 'Erekana ubwenge mu biganiro' : 'Show personality and emotional intelligence'}
- ${isKinyarwanda ? 'Tanga ibiciro bike gusa' : 'Give minimal discounts strategically'}
- ${isKinyarwanda ? 'Subiza JSON gusa' : 'Return ONLY valid JSON, nothing else'}.
`;

    return {
      systemPrompt,
      userPrompt
    };
  }

  /**
   * Call LLM API
   */
  async callLLM(systemPrompt, userPrompt) {
    const startTime = Date.now();

    try {
      if (this.provider === 'groq' || this.provider === 'openai' || this.provider === 'together') {
        const requestBody = {
          model: this.model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          temperature: this.temperature,
          max_tokens: this.maxTokens
        };

        // OpenAI supports response_format, others may not
        if (this.provider === 'openai') {
          requestBody.response_format = { type: 'json_object' };
        }

        const response = await axios.post(
          this.endpoint,
          requestBody,
          {
            headers: {
              'Authorization': `Bearer ${this.apiKey}`,
              'Content-Type': 'application/json'
            },
            timeout: 30000
          }
        );

        const processingTimeMs = Date.now() - startTime;
        const content = response.data.choices[0].message.content;
        
        return {
          content,
          processingTimeMs,
          usage: response.data.usage
        };
      } else if (this.provider === 'anthropic') {
        const response = await axios.post(
          'https://api.anthropic.com/v1/messages',
          {
            model: this.model,
            max_tokens: this.maxTokens,
            messages: [
              { role: 'user', content: `${systemPrompt}\n\n${userPrompt}` }
            ]
          },
          {
            headers: {
              'x-api-key': this.apiKey,
              'anthropic-version': '2023-06-01',
              'Content-Type': 'application/json'
            },
            timeout: 30000
          }
        );

        const processingTimeMs = Date.now() - startTime;
        const content = response.data.content[0].text;
        
        return {
          content,
          processingTimeMs,
          usage: response.data.usage
        };
      } else if (this.provider === 'huggingface') {
        const response = await axios.post(
          `${this.endpoint}/${this.model}`,
          {
            inputs: `${systemPrompt}\n\n${userPrompt}`,
            parameters: {
              max_new_tokens: this.maxTokens,
              temperature: this.temperature,
              return_full_text: false
            }
          },
          {
            headers: {
              'Authorization': `Bearer ${this.apiKey}`,
              'Content-Type': 'application/json'
            },
            timeout: 60000
          }
        );

        const processingTimeMs = Date.now() - startTime;
        const content = response.data[0]?.generated_text || response.data.generated_text;
        
        return {
          content,
          processingTimeMs
        };
      } else {
        // Local/custom endpoint (Ollama, etc.)
        const response = await axios.post(
          this.endpoint,
          {
            prompt: `${systemPrompt}\n\n${userPrompt}`,
            max_tokens: this.maxTokens,
            temperature: this.temperature
          },
          {
            timeout: 30000
          }
        );

        const processingTimeMs = Date.now() - startTime;
        return {
          content: response.data.response || response.data.text,
          processingTimeMs
        };
      }
    } catch (error) {
      console.error('LLM API Error:', error.message);
      throw new Error(`LLM API failed: ${error.message}`);
    }
  }

  /**
   * Parse and validate LLM response
   */
  parseResponse(content, floorPrice, basePrice, userOffer = null) {
    try {
      // Try to extract JSON if wrapped in markdown
      let jsonStr = content.trim();
      if (jsonStr.startsWith('```json')) {
        jsonStr = jsonStr.replace(/```json\n?/g, '').replace(/```\n?/g, '');
      } else if (jsonStr.startsWith('```')) {
        jsonStr = jsonStr.replace(/```\n?/g, '');
      }

      const parsed = JSON.parse(jsonStr);

      // Validate required fields
      if (!parsed.status || !['counter', 'accept', 'reject', 'final'].includes(parsed.status)) {
        throw new Error('Invalid status field');
      }

      // Validate counterPrice if present
      if (parsed.counterPrice !== undefined && parsed.counterPrice !== null) {
        parsed.counterPrice = Math.round(parsed.counterPrice);
        
        // CRITICAL: Counter price must be higher than user's offer
        if (userOffer && parsed.counterPrice < userOffer && parsed.status !== 'accept') {
          console.warn(`LLM suggested ${parsed.counterPrice} LOWER than user offer ${userOffer}, fixing`);
          parsed.counterPrice = Math.max(floorPrice, Math.round(userOffer * 1.05));
        }
        
        // Clamp to bounds
        if (parsed.counterPrice < floorPrice) {
          console.warn(`LLM suggested ${parsed.counterPrice} below floor ${floorPrice}, clamping`);
          parsed.counterPrice = floorPrice;
        }
        if (parsed.counterPrice > basePrice) {
          parsed.counterPrice = basePrice;
        }
      }

      // Ensure arrays exist
      parsed.altPerks = parsed.altPerks || [];
      parsed.bundleSuggestions = parsed.bundleSuggestions || [];

      return parsed;
    } catch (error) {
      console.error('Failed to parse LLM response:', error.message, content);
      throw new Error('Invalid LLM response format');
    }
  }

  /**
   * Main negotiation method
   */
  async negotiate(context) {
    const { systemPrompt, userPrompt } = this.generatePrompt(context);
    
    const llmResult = await this.callLLM(systemPrompt, userPrompt);
    
    const parsed = this.parseResponse(
      llmResult.content,
      context.floorPrice,
      context.basePrice,
      context.userOffer
    );

    return {
      response: parsed,
      llmData: {
        prompt: userPrompt,
        rawResponse: llmResult.content,
        processingTimeMs: llmResult.processingTimeMs,
        usage: llmResult.usage
      }
    };
  }

  /**
   * Fallback negotiation (rule-based, no LLM) - Enhanced with human-like responses
   */
  fallbackNegotiate(context) {
    const {
      userOffer,
      basePrice,
      floorPrice,
      currentRound,
      maxRounds,
      clearanceFlag,
      fallbackPerks,
      language,
      productName,
      stockLevel
    } = context;

    const isKinyarwanda = language === 'rw';
    const discountPct = ((basePrice - userOffer) / basePrice) * 100;
    const productNameStr = productName?.en || 'this product';

    // Accept if offer is at or above floor (but close to it)
    if (userOffer >= floorPrice && userOffer <= basePrice) {
      const acceptPhrases = isKinyarwanda ? [
        `Yego! Twemeje ${userOffer.toLocaleString()} RWF. Urabona amahirwe meza!`,
        `Byiza! Ndashobora gukora ${userOffer.toLocaleString()} RWF kuberako uri umukiriya mwiza.`,
        `Emeza! ${userOffer.toLocaleString()} RWF - ni igiciro cyiza kuri ${productNameStr}.`
      ] : [
        `You've got a deal! ${userOffer.toLocaleString()} RWF it is. You're getting excellent value on this ${productNameStr}!`,
        `Perfect! I can do ${userOffer.toLocaleString()} RWF for you. That's a great price for the quality you're getting.`,
        `Deal! ${userOffer.toLocaleString()} RWF is fair. You won't regret this purchase - ${productNameStr} is one of our best!`
      ];
      
      return {
        status: 'accept',
        counterPrice: userOffer,
        justification: acceptPhrases[Math.floor(Math.random() * acceptPhrases.length)],
        altPerks: [],
        bundleSuggestions: []
      };
    }

    // Reject if too low and final round
    if (userOffer < floorPrice && currentRound >= maxRounds) {
      const rejectPhrases = isKinyarwanda ? [
        `Tubabaje cyane, ariko ntidushobora kwemera munsi ya ${floorPrice.toLocaleString()} RWF. ${productNameStr} ni igicuruzwa cy'ireme kandi gifite agaciro.`,
        `Mbabarira, ${userOffer.toLocaleString()} RWF ni hasi cyane. Igiciro cyacu cya nyuma ni ${floorPrice.toLocaleString()} RWF.`
      ] : [
        `I really wish I could, but ${userOffer.toLocaleString()} RWF is below our cost. The absolute lowest I can go is ${floorPrice.toLocaleString()} RWF for this quality ${productNameStr}.`,
        `I understand you're looking for a good deal, but ${userOffer.toLocaleString()} RWF won't work. This ${productNameStr} is premium quality - ${floorPrice.toLocaleString()} RWF is already a great price.`
      ];
      
      const perks = [];
      if (fallbackPerks.freeShipping?.enabled) {
        perks.push({
          type: 'freeShipping',
          description: isKinyarwanda 
            ? 'Ariko ndashobora gutanga kohereza ubuntu niba wemera igiciro cyacu!' 
            : 'But I can throw in free shipping if you meet our price!'
        });
      }
      
      return {
        status: 'reject',
        justification: rejectPhrases[Math.floor(Math.random() * rejectPhrases.length)],
        altPerks: perks,
        bundleSuggestions: []
      };
    }

    // Strategic counter offer - minimize discount
    // If user offers MORE than base price, just accept it!
    if (userOffer >= basePrice) {
      return {
        status: 'accept',
        counterPrice: userOffer,
        justification: isKinyarwanda 
          ? `Yego! Twemeje ${userOffer.toLocaleString()} RWF. Urabona amahirwe meza!`
          : `You've got a deal! ${userOffer.toLocaleString()} RWF it is. You're getting excellent value!`,
        altPerks: [],
        bundleSuggestions: []
      };
    }
    
    const gap = basePrice - userOffer;
    let discountFactor;
    
    if (currentRound === 1) {
      discountFactor = 0.15; // Give only 15% of the gap
    } else if (currentRound === 2) {
      discountFactor = 0.30; // Give 30% of the gap
    } else {
      discountFactor = 0.50; // Final round, give 50% of the gap
    }
    
    // Counter offer should be HIGHER than user's offer (moving from base price toward user's offer)
    let counterPrice = Math.max(
      floorPrice,
      Math.round(basePrice - (gap * discountFactor))
    );
    
    // CRITICAL: Ensure counter price is ALWAYS higher than user's offer
    if (counterPrice <= userOffer) {
      counterPrice = Math.max(floorPrice, Math.round(userOffer * 1.05)); // At least 5% higher
    }

    // Human-like counter offer phrases
    const counterPhrases = isKinyarwanda ? [
      `Ndabona icyifuzo cyawe, ariko ${productNameStr} ni igicuruzwa cy'ireme. Ndashobora gutanga ${counterPrice.toLocaleString()} RWF - ni igiciro cyiza cyane!`,
      `Reka nkubwire ukuri - ${counterPrice.toLocaleString()} RWF ni igiciro cyiza kuri ${productNameStr}. Urabona agaciro kanaka!`,
      `Hmm, ${userOffer.toLocaleString()} RWF ni hasi gato. Ndashobora gukora ${counterPrice.toLocaleString()} RWF kuberako uri umukiriya mwiza.`
    ] : [
      `I hear you, but ${productNameStr} is premium quality. Let me do ${counterPrice.toLocaleString()} RWF for you - that's already a fantastic deal!`,
      `I'll be honest with you - ${counterPrice.toLocaleString()} RWF is a great price for this ${productNameStr}. You're getting real value here!`,
      `${userOffer.toLocaleString()} RWF is a bit low for the quality. How about ${counterPrice.toLocaleString()} RWF? I can make that work for you.`
    ];

    // Add urgency if low stock
    let justification = counterPhrases[Math.floor(Math.random() * counterPhrases.length)];
    if (stockLevel < 10) {
      justification += isKinyarwanda 
        ? ` Bisigaye ${stockLevel} gusa!` 
        : ` Only ${stockLevel} left in stock!`;
    }

    // Offer perks on round 2+ if customer is still far from floor
    const perks = [];
    if (currentRound >= 2 && userOffer < floorPrice * 1.1) {
      if (fallbackPerks.freeShipping?.enabled) {
        perks.push({
          type: 'freeShipping',
          description: isKinyarwanda 
            ? 'Kohereza ubuntu niba wemera!' 
            : 'Plus free shipping if you accept!'
        });
      }
    }

    return {
      status: currentRound >= maxRounds - 1 ? 'final' : 'counter',
      counterPrice,
      justification,
      altPerks: perks,
      bundleSuggestions: []
    };
  }
}

module.exports = new LLMService();
