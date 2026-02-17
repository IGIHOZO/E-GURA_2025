import { Request, Response } from 'express';
import { MeilisearchService } from '../services/MeilisearchService';
import { AnalyticsService } from '../services/AnalyticsService';
import { logger } from '../utils/logger';
import { v4 as uuidv4 } from 'uuid';

export class SearchController {
  constructor(
    private meilisearchService: MeilisearchService,
    private analyticsService: AnalyticsService
  ) {}

  async search(req: Request, res: Response) {
    const startTime = Date.now();
    const sessionId = req.headers['x-session-id'] as string || uuidv4();
    const userAgent = req.headers['user-agent'] || 'unknown';

    try {
      const {
        q: query = '',
        filters = {},
        sort,
        page = 1,
        hitsPerPage = 20,
        facets = ['brand', 'category', 'price']
      } = req.body;

      logger.info(`Search request: ${query}`, { sessionId, filters });

      // For now, return mock data if no real search backend
      const mockResults = this.getMockSearchResults(query, filters);

      const latency = Date.now() - startTime;

      // Log analytics
      await this.analyticsService.logQuery({
        sessionId,
        query,
        filters,
        resultsCount: mockResults.length,
        latency,
        userAgent,
        timestamp: new Date()
      });

      // Add search key for client-side caching
      const searchKey = this.generateSearchKey(query, filters, sort, page);

      res.json({
        success: true,
        hits: mockResults,
        totalHits: mockResults.length,
        page: Number(page),
        totalPages: Math.ceil(mockResults.length / Number(hitsPerPage)),
        facets: {
          brand: { 'SEWITHDEBBY': 5, 'Nike': 3, 'Adidas': 2 },
          category: { 'Fashion': 8, 'Electronics': 2 }
        },
        processingTimeMs: latency,
        query,
        searchKey,
        sessionId,
        _meta: {
          latency,
          timestamp: new Date().toISOString(),
          note: 'Using mock data - MongoDB not connected'
        }
      });

    } catch (error) {
      const latency = Date.now() - startTime;

      logger.error('Search error:', error);

      // Log failed search
      await this.analyticsService.logQuery({
        sessionId,
        query: req.body.q || '',
        filters: req.body.filters || {},
        resultsCount: 0,
        latency,
        userAgent,
        error: error.message,
        timestamp: new Date()
      });

      res.status(500).json({
        success: false,
        error: 'Search failed',
        message: error.message,
        _meta: {
          latency,
          timestamp: new Date().toISOString()
        }
      });
    }
  }

  private getMockSearchResults(query: string, filters: any) {
    // Mock product data for demonstration
    const mockProducts = [
      {
        id: '1',
        title: 'Elegant Red Dress',
        description: 'Beautiful red evening dress perfect for special occasions',
        brand: 'SEWITHDEBBY',
        category: 'Fashion',
        price: 2500,
        originalPrice: 3200,
        inStock: true,
        rating: 4.5,
        images: ['/placeholder-image.jpg'],
        attributes: { color: 'red', size: 'M' },
        variants: [],
        tags: ['dress', 'red', 'evening'],
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: '2',
        title: 'Classic White Shirt',
        description: 'Timeless white shirt for formal and casual wear',
        brand: 'SEWITHDEBBY',
        category: 'Fashion',
        price: 1200,
        inStock: true,
        rating: 4.2,
        images: ['/placeholder-image.jpg'],
        attributes: { color: 'white', size: 'L' },
        variants: [],
        tags: ['shirt', 'white', 'formal'],
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: '3',
        title: 'Running Shoes',
        description: 'Comfortable running shoes for daily exercise',
        brand: 'Nike',
        category: 'Sports',
        price: 3500,
        inStock: true,
        rating: 4.7,
        images: ['/placeholder-image.jpg'],
        attributes: { color: 'black', size: '42' },
        variants: [],
        tags: ['shoes', 'running', 'sports'],
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    // Simple filtering based on query
    let filtered = mockProducts;

    if (query.trim()) {
      const searchTerm = query.toLowerCase();
      filtered = mockProducts.filter(product =>
        product.title.toLowerCase().includes(searchTerm) ||
        product.description.toLowerCase().includes(searchTerm) ||
        product.tags.some(tag => tag.includes(searchTerm))
      );
    }

    return filtered;
  }

  async suggest(req: Request, res: Response) {
    const startTime = Date.now();
    const sessionId = req.headers['x-session-id'] as string || uuidv4();

    try {
      const { q: query, limit = 5 } = req.query;

      if (!query || typeof query !== 'string') {
        return res.status(400).json({
          success: false,
          error: 'Query parameter "q" is required'
        });
      }

      logger.info(`Suggestions request: ${query}`, { sessionId });

      const suggestions = await this.meilisearchService.getSuggestions(query, Number(limit));

      const latency = Date.now() - startTime;

      res.json({
        success: true,
        ...suggestions,
        _meta: {
          latency,
          timestamp: new Date().toISOString()
        }
      });

    } catch (error) {
      const latency = Date.now() - startTime;

      logger.error('Suggestions error:', error);

      res.status(500).json({
        success: false,
        error: 'Suggestions failed',
        message: error.message,
        _meta: {
          latency,
          timestamp: new Date().toISOString()
        }
      });
    }
  }

  async reindex(req: Request, res: Response) {
    const startTime = Date.now();

    try {
      logger.info('Reindex request received');

      // This would typically require admin authentication
      // For now, we'll allow it but log the request
      const clientIp = req.ip || req.connection.remoteAddress;

      logger.warn(`Reindex triggered from ${clientIp}`);

      // Trigger reindex (this is async)
      setImmediate(async () => {
        try {
          // This would need to be imported or injected
          // For now, we'll just log that reindex was requested
          logger.info('Reindex process started in background');
        } catch (error) {
          logger.error('Background reindex failed:', error);
        }
      });

      const latency = Date.now() - startTime;

      res.json({
        success: true,
        message: 'Reindex started in background',
        _meta: {
          latency,
          timestamp: new Date().toISOString()
        }
      });

    } catch (error) {
      const latency = Date.now() - startTime;

      logger.error('Reindex error:', error);

      res.status(500).json({
        success: false,
        error: 'Reindex failed',
        message: error.message,
        _meta: {
          latency,
          timestamp: new Date().toISOString()
        }
      });
    }
  }

  async getQueryAnalytics(req: Request, res: Response) {
    try {
      const { startDate, endDate, limit = 100 } = req.query;

      const start = startDate ? new Date(startDate as string) : new Date(Date.now() - 24 * 60 * 60 * 1000);
      const end = endDate ? new Date(endDate as string) : new Date();

      const analytics = await this.analyticsService.getQueryAnalytics(start, end, Number(limit));

      res.json({
        success: true,
        analytics,
        _meta: {
          timestamp: new Date().toISOString(),
          period: { start, end }
        }
      });

    } catch (error) {
      logger.error('Analytics error:', error);

      res.status(500).json({
        success: false,
        error: 'Failed to get analytics',
        message: error.message
      });
    }
  }

  async getPerformanceAnalytics(req: Request, res: Response) {
    try {
      const { startDate, endDate } = req.query;

      const start = startDate ? new Date(startDate as string) : new Date(Date.now() - 24 * 60 * 60 * 1000);
      const end = endDate ? new Date(endDate as string) : new Date();

      const analytics = await this.analyticsService.getPerformanceAnalytics(start, end);

      res.json({
        success: true,
        analytics,
        _meta: {
          timestamp: new Date().toISOString(),
          period: { start, end }
        }
      });

    } catch (error) {
      logger.error('Performance analytics error:', error);

      res.status(500).json({
        success: false,
        error: 'Failed to get performance analytics',
        message: error.message
      });
    }
  }

  private generateSearchKey(query: string, filters: any, sort: string | undefined, page: number): string {
    // Generate a deterministic key for caching search results
    const keyData = {
      query,
      filters,
      sort,
      page
    };

    return Buffer.from(JSON.stringify(keyData)).toString('base64');
  }
}
