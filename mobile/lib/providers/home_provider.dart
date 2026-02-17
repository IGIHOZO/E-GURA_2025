import 'package:flutter/material.dart';
import '../models/category.dart';
import '../models/product.dart';
import '../services/api_service.dart';
// import '../services/prefetch_service.dart';

class HomeProvider extends ChangeNotifier {
  final ApiService _api = ApiService();

  List<Category> categories = [];
  List<Product> featured = [];
  List<Product> flashDeals = [];
  List<Product> trending = [];
  List<Product> bestDeals = [];
  List<Product> latest = [];

  // Infinite scroll state
  List<Product> allProducts = [];
  int _currentPage = 0;
  int _totalPages = 1;
  int totalProducts = 0;
  bool isLoadingMore = false;
  bool get hasMore => _currentPage < _totalPages;

  bool isLoading = true;
  String? error;

  Future<void> loadHomeFeed() async {
    isLoading = true;
    error = null;
    _currentPage = 0;
    allProducts = [];
    notifyListeners();
    
    // Start prefetching in background
    // PrefetchService.startPrefetching();

    try {
      // Fetch all three in parallel but handle individual failures
      final homeFeedFuture = _api.getHomeFeed().catchError((e) {
        debugPrint('[HomeProvider] Home feed error: $e');
        return <String, List<Product>>{};
      });
      final categoriesFuture = _api.getCategories().catchError((e) {
        debugPrint('[HomeProvider] Categories error: $e');
        return <Category>[];
      });
      final productsFuture = _api.getProducts(page: 1, limit: 12).catchError((e) {
        debugPrint('[HomeProvider] Products error: $e');
        return PaginatedProducts(products: [], currentPage: 1, totalPages: 1, total: 0);
      });

      final results = await Future.wait([homeFeedFuture, categoriesFuture, productsFuture]);

      final data = results[0] as Map<String, List<Product>>;
      categories = results[1] as List<Category>;
      debugPrint('[HomeProvider] Loaded ${categories.length} categories');
      final paginated = results[2] as PaginatedProducts;

      featured = data['featured'] ?? [];
      flashDeals = data['flashDeals'] ?? [];
      trending = data['trending'] ?? [];
      bestDeals = data['bestDeals'] ?? [];
      latest = data['latest'] ?? [];

      allProducts = paginated.products;
      _currentPage = paginated.currentPage;
      _totalPages = paginated.totalPages;
      totalProducts = paginated.total;

      // Only show error if everything failed
      if (featured.isEmpty && latest.isEmpty && flashDeals.isEmpty && allProducts.isEmpty) {
        error = 'Unable to load products. Please try again.';
      } else {
        error = null;
      }
    } catch (e) {
      debugPrint('[HomeProvider] Unexpected error: $e');
      if (e.toString().contains('No internet connection') || 
          e.toString().contains('Network is unreachable') ||
          e.toString().contains('SocketException')) {
        error = 'No internet connection. Please check your network settings.';
      } else if (e.toString().contains('Timeout')) {
        error = 'Connection timeout. Please try again.';
      } else {
        error = 'Unable to load products. Please try again.';
      }
    }

    isLoading = false;
    notifyListeners();
  }

  Future<void> loadMore() async {
    if (isLoadingMore || !hasMore) return;
    isLoadingMore = true;
    notifyListeners();

    try {
      // Try to get from cache first for instant response
      // final cachedProducts = PrefetchService.getCachedProducts(_currentPage + 1);
      
      // if (cachedProducts != null) {
      //   // Instant response from cache
      //     allProducts = [...allProducts, ...cachedProducts];
      //     _currentPage = _currentPage + 1;
      //     totalProducts = allProducts.length;
      //     notifyListeners();
        
      //     // Fetch in background without blocking UI
      //     _api.getProducts(page: _currentPage, limit: 12).then((paginated) {
      //       if (paginated != null) {
      //         _totalPages = paginated.totalPages;
      //         totalProducts = paginated.total;
      //       }
      //     });
      // } else {
        // Fallback to API if not cached
        final paginated = await _api.getProducts(page: _currentPage + 1, limit: 12);
        allProducts = [...allProducts, ...paginated.products];
        _currentPage = paginated.currentPage;
        _totalPages = paginated.totalPages;
        totalProducts = paginated.total;
      // }
    } catch (e) {
      debugPrint('[HomeProvider] loadMore error: $e');
    }

    isLoadingMore = false;
    notifyListeners();
  }
}
