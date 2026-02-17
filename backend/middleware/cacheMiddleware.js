const crypto = require('crypto');
const cacheService = require('../services/cacheService');

const normalizeQuery = (query = {}) => {
  const sortedKeys = Object.keys(query).sort();
  return sortedKeys.reduce((acc, key) => {
    const value = query[key];
    acc[key] = Array.isArray(value) ? [...value].sort() : value;
    return acc;
  }, {});
};

const buildCacheKey = (req) => {
  const payload = JSON.stringify({
    method: req.method,
    path: req.baseUrl + req.path,
    params: req.params,
    query: normalizeQuery(req.query)
  });

  return crypto.createHash('sha1').update(payload).digest('hex');
};

const cacheMiddleware = (ttlSeconds = 60, options = {}) => {
  return async (req, res, next) => {
    if (req.method !== 'GET' || (options.skip && options.skip(req))) {
      return next();
    }

    const key = options.keyBuilder ? options.keyBuilder(req) : buildCacheKey(req);
    const tags = options.tags || [];

    try {
      const cachedResponse = await cacheService.get(key);
      if (cachedResponse) {
        if (cachedResponse.headers) {
          Object.entries(cachedResponse.headers).forEach(([header, value]) => {
            res.set(header, value);
          });
        }
        res.set('X-Cache', 'HIT');
        return res.status(cachedResponse.statusCode || 200).json(cachedResponse.body);
      }
    } catch (error) {
      console.warn('Cache read failed:', error.message);
    }

    const originalJson = res.json.bind(res);
    res.json = async (body) => {
      try {
        const etag = crypto.createHash('md5').update(JSON.stringify(body)).digest('hex');
        const headers = {
          'Cache-Control': `public, max-age=${ttlSeconds}`,
          ETag: etag
        };

        res.set(headers);
        res.set('X-Cache', 'MISS');

        await cacheService.set(
          key,
          {
            body,
            statusCode: res.statusCode,
            headers
          },
          ttlSeconds,
          { tags }
        );
      } catch (error) {
        console.warn('Cache write failed:', error.message);
      }

      return originalJson(body);
    };

    next();
  };
};

module.exports = cacheMiddleware;

