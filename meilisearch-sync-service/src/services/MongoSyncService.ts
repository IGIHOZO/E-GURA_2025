import mongoose from 'mongoose';
import { MeilisearchService, ProductDocument } from './MeilisearchService';
import { logger } from '../utils/logger';

export interface MongoProduct {
  _id: mongoose.Types.ObjectId;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  mainImage?: string;
  images?: string[];
  category: string;
  brand?: string;
  gender?: string;
  sizes?: string[];
  colors?: string[];
  material?: string[];
  tags?: string[];
  stockQuantity: number;
  averageRating?: number;
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
  variants?: Array<{
    size?: string;
    color?: string;
    price?: number;
    stockQuantity?: number;
  }>;
}

export class MongoSyncService {
  private meilisearchService: MeilisearchService;
  private isConnected: boolean = false;
  private changeStream?: mongoose.ChangeStream;
  private backfillInProgress: boolean = false;

  constructor(meilisearchService: MeilisearchService) {
    this.meilisearchService = meilisearchService;
  }

  async initialize() {
    try {
      logger.info('Initializing MongoDB sync service...');

      // Connect to MongoDB with multiple retry attempts
      const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/ecommerce';

      logger.info(`Attempting to connect to MongoDB at: ${mongoUri}`);

      const mongooseOptions = {
        serverSelectionTimeoutMS: 15000, // 15 seconds
        socketTimeoutMS: 45000, // 45 seconds
        bufferCommands: false,
        bufferMaxEntries: 0,
        maxPoolSize: 10,
        minPoolSize: 2,
        maxIdleTimeMS: 30000,
        retryWrites: true,
        retryReads: true,
      };

      // Try to connect with retry logic
      let retries = 3;
      while (retries > 0) {
        try {
          await mongoose.connect(mongoUri, mongooseOptions);
          break;
        } catch (error) {
          retries--;
          if (retries > 0) {
            logger.warn(`MongoDB connection failed, retrying... (${retries} attempts left)`);
            await new Promise(resolve => setTimeout(resolve, 2000));
          } else {
            throw error;
          }
        }
      }

      this.isConnected = true;
      logger.info('✅ MongoDB connected successfully');

      // Test the connection
      const collections = await mongoose.connection.db.listCollections().toArray();
      logger.info(`Found ${collections.length} collections in database`);

    } catch (error) {
      logger.error('❌ Failed to connect to MongoDB:', error.message);
      logger.warn('MongoDB connection failed. Running in demo mode.');
      logger.info('To enable full functionality:');
      logger.info('1. Install MongoDB: See MONGODB_INSTALLATION_GUIDE.md');
      logger.info('2. Start MongoDB: mongod --dbpath C:\\data\\db');
      logger.info('3. Or install using Chocolatey: choco install mongodb');

      this.isConnected = false;
    }
  }

  async startSync() {
    if (!this.isConnected) {
      logger.warn('MongoDB not connected. Skipping sync operations.');
      logger.info('Search service will still function, but without real-time MongoDB updates.');
      return;
    }

    logger.info('Starting MongoDB-Meilisearch sync...');

    try {
      // Start backfill if needed
      await this.ensureBackfillComplete();

      // Start change stream monitoring
      await this.startChangeStream();

      logger.info('MongoDB-Meilisearch sync started successfully');
    } catch (error) {
      logger.error('Failed to start sync:', error);
      throw error;
    }
  }

  private async ensureBackfillComplete() {
    // Check if we need to backfill existing data
    const Product = mongoose.model('Product');
    const count = await Product.countDocuments({ isActive: true });

    if (count > 0) {
      logger.info(`Found ${count} products in MongoDB. Starting backfill...`);
      await this.backfillProducts();
    } else {
      logger.info('No products found in MongoDB');
    }
  }

  private async backfillProducts() {
    if (this.backfillInProgress) {
      logger.warn('Backfill already in progress');
      return;
    }

    this.backfillInProgress = true;

    try {
      logger.info('Starting backfill of existing products...');

      const Product = mongoose.model('Product');
      const batchSize = 100;
      let skip = 0;
      let processed = 0;

      while (true) {
        const products = await Product.find({ isActive: true })
          .skip(skip)
          .limit(batchSize)
          .lean();

        if (products.length === 0) break;

        // Transform and index products
        const meiliProducts = products.map(this.transformProduct.bind(this));

        await this.meilisearchService.addProduct(...meiliProducts);

        processed += products.length;
        skip += batchSize;

        logger.info(`Backfilled ${processed} products...`);

        // Small delay to avoid overwhelming Meilisearch
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      logger.info(`Backfill completed. Processed ${processed} products`);
    } catch (error) {
      logger.error('Backfill failed:', error);
      throw error;
    } finally {
      this.backfillInProgress = false;
    }
  }

  private async startChangeStream() {
    try {
      const Product = mongoose.model('Product');

      // Watch for changes in the Product collection
      this.changeStream = Product.watch([
        {
          $match: {
            $or: [
              { operationType: 'insert' },
              { operationType: 'update' },
              { operationType: 'delete' }
            ]
          }
        }
      ], {
        fullDocument: 'updateLookup'
      });

      logger.info('Change stream started for Product collection');

      this.changeStream.on('change', async (change) => {
        try {
          await this.handleChange(change);
        } catch (error) {
          logger.error('Error handling change:', error);
        }
      });

      this.changeStream.on('error', (error) => {
        logger.error('Change stream error:', error);
      });

      this.changeStream.on('close', () => {
        logger.warn('Change stream closed');
      });

    } catch (error) {
      logger.error('Failed to start change stream:', error);
      throw error;
    }
  }

  private async handleChange(change: mongoose.ChangeEvent) {
    logger.debug('Processing change:', change.operationType, change.documentKey);

    switch (change.operationType) {
      case 'insert':
      case 'update':
        if (change.fullDocument) {
          // Only sync active products
          if (change.fullDocument.isActive) {
            const meiliProduct = this.transformProduct(change.fullDocument);
            await this.meilisearchService.updateProduct(meiliProduct);
            logger.debug(`Synced product ${meiliProduct.id} to Meilisearch`);
          } else {
            // Product was deactivated, remove from search
            const productId = change.documentKey._id.toString();
            await this.meilisearchService.deleteProduct(productId);
            logger.debug(`Removed inactive product ${productId} from Meilisearch`);
          }
        }
        break;

      case 'delete':
        const productId = change.documentKey._id.toString();
        await this.meilisearchService.deleteProduct(productId);
        logger.debug(`Deleted product ${productId} from Meilisearch`);
        break;
    }
  }

  private transformProduct(mongoProduct: MongoProduct): ProductDocument {
    // Flatten nested fields for better search
    const flattenedAttributes: Record<string, any> = {};

    // Add basic product info to attributes
    if (mongoProduct.brand) flattenedAttributes.brand = mongoProduct.brand;
    if (mongoProduct.gender) flattenedAttributes.gender = mongoProduct.gender;
    if (mongoProduct.material) flattenedAttributes.material = mongoProduct.material.join(', ');
    if (mongoProduct.sizes) flattenedAttributes.sizes = mongoProduct.sizes.join(', ');
    if (mongoProduct.colors) flattenedAttributes.colors = mongoProduct.colors.join(', ');
    if (mongoProduct.tags) flattenedAttributes.tags = mongoProduct.tags.join(', ');

    // Add variant information
    if (mongoProduct.variants && mongoProduct.variants.length > 0) {
      flattenedAttributes.hasVariants = true;
      flattenedAttributes.variantCount = mongoProduct.variants.length;

      // Flatten variant details
      mongoProduct.variants.forEach((variant, index) => {
        if (variant.size) flattenedAttributes[`variant_${index}_size`] = variant.size;
        if (variant.color) flattenedAttributes[`variant_${index}_color`] = variant.color;
        if (variant.price) flattenedAttributes[`variant_${index}_price`] = variant.price;
        if (variant.stockQuantity !== undefined) {
          flattenedAttributes[`variant_${index}_stock`] = variant.stockQuantity;
        }
      });
    }

    return {
      id: mongoProduct._id.toString(),
      title: mongoProduct.name,
      description: mongoProduct.description,
      brand: mongoProduct.brand || 'SEWITHDEBBY',
      category: mongoProduct.category,
      price: mongoProduct.price,
      originalPrice: mongoProduct.originalPrice,
      inStock: mongoProduct.stockQuantity > 0,
      rating: mongoProduct.averageRating || 0,
      images: mongoProduct.images || (mongoProduct.mainImage ? [mongoProduct.mainImage] : []),
      attributes: flattenedAttributes,
      variants: mongoProduct.variants || [],
      tags: mongoProduct.tags || [],
      createdAt: mongoProduct.createdAt,
      updatedAt: mongoProduct.updatedAt
    };
  }

  async reindexAll() {
    logger.info('Starting full reindex...');

    try {
      // Clear existing index
      await this.meilisearchService.client.index('products_v1').deleteAllDocuments();
      logger.info('Cleared existing index');

      // Re-run backfill
      await this.backfillProducts();

      logger.info('Full reindex completed');
    } catch (error) {
      logger.error('Reindex failed:', error);
      throw error;
    }
  }

  async getSyncStats() {
    try {
      const Product = mongoose.model('Product');
      const totalProducts = await Product.countDocuments();
      const activeProducts = await Product.countDocuments({ isActive: true });

      const meiliStats = await this.meilisearchService.getStats();

      return {
        success: true,
        mongodb: {
          totalProducts,
          activeProducts,
          inactiveProducts: totalProducts - activeProducts
        },
        meilisearch: meiliStats.stats,
        syncStatus: {
          connected: this.isConnected,
          backfillInProgress: this.backfillInProgress,
          changeStreamActive: !!this.changeStream
        }
      };
    } catch (error) {
      logger.error('Failed to get sync stats:', error);
      throw error;
    }
  }

  async close() {
    try {
      if (this.changeStream) {
        await this.changeStream.close();
        logger.info('Change stream closed');
      }

      if (this.isConnected) {
        await mongoose.connection.close();
        logger.info('MongoDB connection closed');
      }
    } catch (error) {
      logger.error('Error closing MongoDB sync service:', error);
    }
  }
}
