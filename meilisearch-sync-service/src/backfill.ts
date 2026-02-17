import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { MeilisearchService } from './services/MeilisearchService';
import { MongoSyncService } from './services/MongoSyncService';
import { logger } from './utils/logger';

dotenv.config();

async function backfillProducts() {
  logger.info('🚀 Starting Meilisearch backfill process...');

  try {
    // Initialize services
    const meilisearchService = new MeilisearchService();
    await meilisearchService.initialize();

    const mongoSyncService = new MongoSyncService(meilisearchService);
    await mongoSyncService.initialize();

    logger.info('Services initialized, starting backfill...');

    // Run the backfill
    await mongoSyncService.backfillProducts();

    logger.info('✅ Backfill completed successfully!');

    // Show final stats
    const stats = await mongoSyncService.getSyncStats();
    logger.info('Final sync stats:', stats);

  } catch (error) {
    logger.error('❌ Backfill failed:', error);
    process.exit(1);
  } finally {
    // Close connections
    await mongoose.connection.close();
    logger.info('Database connections closed');
  }
}

// Run backfill if this script is executed directly
if (require.main === module) {
  backfillProducts();
}

export { backfillProducts };
