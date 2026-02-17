import 'package:flutter/material.dart';
import '../config/theme.dart';
import '../models/product.dart';
import '../models/category.dart';
import '../services/api_service.dart';
import '../widgets/product_card.dart';
import '../widgets/shimmer_loading.dart';
import 'product_detail_screen.dart';

class CategoryProductsScreen extends StatefulWidget {
  final Category category;
  final String? categoryName;
  final String? categoryId;
  final String? categoryImage;
  final String? categoryDescription;

  const CategoryProductsScreen({
    super.key, 
    required this.category,
    this.categoryName,
    this.categoryId,
    this.categoryImage,
    this.categoryDescription,
  });

  @override
  State<CategoryProductsScreen> createState() =>
      _CategoryProductsScreenState();
}

class _CategoryProductsScreenState extends State<CategoryProductsScreen> {
  List<Product> _products = [];
  List<Product> _filteredProducts = [];
  bool _loading = true;
  String _sortBy = 'featured';
  final TextEditingController _searchController = TextEditingController();
  bool _isSearching = false;

  final _sortOptions = const [
    {'value': 'featured', 'label': 'Recommended'},
    {'value': 'price-asc', 'label': 'Price ↑'},
    {'value': 'price-desc', 'label': 'Price ↓'},
    {'value': 'newest', 'label': 'Newest'},
  ];

  @override
  void initState() {
    super.initState();
    _loadProducts();
    _searchController.addListener(_onSearchChanged);
  }

  @override
  void dispose() {
    _searchController.removeListener(_onSearchChanged);
    _searchController.dispose();
    super.dispose();
  }

  void _onSearchChanged() {
    final query = _searchController.text.toLowerCase().trim();
    setState(() {
      _isSearching = query.isNotEmpty;
      if (query.isEmpty) {
        _filteredProducts = List.from(_products);
      } else {
        _filteredProducts = _products.where((product) {
          return product.name.toLowerCase().contains(query) ||
              (product.description?.toLowerCase().contains(query) ?? false) ||
              (product.category?.toLowerCase().contains(query) ?? false) ||
              (product.brand?.toLowerCase().contains(query) ?? false);
        }).toList();
      }
    });
    _applySort();
  }

  Future<void> _loadProducts() async {
    setState(() => _loading = true);
    try {
      _products =
          await ApiService().getProductsByCategory(widget.category.id);
      _filteredProducts = List.from(_products);
      _applySort();
    } catch (_) {}
    if (mounted) setState(() => _loading = false);
  }

  void _applySort() {
    final productsToSort = _isSearching ? _filteredProducts : _products;
    
    switch (_sortBy) {
      case 'price-asc':
        productsToSort.sort((a, b) => a.price.compareTo(b.price));
        break;
      case 'price-desc':
        productsToSort.sort((a, b) => b.price.compareTo(a.price));
        break;
      case 'newest':
        productsToSort.sort((a, b) => b.createdAt?.compareTo(a.createdAt ?? '') ?? 0);
        break;
      default:
        break;
    }
    
    if (_isSearching) {
      _filteredProducts = productsToSort;
    } else {
      _products = productsToSort;
    }
  }

  void _navigateToProduct(Product product) {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (_) => ProductDetailScreen(productId: product.id),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF5F5F5),
      appBar: AppBar(
        title: Text(widget.category.name),
        backgroundColor: Colors.white,
        foregroundColor: const Color(0xFF1A1A2E),
        elevation: 0.5,
      ),
      body: Column(
        children: [
          // Sort bar
          Container(
            color: Colors.white,
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
            child: Row(
              children: [
                Icon(Icons.category,
                    color: AppTheme.primaryColor, size: 20),
                const SizedBox(width: 8),
                Text(
                  _loading 
                      ? 'Loading...' 
                      : '${_isSearching ? _filteredProducts.length : _products.length} products${_isSearching ? ' found' : ''}',
                  style: TextStyle(
                    fontSize: 13,
                    color: Colors.grey[600],
                    fontWeight: FontWeight.w500,
                  ),
                ),
                const Spacer(),
                // Sort dropdown
                Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(
                    border: Border.all(color: Colors.grey[300]!),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: DropdownButtonHideUnderline(
                    child: DropdownButton<String>(
                      value: _sortBy,
                      isDense: true,
                      style: const TextStyle(fontSize: 13, color: Color(0xFF1A1A2E)),
                      icon: const Icon(Icons.sort, size: 16),
                      items: _sortOptions.map((opt) {
                        return DropdownMenuItem(
                          value: opt['value'],
                          child: Text(opt['label']!),
                        );
                      }).toList(),
                      onChanged: (val) {
                        if (val != null) {
                          setState(() {
                            _sortBy = val;
                            _applySort();
                          });
                        }
                      },
                    ),
                  ),
                ),
              ],
            ),
          ),
          // Search bar
          Container(
            color: Colors.white,
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
            child: TextField(
              controller: _searchController,
              decoration: InputDecoration(
                hintText: 'Search products...',
                prefixIcon: const Icon(Icons.search, color: Colors.grey),
                suffixIcon: _isSearching
                    ? IconButton(
                        icon: const Icon(Icons.clear, color: Colors.grey),
                        onPressed: () {
                          _searchController.clear();
                        },
                      )
                    : null,
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(8),
                  borderSide: BorderSide(color: Colors.grey[300]!),
                ),
                focusedBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(8),
                  borderSide: const BorderSide(color: Color(0xFF10B981)),
                ),
                contentPadding: const EdgeInsets.symmetric(
                  horizontal: 16,
                  vertical: 12,
                ),
              ),
            ),
          ),
          const SizedBox(height: 4),
          // Products grid
          Expanded(
            child: _loading
                ? const Padding(
                    padding: EdgeInsets.all(12),
                    child: ShimmerProductGrid(count: 6),
                  )
                : (_isSearching ? _filteredProducts : _products).isEmpty
                    ? Center(
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(Icons.inbox_outlined,
                                size: 64, color: Colors.grey[300]),
                            const SizedBox(height: 12),
                            Text(
                              _isSearching 
                                  ? 'No products found for "${_searchController.text}"'
                                  : 'No products in ${widget.category.name}',
                              style: TextStyle(
                                  fontSize: 15, color: Colors.grey[500]),
                            ),
                          ],
                        ),
                      )
                    : RefreshIndicator(
                        onRefresh: _loadProducts,
                        color: AppTheme.primaryColor,
                        child: GridView.builder(
                          padding: const EdgeInsets.all(12),
                          gridDelegate:
                              const SliverGridDelegateWithFixedCrossAxisCount(
                            crossAxisCount: 2,
                            childAspectRatio: 0.62,
                            crossAxisSpacing: 10,
                            mainAxisSpacing: 10,
                          ),
                          itemCount: _isSearching ? _filteredProducts.length : _products.length,
                          itemBuilder: (context, index) {
                            final product = _isSearching ? _filteredProducts[index] : _products[index];
                            return ProductCard(
                              product: product,
                              animationIndex: index % 12,
                              onTap: () => _navigateToProduct(product),
                            );
                          },
                        ),
                      ),
          ),
        ],
      ),
    );
  }
}
