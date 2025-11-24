import { Meilisearch } from 'meilisearch';
import { logger } from '../utils/logger';

export interface ProductDocument {
  id: string;
  title: string;
  description: string;
  brand: string;
  category: string;
  price: number;
  originalPrice?: number;
  inStock: boolean;
  rating: number;
  images: string[];
  attributes: Record<string, any>;
  variants: Array<{
    size?: string;
    color?: string;
    price?: number;
    stockQuantity?: number;
  }>;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

export class MeilisearchService {
  private client: Meilisearch;
  private indexName = 'products_v1';

  constructor() {
    const config: any = {
      host: process.env.MEILISEARCH_URL || 'http://localhost:7700',
    };
    
    // Only add API key if it exists
    if (process.env.MEILI_MASTER_KEY) {
      config.apiKey = process.env.MEILI_MASTER_KEY;
    }
    
    this.client = new Meilisearch(config);
  }

  async initialize() {
    try {
      logger.info('Initializing Meilisearch service...');

      // Create or update the index with proper configuration
      await this.createOrUpdateIndex();

      // Add synonyms for better search
      await this.addSynonyms();

      logger.info('Meilisearch service initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize Meilisearch service:', error);
      throw error;
    }
  }

  private async createOrUpdateIndex() {
    try {
      // Create the index if it doesn't exist
      await this.client.createIndex(this.indexName, { primaryKey: 'id' });

      // Update index settings
      await this.client.index(this.indexName).updateSettings({
        searchableAttributes: [
          'title',
          'description',
          'brand',
          'category',
          'attributes.*',
          'tags'
        ],
        filterableAttributes: [
          'brand',
          'category',
          'price',
          'inStock',
          'rating',
          'createdAt'
        ],
        sortableAttributes: [
          'price',
          'rating',
          'createdAt'
        ],
        rankingRules: [
          'words',
          'typo',
          'proximity',
          'attribute',
          'sort',
          'exactness',
          // Custom ranking rules
          'inStock:desc',
          'rating:desc',
          'createdAt:desc'
        ],
        typoTolerance: {
          enabled: true,
          minWordSizeForTypos: {
            oneTypo: 5,
            twoTypos: 9
          },
          disableOnWords: [],
          disableOnAttributes: []
        },
        pagination: {
          maxTotalHits: 1000
        },
        faceting: {
          maxValuesPerFacet: 100
        },
        synonyms: {
          'dress': ['gown', 'frock', 'garment'],
          'shoes': ['footwear', 'boots', 'sneakers'],
          'bag': ['handbag', 'purse', 'tote'],
          'shirt': ['top', 'blouse', 'tee'],
          'pants': ['trousers', 'jeans', 'slacks']
        }
      });

      logger.info(`Meilisearch index '${this.indexName}' configured successfully`);
    } catch (error: any) {
      if (error.message?.includes('already exists')) {
        logger.info(`Index '${this.indexName}' already exists, updating settings...`);
        await this.client.index(this.indexName).updateSettings({
          searchableAttributes: [
            'title',
            'description',
            'brand',
            'category',
            'attributes.*',
            'tags'
          ],
          filterableAttributes: [
            'brand',
            'category',
            'price',
            'inStock',
            'rating',
            'createdAt'
          ],
          sortableAttributes: [
            'price',
            'rating',
            'createdAt'
          ],
          rankingRules: [
            'words',
            'typo',
            'proximity',
            'attribute',
            'sort',
            'exactness',
            'inStock:desc',
            'rating:desc',
            'createdAt:desc'
          ]
        });
      } else {
        throw error;
      }
    }
  }

  private async addSynonyms() {
    // Additional synonyms for better search experience
    const synonyms = {
      // Fashion synonyms
      'fashion': ['clothing', 'apparel', 'garments', 'style'],
      'accessories': ['jewelry', 'bags', 'belts', 'hats', 'scarves'],
      'footwear': ['shoes', 'boots', 'sandals', 'sneakers', 'heels'],

      // Material synonyms
      'cotton': ['natural', 'breathable', 'organic'],
      'leather': ['genuine', 'cowhide', 'premium'],
      'synthetic': ['polyester', 'nylon', 'acrylic'],

      // Size synonyms
      'small': ['xs', 'petite', 'mini'],
      'large': ['xl', 'plus', 'oversized'],
      'medium': ['m', 'regular', 'standard']
    };

    try {
      await this.client.index(this.indexName).updateSynonyms(synonyms);
      logger.info('Synonyms added to Meilisearch index');
    } catch (error) {
      logger.warn('Failed to add synonyms:', error);
    }
  }

  async addProduct(product: ProductDocument) {
    try {
      const result = await this.client.index(this.indexName).addDocuments([product]);
      logger.debug(`Added product ${product.id} to Meilisearch`);
      return result;
    } catch (error) {
      logger.error(`Failed to add product ${product.id}:`, error);
      throw error;
    }
  }

  async updateProduct(product: ProductDocument) {
    try {
      const result = await this.client.index(this.indexName).updateDocuments([product]);
      logger.debug(`Updated product ${product.id} in Meilisearch`);
      return result;
    } catch (error) {
      logger.error(`Failed to update product ${product.id}:`, error);
      throw error;
    }
  }

  async deleteProduct(productId: string) {
    try {
      const result = await this.client.index(this.indexName).deleteDocument(productId);
      logger.debug(`Deleted product ${productId} from Meilisearch`);
      return result;
    } catch (error) {
      logger.error(`Failed to delete product ${productId}:`, error);
      throw error;
    }
  }

  async search(params: {
    query?: string;
    filters?: Record<string, any>;
    sort?: string[];
    page?: number;
    hitsPerPage?: number;
    facets?: string[];
  }) {
    const {
      query = '',
      filters = {},
      sort,
      page = 1,
      hitsPerPage = 20,
      facets = ['brand', 'category', 'price']
    } = params;

    try {
      const searchParams: any = {
        q: query,
        filter: this.buildFilterExpression(filters),
        sort,
        page,
        hitsPerPage,
        facetsDistribution: facets,
        attributesToHighlight: ['title', 'description'],
        attributesToCrop: ['description'],
        cropLength: 50
      };

      const result = await this.client.index(this.indexName).search(query, searchParams);

      return {
        success: true,
        hits: result.hits,
        totalHits: result.totalHits,
        page: result.page,
        totalPages: result.totalPages,
        facets: result.facetDistribution,
        processingTimeMs: result.processingTimeMs,
        query: result.query
      };
    } catch (error) {
      logger.error('Search failed:', error);
      throw error;
    }
  }

  private buildFilterExpression(filters: Record<string, any>): string | undefined {
    const expressions: string[] = [];

    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        if (Array.isArray(value)) {
          if (value.length > 0) {
            const values = value.map(v => `"${v}"`).join(' OR ');
            expressions.push(`${key} IN [${values}]`);
          }
        } else if (typeof value === 'object') {
          // Handle range filters (e.g., price range)
          if (value.min !== undefined || value.max !== undefined) {
            const conditions: string[] = [];
            if (value.min !== undefined) conditions.push(`${key} >= ${value.min}`);
            if (value.max !== undefined) conditions.push(`${key} <= ${value.max}`);
            if (conditions.length > 0) {
              expressions.push(`(${conditions.join(' AND ')})`);
            }
          }
        } else {
          expressions.push(`${key} = "${value}"`);
        }
      }
    });

    return expressions.length > 0 ? expressions.join(' AND ') : undefined;
  }

  async getSuggestions(query: string, limit: number = 5) {
    try {
      const result = await this.client.index(this.indexName).search(query, {
        q: query,
        hitsPerPage: limit,
        attributesToRetrieve: ['title', 'category', 'brand']
      });

      return {
        success: true,
        suggestions: result.hits.map(hit => ({
          title: hit.title,
          category: hit.category,
          brand: hit.brand
        }))
      };
    } catch (error) {
      logger.error('Suggestions failed:', error);
      throw error;
    }
  }

  async getStats() {
    try {
      const stats = await this.client.index(this.indexName).getStats();
      return {
        success: true,
        stats
      };
    } catch (error) {
      logger.error('Failed to get stats:', error);
      throw error;
    }
  }

  async close() {
    // Meilisearch client doesn't need explicit closing
    logger.info('Meilisearch service closed');
  }
}
