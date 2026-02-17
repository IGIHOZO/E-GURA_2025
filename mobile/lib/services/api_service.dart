import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;
import '../config/api_config.dart';
import '../models/category.dart' as models;
import '../models/product.dart';
import '../models/subcategory.dart';

class ApiService {
  static final ApiService _instance = ApiService._internal();
  factory ApiService() => _instance;

  final http.Client _client = http.Client();

  ApiService._internal();

  Future<Map<String, List<Product>>> getHomeFeed() async {
    const maxRetries = 3;
    for (var attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        final timeout = Duration(seconds: 20 + (attempt * 15));
        debugPrint('[API] Fetching home feed (attempt $attempt, timeout ${timeout.inSeconds}s)');
        final response = await _client.get(Uri.parse(ApiConfig.homeFeedUrl))
            .timeout(timeout);
        debugPrint('[API] Response: ${response.statusCode} (${response.body.length} bytes)');
        if (response.statusCode == 200) {
          final json = jsonDecode(response.body);
          final data = json['data'] as Map<String, dynamic>? ?? {};
          return {
            'featured': _parseProductList(data['featured']),
            'flashDeals': _parseProductList(data['flashDeals']),
            'trending': _parseProductList(data['trending']),
            'bestDeals': _parseProductList(data['bestDeals']),
            'latest': _parseProductList(data['latest']),
          };
        }
        debugPrint('[API] Home feed status: ${response.statusCode}');
      } catch (e) {
        debugPrint('[API] Home feed attempt $attempt failed: $e');
        if (attempt == maxRetries) rethrow;
        await Future.delayed(Duration(seconds: attempt * 2));
      }
    }
    return {};
  }

  Future<Product> getProductDetail(String id) async {
    final response = await _client.get(Uri.parse(ApiConfig.productDetailUrl(id)));
    if (response.statusCode == 200) {
      final json = jsonDecode(response.body);
      final data = json['data'] ?? json['product'] ?? json;
      return Product.fromJson(data as Map<String, dynamic>);
    }
    throw Exception('Failed to load product: ${response.statusCode}');
  }

  Future<List<Product>> searchProducts(String query) async {
    try {
      final url = '${ApiConfig.productsUrl}?limit=200';
      debugPrint('[API] Searching products for: $query');
      final response = await _client.get(Uri.parse(url))
          .timeout(const Duration(seconds: 15));
      if (response.statusCode == 200) {
        final json = jsonDecode(response.body);
        final all = _parseProductList(json['data']);
        final q = query.toLowerCase().trim();
        return all.where((p) {
          return p.name.toLowerCase().contains(q) ||
              (p.description ?? '').toLowerCase().contains(q) ||
              (p.shortDescription ?? '').toLowerCase().contains(q) ||
              (p.brand ?? '').toLowerCase().contains(q) ||
              (p.category ?? '').toLowerCase().contains(q);
        }).toList();
      }
    } catch (e) {
      debugPrint('[API] Search error: $e');
    }
    return [];
  }

  Future<List<models.Category>> getCategories() async {
    try {
      final url = '${ApiConfig.apiUrl}/categories';
      debugPrint('[API] Fetching: $url');
      final response = await _client.get(Uri.parse(url))
          .timeout(const Duration(seconds: 15));
      debugPrint('[API] Categories: ${response.statusCode}');
      if (response.statusCode == 200) {
        final json = jsonDecode(response.body);
        final list = json['categories'] as List? ?? [];
        final categories = list
            .map((item) => models.Category.fromJson(item as Map<String, dynamic>))
            .toList();
        debugPrint('[API] Parsed ${categories.length} categories from database');
        return categories;
      }
    } catch (e) {
      debugPrint('[API] Categories error: $e');
    }
    return [];
  }

  Future<List<Subcategory>> getSubcategories(String categoryId) async {
    try {
      // Fetch all products and extract unique subcategories
      final url = '${ApiConfig.productsUrl}?limit=500'; // Get more products to extract subcategories
      debugPrint('[API] Fetching products to extract subcategories for: $categoryId');
      final response = await _client.get(Uri.parse(url))
          .timeout(const Duration(seconds: 20));
      
      if (response.statusCode == 200) {
        final json = jsonDecode(response.body);
        final allProducts = _parseProductList(json['data']);
        
        // Filter products by category
        final categoryProducts = allProducts.where((p) {
          final pCat = (p.category ?? '').toLowerCase().trim();
          return pCat == categoryId.toLowerCase() ||
              pCat.replaceAll(RegExp(r'[^a-z0-9]'), '') ==
                  categoryId.toLowerCase().replaceAll(RegExp(r'[^a-z0-9]'), '');
        }).toList();
        
        // Extract unique subcategories with smart categorization
        final subcategoryMap = <String, int>{};
        for (final product in categoryProducts) {
          String subcategory;
          
          // If subcategory exists in database, use it
          if (product.subcategory != null && product.subcategory!.isNotEmpty) {
            subcategory = product.subcategory!;
          } else {
            // Generate smart subcategory from product name and category
            subcategory = _generateSmartSubcategory(product.name ?? '', categoryId);
          }
          
          subcategoryMap[subcategory] = (subcategoryMap[subcategory] ?? 0) + 1;
        }
        
        // Convert to Subcategory objects
        final subcategories = subcategoryMap.entries.map((entry) {
          return Subcategory(
            id: entry.key.toLowerCase().replaceAll(' ', '-'),
            name: entry.key,
            categoryId: categoryId,
            productCount: entry.value,
          );
        }).toList();
        
        // Sort by product count (descending) then by name
        subcategories.sort((a, b) {
          if (b.productCount != a.productCount) {
            return b.productCount.compareTo(a.productCount);
          }
          return a.name.compareTo(b.name);
        });
        
        debugPrint('[API] Extracted ${subcategories.length} subcategories for $categoryId');
        return subcategories;
      }
    } catch (e) {
      debugPrint('[API] Subcategories error: $e');
    }
    return [];
  }

  // Generate smart subcategories based on product names and category
  String _generateSmartSubcategory(String productName, String categoryId) {
    final name = productName.toLowerCase();
    
    switch (categoryId.toLowerCase()) {
      case 'womens-fashion':
        if (name.contains('dress')) return 'Dresses';
        if (name.contains('top') || name.contains('shirt') || name.contains('blouse')) return 'Tops';
        if (name.contains('pant') || name.contains('skirt') || name.contains('bottom')) return 'Bottoms';
        if (name.contains('bag') || name.contains('purse') || name.contains('wallet')) return 'Bags';
        if (name.contains('shoe') || name.contains('sandal') || name.contains('heel')) return 'Footwear';
        if (name.contains('jewelry') || name.contains('necklace') || name.contains('earring')) return 'Jewelry';
        if (name.contains('scarf') || name.contains('belt') || name.contains('hat')) return 'Accessories';
        return 'Clothing';
        
      case 'mens-fashion':
        if (name.contains('shirt') || name.contains('t-shirt')) return 'Shirts';
        if (name.contains('pant') || name.contains('trouser')) return 'Pants';
        if (name.contains('shoe') || name.contains('sneaker') || name.contains('boot')) return 'Footwear';
        if (name.contains('watch') || name.contains('belt') || name.contains('wallet')) return 'Accessories';
        if (name.contains('jacket') || name.contains('coat') || name.contains('blazer')) return 'Outerwear';
        return 'Mens Clothing';
        
      case 'home-living':
        if (name.contains('kettle') || name.contains('pot') || name.contains('pan')) return 'Kitchen';
        if (name.contains('furniture') || name.contains('chair') || name.contains('table') || name.contains('sofa')) return 'Furniture';
        if (name.contains('bed') || name.contains('pillow') || name.contains('blanket')) return 'Bedroom';
        if (name.contains('decor') || name.contains('lamp') || name.contains('mirror')) return 'Decor';
        if (name.contains('clean') || name.contains('mop') || name.contains('broom')) return 'Cleaning';
        return 'Home Essentials';
        
      case 'electronics':
        if (name.contains('phone') || name.contains('mobile') || name.contains('smartphone')) return 'Phones';
        if (name.contains('laptop') || name.contains('computer') || name.contains('tablet')) return 'Computers';
        if (name.contains('tv') || name.contains('television') || name.contains('monitor')) return 'TV & Audio';
        if (name.contains('headphone') || name.contains('speaker') || name.contains('earphone')) return 'Audio';
        if (name.contains('camera') || name.contains('video') || name.contains('photo')) return 'Cameras';
        return 'Electronics';
        
      case 'office-stationery':
        if (name.contains('glue') || name.contains('adhesive') || name.contains('tape')) return 'Adhesives';
        if (name.contains('pen') || name.contains('pencil') || name.contains('marker')) return 'Writing';
        if (name.contains('paper') || name.contains('notebook') || name.contains('book')) return 'Paper Products';
        if (name.contains('stapler') || name.contains('clip') || name.contains('binder')) return 'Office Supplies';
        return 'Stationery';
        
      case 'kids-baby':
        if (name.contains('toy') || name.contains('game') || name.contains('play')) return 'Toys';
        if (name.contains('clothing') || name.contains('dress') || name.contains('shirt')) return 'Clothing';
        if (name.contains('diaper') || name.contains('baby') || name.contains('infant')) return 'Baby Care';
        return 'Kids Products';
        
      case 'shoes-footwear':
        if (name.contains('men') || name.contains('male')) return 'Mens Shoes';
        if (name.contains('women') || name.contains('female')) return 'Womens Shoes';
        if (name.contains('kid') || name.contains('child')) return 'Kids Shoes';
        if (name.contains('sport') || name.contains('running') || name.contains('athletic')) return 'Sports Shoes';
        return 'Footwear';
        
      case 'bags-accessories':
        if (name.contains('backpack') || name.contains('school bag')) return 'Backpacks';
        if (name.contains('handbag') || name.contains('purse') || name.contains('clutch')) return 'Handbags';
        if (name.contains('luggage') || name.contains('suitcase') || name.contains('travel')) return 'Travel Bags';
        if (name.contains('wallet') || name.contains('card holder')) return 'Wallets';
        return 'Bags & Accessories';
        
      case 'jewelry-watches':
        if (name.contains('watch') || name.contains('timepiece')) return 'Watches';
        if (name.contains('necklace') || name.contains('chain')) return 'Necklaces';
        if (name.contains('earring') || name.contains('stud')) return 'Earrings';
        if (name.contains('ring') || name.contains('band')) return 'Rings';
        if (name.contains('bracelet') || name.contains('bangle')) return 'Bracelets';
        return 'Jewelry';
        
      default:
        return 'Products';
    }
  }

  Future<PaginatedProducts> getProducts({int page = 1, int limit = 12}) async {
    try {
      final url = '${ApiConfig.productsUrl}?page=$page&limit=$limit';
      debugPrint('[API] Fetching page $page: $url');
      final response = await _client.get(Uri.parse(url))
          .timeout(const Duration(seconds: 15));
      if (response.statusCode == 200) {
        final json = jsonDecode(response.body);
        final pagination = json['pagination'] as Map<String, dynamic>? ?? {};
        final products = _parseProductList(json['data']);
        return PaginatedProducts(
          products: products,
          currentPage: pagination['page'] as int? ?? page,
          totalPages: pagination['pages'] as int? ?? 1,
          total: pagination['total'] as int? ?? products.length,
        );
      }
    } catch (e) {
      debugPrint('[API] Paginated products error: $e');
    }
    return PaginatedProducts(products: [], currentPage: page, totalPages: 1, total: 0);
  }

  Future<List<Product>> getProductsByCategory(String categoryId) async {
    try {
      final url = '${ApiConfig.productsUrl}?limit=200';
      debugPrint('[API] Fetching products for category: $categoryId');
      final response = await _client.get(Uri.parse(url))
          .timeout(const Duration(seconds: 15));
      if (response.statusCode == 200) {
        final json = jsonDecode(response.body);
        final all = _parseProductList(json['data']);
        final catLower = categoryId.toLowerCase().trim();
        return all.where((p) {
          final pCat = (p.category ?? '').toLowerCase().trim();
          return pCat == catLower ||
              pCat.replaceAll(RegExp(r'[^a-z0-9]'), '') ==
                  catLower.replaceAll(RegExp(r'[^a-z0-9]'), '');
        }).toList();
      }
    } catch (e) {
      debugPrint('[API] Category products error: $e');
    }
    return [];
  }

  Future<List<Product>> getProductsBySubcategory(String subcategoryId, String categoryId) async {
    try {
      final url = '${ApiConfig.productsUrl}?limit=200';
      debugPrint('[API] Fetching products for subcategory: $subcategoryId (category: $categoryId)');
      final response = await _client.get(Uri.parse(url))
          .timeout(const Duration(seconds: 15));
      if (response.statusCode == 200) {
        final json = jsonDecode(response.body);
        final all = _parseProductList(json['data']);
        
        // First filter by category, then by subcategory
        return all.where((p) {
          // Check if product belongs to the specified category
          final pCat = (p.category ?? '').toLowerCase().trim();
          final isCorrectCategory = pCat == categoryId.toLowerCase() ||
              pCat.replaceAll(RegExp(r'[^a-z0-9]'), '') ==
                  categoryId.toLowerCase().replaceAll(RegExp(r'[^a-z0-9]'), '');
          
          if (!isCorrectCategory) return false;
          
          // Check subcategory match
          final pSubcat = (p.subcategory ?? '').toLowerCase().trim();
          if (pSubcat.isNotEmpty) {
            // Use database subcategory if available
            return pSubcat == subcategoryId.toLowerCase().trim() ||
                pSubcat.replaceAll(RegExp(r'[^a-z0-9]'), '') ==
                    subcategoryId.toLowerCase().replaceAll(RegExp(r'[^a-z0-9]'), '');
          } else {
            // Use smart subcategory matching
            final smartSubcat = _generateSmartSubcategory(p.name ?? '', categoryId);
            return smartSubcat.toLowerCase() == subcategoryId.toLowerCase();
          }
        }).toList();
      }
    } catch (e) {
      debugPrint('[API] Subcategory products error: $e');
    }
    return [];
  }

  List<Product> _parseProductList(dynamic list) {
    if (list is List) {
      return list
          .map((item) => Product.fromJson(item as Map<String, dynamic>))
          .toList();
    }
    return [];
  }
}
