/**
 * Embedding Service - Generates vector embeddings for semantic search
 * Supports multiple providers with automatic fallback
 */

class EmbeddingService {
  constructor() {
    this.provider = process.env.EMBEDDING_PROVIDER || 'local';
    this.model = process.env.EMBEDDING_MODEL || 'all-MiniLM-L6-v2';
    this.dimensions = 384; // Standard for all-MiniLM-L6-v2
    this.cache = new Map(); // Simple in-memory cache
  }

  /**
   * Generate embedding for text
   * @param {string} text - Text to embed
   * @returns {Promise<number[]>} - Embedding vector
   */
  async generateEmbedding(text) {
    if (!text || typeof text !== 'string') {
      throw new Error('Invalid text input');
    }

    // Check cache
    const cacheKey = this.hashText(text);
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    let embedding;

    try {
      switch (this.provider) {
        case 'openai':
          embedding = await this.generateOpenAIEmbedding(text);
          break;
        case 'cohere':
          embedding = await this.generateCohereEmbedding(text);
          break;
        case 'local':
        default:
          embedding = await this.generateLocalEmbedding(text);
          break;
      }

      // Cache result
      if (this.cache.size > 10000) {
        // Clear cache if too large
        this.cache.clear();
      }
      this.cache.set(cacheKey, embedding);

      return embedding;
    } catch (error) {
      console.error('Embedding generation failed:', error);
      // Fallback to simple TF-IDF based embedding
      return this.generateFallbackEmbedding(text);
    }
  }

  /**
   * Generate embedding using OpenAI
   */
  async generateOpenAIEmbedding(text) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const response = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'text-embedding-3-small',
        input: text.substring(0, 8000) // Limit length
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const data = await response.json();
    const embedding = data.data[0].embedding;

    // Resize to 384 dimensions if needed
    return this.resizeEmbedding(embedding, this.dimensions);
  }

  /**
   * Generate embedding using Cohere
   */
  async generateCohereEmbedding(text) {
    const apiKey = process.env.COHERE_API_KEY;
    if (!apiKey) {
      throw new Error('Cohere API key not configured');
    }

    const response = await fetch('https://api.cohere.ai/v1/embed', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        texts: [text.substring(0, 2048)],
        model: 'embed-english-light-v3.0',
        input_type: 'search_document'
      })
    });

    if (!response.ok) {
      throw new Error(`Cohere API error: ${response.statusText}`);
    }

    const data = await response.json();
    const embedding = data.embeddings[0];

    return this.resizeEmbedding(embedding, this.dimensions);
  }

  /**
   * Generate embedding using local simple method (TF-IDF inspired)
   * This is a lightweight fallback that doesn't require external APIs
   */
  async generateLocalEmbedding(text) {
    // Tokenize and normalize
    const tokens = this.tokenize(text.toLowerCase());
    
    // Create a fixed-size embedding using hashing trick
    const embedding = new Array(this.dimensions).fill(0);
    
    // Calculate term frequencies
    const termFreq = new Map();
    tokens.forEach(token => {
      termFreq.set(token, (termFreq.get(token) || 0) + 1);
    });
    
    // Normalize and hash into embedding space
    const maxFreq = Math.max(...termFreq.values());
    termFreq.forEach((freq, term) => {
      const normalizedFreq = freq / maxFreq;
      
      // Use multiple hash functions for better distribution
      for (let i = 0; i < 3; i++) {
        const hash = this.hashString(term + i) % this.dimensions;
        embedding[hash] += normalizedFreq / 3;
      }
    });
    
    // Normalize to unit vector
    return this.normalizeVector(embedding);
  }

  /**
   * Fallback embedding for errors
   */
  generateFallbackEmbedding(text) {
    console.warn('Using fallback embedding generation');
    return this.generateLocalEmbedding(text);
  }

  /**
   * Tokenize text
   */
  tokenize(text) {
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(t => t.length > 2);
  }

  /**
   * Hash string to number
   */
  hashString(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  /**
   * Hash text for caching
   */
  hashText(text) {
    return this.hashString(text).toString();
  }

  /**
   * Resize embedding to target dimensions
   */
  resizeEmbedding(embedding, targetDim) {
    if (embedding.length === targetDim) {
      return embedding;
    }

    if (embedding.length > targetDim) {
      // Truncate
      return embedding.slice(0, targetDim);
    }

    // Pad with zeros
    return [...embedding, ...new Array(targetDim - embedding.length).fill(0)];
  }

  /**
   * Normalize vector to unit length
   */
  normalizeVector(vec) {
    const norm = Math.sqrt(vec.reduce((sum, val) => sum + val * val, 0));
    if (norm === 0) return vec;
    return vec.map(val => val / norm);
  }

  /**
   * Batch generate embeddings
   */
  async generateBatchEmbeddings(texts) {
    return Promise.all(texts.map(text => this.generateEmbedding(text)));
  }

  /**
   * Clear cache
   */
  clearCache() {
    this.cache.clear();
  }
}

module.exports = new EmbeddingService();
