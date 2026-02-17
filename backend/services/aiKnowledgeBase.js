const path = require('path');
const fs = require('fs/promises');
let tf;
let use;
let selectedBackend = null;

try {
  tf = require('@tensorflow/tfjs-node');
  selectedBackend = 'tfjs-node';
} catch (nodeBackendError) {
  console.warn('⚠️ TensorFlow native bindings unavailable, falling back to pure JS backend:', nodeBackendError.message);
  try {
    tf = require('@tensorflow/tfjs');
    require('@tensorflow/tfjs-backend-cpu');
    selectedBackend = 'cpu';
  } catch (jsBackendError) {
    console.error('❌ TensorFlow JS backend unavailable:', jsBackendError.message);
  }
}

try {
  use = require('@tensorflow-models/universal-sentence-encoder');
} catch (modelLoadError) {
  console.error('❌ Universal Sentence Encoder unavailable:', modelLoadError.message);
}
const { Product } = require('../models');

const DATA_DIR = path.join(__dirname, '..', 'data', 'assistant');
const LEARNING_FILE = path.join(DATA_DIR, 'learned-qa.json');
const MAX_LEARNING_ENTRIES = 2000;
const PRODUCT_REFRESH_INTERVAL = 30 * 60 * 1000; // 30 minutes
const LEARNING_REFRESH_INTERVAL = 5 * 60 * 1000; // 5 minutes
const MIN_CONFIDENCE_FOR_DIRECT_ANSWER = 0.45;
const MIN_CONFIDENCE_FOR_LEARNING = 0.3;

const COMMON_STOPWORDS = new Set([
  'the', 'and', 'for', 'with', 'that', 'this', 'from', 'what', 'which', 'when', 'where', 'have', 'about',
  'into', 'would', 'could', 'should', 'there', 'your', 'you', 'our', 'are', 'was', 'were', 'how', 'much',
  'price', 'need', 'want', 'like', 'find', 'tell', 'show', 'best', 'more', 'info'
]);

class AIKnowledgeBase {
  constructor() {
    this.modelPromise = null;
    this.productKnowledge = [];
    this.productEmbeddings = [];
    this.qaEntries = [];
    this.qaEmbeddings = [];
    this.lastProductRefresh = 0;
    this.lastLearningRefresh = 0;
    this.learningDirty = true;
    this.qaDirty = true;
    this.loadingProducts = null;
    this.loadingLearning = null;
    this.enabled = Boolean(tf && use);
    this.backend = selectedBackend;
    this.disabledReason = this.enabled ? null : 'TensorFlow modules missing';
  }

  async ensureModel() {
    if (!this.enabled) {
      return null;
    }
    if (!this.modelPromise) {
      this.modelPromise = (async () => {
        try {
          if (tf?.setBackend && this.backend === 'cpu') {
            await tf.setBackend('cpu');
          }
          if (tf?.ready) {
            await tf.ready();
          }
        } catch (backendError) {
          console.warn('⚠️ Unable to initialize TensorFlow backend:', backendError.message);
        }
        return use.load();
      })().catch((error) => {
        console.error('❌ Failed to load TensorFlow model:', error.message);
        this.enabled = false;
        this.disabledReason = error.message;
        return null;
      });
    }
    return this.modelPromise;
  }

  async embedTexts(texts) {
    if (!this.enabled || !texts || texts.length === 0) {
      return [];
    }
    const model = await this.ensureModel();
    if (!model) {
      return [];
    }
    const embeddingsTensor = await model.embed(texts);
    const rawEmbeddings = await embeddingsTensor.array();
    embeddingsTensor.dispose();
    return rawEmbeddings.map((vector) => this.normalizeVector(vector));
  }

  normalizeVector(vector) {
    const norm = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
    if (!norm) return vector.map(() => 0);
    return vector.map((val) => val / norm);
  }

  dotProduct(vecA, vecB) {
    return vecA.reduce((sum, val, idx) => sum + val * (vecB[idx] || 0), 0);
  }

  extractKeywords(text) {
    return (text || '')
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .filter((token) => token && token.length > 2 && !COMMON_STOPWORDS.has(token));
  }

  applyKeywordBoost(results, keywords) {
    if (!keywords || keywords.length === 0) {
      results.forEach((item) => { item.adjustedScore = item.score; });
      return;
    }

    const keywordSet = new Set(keywords);

    results.forEach((item) => {
      let boost = 0;
      if (item.type === 'product') {
        const haystack = [
          item.entry.name,
          item.entry.category,
          item.entry.description,
          ...(item.entry.tags || [])
        ].join(' ').toLowerCase();
        keywordSet.forEach((keyword) => {
          if (haystack.includes(keyword)) {
            boost += 0.03; // moderate boost per keyword
          }
        });
      } else if (item.type === 'qa') {
        const haystack = `${item.entry.question} ${item.entry.answer}`.toLowerCase();
        keywordSet.forEach((keyword) => {
          if (haystack.includes(keyword)) {
            boost += 0.02;
          }
        });
      }

      const cappedBoost = Math.min(boost, 0.18);
      item.adjustedScore = item.score + cappedBoost;
    });
  }

  async ensureProductKnowledge(force = false) {
    if (!this.enabled) {
      return;
    }
    const now = Date.now();
    if (!force && now - this.lastProductRefresh < PRODUCT_REFRESH_INTERVAL && this.productKnowledge.length > 0) {
      return;
    }

    if (this.loadingProducts) {
      await this.loadingProducts;
      return;
    }

    this.loadingProducts = this.loadProductKnowledge()
      .catch((error) => {
        console.error('❌ Failed to load product knowledge:', error);
      })
      .finally(() => {
        this.loadingProducts = null;
      });

    await this.loadingProducts;
  }

  async loadProductKnowledge() {
    if (!this.enabled) {
      return;
    }
    const products = await this.fetchProducts();

    const knowledgeEntries = products.map((product) => ({
      id: product.id,
      name: product.name,
      price: Number(product.price) || null,
      description: product.description || '',
      category: product.category || '',
      tags: Array.isArray(product.tags) ? product.tags : [],
      image: product.mainImage || product.image || (Array.isArray(product.images) ? product.images[0] : null),
      metadata: {
        brand: product.brand || null,
        sku: product.sku || product.id,
        stock: product.stockQuantity ?? product.stock ?? null
      }
    }));

    const texts = knowledgeEntries.map((entry) => this.buildProductContext(entry));
    const embeddings = await this.embedTexts(texts);

    this.productKnowledge = knowledgeEntries.map((entry, index) => ({
      ...entry,
      context: texts[index]
    }));
    this.productEmbeddings = embeddings;
    this.lastProductRefresh = Date.now();
  }

  buildProductContext(entry) {
    const parts = [
      entry.name,
      entry.category,
      entry.description,
      ...(entry.tags || [])
    ].filter(Boolean);

    if (entry.metadata?.brand) {
      parts.push(`Brand: ${entry.metadata.brand}`);
    }
    if (entry.price) {
      parts.push(`Price: ${entry.price}`);
    }
    return parts.join('\n');
  }

  async fetchProducts() {
    try {
      if (typeof Product.findAll === 'function') {
        const records = await Product.findAll({
          where: { isActive: true },
          attributes: ['id', 'name', 'price', 'description', 'category', 'tags', 'brand', 'sku', 'stockQuantity', 'mainImage', 'images']
        });
        return records.map((record) => record.toJSON ? record.toJSON() : record);
      }

      const records = await Product.find({ isActive: true })
        .select('name price description category tags brand sku stockQuantity mainImage images')
        .lean();
      return records;
    } catch (error) {
      console.error('❌ Error fetching products for knowledge base:', error);
      return [];
    }
  }

  async ensureLearningData(force = false) {
    if (!this.enabled) {
      return;
    }
    const now = Date.now();
    if (!force && !this.learningDirty && now - this.lastLearningRefresh < LEARNING_REFRESH_INTERVAL) {
      return;
    }

    if (this.loadingLearning) {
      await this.loadingLearning;
      return;
    }

    this.loadingLearning = this.loadLearningData()
      .catch((error) => {
        console.error('❌ Failed to load learning data:', error);
      })
      .finally(() => {
        this.loadingLearning = null;
      });

    await this.loadingLearning;
  }

  async loadLearningData() {
    if (!this.enabled) {
      return;
    }
    try {
      await fs.mkdir(DATA_DIR, { recursive: true });
      try {
        const raw = await fs.readFile(LEARNING_FILE, 'utf-8');
        this.qaEntries = JSON.parse(raw);
      } catch (readError) {
        if (readError.code === 'ENOENT') {
          this.qaEntries = [];
          await fs.writeFile(LEARNING_FILE, '[]', 'utf-8');
        } else {
          throw readError;
        }
      }
    } catch (error) {
      console.error('❌ Unable to initialise learning store:', error);
      this.qaEntries = [];
    }

    this.qaDirty = true;
    this.learningDirty = false;
    this.lastLearningRefresh = Date.now();
  }

  async ensureQAEmbeddings() {
    if (!this.enabled) {
      return;
    }
    await this.ensureLearningData();
    if (!this.qaDirty) return;

    const entriesWithAnswers = this.qaEntries.filter((entry) => entry.answer);
    const texts = entriesWithAnswers.map((entry) => `${entry.question}\n${entry.answer}`);
    const embeddings = await this.embedTexts(texts);

    this.qaEmbeddings = embeddings;
    this.qaEntriesWithEmbeddings = entriesWithAnswers;
    this.qaDirty = false;
  }

  async answerQuestion(question, options = {}) {
    const trimmed = (question || '').trim();
    if (!trimmed) {
      return null;
    }

    if (!this.enabled) {
      return null;
    }

    await this.ensureProductKnowledge();
    await this.ensureQAEmbeddings();

    const [questionEmbedding] = await this.embedTexts([trimmed]);
    if (!questionEmbedding) {
      return null;
    }

    const results = [];
    const keywords = this.extractKeywords(trimmed);

    this.productEmbeddings.forEach((embedding, index) => {
      const score = this.dotProduct(questionEmbedding, embedding);
      if (score > 0) {
        results.push({
          type: 'product',
          score,
          entry: this.productKnowledge[index]
        });
      }
    });

    if (this.qaEmbeddings.length > 0) {
      this.qaEmbeddings.forEach((embedding, index) => {
        const score = this.dotProduct(questionEmbedding, embedding);
        if (score > 0) {
          results.push({
            type: 'qa',
            score,
            entry: this.qaEntriesWithEmbeddings[index]
          });
        }
      });
    }

    this.applyKeywordBoost(results, keywords);

    results.sort((a, b) => (b.adjustedScore ?? b.score) - (a.adjustedScore ?? a.score));
    const limit = options.limit || 3;
    const topResults = results.slice(0, limit);
    const best = topResults[0];
    const bestScore = best?.adjustedScore ?? best?.score;

    if (!best || bestScore < MIN_CONFIDENCE_FOR_LEARNING) {
      await this.recordLearningOpportunity(trimmed, { reason: 'low_confidence', score: bestScore || 0 });
      
      // Instead of returning null, provide a helpful fallback answer
      const fallbackAnswer = this.generateFallbackAnswer(trimmed, topResults);
      
      return {
        answer: fallbackAnswer,
        confidence: bestScore || 0,
        references: topResults.map((item) => this.mapReference(item)),
        needsLearning: true,
        lowConfidence: true
      };
    }

    if (best.type === 'qa' && best.entry.answer && bestScore >= MIN_CONFIDENCE_FOR_DIRECT_ANSWER) {
      return {
        answer: best.entry.answer,
        confidence: bestScore,
        references: topResults.map((item) => this.mapReference(item)),
        needsLearning: false
      };
    }

    // Compose dynamic product answer
    const relatedProducts = topResults
      .filter((item) => item.type === 'product')
      .map((item) => item.entry);

    const isLowConfidence = bestScore < MIN_CONFIDENCE_FOR_DIRECT_ANSWER;
    if (isLowConfidence) {
      await this.recordLearningOpportunity(trimmed, { reason: 'low_confidence_answer', score: bestScore });
    }

    const answer = isLowConfidence
      ? `I'm still learning about that, but here's what I found:

${this.composeProductAnswer(relatedProducts)}`
      : this.composeProductAnswer(relatedProducts);

    return {
      answer,
      confidence: bestScore,
      references: topResults.map((item) => this.mapReference(item)),
      needsLearning: false,
      lowConfidence: isLowConfidence
    };
  }

  mapReference(result) {
    if (result.type === 'product') {
      return {
        type: result.type,
        id: result.entry.id,
        name: result.entry.name,
        price: result.entry.price,
        category: result.entry.category,
        image: result.entry.image,
        score: result.score,
        adjustedScore: result.adjustedScore
      };
    }

    return {
      type: 'qa',
      question: result.entry.question,
      answer: result.entry.answer,
      score: result.score,
      adjustedScore: result.adjustedScore
    };
  }

  generateFallbackAnswer(question, topResults) {
    // Generate a helpful response even when confidence is low
    const lowerQuestion = question.toLowerCase();
    
    // Check if it's a greeting or simple query
    if (['hi', 'hello', 'hey', 'proceed', 'ok', 'yes', 'no'].some(word => lowerQuestion === word)) {
      return "I'm here to help! You can ask me about products, prices, or make an offer. What would you like to know? 😊";
    }
    
    // If we have some results, show them
    if (topResults && topResults.length > 0) {
      const products = topResults.filter(r => r.type === 'product').map(r => r.entry);
      if (products.length > 0) {
        return `I found some products that might interest you. Let me show you what we have! 🛍️`;
      }
    }
    
    // Generic helpful response
    return "I'm still learning about that! Could you rephrase your question or tell me what product you're looking for? I can help you find items, check prices, or negotiate deals! 💡";
  }

  composeProductAnswer(products) {
    if (!products || products.length === 0) {
      return "I'm still gathering more information about that product.";
    }

    const primary = products[0];
    const lines = [];

    lines.push(`Here's what I found about **${primary.name}**:`);
    if (primary.price) {
      lines.push(`• Current price: ${Number(primary.price).toLocaleString()} RWF`);
    }
    if (primary.category) {
      lines.push(`• Category: ${primary.category}`);
    }
    if (primary.description) {
      const summary = primary.description.length > 320
        ? `${primary.description.slice(0, 317)}...`
        : primary.description;
      lines.push(`• Details: ${summary}`);
    }
    if (primary.metadata?.stock !== undefined && primary.metadata.stock !== null) {
      const stockText = Number(primary.metadata.stock) > 0 ? 'In stock' : 'Currently low on stock';
      lines.push(`• Availability: ${stockText}`);
    }

    if (products.length > 1) {
      const otherNames = products.slice(1).map((p) => p.name).filter(Boolean);
      if (otherNames.length > 0) {
        lines.push(`Need alternatives? I can also show you: ${otherNames.slice(0, 3).join(', ')}.`);
      }
    }

    lines.push("Let me know if you want to negotiate or see similar items! ✨");
    return lines.join('\n');
  }

  async recordLearningOpportunity(question, metadata = {}) {
    if (!this.enabled) {
      return;
    }
    await this.ensureLearningData();

    const existingIndex = this.qaEntries.findIndex((entry) => entry.question.toLowerCase() === question.toLowerCase());
    if (existingIndex !== -1) {
      const existing = this.qaEntries[existingIndex];
      existing.occurrences = (existing.occurrences || 0) + 1;
      existing.lastAskedAt = new Date().toISOString();
      existing.metadata = { ...existing.metadata, ...metadata };
    } else {
      this.qaEntries.push({
        question,
        answer: null,
        createdAt: new Date().toISOString(),
        lastAskedAt: new Date().toISOString(),
        occurrences: 1,
        metadata
      });

      if (this.qaEntries.length > MAX_LEARNING_ENTRIES) {
        this.qaEntries.shift();
      }
    }

    this.qaDirty = true;
    await this.saveLearningData();
  }

  async learn(question, answer, metadata = {}) {
    if (!this.enabled) {
      return;
    }
    await this.ensureLearningData(true);

    const cleanedQuestion = question.trim();
    const cleanedAnswer = answer.trim();

    let entry = this.qaEntries.find((item) => item.question.toLowerCase() === cleanedQuestion.toLowerCase());
    if (!entry) {
      entry = {
        question: cleanedQuestion,
        answer: cleanedAnswer,
        createdAt: new Date().toISOString(),
        lastAskedAt: new Date().toISOString(),
        occurrences: 1,
        metadata
      };
      this.qaEntries.push(entry);
    } else {
      entry.answer = cleanedAnswer;
      entry.lastLearnedAt = new Date().toISOString();
      entry.metadata = { ...entry.metadata, ...metadata };
    }

    this.qaDirty = true;
    await this.saveLearningData();
  }

  async saveLearningData() {
    if (!this.enabled) {
      return;
    }
    try {
      await fs.mkdir(DATA_DIR, { recursive: true });
      await fs.writeFile(LEARNING_FILE, JSON.stringify(this.qaEntries, null, 2), 'utf-8');
    } catch (error) {
      console.error('❌ Failed to persist learning data:', error);
    }
  }

  async findRelevantProducts(query, options = {}) {
    const trimmed = (query || '').trim();
    if (!trimmed) return [];

    if (!this.enabled) {
      return [];
    }

    await this.ensureProductKnowledge();
    const [queryEmbedding] = await this.embedTexts([trimmed]);
    if (!queryEmbedding) return [];

    const scores = this.productEmbeddings.map((embedding, index) => ({
      score: this.dotProduct(queryEmbedding, embedding),
      entry: this.productKnowledge[index]
    }));

    const sorted = scores
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, options.limit || 5);

    return sorted.map((item) => ({
      id: item.entry.id,
      name: item.entry.name,
      price: item.entry.price,
      category: item.entry.category,
      image: item.entry.image,
      score: item.score
    }));
  }
}

module.exports = new AIKnowledgeBase();
