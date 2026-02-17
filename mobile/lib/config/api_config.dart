class ApiConfig {
  static const String baseUrl = 'https://egura.rw';
  static const String apiUrl = '$baseUrl/api';
  static const String productsUrl = '$apiUrl/products';
  static const String homeFeedUrl = '$productsUrl/home-feed?featuredLimit=8&flashLimit=6&trendingLimit=8&bestDealsLimit=6&latestLimit=20';
  static const String healthUrl = '$apiUrl/health';

  static String productDetailUrl(String id) => '$productsUrl/$id';

  static String imageUrl(String path) {
    if (path.startsWith('http')) return path;
    if (path.startsWith('/')) return '$baseUrl$path';
    return path;
  }

  static String thumbnailUrl(String path) {
    return imageUrl(path.replaceAll('/medium/', '/thumb/'));
  }
}
