class Product {
  final String id;
  final String name;
  final double price;
  final double? originalPrice;
  final int? discountPercentage;
  final String? mainImage;
  final String? category;
  final String? subcategory;
  final String? brand;
  final List<String>? tags;
  final List<String>? colors;
  final List<String>? sizes;
  final double? averageRating;
  final int? totalReviews;
  final int? salesCount;
  final int? stockQuantity;
  final bool isFeatured;
  final bool isNew;
  final bool isSale;
  final bool isBestSeller;
  final String? shortDescription;
  final String? description;
  final List<String>? images;
  final String? createdAt;
  bool isFavorite = false;

  Product({
    required this.id,
    required this.name,
    required this.price,
    this.originalPrice,
    this.discountPercentage,
    this.mainImage,
    this.category,
    this.subcategory,
    this.brand,
    this.tags,
    this.colors,
    this.sizes,
    this.averageRating,
    this.totalReviews,
    this.salesCount,
    this.stockQuantity,
    this.isFeatured = false,
    this.isNew = false,
    this.isSale = false,
    this.isBestSeller = false,
    this.shortDescription,
    this.description,
    this.images,
    this.createdAt,
    this.isFavorite = false,
  });

  factory Product.fromJson(Map<String, dynamic> json) {
    return Product(
      id: json['id']?.toString() ?? json['_id']?.toString() ?? '',
      name: json['name']?.toString() ?? 'Unknown Product',
      price: _toDouble(json['price']),
      originalPrice: json['originalPrice'] != null ? _toDouble(json['originalPrice']) : null,
      discountPercentage: _toInt(json['discountPercentage']),
      mainImage: json['mainImage']?.toString(),
      category: json['category']?.toString(),
      subcategory: json['subcategory']?.toString(),
      brand: json['brand']?.toString(),
      tags: _toStringList(json['tags']),
      colors: _toStringList(json['colors']),
      sizes: _toStringList(json['sizes']),
      averageRating: json['averageRating'] != null ? _toDouble(json['averageRating']) : null,
      totalReviews: _toInt(json['totalReviews']),
      salesCount: _toInt(json['salesCount']),
      stockQuantity: json['stockQuantity'] != null ? _toInt(json['stockQuantity']) : null,
      isFeatured: json['isFeatured'] == true,
      isNew: json['isNew'] == true,
      isSale: json['isSale'] == true,
      isBestSeller: json['isBestSeller'] == true,
      shortDescription: json['shortDescription']?.toString(),
      description: json['description']?.toString(),
      images: _toStringList(json['images']),
      createdAt: json['createdAt']?.toString(),
      isFavorite: json['isFavorite'] == true,
    );
  }

  static int _toInt(dynamic value) {
    if (value is int) return value;
    if (value is double) return value.toInt();
    if (value is String) return int.tryParse(value) ?? 0;
    return 0;
  }

  static double _toDouble(dynamic value) {
    if (value is double) return value;
    if (value is int) return value.toDouble();
    if (value is String) return double.tryParse(value) ?? 0.0;
    return 0.0;
  }

  static List<String>? _toStringList(dynamic value) {
    if (value is List) return value.map((e) => e.toString()).toList();
    return null;
  }

  static String formatNumber(double value) {
    final str = value.toStringAsFixed(0);
    final result = StringBuffer();
    for (int i = 0; i < str.length; i++) {
      if (i > 0 && (str.length - i) % 3 == 0) result.write(',');
      result.write(str[i]);
    }
    return result.toString();
  }

  String get formattedPrice => '${formatNumber(price)} RWF';

  String get formattedOriginalPrice =>
      originalPrice != null ? '${formatNumber(originalPrice!)} RWF' : '';

  double get flashDealPrice => (price * 0.7).floorToDouble();

  String get formattedFlashPrice => '${formatNumber(flashDealPrice)} RWF';

  double get savings =>
      originalPrice != null ? originalPrice! - price : price * 0.3;

  String get formattedSavings => '${formatNumber(savings)} RWF';

  bool get hasDiscount => (discountPercentage ?? 0) > 0;

  String get stockStatus {
    if (stockQuantity == null) return 'In Stock';
    if (stockQuantity! <= 0) return 'Out of Stock';
    if (stockQuantity! < 5) return 'Low Stock';
    return 'In Stock';
  }
}

class PaginatedProducts {
  final List<Product> products;
  final int currentPage;
  final int totalPages;
  final int total;

  PaginatedProducts({
    required this.products,
    required this.currentPage,
    required this.totalPages,
    required this.total,
  });

  bool get hasMore => currentPage < totalPages;
}
