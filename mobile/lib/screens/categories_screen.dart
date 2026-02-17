import 'dart:math';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:shimmer/shimmer.dart';
import '../config/theme.dart';
import '../config/api_config.dart';
import '../providers/home_provider.dart';
import '../models/category.dart';
import '../models/subcategory.dart';
import '../services/api_service.dart';
import 'subcategory_products_screen.dart';
import '../main.dart';

const Color _blackWithOpacity = Color(0x0D000000);
const Color _primaryColorWithOpacity = Color(0x1A7A1A80);

class CategoriesScreen extends StatefulWidget {
  const CategoriesScreen({super.key});

  @override
  State<CategoriesScreen> createState() => _CategoriesScreenState();
}

class _CategoriesScreenState extends State<CategoriesScreen> {
  Category? _selectedCategory;
  List<Subcategory> _selectedSubcategories = [];
  bool _loadingSubcategories = false;
  Map<String, String> _categoryImages = {};
  Map<String, String> _subcategoryImages = {};
  List<Category> _shuffledCategories = [];

  Future<void> _selectCategory(Category category) async {
    setState(() {
      _selectedCategory = category;
      _loadingSubcategories = true;
      _selectedSubcategories = [];
    });

    try {
      final subcategories = await ApiService().getSubcategories(category.id);
      
      // Fetch product images for subcategories
      for (final subcategory in subcategories) {
        if (!_subcategoryImages.containsKey(subcategory.id)) {
          try {
            final products = await ApiService().getProductsBySubcategory(
              subcategory.id, 
              category.id
            );
            if (products.isNotEmpty) {
              // Pick a random product image instead of always the first one
              final randomProduct = products[Random().nextInt(products.length)];
              setState(() {
                _subcategoryImages[subcategory.id] = randomProduct.mainImage ?? '';
              });
            }
          } catch (e) {
            // Continue even if image fetch fails
          }
        }
      }
      
      setState(() {
        _selectedSubcategories = subcategories;
        _loadingSubcategories = false;
      });
    } catch (e) {
      setState(() {
        _loadingSubcategories = false;
      });
    }
  }

  Future<void> _loadCategoryImages(List<Category> categories) async {
    // Shuffle categories for random order
    if (_shuffledCategories.isEmpty) {
      _shuffledCategories = List.from(categories)..shuffle();
    }
    
    for (final category in _shuffledCategories) {
      if (!_categoryImages.containsKey(category.id)) {
        try {
          final products = await ApiService().getProductsByCategory(category.id);
          if (products.isNotEmpty) {
            // Pick a random product image instead of always the first one
            final randomProduct = products[Random().nextInt(products.length)];
            setState(() {
              _categoryImages[category.id] = randomProduct.mainImage ?? '';
            });
          }
        } catch (e) {
          // Continue even if image fetch fails
        }
      }
    }
    
    // Auto-select the first (now shuffled) category if none is selected
    if (_selectedCategory == null && _shuffledCategories.isNotEmpty) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        _selectCategory(_shuffledCategories.first);
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF8F9FA),
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        surfaceTintColor: Colors.white,
        toolbarHeight: 56,
        title: const Text(
          'Categories',
          style: TextStyle(
            color: Color(0xFF1A1A1A),
            fontWeight: FontWeight.w600,
            fontSize: 18,
          ),
        ),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: Color(0xFF1A1A1A)),
          onPressed: () {
            if (Navigator.canPop(context)) {
              Navigator.pop(context);
            } else {
              Navigator.pushReplacement(
                context,
                MaterialPageRoute(builder: (context) => const MainShell()),
              );
            }
          },
        ),
      ),
      body: Consumer<HomeProvider>(
        builder: (context, home, child) {
          if (home.isLoading && home.categories.isEmpty) {
            return _buildShimmerLoader();
          }

          if (home.error != null) {
            return _buildErrorState(home);
          }

          if (home.categories.isEmpty) {
            return _buildEmptyState();
          }

          // Load category images if not already loaded
          if (_categoryImages.isEmpty) {
            _loadCategoryImages(home.categories);
          }

          return RefreshIndicator(
            onRefresh: () => home.loadHomeFeed(),
            child: Row(
              children: [
                // Left sidebar - Categories
                Container(
                  width: 120,
                  decoration: const BoxDecoration(
                    color: Colors.white,
                    boxShadow: [
                      BoxShadow(
                        color: _blackWithOpacity,
                        blurRadius: 1,
                        offset: const Offset(1, 0),
                      ),
                    ],
                  ),
                  child: ListView.builder(
                    padding: const EdgeInsets.symmetric(vertical: 4),
                    itemCount: _shuffledCategories.length,
                    itemBuilder: (context, index) {
                      final category = _shuffledCategories[index];
                      final isSelected = _selectedCategory?.id == category.id;
                      return _buildModernCategoryItem(
                        category: category,
                        isSelected: isSelected,
                        onTap: () => _selectCategory(category),
                      );
                    },
                  ),
                ),
                // Right side - Subcategories
                Expanded(
                  child: Container(
                    color: Colors.white,
                    child: _selectedCategory == null
                        ? _buildModernSelectCategoryPrompt()
                        : _loadingSubcategories
                            ? _buildModernLoadingState()
                            : _buildModernSubcategoriesGrid(),
                  ),
                ),
              ],
            ),
          );
        },
      ),
    );
  }

  Widget _buildShimmerLoader() {
    return Row(
      children: [
        // Left column shimmer
        Container(
          width: 120,
          decoration: const BoxDecoration(
            color: Colors.white,
            boxShadow: [
              BoxShadow(
                color: _blackWithOpacity,
                blurRadius: 1,
                offset: const Offset(1, 0),
              ),
            ],
          ),
          child: ListView.builder(
            padding: const EdgeInsets.symmetric(vertical: 4),
            itemCount: 6,
            itemBuilder: (context, index) => Shimmer.fromColors(
              baseColor: const Color(0xFFF5F5F5),
              highlightColor: const Color(0xFFFAFAFA),
              child: Container(
                margin: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                height: 72,
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(12),
                ),
              ),
            ),
          ),
        ),
        // Right side shimmer
        Expanded(
          child: Container(
            color: Colors.white,
            child: ListView.builder(
              padding: const EdgeInsets.all(16),
              itemCount: 4,
              itemBuilder: (context, index) => Shimmer.fromColors(
                baseColor: const Color(0xFFF5F5F5),
                highlightColor: const Color(0xFFFAFAFA),
                child: Container(
                  margin: const EdgeInsets.only(bottom: 12),
                  height: 120,
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(16),
                  ),
                ),
              ),
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildModernLoadingState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Container(
            width: 60,
            height: 60,
            decoration: BoxDecoration(
              color: _primaryColorWithOpacity,
              shape: BoxShape.circle,
            ),
            child: CircularProgressIndicator(
              strokeWidth: 3,
              color: AppTheme.primaryColor,
            ),
          ),
          const SizedBox(height: 16),
          Text(
            'Loading subcategories...',
            style: TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.w500,
              color: const Color(0xFF6B7280),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildErrorState(HomeProvider home) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.error_outline, size: 64, color: Colors.red[300]),
          const SizedBox(height: 16),
          Text(
            'Failed to load categories',
            style: TextStyle(fontSize: 16, color: Colors.grey[700]),
          ),
          const SizedBox(height: 16),
          ElevatedButton(
            onPressed: () => home.loadHomeFeed(),
            child: const Text('Retry'),
          ),
        ],
      ),
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.category_outlined, size: 64, color: Colors.grey[400]),
          const SizedBox(height: 16),
          Text(
            'No categories available',
            style: TextStyle(fontSize: 16, color: Colors.grey[600]),
          ),
        ],
      ),
    );
  }

  Widget _buildModernCategoryItem({
    required Category category,
    required bool isSelected,
    required VoidCallback onTap,
  }) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        margin: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
        child: Container(
          padding: const EdgeInsets.all(8),
          decoration: BoxDecoration(
            color: isSelected ? AppTheme.primaryColor : Colors.transparent,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(
              color: isSelected ? AppTheme.primaryColor : Colors.transparent,
              width: 1,
            ),
          ),
          child: Column(
            children: [
              // Category image
              Container(
                width: 56,
                height: 56,
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(8),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withOpacity(0.1),
                      blurRadius: 4,
                      offset: const Offset(0, 2),
                    ),
                  ],
                ),
                child: ClipRRect(
                  borderRadius: BorderRadius.circular(6),
                  child: _categoryImages.containsKey(category.id) && _categoryImages[category.id]!.isNotEmpty
                      ? Image.network(
                          ApiConfig.imageUrl(_categoryImages[category.id]!),
                          width: 56,
                          height: 56,
                          fit: BoxFit.cover,
                        )
                      : Container(
                          decoration: BoxDecoration(
                            color: AppTheme.primaryColor.withOpacity(0.1),
                            borderRadius: BorderRadius.circular(6),
                          ),
                          child: Icon(
                            category.materialIcon,
                            color: AppTheme.primaryColor,
                            size: 24,
                          ),
                        ),
                ),
              ),
              const SizedBox(height: 8),
              // Category name
              Text(
                category.name,
                style: TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.w500,
                  color: isSelected ? Colors.white : const Color(0xFF1A1A1A),
                ),
                textAlign: TextAlign.center,
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildModernSelectCategoryPrompt() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              width: 80,
              height: 80,
              decoration: BoxDecoration(
                color: _primaryColorWithOpacity,
                shape: BoxShape.circle,
              ),
              child: Icon(
                Icons.category_outlined,
                size: 40,
                color: AppTheme.primaryColor,
              ),
            ),
            const SizedBox(height: 24),
            Text(
              'Select a category to browse',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.w500,
                color: const Color(0xFF6B7280),
              ),
            ),
            const SizedBox(height: 8),
            Text(
              'Choose from our collection',
              style: TextStyle(
                fontSize: 14,
                color: Colors.grey[600],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildModernSubcategoriesGrid() {
    return Column(
      children: [
        // Header
        Container(
          padding: const EdgeInsets.fromLTRB(20, 20, 16, 20),
          color: Colors.white,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                decoration: BoxDecoration(
                  color: _primaryColorWithOpacity,
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Text(
                  _selectedCategory?.name ?? '',
                  style: const TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w500,
                    color: AppTheme.primaryColor,
                  ),
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 8),
        // Grid
        Expanded(
          child: GridView.builder(
            padding: const EdgeInsets.fromLTRB(20, 8, 20, 8),
            gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
              crossAxisCount: 2,
              crossAxisSpacing: 16,
              mainAxisSpacing: 16,
              childAspectRatio: 0.75,
            ),
            itemCount: _selectedSubcategories.length,
            itemBuilder: (context, index) {
              final subcategory = _selectedSubcategories[index];
              return _buildModernSubcategoryCard(
                subcategory: subcategory,
                onTap: () {
                  Navigator.push(
                    context,
                    MaterialPageRoute(
                      builder: (context) => SubcategoryProductsScreen(
                        subcategory: subcategory,
                        categoryName: _selectedCategory?.name ?? '',
                      ),
                    ),
                  );
                },
              );
            },
          ),
        ),
      ],
    );
  }

  Widget _buildModernSubcategoryCard({
    required Subcategory subcategory,
    required VoidCallback onTap,
  }) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: _blackWithOpacity,
            blurRadius: 12,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(16),
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Image
                Container(
                  width: double.infinity,
                  height: 120,
                  decoration: BoxDecoration(
                    color: AppTheme.primaryColor.withOpacity(0.05),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: ClipRRect(
                    borderRadius: BorderRadius.circular(8),
                    child: _subcategoryImages.containsKey(subcategory.id) && _subcategoryImages[subcategory.id]!.isNotEmpty
                        ? Image.network(
                            ApiConfig.imageUrl(_subcategoryImages[subcategory.id]!),
                            width: double.infinity,
                            height: 120,
                            fit: BoxFit.cover,
                          )
                        : Container(
                          decoration: BoxDecoration(
                            color: AppTheme.primaryColor.withOpacity(0.1),
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: Icon(
                            subcategory.materialIcon,
                            color: AppTheme.primaryColor,
                            size: 40,
                          ),
                        ),
                  ),
                ),
                const SizedBox(height: 12),
                // Title
                Text(
                  subcategory.name,
                  style: const TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w600,
                    color: Color(0xFF1A1A1A),
                  ),
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                ),
                const SizedBox(height: 8),
                // Product count
                Row(
                  children: [
                    Icon(
                      Icons.shopping_bag_outlined,
                      size: 16,
                      color: AppTheme.primaryColor,
                    ),
                    const SizedBox(width: 6),
                    Text(
                      '${subcategory.productCount} products',
                      style: const TextStyle(
                        fontSize: 14,
                        color: Color(0xFF6B7280),
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
