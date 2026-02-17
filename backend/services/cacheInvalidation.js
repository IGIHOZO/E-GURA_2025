const cacheService = require('./cacheService');

const PRODUCT_LIST_TAGS = [
  'products',
  'products:list',
  'products:featured',
  'products:new-arrivals',
  'products:sale',
  'products:flash',
  'products:trending',
  'products:best-deals'
];

const PRODUCT_CATEGORY_TAGS = ['products:categories', 'categories'];
const PRODUCT_SEARCH_TAGS = ['products:search', 'search'];
const PRODUCT_RECOMMENDATION_TAGS = ['products:recommendations', 'search'];

const invalidateProductDetail = async (productId) => {
  if (!productId) {
    return;
  }
  await cacheService.del(`product:${productId}`);
};

const invalidateProductListings = () =>
  cacheService.invalidateTags(PRODUCT_LIST_TAGS);

const invalidateProductCategories = () =>
  cacheService.invalidateTags(PRODUCT_CATEGORY_TAGS);

const invalidateProductSearch = () =>
  cacheService.invalidateTags(PRODUCT_SEARCH_TAGS);

const invalidateProductRecommendations = () =>
  cacheService.invalidateTags(PRODUCT_RECOMMENDATION_TAGS);

const invalidateProductData = async (productId, options = {}) => {
  const tasks = [
    invalidateProductListings(),
    invalidateProductSearch(),
    invalidateProductRecommendations()
  ];

  if (options.skipCategories !== true) {
    tasks.push(invalidateProductCategories());
  }

  if (productId) {
    tasks.push(invalidateProductDetail(productId));
  }

  await Promise.all(tasks);
};

module.exports = {
  invalidateProductListings,
  invalidateProductCategories,
  invalidateProductSearch,
  invalidateProductRecommendations,
  invalidateProductDetail,
  invalidateProductData
};

