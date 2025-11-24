# 🚀 Meilisearch Integration for SEWITHDEBBY E-commerce

A complete, production-ready Meilisearch integration for MongoDB-based e-commerce applications with real-time synchronization, advanced search features, and comprehensive analytics.

## 🌟 Features

- **🔍 Advanced Search Engine**: Lightning-fast, typo-tolerant search with relevance ranking
- **🔄 Real-time Sync**: MongoDB change streams for instant updates
- **📊 Analytics**: Comprehensive search query and performance tracking
- **🛡️ Secure**: Per-session search keys and rate limiting
- **🎯 Smart Ranking**: Relevance > availability > rating > recency
- **📱 Responsive UI**: Modern React/TypeScript frontend
- **🆓 100% Free**: Open-source, no vendor lock-in

## 📋 Table of Contents

- [Quick Start](#quick-start)
- [Architecture](#architecture)
- [Configuration](#configuration)
- [API Endpoints](#api-endpoints)
- [Frontend Integration](#frontend-integration)
- [Development](#development)
- [Deployment](#deployment)
- [Troubleshooting](#troubleshooting)

## 🚀 Quick Start

### 1. Start Meilisearch

```bash
# Start Meilisearch with Docker
docker-compose -f docker-compose.meilisearch.yml up -d

# Verify it's running
curl http://localhost:7700/health
```

### 2. Configure Environment

```bash
# Copy and edit the environment file
cp .env.meilisearch .env.local

# Edit with your settings
nano .env.local
```

### 3. Install Dependencies

```bash
# Install sync service dependencies
cd meilisearch-sync-service
npm install

# Build TypeScript
npm run build
```

### 4. Run Backfill (First Time Only)

```bash
# Backfill existing MongoDB data
npm run backfill
```

### 5. Start Sync Service

```bash
# Start the sync service
npm start
```

### 6. Update Frontend

Replace your existing search component with the new Meilisearch-powered one:

```jsx
import MeilisearchSearch from './components/MeilisearchSearch';

// In your component
<MeilisearchSearch onResultsChange={handleResults} />
```

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │  Sync Service   │    │   Meilisearch   │
│   (React)       │◄──►│  (Node.js)      │◄──►│   (Docker)      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Search UI     │    │   MongoDB       │    │   Search       │
│   Filters       │    │   Change        │    │   Index        │
│   Suggestions   │    │   Streams       │    │   products_v1  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Components

1. **Meilisearch Docker Container**: Search engine instance
2. **Sync Service**: Node.js/TypeScript service for data synchronization
3. **MongoDB Change Streams**: Real-time product updates
4. **React Frontend**: Modern search interface
5. **Analytics Logging**: Query performance and usage tracking

## ⚙️ Configuration

### Environment Variables

```bash
# Meilisearch Configuration
MEILI_MASTER_KEY=your-super-secure-master-key
MEILI_ENV=development
MEILISEARCH_URL=http://localhost:7700

# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/ecommerce

# Service Configuration
SEARCH_SERVICE_PORT=5001
ANALYTICS_ENABLED=true

# Rate Limiting
SEARCH_RATE_LIMIT_PER_MINUTE=100
SEARCH_RATE_LIMIT_BURST=20

# Frontend
FRONTEND_URL=http://localhost:3000
```

### Index Configuration

The `products_v1` index includes:

#### Searchable Fields
- `title` - Product name
- `description` - Product description
- `brand` - Brand name
- `category` - Product category
- `attributes.*` - Flattened attribute fields
- `tags` - Product tags

#### Filterable Fields
- `brand` - Filter by brand
- `category` - Filter by category
- `price` - Price range filtering
- `inStock` - Availability filtering
- `rating` - Rating filtering
- `createdAt` - Date filtering

#### Sortable Fields
- `price` - Price sorting
- `rating` - Rating sorting
- `createdAt` - Date sorting

#### Ranking Rules (Priority Order)
1. **Relevance** - Word matching and proximity
2. **Availability** - In-stock products first
3. **Rating** - Higher rated products first
4. **Recency** - Newer products first

#### Synonyms
- `dress` → `gown`, `frock`, `garment`
- `shoes` → `footwear`, `boots`, `sneakers`
- `bag` → `handbag`, `purse`, `tote`

## 🔗 API Endpoints

### Search Endpoint

```bash
POST /search
Content-Type: application/json

{
  "q": "red dress",
  "filters": {
    "category": "women",
    "price": { "min": 1000, "max": 5000 }
  },
  "sort": ["price:asc"],
  "page": 1,
  "hitsPerPage": 20
}
```

**Response:**
```json
{
  "success": true,
  "hits": [...],
  "totalHits": 45,
  "page": 1,
  "totalPages": 3,
  "facets": {
    "brand": { "Nike": 12, "Adidas": 8 },
    "category": { "women": 25, "men": 20 }
  },
  "processingTimeMs": 12,
  "query": "red dress"
}
```

### Suggestions Endpoint

```bash
GET /suggest?q=red%20dress&limit=5
```

**Response:**
```json
{
  "success": true,
  "suggestions": [
    { "title": "Red Summer Dress", "category": "women", "brand": "Zara" },
    { "title": "Red Evening Gown", "category": "women", "brand": "Gucci" }
  ]
}
```

### Reindex Endpoint

```bash
POST /reindex
```

**Response:**
```json
{
  "success": true,
  "message": "Reindex started in background"
}
```

### Analytics Endpoints

```bash
GET /analytics/queries?startDate=2024-01-01&endDate=2024-01-31
GET /analytics/performance?startDate=2024-01-01&endDate=2024-01-31
```

## 🎨 Frontend Integration

### React Component Usage

```jsx
import React, { useState } from 'react';
import MeilisearchSearch from './components/MeilisearchSearch';

const ShopPage = () => {
  const [searchResults, setSearchResults] = useState([]);

  const handleSearchResults = (results) => {
    setSearchResults(results);
  };

  return (
    <div>
      <MeilisearchSearch onResultsChange={handleSearchResults} />

      <div className="results-grid">
        {searchResults.map(product => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  );
};
```

### Search Component Features

- **🔍 Instant Search**: Real-time search as you type
- **🎛️ Advanced Filters**: Category, brand, price range, rating
- **📊 Faceted Navigation**: See available options before filtering
- **💡 Auto-suggestions**: Smart query completion
- **📱 Mobile Responsive**: Works perfectly on all devices
- **⚡ Fast Loading**: Optimized for performance

## 🛠️ Development

### Project Structure

```
meilisearch-sync-service/
├── src/
│   ├── controllers/
│   │   └── SearchController.ts
│   ├── services/
│   │   ├── MeilisearchService.ts
│   │   ├── MongoSyncService.ts
│   │   └── AnalyticsService.ts
│   ├── middleware/
│   │   └── rateLimiter.ts
│   ├── utils/
│   │   └── logger.ts
│   ├── index.ts
│   ├── backfill.ts
│   └── reindex.ts
├── package.json
├── tsconfig.json
└── README.md
```

### Running in Development

```bash
# Start Meilisearch
docker-compose -f docker-compose.meilisearch.yml up -d

# Install dependencies
cd meilisearch-sync-service
npm install

# Build TypeScript
npm run build

# Start service
npm run dev

# Run backfill (first time)
npm run backfill
```

### Testing

```bash
# Run tests
npm test

# Lint code
npm run lint

# Format code
npm run format
```

## 🚢 Deployment

### Production Setup

1. **Environment Variables**:
   ```bash
   MEILI_MASTER_KEY=your-production-master-key
   MEILI_ENV=production
   MONGODB_URI=your-production-mongodb-uri
   ```

2. **Docker Compose**:
   ```bash
   docker-compose -f docker-compose.meilisearch.yml up -d
   ```

3. **SSL/TLS** (Recommended):
   - Use reverse proxy (nginx, traefik) for SSL termination
   - Configure proper CORS headers

4. **Monitoring**:
   - Set up log aggregation (ELK stack)
   - Monitor Meilisearch metrics
   - Alert on sync failures

### Scaling

- **Horizontal Scaling**: Run multiple Meilisearch instances
- **Load Balancing**: Use nginx or similar for distribution
- **Database Sharding**: Consider MongoDB sharding for large datasets

## 🔧 Troubleshooting

### Common Issues

**1. Search Not Working**
```bash
# Check Meilisearch health
curl http://localhost:7700/health

# Check sync service logs
tail -f logs/combined.log

# Verify MongoDB connection
node -e "require('mongoose').connect(process.env.MONGODB_URI).then(() => console.log('Connected'))"
```

**2. Products Not Syncing**
```bash
# Run backfill manually
npm run backfill

# Check change streams
# Look for errors in sync service logs
```

**3. Performance Issues**
```bash
# Check Meilisearch stats
curl http://localhost:7700/indexes/products_v1/stats

# Monitor query latency
GET /analytics/performance
```

**4. Rate Limiting**
```bash
# Check current rate limits
# Adjust SEARCH_RATE_LIMIT_PER_MINUTE in .env
```

### Logs Location

- **Meilisearch**: Docker container logs
- **Sync Service**: `logs/` directory in project root
- **MongoDB**: MongoDB log files

### Health Checks

```bash
# Meilisearch health
curl http://localhost:7700/health

# Sync service health
curl http://localhost:5001/health

# Database connectivity
# Check sync service logs
```

## 📈 Monitoring & Analytics

### Key Metrics

- **Query Volume**: Total searches per hour/day
- **Zero Results Rate**: Percentage of queries with no results
- **Average Latency**: Response time for search queries
- **Error Rate**: Failed search percentage
- **Popular Queries**: Most searched terms
- **User Engagement**: Search-to-purchase conversion

### Analytics Dashboard

The service provides built-in analytics endpoints:
- `/analytics/queries` - Query trends and popular searches
- `/analytics/performance` - Latency and error rate metrics

### Custom Analytics

```typescript
// Log custom events
await analyticsService.logCustomEvent({
  type: 'product_view',
  productId: '123',
  sessionId: 'abc',
  metadata: { category: 'shoes' }
});
```

## 🔐 Security

### API Keys

- **Master Key**: Full access to Meilisearch (keep secret!)
- **Search Keys**: Limited to search operations (per-session)

### Rate Limiting

- **Search**: 100 requests/minute per IP
- **Suggestions**: 200 requests/minute per IP
- **Bursting**: Allowed for legitimate traffic spikes

### CORS Configuration

```typescript
// Configure CORS in sync service
app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true
}));
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

### Code Style

- Use TypeScript for all new code
- Follow ESLint configuration
- Add JSDoc comments for public methods
- Write tests for new features

## 📄 License

MIT License - see LICENSE file for details.

## 🙏 Acknowledgments

- [Meilisearch](https://meilisearch.com) - Amazing open-source search engine
- [MongoDB](https://mongodb.com) - Document database
- [Node.js](https://nodejs.org) - JavaScript runtime

---

**Made with ❤️ for the SEWITHDEBBY e-commerce platform**
