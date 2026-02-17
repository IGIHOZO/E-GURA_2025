import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:shimmer/shimmer.dart';
import '../config/theme.dart';
import '../providers/home_provider.dart';
import '../models/category.dart';
import '../models/subcategory.dart';
import '../services/api_service.dart';
import '../widgets/shimmer_loading.dart';
import 'category_products_screen.dart';
import 'subcategory_products_screen.dart';

class CategoriesScreen extends StatefulWidget {
  const CategoriesScreen({super.key});

  @override
  State<CategoriesScreen> createState() => _CategoriesScreenState();
}

class _CategoriesScreenState extends State<CategoriesScreen>
    with SingleTickerProviderStateMixin {
  late AnimationController _animationController;
  Category? _selectedCategory;
  List<Subcategory> _selectedSubcategories = [];
  bool _loadingSubcategories = false;

  @override
  void initState() {
    super.initState();
    _animationController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 800),
    );
    _animationController.forward();
  }

  @override
  void dispose() {
    _animationController.dispose();
    super.dispose();
  }

  Future<void> _selectCategory(Category category) async {
    setState(() {
      _selectedCategory = category;
      _loadingSubcategories = true;
      _selectedSubcategories = [];
    });

    try {
      final subcategories = await ApiService().getSubcategories(category.id);
      if (mounted) {
        setState(() {
          _selectedSubcategories = subcategories;
          _loadingSubcategories = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() => _loadingSubcategories = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF5F5F5),
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        title: const Text(
          'Categoriess',
          style: TextStyle(
            color: Color(0xFF1A1A1A),
            fontWeight: FontWeight.w600,
            fontSize: 18,
          ),
        ),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: Color(0xFF1A1A1A)),
          onPressed: () => Navigator.pop(context),
        ),
      ),
      body: Consumer<HomeProvider>(
        builder: (context, home, child) {
          if (home.isLoading && home.categories.isEmpty) {
            return _buildShimmerGrid();
          }

          if (home.error != null) {
            return _buildErrorState(home);
          }

          if (home.categories.isEmpty) {
            return _buildEmptyState();
          }

          return RefreshIndicator(
            onRefresh: () => home.loadHomeFeed(),
            child: Row(
              children: [
                // Left Column - Categories
                Expanded(
                  flex: 1,
                  child: Container(
                    decoration: const BoxDecoration(
                      color: Colors.white,
                      border: Border(
                        right: BorderSide(color: Color(0xFFE0E0E0), width: 1),
                      ),
                    ),
                    child: ListView.builder(
                      padding: const EdgeInsets.symmetric(vertical: 8),
                      itemCount: home.categories.length,
                      itemBuilder: (context, index) {
                        final category = home.categories[index];
                        final isSelected = _selectedCategory?.id == category.id;
                        return _CategoryListItem(
                          category: category,
                          isSelected: isSelected,
                          onTap: () => _selectCategory(category),
                          animation: _animationController,
                          index: index,
                        );
                      },
                    ),
                  ),
                ),
                
                // Right Column - Subcategories
                Expanded(
                  flex: 2,
                  child: Container(
                    decoration: const BoxDecoration(
                      color: Color(0xFFFAFAFA),
                    ),
                    child: _selectedCategory == null
                        ? _buildEmptySubcategoryState()
                        : _buildSubcategoriesList(),
                  ),
                ),
              ],
            ),
          );
        },
      ),
    );
  }

  Widget _buildShimmerGrid() {
    return Row(
      children: [
        // Left column shimmer
        Expanded(
          flex: 1,
          child: Container(
            decoration: const BoxDecoration(
              color: Colors.white,
              border: Border(
                right: BorderSide(color: Color(0xFFE0E0E0), width: 1),
              ),
            ),
            child: ListView.builder(
              padding: const EdgeInsets.symmetric(vertical: 8),
              itemCount: 5,
              itemBuilder: (context, index) => Shimmer.fromColors(
                baseColor: const Color(0xFFE8E8E8),
                highlightColor: const Color(0xFFF5F5F5),
                period: const Duration(milliseconds: 1500),
                child: Container(
                  margin: const EdgeInsets.only(bottom: 8),
                  height: 60,
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(8),
                  ),
                ),
              ),
            ),
          ),
        ),
        // Right column shimmer
        Expanded(
          flex: 2,
          child: Container(
            color: const Color(0xFFFAFAFA),
            child: ListView.builder(
              padding: const EdgeInsets.all(16),
              itemCount: 3,
              itemBuilder: (context, index) => Shimmer.fromColors(
                baseColor: const Color(0xFFE8E8E8),
                highlightColor: const Color(0xFFF5F5F5),
                period: const Duration(milliseconds: 1500),
                child: Container(
                  margin: const EdgeInsets.only(bottom: 12),
                  height: 40,
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(20),
                  ),
                ),
              ),
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildErrorState(HomeProvider home) {
    return Center(
        child: Container(
          margin: const EdgeInsets.all(32),
          padding: const EdgeInsets.all(32),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(24),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withOpacity(0.04),
                blurRadius: 20,
                offset: const Offset(0, 4),
              ),
            ],
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                width: 80,
                height: 80,
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    colors: [
                      const Color(0xFFFEE2E2),
                      const Color(0xFFFEF2F2),
                    ],
                  ),
                  shape: BoxShape.circle,
                ),
                child: const Icon(
                  Icons.cloud_off_rounded,
                  size: 40,
                  color: Color(0xFFEF4444),
                ),
              ),
              const SizedBox(height: 24),
              const Text(
                'Connection Issue',
                style: TextStyle(
                  fontSize: 22,
                  fontWeight: FontWeight.w700,
                  color: Color(0xFF1A1A1A),
                  letterSpacing: -0.5,
                ),
              ),
              const SizedBox(height: 12),
              Text(
                home.error ?? 'Unable to load categories',
                textAlign: TextAlign.center,
                style: const TextStyle(
                  fontSize: 15,
                  color: Color(0xFF666666),
                  height: 1.6,
                ),
              ),
              const SizedBox(height: 32),
              ElevatedButton(
                onPressed: () => home.loadHomeFeed(),
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF1A1A1A),
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(
                    horizontal: 32,
                    vertical: 16,
                  ),
                  elevation: 0,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                ),
                child: const Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(Icons.refresh_rounded, size: 20),
                    SizedBox(width: 10),
                    Text(
                      'Retry',
                      style: TextStyle(
                        fontSize: 15,
                        fontWeight: FontWeight.w600,
                        letterSpacing: 0.3,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      );
  }

  Widget _buildEmptyState() {
    return Center(
        child: Container(
          margin: const EdgeInsets.all(32),
          padding: const EdgeInsets.all(32),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(24),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withOpacity(0.04),
                blurRadius: 20,
                offset: const Offset(0, 4),
              ),
            ],
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                width: 80,
                height: 80,
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    colors: [
                      AppTheme.primaryColor.withOpacity(0.1),
                      AppTheme.primaryColor.withOpacity(0.05),
                    ],
                  ),
                  shape: BoxShape.circle,
                ),
                child: Icon(
                  Icons.shopping_bag_outlined,
                  size: 40,
                  color: AppTheme.primaryColor,
                ),
              ),
              const SizedBox(height: 24),
              const Text(
                'No Categories Yet',
                style: TextStyle(
                  fontSize: 22,
                  fontWeight: FontWeight.w700,
                  color: Color(0xFF1A1A1A),
                  letterSpacing: -0.5,
                ),
              ),
              const SizedBox(height: 12),
              const Text(
                'Categories will appear here\nonce they are added',
                textAlign: TextAlign.center,
                style: TextStyle(
                  fontSize: 15,
                  color: Color(0xFF666666),
                  height: 1.6,
                ),
              ),
            ],
          ),
        ),
      );
  }

  Widget _buildEmptySubcategoryState() {
    return Center(
      child: Container(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              Icons.touch_app_outlined,
              size: 64,
              color: Colors.grey[400],
            ),
            const SizedBox(height: 16),
            Text(
              'Select a category to view subcategories',
              style: TextStyle(
                fontSize: 16,
                color: Colors.grey[600],
                fontWeight: FontWeight.w500,
              ),
              textAlign: TextAlign.center,
            ),
          ],
  bool _loadingSubcategories = true;
  bool _expanded = false;
  late AnimationController _expandController;

  @override
  void initState() {
    super.initState();
    _expandController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 300),
    );
    _loadSubcategories();
  }

  @override
  void dispose() {
    _expandController.dispose();
    super.dispose();
  }

  Future<void> _loadSubcategories() async {
    setState(() => _loadingSubcategories = true);
    try {
      final subcategories = await ApiService().getSubcategories(widget.category.id);
      if (mounted) {
        setState(() {
          _subcategories = subcategories;
          _loadingSubcategories = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() => _loadingSubcategories = false);
      }
    }
  }

  void _toggleExpanded() {
    setState(() => _expanded = !_expanded);
    if (_expanded) {
      _expandController.forward();
    } else {
      _expandController.reverse();
    }
  }

  @override
  Widget build(BuildContext context) {
    final delay = widget.index * 80;
    
    return FadeTransition(
      opacity: Tween<double>(begin: 0.0, end: 1.0).animate(
        CurvedAnimation(
          parent: widget.animation,
          curve: Interval(
            (delay / 800).clamp(0.0, 1.0),
            ((delay + 400) / 800).clamp(0.0, 1.0),
            curve: Curves.easeOut,
          ),
        ),
      ),
      child: SlideTransition(
        position: Tween<Offset>(
          begin: const Offset(0, 0.15),
          end: Offset.zero,
        ).animate(
          CurvedAnimation(
            parent: widget.animation,
            curve: Interval(
              (delay / 800).clamp(0.0, 1.0),
              ((delay + 400) / 800).clamp(0.0, 1.0),
              curve: Curves.easeOutCubic,
            ),
          ),
        ),
        child: GestureDetector(
          onTap: _toggleExpanded,
          child: Container(
            margin: const EdgeInsets.only(bottom: 16),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(16),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withOpacity(0.08),
                  blurRadius: 10,
                  offset: const Offset(0, 2),
                ),
              ],
            ),
            child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Category Header
              Container(
                padding: const EdgeInsets.all(16),
                child: Row(
                  children: [
                    // Category Icon
                    Container(
                      width: 50,
                      height: 50,
                      decoration: BoxDecoration(
                        color: AppTheme.primaryColor.withOpacity(0.1),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Icon(
                        widget.category.materialIcon,
                        color: AppTheme.primaryColor,
                        size: 24,
                      ),
                    ),
                    const SizedBox(width: 12),
                    
                    // Category Name
                    Expanded(
                      child: Text(
                        widget.category.name,
                        style: const TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.w600,
                          color: Color(0xFF1A1A1A),
                        ),
                      ),
                    ),
                    
                    // Arrow Icon
                    Icon(
                      _expanded ? Icons.keyboard_arrow_up : Icons.keyboard_arrow_down,
                      color: Colors.grey[600],
                      size: 20,
                    ),
                  ],
                ),
              ),
              
              // Subcategories Section
              if (_expanded) ...[
                const Divider(height: 1, color: Color(0xFFE0E0E0)),
                
                // Subcategories Grid
                Container(
                  padding: const EdgeInsets.all(16),
                  child: _loadingSubcategories
                      ? _buildSubcategoriesShimmer()
                      : _subcategories.isEmpty
                          ? _buildNoSubcategories()
                          : _buildSubcategoriesGrid(),
                ),
              ],
            ],
          ),
        ),
        ),
      ),
    );
  }

  Widget _buildSubcategoriesShimmer() {
    return GridView.builder(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 3,
        crossAxisSpacing: 12,
        mainAxisSpacing: 12,
        childAspectRatio: 2.5,
      ),
      itemCount: 6,
      itemBuilder: (context, index) => Shimmer.fromColors(
        baseColor: const Color(0xFFE8E8E8),
        highlightColor: const Color(0xFFF5F5F5),
        period: const Duration(milliseconds: 1500),
        child: Container(
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(8),
          ),
        ),
      ),
    );
  }

  Widget _buildNoSubcategories() {
    return Container(
      padding: const EdgeInsets.all(24),
      child: const Text(
        'No subcategories available',
        textAlign: TextAlign.center,
        style: TextStyle(
          fontSize: 14,
          color: Color(0xFF999999),
        ),
      ),
    );
  }

  Widget _buildSubcategoriesGrid() {
    return Container(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Padding(
            padding: EdgeInsets.only(left: 4, bottom: 12),
            child: Text(
              'SUBCATEGORIES',
              style: TextStyle(
                fontSize: 13,
                fontWeight: FontWeight.w700,
                color: Color(0xFF666666),
                letterSpacing: 0.5,
              ),
            ),
          ),
          GridView.builder(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
              crossAxisCount: 3,
              childAspectRatio: 2.5,
              crossAxisSpacing: 8,
              mainAxisSpacing: 8,
            ),
            itemCount: _subcategories.length,
            itemBuilder: (context, index) {
              final subcategory = _subcategories[index];
              return _SubcategoryChip(
                subcategory: subcategory,
                categoryName: widget.category.name,
                delay: index * 50,
              );
            },
          ),
        ],
      ),
    );
  }
}

class _SubcategoryChip extends StatefulWidget {
  final Subcategory subcategory;
  final String categoryName;
  final int delay;

  const _SubcategoryChip({
    required this.subcategory,
    required this.categoryName,
    required this.delay,
  });

  @override
  State<_SubcategoryChip> createState() => _SubcategoryChipState();
}

class _SubcategoryChipState extends State<_SubcategoryChip> {
  bool _isPressed = false;

  @override
  Widget build(BuildContext context) {
    return TweenAnimationBuilder<double>(
      tween: Tween(begin: 0.0, end: 1.0),
      duration: Duration(milliseconds: 300 + widget.delay),
      curve: Curves.easeOutBack,
      builder: (context, value, child) {
        return Transform.scale(
          scale: value,
          child: child,
        );
      },
      child: GestureDetector(
        onTapDown: (_) => setState(() => _isPressed = true),
        onTapUp: (_) => setState(() => _isPressed = false),
        onTapCancel: () => setState(() => _isPressed = false),
        onTap: () {
          Navigator.push(
            context,
            PageRouteBuilder(
              pageBuilder: (context, animation, secondaryAnimation) =>
                  SubcategoryProductsScreen(
                subcategory: widget.subcategory,
                categoryName: widget.categoryName,
              ),
              transitionsBuilder: (context, animation, secondaryAnimation, child) {
                const begin = Offset(1.0, 0.0);
                const end = Offset.zero;
                const curve = Curves.easeInOutCubic;
                var tween = Tween(begin: begin, end: end).chain(
                  CurveTween(curve: curve),
                );
                var offsetAnimation = animation.drive(tween);
                return SlideTransition(
                  position: offsetAnimation,
                  child: FadeTransition(
                    opacity: animation,
                    child: child,
                  ),
                );
              },
              transitionDuration: const Duration(milliseconds: 400),
            ),
          );
        },
        child: AnimatedScale(
          scale: _isPressed ? 0.96 : 1.0,
          duration: const Duration(milliseconds: 100),
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
            decoration: BoxDecoration(
              color: const Color(0xFFF5F5F5),
              borderRadius: BorderRadius.circular(20),
              border: Border.all(
                color: const Color(0xFFE0E0E0),
                width: 1,
              ),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(
                  widget.subcategory.materialIcon,
                  color: AppTheme.primaryColor,
                  size: 16,
                ),
                const SizedBox(width: 6),
                Expanded(
                  child: Text(
                    widget.subcategory.name,
                    style: const TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.w500,
                      color: Color(0xFF333333),
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    textAlign: TextAlign.center,
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}