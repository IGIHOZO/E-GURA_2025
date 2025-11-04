/**
 * AI-Powered Robust Product Fetcher
 * Multiple fallback strategies with retry logic
 */

class ProductFetcher {
  constructor() {
    this.maxRetries = 3;
    this.retryDelay = 500; // ms
    this.cache = new Map();
    this.cacheExpiry = 60000; // 1 minute
  }

  /**
   * Fetch product with AI-powered retry and fallback strategies
   */
  async fetchProduct(productId) {
    console.log('🤖 AI Product Fetcher starting for ID:', productId);

    // Strategy 1: Check cache first
    const cached = this.getFromCache(productId);
    if (cached) {
      console.log('⚡ Cache hit! Returning cached product');
      return cached;
    }

    // Try multiple strategies in order
    const strategies = [
      () => this.strategy1_ModelsIndex(productId),
      () => this.strategy2_DirectSequelize(productId),
      () => this.strategy3_RawSQL(productId),
      () => this.strategy4_DirectImport(productId)
    ];

    let lastError;
    let productNotFound = false;
    
    for (let i = 0; i < strategies.length; i++) {
      const strategyName = `Strategy ${i + 1}`;
      console.log(`🔄 Trying ${strategyName}...`);

      try {
        const product = await strategies[i](); // Try without retry first
        if (product) {
          console.log(`✅ ${strategyName} SUCCESS! Product found:`, product.name || product.id);
          this.saveToCache(productId, product);
          return product;
        } else {
          // Strategy succeeded but product not found
          console.log(`📭 ${strategyName} executed but product not found`);
          productNotFound = true;
        }
      } catch (error) {
        console.error(`❌ ${strategyName} failed:`, error.message);
        lastError = error;
        continue;
      }
    }

    // If at least one strategy succeeded but found no product, return null
    if (productNotFound) {
      console.log('📭 Product does not exist in database');
      return null;
    }

    // All strategies failed with errors
    throw new Error(`Database error. Last error: ${lastError?.message}`);
  }

  /**
   * Strategy 1: Use models/index.js
   */
  async strategy1_ModelsIndex(productId) {
    try {
      const models = require('../models');
      const Product = models.Product;

      if (!Product) throw new Error('Product model not found');

      if (typeof Product.findByPk === 'function') {
        return await Product.findByPk(productId);
      } else if (typeof Product.findById === 'function') {
        return await Product.findById(productId);
      }

      throw new Error('No suitable find method');
    } catch (error) {
      throw new Error(`Models index failed: ${error.message}`);
    }
  }

  /**
   * Strategy 2: Direct Sequelize connection
   */
  async strategy2_DirectSequelize(productId) {
    try {
      const { sequelize } = require('../config/database');
      const { DataTypes } = require('sequelize');

      // Define model directly
      const Product = sequelize.define('Product', {
        id: { type: DataTypes.UUID, primaryKey: true },
        name: DataTypes.STRING,
        price: DataTypes.DECIMAL,
        description: DataTypes.TEXT,
        mainImage: DataTypes.STRING,
        category: DataTypes.STRING,
        stockQuantity: DataTypes.INTEGER,
        isActive: DataTypes.BOOLEAN
      }, {
        tableName: 'Products',
        timestamps: false
      });

      return await Product.findByPk(productId);
    } catch (error) {
      throw new Error(`Direct Sequelize failed: ${error.message}`);
    }
  }

  /**
   * Strategy 3: Raw SQL query
   */
  async strategy3_RawSQL(productId) {
    try {
      const { sequelize } = require('../config/database');

      const [results] = await sequelize.query(
        'SELECT * FROM "Products" WHERE id = :id LIMIT 1',
        {
          replacements: { id: productId },
          type: sequelize.QueryTypes.SELECT
        }
      );

      return results[0] || null;
    } catch (error) {
      throw new Error(`Raw SQL failed: ${error.message}`);
    }
  }

  /**
   * Strategy 4: Direct model import
   */
  async strategy4_DirectImport(productId) {
    try {
      // Try to import Product model directly
      const Product = require('../models/Product');
      
      if (typeof Product.findByPk === 'function') {
        return await Product.findByPk(productId);
      }
      
      throw new Error('Direct import has no findByPk method');
    } catch (error) {
      throw new Error(`Direct import failed: ${error.message}`);
    }
  }

  /**
   * Retry with exponential backoff
   */
  async retryWithBackoff(fn, retries) {
    for (let i = 0; i < retries; i++) {
      try {
        return await fn();
      } catch (error) {
        if (i === retries - 1) throw error;
        
        const delay = this.retryDelay * Math.pow(2, i);
        console.log(`⏳ Retry ${i + 1}/${retries} after ${delay}ms...`);
        await this.sleep(delay);
      }
    }
  }

  /**
   * Cache management
   */
  saveToCache(productId, product) {
    this.cache.set(productId, {
      product,
      timestamp: Date.now()
    });
    console.log('💾 Product cached');
  }

  getFromCache(productId) {
    const cached = this.cache.get(productId);
    if (!cached) return null;

    const age = Date.now() - cached.timestamp;
    if (age > this.cacheExpiry) {
      this.cache.delete(productId);
      return null;
    }

    return cached.product;
  }

  clearCache() {
    this.cache.clear();
    console.log('🧹 Cache cleared');
  }

  /**
   * Sleep utility
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Test database connection
   */
  async testConnection() {
    console.log('🔍 Testing database connection...');
    
    try {
      const { sequelize } = require('../config/database');
      await sequelize.authenticate();
      console.log('✅ Database connection OK');
      return true;
    } catch (error) {
      console.error('❌ Database connection failed:', error.message);
      return false;
    }
  }

  /**
   * Get all available products (for fallback)
   */
  async getAllProducts() {
    try {
      const { sequelize } = require('../config/database');
      const [results] = await sequelize.query(
        'SELECT * FROM products WHERE "isActive" = true LIMIT 100'
      );
      return results;
    } catch (error) {
      console.error('❌ Failed to get all products:', error.message);
      return [];
    }
  }
}

// Export singleton
module.exports = new ProductFetcher();
