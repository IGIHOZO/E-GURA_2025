import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import 'package:shimmer/shimmer.dart';
import 'dart:ui';
import '../config/theme.dart';
import '../providers/home_provider.dart';
import '../models/category.dart';
import '../widgets/shimmer_loading.dart';

class CategoriesScreen extends StatefulWidget {
  const CategoriesScreen({super.key});

  @override
  State<CategoriesScreen> createState() => _CategoriesScreenState();
}

class _CategoriesScreenState extends State<CategoriesScreen>
    with TickerProviderStateMixin {
  late AnimationController _staggerController;
  late AnimationController _headerController;
  final ScrollController _scrollController = ScrollController();
  double _scrollOffset = 0.0;

  @override
  void initState() {
    super.initState();
    
    _staggerController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1200),
    );
    
    _headerController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 800),
    );

    _scrollController.addListener(() {
      setState(() {
        _scrollOffset = _scrollController.offset;
      });
    });

    _playAnimations();
  }

  void _playAnimations() async {
    await Future.delayed(const Duration(milliseconds: 100));
    _headerController.forward();
    await Future.delayed(const Duration(milliseconds: 200));
    _staggerController.forward();
  }

  @override
  void dispose() {
    _staggerController.dispose();
    _headerController.dispose();
    _scrollController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final headerOpacity = (1 - (_scrollOffset / 120)).clamp(0.0, 1.0);
    final headerScale = (1 - (_scrollOffset / 600)).clamp(0.85, 1.0);

    return AnnotatedRegion<SystemUiOverlayStyle>(
      value: SystemUiOverlayStyle.dark.copyWith(
        statusBarColor: Colors.transparent,
        statusBarIconBrightness: Brightness.dark,
      ),
      child: Scaffold(
        backgroundColor: const Color(0xFFFAFAFA),
        body: SafeArea(
          child: CustomScrollView(
            controller: _scrollController,
            physics: const BouncingScrollPhysics(),
            slivers: [
              // Premium Header
              SliverToBoxAdapter(
                child: _buildPremiumHeader(headerOpacity, headerScale),
              ),

              // Categories Content
              Consumer<HomeProvider>(
                builder: (context, home, child) {
                  if (home.isLoading && home.categories.isEmpty) {
                    return _buildShimmerGrid();
                  }

                  if (home.error != null) {
                    return SliverFillRemaining(
                      child: _buildErrorState(home),
                    );
                  }

                  if (home.categories.isEmpty) {
                    return SliverFillRemaining(
                      child: _buildEmptyState(),
                    );
                  }

                  return _buildCategoriesGrid(home.categories);
                },
              ),

              // Bottom Spacing
              const SliverToBoxAdapter(
                child: SizedBox(height: 32),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildPremiumHeader(double opacity, double scale) {
    return FadeTransition(
      opacity: _headerController,
      child: SlideTransition(
        position: Tween<Offset>(
          begin: const Offset(0, -0.5),
          end: Offset.zero,
        ).animate(CurvedAnimation(
          parent: _headerController,
          curve: Curves.easeOutCubic,
        )),
        child: Opacity(
          opacity: opacity,
          child: Transform.scale(
            scale: scale,
            alignment: Alignment.topCenter,
            child: Container(
              padding: const EdgeInsets.fromLTRB(24, 20, 24, 32),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Container(
                        width: 4,
                        height: 32,
                        decoration: BoxDecoration(
                          gradient: const LinearGradient(
                            begin: Alignment.topCenter,
                            end: Alignment.bottomCenter,
                            colors: [
                              Color(0xFF6366F1),
                              Color(0xFF8B5CF6),
                            ],
                          ),
                          borderRadius: BorderRadius.circular(2),
                        ),
                      ),
                      const SizedBox(width: 12),
                      const Text(
                        'Explore',
                        style: TextStyle(
                          fontSize: 36,
                          fontWeight: FontWeight.w800,
                          letterSpacing: -1.5,
                          color: Color(0xFF0F172A),
                          height: 1.2,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),
                  Padding(
                    padding: const EdgeInsets.only(left: 16),
                    child: Text(
                      'Discover what matters to you',
                      style: TextStyle(
                        fontSize: 15,
                        fontWeight: FontWeight.w500,
                        color: const Color(0xFF64748B),
                        letterSpacing: 0.2,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildCategoriesGrid(List<Category> categories) {
    return SliverPadding(
      padding: const EdgeInsets.symmetric(horizontal: 20),
      sliver: SliverGrid(
        gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
          crossAxisCount: 2,
          childAspectRatio: 0.82,
          crossAxisSpacing: 16,
          mainAxisSpacing: 16,
        ),
        delegate: SliverChildBuilderDelegate(
          (context, index) {
            return _AnimatedCategoryCard(
              category: categories[index],
              index: index,
              animation: _staggerController,
            );
          },
          childCount: categories.length,
        ),
      ),
    );
  }

  Widget _buildShimmerGrid() {
    return SliverPadding(
      padding: const EdgeInsets.symmetric(horizontal: 20),
      sliver: SliverGrid(
        gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
          crossAxisCount: 2,
          childAspectRatio: 0.82,
          crossAxisSpacing: 16,
          mainAxisSpacing: 16,
        ),
        delegate: SliverChildBuilderDelegate(
          (context, index) => Shimmer.fromColors(
            baseColor: const Color(0xFFE2E8F0),
            highlightColor: const Color(0xFFF8FAFC),
            child: Container(
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(20),
              ),
            ),
          ),
          childCount: 8,
        ),
      ),
    );
  }

  Widget _buildErrorState(HomeProvider home) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(40),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              width: 120,
              height: 120,
              decoration: BoxDecoration(
                color: const Color(0xFFFEF2F2),
                borderRadius: BorderRadius.circular(30),
              ),
              child: const Icon(
                Icons.cloud_off_rounded,
                size: 56,
                color: Color(0xFFEF4444),
              ),
            ),
            const SizedBox(height: 32),
            const Text(
              'Connection Issue',
              style: TextStyle(
                fontSize: 24,
                fontWeight: FontWeight.w700,
                color: Color(0xFF0F172A),
                letterSpacing: -0.5,
              ),
            ),
            const SizedBox(height: 12),
            Text(
              home.error ?? 'Unable to load categories',
              textAlign: TextAlign.center,
              style: const TextStyle(
                fontSize: 15,
                color: Color(0xFF64748B),
                height: 1.6,
                fontWeight: FontWeight.w400,
              ),
            ),
            const SizedBox(height: 32),
            _buildActionButton(
              label: 'Retry',
              icon: Icons.refresh_rounded,
              onPressed: () => home.loadHomeFeed(),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(40),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              width: 120,
              height: 120,
              decoration: BoxDecoration(
                color: const Color(0xFFF8FAFC),
                borderRadius: BorderRadius.circular(30),
              ),
              child: const Icon(
                Icons.grid_view_rounded,
                size: 56,
                color: Color(0xFFCBD5E1),
              ),
            ),
            const SizedBox(height: 32),
            const Text(
              'No Categories',
              style: TextStyle(
                fontSize: 24,
                fontWeight: FontWeight.w700,
                color: Color(0xFF0F172A),
                letterSpacing: -0.5,
              ),
            ),
            const SizedBox(height: 12),
            const Text(
              'New categories will appear here',
              textAlign: TextAlign.center,
              style: TextStyle(
                fontSize: 15,
                color: Color(0xFF64748B),
                height: 1.6,
                fontWeight: FontWeight.w400,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildActionButton({
    required String label,
    required IconData icon,
    required VoidCallback onPressed,
  }) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onPressed,
        borderRadius: BorderRadius.circular(16),
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 16),
          decoration: BoxDecoration(
            gradient: const LinearGradient(
              colors: [Color(0xFF6366F1), Color(0xFF8B5CF6)],
            ),
            borderRadius: BorderRadius.circular(16),
            boxShadow: [
              BoxShadow(
                color: const Color(0xFF6366F1).withOpacity(0.3),
                blurRadius: 20,
                offset: const Offset(0, 8),
              ),
            ],
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(icon, color: Colors.white, size: 20),
              const SizedBox(width: 8),
              Text(
                label,
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 16,
                  fontWeight: FontWeight.w600,
                  letterSpacing: 0.3,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

// Animated Category Card
class _AnimatedCategoryCard extends StatelessWidget {
  final Category category;
  final int index;
  final AnimationController animation;

  const _AnimatedCategoryCard({
    required this.category,
    required this.index,
    required this.animation,
  });

  @override
  Widget build(BuildContext context) {
    final delay = index * 0.08;
    final animationInterval = Interval(
      delay.clamp(0.0, 0.5),
      (delay + 0.5).clamp(0.0, 1.0),
      curve: Curves.easeOutCubic,
    );

    return FadeTransition(
      opacity: Tween<double>(begin: 0.0, end: 1.0).animate(
        CurvedAnimation(parent: animation, curve: animationInterval),
      ),
      child: SlideTransition(
        position: Tween<Offset>(
          begin: const Offset(0, 0.4),
          end: Offset.zero,
        ).animate(
          CurvedAnimation(parent: animation, curve: animationInterval),
        ),
        child: _CategoryCard(category: category),
      ),
    );
  }
}

// Premium Category Card
class _CategoryCard extends StatefulWidget {
  final Category category;

  const _CategoryCard({required this.category});

  @override
  State<_CategoryCard> createState() => _CategoryCardState();
}

class _CategoryCardState extends State<_CategoryCard>
    with SingleTickerProviderStateMixin {
  late AnimationController _hoverController;
  bool _isPressed = false;

  final List<List<Color>> _gradients = [
    [Color(0xFF6366F1), Color(0xFF8B5CF6)], // Indigo to Purple
    [Color(0xFFEC4899), Color(0xFFF43F5E)], // Pink to Rose
    [Color(0xFF06B6D4), Color(0xFF0EA5E9)], // Cyan to Blue
    [Color(0xFF10B981), Color(0xFF059669)], // Emerald to Green
    [Color(0xFFF59E0B), Color(0xFFEF4444)], // Amber to Red
    [Color(0xFF8B5CF6), Color(0xFFEC4899)], // Purple to Pink
    [Color(0xFF0EA5E9), Color(0xFF6366F1)], // Blue to Indigo
    [Color(0xFF059669), Color(0xFF06B6D4)], // Green to Cyan
  ];

  @override
  void initState() {
    super.initState();
    _hoverController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 300),
    );
  }

  @override
  void dispose() {
    _hoverController.dispose();
    super.dispose();
  }

  List<Color> _getCategoryGradient() {
    final hash = widget.category.name.hashCode;
    return _gradients[hash.abs() % _gradients.length];
  }

  IconData _getCategoryIcon() {
    final name = widget.category.name.toLowerCase();
    
    if (name.contains('electronic') || name.contains('tech')) return Icons.devices_rounded;
    if (name.contains('fashion') || name.contains('cloth')) return Icons.checkroom_rounded;
    if (name.contains('food') || name.contains('grocery')) return Icons.restaurant_menu_rounded;
    if (name.contains('home') || name.contains('furniture')) return Icons.weekend_rounded;
    if (name.contains('book')) return Icons.auto_stories_rounded;
    if (name.contains('sport') || name.contains('fitness')) return Icons.fitness_center_rounded;
    if (name.contains('beauty') || name.contains('cosmetic')) return Icons.face_retouching_natural_rounded;
    if (name.contains('toy') || name.contains('kid')) return Icons.toys_rounded;
    if (name.contains('auto') || name.contains('car')) return Icons.directions_car_filled_rounded;
    if (name.contains('health')) return Icons.favorite_rounded;
    if (name.contains('pet')) return Icons.pets_rounded;
    if (name.contains('garden')) return Icons.local_florist_rounded;
    
    return Icons.category_rounded;
  }

  @override
  Widget build(BuildContext context) {
    final gradient = _getCategoryGradient();

    return GestureDetector(
      onTapDown: (_) {
        setState(() => _isPressed = true);
        _hoverController.forward();
      },
      onTapUp: (_) {
        setState(() => _isPressed = false);
        _hoverController.reverse();
      },
      onTapCancel: () {
        setState(() => _isPressed = false);
        _hoverController.reverse();
      },
      onTap: () {
        HapticFeedback.lightImpact();
        Navigator.push(
          context,
          PageRouteBuilder(
            pageBuilder: (context, animation, secondaryAnimation) =>
                CategoryProductsScreen(
              category: widget.category,
              categoryName: widget.category.name,
              categoryId: widget.category.id,
              categoryImage: widget.category.icon,
              categoryDescription: widget.category.description,
            ),
            transitionsBuilder: (context, animation, secondaryAnimation, child) {
              const begin = Offset(1.0, 0.0);
              const end = Offset.zero;
              const curve = Curves.easeInOutCubic;
              var tween = Tween(begin: begin, end: end).chain(
                CurveTween(curve: curve),
              );
              return SlideTransition(
                position: animation.drive(tween),
                child: child,
              );
            },
            transitionDuration: const Duration(milliseconds: 400),
          ),
        );
      },
      child: AnimatedScale(
        scale: _isPressed ? 0.96 : 1.0,
        duration: const Duration(milliseconds: 150),
        curve: Curves.easeOut,
        child: AnimatedBuilder(
          animation: _hoverController,
          builder: (context, child) {
            return Container(
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(20),
                boxShadow: [
                  BoxShadow(
                    color: gradient[0].withOpacity(
                      _isPressed ? 0.25 : 0.15,
                    ),
                    blurRadius: _isPressed ? 16 : 24,
                    offset: Offset(0, _isPressed ? 4 : 8),
                    spreadRadius: _isPressed ? -2 : 0,
                  ),
                ],
              ),
              child: ClipRRect(
                borderRadius: BorderRadius.circular(20),
                child: BackdropFilter(
                  filter: ImageFilter.blur(sigmaX: 10, sigmaY: 10),
                  child: Container(
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(20),
                      border: Border.all(
                        color: gradient[0].withOpacity(0.1),
                        width: 1.5,
                      ),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        // Icon Section
                        Expanded(
                          flex: 3,
                          child: Container(
                            margin: const EdgeInsets.all(14),
                            decoration: BoxDecoration(
                              gradient: LinearGradient(
                                begin: Alignment.topLeft,
                                end: Alignment.bottomRight,
                                colors: gradient,
                              ),
                              borderRadius: BorderRadius.circular(16),
                              boxShadow: [
                                BoxShadow(
                                  color: gradient[0].withOpacity(0.3),
                                  blurRadius: 12,
                                  offset: const Offset(0, 4),
                                ),
                              ],
                            ),
                            child: Center(
                              child: Icon(
                                _getCategoryIcon(),
                                color: Colors.white,
                                size: 36,
                              ),
                            ),
                          ),
                        ),

                        // Text Section
                        Expanded(
                          flex: 2,
                          child: Padding(
                            padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                Text(
                                  widget.category.name,
                                  style: const TextStyle(
                                    fontSize: 16,
                                    fontWeight: FontWeight.w700,
                                    color: Color(0xFF0F172A),
                                    letterSpacing: -0.3,
                                    height: 1.2,
                                  ),
                                  maxLines: 2,
                                  overflow: TextOverflow.ellipsis,
                                ),
                                if (widget.category.description != null &&
                                    widget.category.description!.isNotEmpty) ...[
                                  const SizedBox(height: 4),
                                  Text(
                                    widget.category.description!,
                                    style: const TextStyle(
                                      fontSize: 12,
                                      color: Color(0xFF64748B),
                                      fontWeight: FontWeight.w400,
                                      height: 1.4,
                                      letterSpacing: 0.1,
                                    ),
                                    maxLines: 2,
                                    overflow: TextOverflow.ellipsis,
                                  ),
                                ],
                              ],
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            );
          },
        ),
      ),
    );
 Syncing files to device Linux...                                   122ms

Flutter run key commands.
r Hot reload. 🔥🔥🔥
R Hot restart.
h List all available interactive commands.
d Detach (terminate "flutter run" but leave application running).
c Clear the screen
q Quit (terminate the application on the device).

A Dart VM Service on Linux is available at: http://127.0.0.1:39143/ZhzELQycbm4=/
flutter: [API] Fetching home feed (attempt 1, timeout 35s)
flutter: [API] Fetching: https://egura.rw/api/categories
flutter: [API] Fetching page 1: https://egura.rw/api/products?page=1&limit=12
The Flutter DevTools debugger and profiler on Linux is available at:
http://127.0.0.1:9100?uri=http://127.0.0.1:39143/ZhzELQycbm4=/
flutter: [API] Response: 200 (49114 bytes)
flutter: [API] Categories: 200
flutter: [API] Fetching products for category: kids-baby

lib/screens/home_screen.dart:551:41: Error: The method 'CategoryProductsScreen' isn't defined for the class
'_HomeScreenState'.
 - '_HomeScreenState' is from 'package:egura_app/screens/home_screen.dart' ('lib/screens/home_screen.dart').
Try correcting the name to the name of an existing method, or defining a method named 'CategoryProductsScreen'.
                        builder: (_) => CategoryProductsScreen(category: cat),
                                        ^^^^^^^^^^^^^^^^^^^^^^
lib/screens/categories_screen.dart:335:35: Error: The method 'CategoryProductsScreen' isn't defined for the class
'_CategoryCardState'.
 - '_CategoryCardState' is from 'package:egura_app/screens/categories_screen.dart'
 ('lib/screens/categories_screen.dart').
Try correcting the name to the name of an existing method, or defining a method named 'CategoryProductsScreen'.
            builder: (context) => CategoryProductsScreen(
                                  ^^^^^^^^^^^^^^^^^^^^^^
lib/screens/category_products_screen.dart:517:17: Error: The method 'CategoryProductsScreen' isn't defined for the
class '_CategoryCardState'.
 - '_CategoryCardState' is from 'package:egura_app/screens/category_products_screen.dart'
 ('lib/screens/category_products_screen.dart').
Try correcting the name to the name of an existing method, or defining a method named 'CategoryProductsScreen'.
                CategoryProductsScreen(
                ^^^^^^^^^^^^^^^^^^^^^^
Performing hot restart...                                               
Restarted application in 898ms.
Try again after fixing the above error(s). }
}