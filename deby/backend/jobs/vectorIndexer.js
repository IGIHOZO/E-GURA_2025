/**
 * Vector Indexer - Background job to generate and update product embeddings
 */

const Product = require('../models/Product');
const ProductVector = require('../models/ProductVector');
const embeddingService = require('../services/embeddingService');

class VectorIndexer {
  constructor() {
    this.batchSize = 10;
    this.isRunning = false;
  }

  /**
   * Index all products
   */
  async indexAll() {
    if (this.isRunning) {
      console.log('⚠️ Indexer already running');
      return;
    }

    this.isRunning = true;
    const startTime = Date.now();

    try {
      console.log('🚀 Starting full vector indexing...');

      const products = await Product.find({ isActive: true })
        .select('name description category brand tags colors material')
        .lean();

      console.log(`📊 Found ${products.length} products to index`);

      let indexed = 0;
      let errors = 0;

      // Process in batches
      for (let i = 0; i < products.length; i += this.batchSize) {
        const batch = products.slice(i, i + this.batchSize);
        
        await Promise.all(batch.map(async (product) => {
          try {
            await this.indexProduct(product._id, product);
            indexed++;
            if (indexed % 50 === 0) {
              console.log(`✅ Indexed ${indexed}/${products.length} products`);
            }
          } catch (error) {
            console.error(`❌ Failed to index product ${product._id}:`, error.message);
            errors++;
          }
        }));
      }

      const duration = ((Date.now() - startTime) / 1000).toFixed(2);
      console.log(`✅ Indexing complete: ${indexed} indexed, ${errors} errors, ${duration}s`);

      return { indexed, errors, duration };
    } catch (error) {
      console.error('❌ Indexing failed:', error);
      throw error;
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Index single product
   */
  async indexProduct(productId, productData = null) {
    try {
      // Fetch product if not provided
      if (!productData) {
        productData = await Product.findById(productId)
          .select('name description category brand tags colors material')
          .lean();
      }

      if (!productData) {
        throw new Error('Product not found');
      }

      // Generate embedding text
      const embeddingText = this.generateEmbeddingText(productData);

      // Generate embedding
      const embedding = await embeddingService.generateEmbedding(embeddingText);

      // Upsert vector
      await ProductVector.upsertVector(productId, embedding, embeddingText);

      return true;
    } catch (error) {
      console.error(`Failed to index product ${productId}:`, error);
      throw error;
    }
  }

  /**
   * Index products that need updates
   */
  async indexUpdated() {
    try {
      console.log('🔄 Indexing updated products...');

      // Find products updated recently without vectors or with old vectors
      const recentlyUpdated = await Product.find({
        isActive: true,
        updatedAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } // Last 24h
      }).select('_id').lean();

      if (recentlyUpdated.length === 0) {
        console.log('✅ No products need updating');
        return { indexed: 0 };
      }

      const productIds = recentlyUpdated.map(p => p._id);
      
      // Check which ones need reindexing
      const existingVectors = await ProductVector.find({
        productId: { $in: productIds }
      }).select('productId updatedAt').lean();

      const existingMap = new Map(
        existingVectors.map(v => [v.productId.toString(), v.updatedAt])
      );

      const toIndex = [];
      for (const product of recentlyUpdated) {
        const pid = product._id.toString();
        const vectorUpdated = existingMap.get(pid);
        
        if (!vectorUpdated || vectorUpdated < product.updatedAt) {
          toIndex.push(product._id);
        }
      }

      console.log(`📊 ${toIndex.length} products need reindexing`);

      let indexed = 0;
      for (const productId of toIndex) {
        try {
          await this.indexProduct(productId);
          indexed++;
        } catch (error) {
          console.error(`Failed to index ${productId}:`, error.message);
        }
      }

      console.log(`✅ Indexed ${indexed} updated products`);
      return { indexed };
    } catch (error) {
      console.error('❌ Update indexing failed:', error);
      throw error;
    }
  }

  /**
   * Generate embedding text from product
   */
  generateEmbeddingText(product) {
    const parts = [
      product.name,
      product.description,
      product.category,
      product.brand,
      ...(product.tags || []),
      ...(product.colors || []),
      ...(product.material || [])
    ].filter(Boolean);

    return parts.join(' ');
  }

  /**
   * Get indexing status
   */
  async getStatus() {
    const totalProducts = await Product.countDocuments({ isActive: true });
    const indexedProducts = await ProductVector.countDocuments();
    const recentlyIndexed = await ProductVector.countDocuments({
      updatedAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
    });

    return {
      totalProducts,
      indexedProducts,
      recentlyIndexed,
      coverage: totalProducts > 0 ? (indexedProducts / totalProducts * 100).toFixed(2) : 0,
      isRunning: this.isRunning
    };
  }
}

module.exports = new VectorIndexer();
