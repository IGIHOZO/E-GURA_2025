import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { MeilisearchService } from './services/MeilisearchService';
import { MongoSyncService } from './services/MongoSyncService';
import { SearchController } from './controllers/SearchController';
import { AnalyticsService } from './services/AnalyticsService';
import { logger } from './utils/logger';
import { rateLimiter } from './middleware/rateLimiter';

dotenv.config();

class MeilisearchSyncServer {
  private app: express.Application;
  private meilisearchService: MeilisearchService;
  private mongoSyncService: MongoSyncService;
  private analyticsService: AnalyticsService;

  constructor() {
    this.app = express();
    this.setupMiddleware();
    this.initializeServices();
    this.setupRoutes();
    this.setupGracefulShutdown();
  }

  private setupMiddleware() {
    this.app.use(helmet());
    this.app.use(cors());
    this.app.use(compression());
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true }));

    // Health check endpoint
    this.app.get('/health', (req, res) => {
      res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        version: '1.0.0'
      });
    });
  }

  private async initializeServices() {
    try {
      // Initialize Meilisearch service
      this.meilisearchService = new MeilisearchService();
      await this.meilisearchService.initialize();

      // Initialize MongoDB sync service
      this.mongoSyncService = new MongoSyncService(this.meilisearchService);
      await this.mongoSyncService.initialize();

      // Initialize analytics service
      this.analyticsService = new AnalyticsService();

      logger.info('All services initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize services:', error);
      throw error;
    }
  }

  private setupRoutes() {
    const searchController = new SearchController(
      this.meilisearchService,
      this.analyticsService
    );

    // Search routes with rate limiting
    this.app.post('/search', rateLimiter, searchController.search.bind(searchController));
    this.app.get('/suggest', rateLimiter, searchController.suggest.bind(searchController));
    this.app.post('/reindex', searchController.reindex.bind(searchController));

    // Analytics routes (admin only - in production, add auth middleware)
    this.app.get('/analytics/queries', searchController.getQueryAnalytics.bind(searchController));
    this.app.get('/analytics/performance', searchController.getPerformanceAnalytics.bind(searchController));
  }

  private setupGracefulShutdown() {
    const shutdown = async (signal: string) => {
      logger.info(`Received ${signal}. Starting graceful shutdown...`);

      try {
        // Close MongoDB connections
        await this.mongoSyncService.close();

        // Close Meilisearch connection
        await this.meilisearchService.close();

        logger.info('Graceful shutdown completed');
        process.exit(0);
      } catch (error) {
        logger.error('Error during shutdown:', error);
        process.exit(1);
      }
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
  }

  public async start() {
    const PORT = process.env.SEARCH_SERVICE_PORT || 5001;

    try {
      // Start the sync service (change streams, backfill, etc.)
      await this.mongoSyncService.startSync();

      // Start the HTTP server
      this.app.listen(PORT, () => {
        logger.info(`🚀 Meilisearch Sync Service running on port ${PORT}`);
        logger.info(`📊 Health check: http://localhost:${PORT}/health`);
        logger.info(`🔍 Search API: http://localhost:${PORT}/search`);
        logger.info(`💡 Suggestions API: http://localhost:${PORT}/suggest`);
      });
    } catch (error) {
      logger.error('Failed to start server:', error);
      process.exit(1);
    }
  }
}

// Start the server
const server = new MeilisearchSyncServer();
server.start().catch(console.error);
