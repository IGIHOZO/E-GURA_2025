import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:shimmer/shimmer.dart';
import 'package:share_plus/share_plus.dart';
import '../config/api_config.dart';
import '../config/theme.dart';
import '../models/product.dart';
import '../services/api_service.dart';
import '../providers/cart_provider.dart';

class ProductDetailScreen extends StatefulWidget {
  final String productId;

  const ProductDetailScreen({super.key, required this.productId});

  @override
  State<ProductDetailScreen> createState() => _ProductDetailScreenState();
}

class _ProductDetailScreenState extends State<ProductDetailScreen> {
  Product? _product;
  bool _loading = true;
  String? _error;
  int _currentImageIndex = 0;
  String? _selectedSize;
  String? _selectedColor;
  int _quantity = 1;
  bool _showSuccess = false;
  final GlobalKey _shareButtonKey = GlobalKey();

  static const Map<String, Color> _colorHexMap = {
    'Blue': Color(0xFF3B82F6),
    'Red': Color(0xFFEF4444),
    'Green': Color(0xFF10B981),
    'Yellow': Color(0xFFF59E0B),
    'Black': Color(0xFF111827),
    'White': Color(0xFFF9FAFB),
    'Purple': Color(0xFF8B5CF6),
    'Orange': Color(0xFFF97316),
    'Pink': Color(0xFFEC4899),
    'Brown': Color(0xFF92400E),
    'Gray': Color(0xFF6B7280),
    'Navy': Color(0xFF1E3A8A),
    'Beige': Color(0xFFF5F5DC),
    'Silver': Color(0xFFC0C0C0),
    'Gold': Color(0xFFFFD700),
  };

  @override
  void initState() {
    super.initState();
    _loadProduct();
  }

  Future<void> _loadProduct() async {
    setState(() { _loading = true; _error = null; });
    try {
      _product = await ApiService().getProductDetail(widget.productId);
    } catch (e) {
      _error = 'Failed to load product details.';
    }
    if (mounted) setState(() => _loading = false);
  }

  List<String> get _allImages {
    final images = <String>[];
    if (_product?.mainImage != null) images.add(_product!.mainImage!);
    if (_product?.images != null) {
      for (final img in _product!.images!) {
        if (!images.contains(img)) images.add(img);
      }
    }
    return images;
  }

  Future<void> _shareProduct() async {
    if (_product == null) return;

    final productName = _product!.name;
    final productPrice = _product!.price;
    final productUrl = '${ApiConfig.baseUrl}/products/${_product!.id}';
    
    final shareText = 'Check out this amazing product: $productName\n'
        'Price: RWF ${productPrice.toStringAsFixed(0)}\n'
        'View here: $productUrl';

    try {
      // Get the position of the share button
      final RenderBox? shareButton = _shareButtonKey.currentContext?.findRenderObject() as RenderBox?;
      Rect? sharePositionOrigin;
      
      if (shareButton != null) {
        final offset = shareButton.localToGlobal(Offset.zero);
        sharePositionOrigin = Rect.fromLTWH(
          offset.dx,
          offset.dy,
          shareButton.size.width,
          shareButton.size.height,
        );
      }

      await Share.share(
        shareText,
        subject: productName,
        sharePositionOrigin: sharePositionOrigin,
      );
    } catch (e) {
      debugPrint('Share error: $e');
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      body: _loading
          ? _buildLoadingState()
          : _error != null
              ? _buildErrorState()
              : _buildProductDetail(),
      bottomNavigationBar: _product != null && !_loading ? _buildBottomBar() : null,
    );
  }

  Widget _buildLoadingState() {
    return SafeArea(
      child: Column(
        children: [
          _buildBackButton(),
          Shimmer.fromColors(
            baseColor: Colors.grey[300]!,
            highlightColor: Colors.grey[100]!,
            child: Column(
              children: [
                Container(height: 300, color: Colors.white),
                Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Container(height: 20, width: double.infinity, color: Colors.white),
                      const SizedBox(height: 10),
                      Container(height: 20, width: 200, color: Colors.white),
                      const SizedBox(height: 16),
                      Container(height: 28, width: 120, color: Colors.white),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildErrorState() {
    return SafeArea(
      child: Column(
        children: [
          _buildBackButton(),
          Expanded(
            child: Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Icon(Icons.error_outline, size: 64, color: Colors.grey),
                  const SizedBox(height: 16),
                  Text(_error!, style: const TextStyle(color: AppTheme.textSecondary)),
                  const SizedBox(height: 16),
                  ElevatedButton.icon(
                    onPressed: _loadProduct,
                    icon: const Icon(Icons.refresh),
                    label: const Text('Retry'),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildBackButton() {
    return Align(
      alignment: Alignment.centerLeft,
      child: Padding(
        padding: const EdgeInsets.all(8),
        child: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () => Navigator.pop(context),
        ),
      ),
    );
  }

  Widget _buildProductDetail() {
    final product = _product!;
    final images = _allImages;

    return CustomScrollView(
      slivers: [
        SliverAppBar(
          expandedHeight: 350,
          pinned: true,
          backgroundColor: Colors.white,
          leading: IconButton(
            icon: Container(
              padding: const EdgeInsets.all(6),
              decoration: BoxDecoration(
                color: Colors.white.withOpacity(0.9),
                shape: BoxShape.circle,
              ),
              child: const Icon(Icons.arrow_back, size: 20),
            ),
            onPressed: () => Navigator.pop(context),
          ),
          actions: [
            IconButton(
              key: _shareButtonKey,
              icon: Container(
                padding: const EdgeInsets.all(6),
                decoration: BoxDecoration(
                  color: Colors.white.withOpacity(0.9),
                  shape: BoxShape.circle,
                ),
                child: const Icon(Icons.share, size: 20),
              ),
              onPressed: () => _shareProduct(),
            ),
            IconButton(
              icon: Container(
                padding: const EdgeInsets.all(6),
                decoration: BoxDecoration(
                  color: Colors.white.withOpacity(0.9),
                  shape: BoxShape.circle,
                ),
                child: const Icon(Icons.favorite_border, size: 20),
              ),
              onPressed: () {},
            ),
          ],
          flexibleSpace: FlexibleSpaceBar(
            background: Stack(
              children: [
                PageView.builder(
                  itemCount: images.isEmpty ? 1 : images.length,
                  onPageChanged: (i) => setState(() => _currentImageIndex = i),
                  itemBuilder: (context, index) {
                    if (images.isEmpty) {
                      return Container(
                        color: Colors.grey[100],
                        child: const Icon(Icons.image, size: 80, color: Colors.grey),
                      );
                    }
                    return CachedNetworkImage(
                      imageUrl: ApiConfig.imageUrl(images[index]),
                      fit: BoxFit.contain,
                      placeholder: (_, __) => Shimmer.fromColors(
                        baseColor: Colors.grey[300]!,
                        highlightColor: Colors.grey[100]!,
                        child: Container(color: Colors.white),
                      ),
                      errorWidget: (_, __, ___) => Container(
                        color: Colors.grey[100],
                        child: const Icon(Icons.broken_image, size: 60, color: Colors.grey),
                      ),
                    );
                  },
                ),
                if (images.length > 1)
                  Positioned(
                    bottom: 16,
                    left: 0,
                    right: 0,
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: List.generate(images.length, (i) {
                        return AnimatedContainer(
                          duration: const Duration(milliseconds: 200),
                          width: i == _currentImageIndex ? 20 : 8,
                          height: 8,
                          margin: const EdgeInsets.symmetric(horizontal: 3),
                          decoration: BoxDecoration(
                            color: i == _currentImageIndex
                                ? AppTheme.primaryColor
                                : Colors.grey[300],
                            borderRadius: BorderRadius.circular(4),
                          ),
                        );
                      }),
                    ),
                  ),
                if (product.hasDiscount)
                  Positioned(
                    top: 100,
                    left: 16,
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                      decoration: BoxDecoration(
                        gradient: const LinearGradient(
                          colors: [Color(0xFFFF3D00), Color(0xFFFF6B00)],
                        ),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Text(
                        '-${product.discountPercentage}% OFF',
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 14,
                          fontWeight: FontWeight.w800,
                        ),
                      ),
                    ),
                  ),
              ],
            ),
          ),
        ),
        SliverToBoxAdapter(
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Badges row — matches web
                Wrap(
                  spacing: 8,
                  children: [
                    if (product.isNew)
                      _badge('NEW', const Color(0xFF3B82F6)),
                    if (product.isSale)
                      _badge('SALE', const Color(0xFFEF4444)),
                    _badge(
                      product.stockStatus,
                      product.stockStatus == 'In Stock'
                          ? const Color(0xFF10B981)
                          : product.stockStatus == 'Low Stock'
                              ? const Color(0xFFF59E0B)
                              : const Color(0xFFEF4444),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                // Title
                Text(
                  product.name,
                  style: const TextStyle(
                    fontSize: 22,
                    fontWeight: FontWeight.w800,
                    height: 1.3,
                    color: Color(0xFF1A1A2E),
                  ),
                ),
                const SizedBox(height: 8),
                // Brand
                Text(
                  'Brand: ${product.brand ?? 'E-Gura Store'}',
                  style: TextStyle(fontSize: 14, color: Colors.grey[600]),
                ),
                const SizedBox(height: 10),
                // Rating row
                Row(
                  children: [
                    ...List.generate(5, (i) {
                      final r = product.averageRating ?? 4.5;
                      return Icon(
                        i < r.floor() ? Icons.star : Icons.star_border,
                        size: 18,
                        color: i < r.floor() ? AppTheme.starColor : Colors.grey[300],
                      );
                    }),
                    const SizedBox(width: 8),
                    Text(
                      '(${product.totalReviews ?? 0} reviews)',
                      style: TextStyle(fontSize: 13, color: Colors.grey[600]),
                    ),
                  ],
                ),
                const SizedBox(height: 16),
                // Price
                Row(
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: [
                    Text(
                      Product.formatNumber(product.price),
                      style: const TextStyle(
                        fontSize: 28,
                        fontWeight: FontWeight.w900,
                        color: Color(0xFFDC2626),
                      ),
                    ),
                    const SizedBox(width: 4),
                    const Padding(
                      padding: EdgeInsets.only(bottom: 4),
                      child: Text('RWF',
                          style: TextStyle(
                              fontSize: 14,
                              fontWeight: FontWeight.w700,
                              color: Color(0xFF1A1A2E))),
                    ),
                    if (product.hasDiscount && product.originalPrice != null) ...[
                      const SizedBox(width: 12),
                      Padding(
                        padding: const EdgeInsets.only(bottom: 4),
                        child: Text(
                          product.formattedOriginalPrice,
                          style: TextStyle(
                            fontSize: 16,
                            color: Colors.grey[400],
                            decoration: TextDecoration.lineThrough,
                          ),
                        ),
                      ),
                    ],
                  ],
                ),
                const SizedBox(height: 20),
                const Divider(),
                // Description
                const SizedBox(height: 12),
                const Text('Description',
                    style: TextStyle(
                        fontSize: 16, fontWeight: FontWeight.w700)),
                const SizedBox(height: 8),
                Text(
                  product.description ??
                      product.shortDescription ??
                      'A beautiful ${product.category?.toLowerCase() ?? ''} product from E-Gura Store. Made with premium materials.',
                  style: TextStyle(
                    fontSize: 14,
                    color: Colors.grey[700],
                    height: 1.6,
                  ),
                ),
                // Sizes
                if (product.sizes != null && product.sizes!.isNotEmpty) ...[
                  const SizedBox(height: 20),
                  Row(
                    children: [
                      const Text('Size',
                          style: TextStyle(
                              fontSize: 16, fontWeight: FontWeight.w700)),
                      if (product.sizes!.isNotEmpty)
                        const Text(' *',
                            style: TextStyle(
                                color: Color(0xFFEF4444), fontSize: 16)),
                    ],
                  ),
                  const SizedBox(height: 10),
                  Wrap(
                    spacing: 10,
                    runSpacing: 10,
                    children: product.sizes!.map((size) {
                      final selected = _selectedSize == size;
                      return GestureDetector(
                        onTap: () =>
                            setState(() => _selectedSize = size),
                        child: Container(
                          padding: const EdgeInsets.symmetric(
                              horizontal: 20, vertical: 12),
                          decoration: BoxDecoration(
                            color: selected
                                ? const Color(0xFF7C3AED)
                                : Colors.white,
                            border: Border.all(
                              color: selected
                                  ? const Color(0xFF7C3AED)
                                  : Colors.grey[300]!,
                              width: 2,
                            ),
                            borderRadius: BorderRadius.circular(10),
                          ),
                          child: Text(
                            size,
                            style: TextStyle(
                              fontWeight: FontWeight.w600,
                              color: selected
                                  ? Colors.white
                                  : Colors.grey[700],
                            ),
                          ),
                        ),
                      );
                    }).toList(),
                  ),
                ],
                // Colors — with hex color circles like web
                if (product.colors != null &&
                    product.colors!.isNotEmpty) ...[
                  const SizedBox(height: 20),
                  const Text('Color',
                      style: TextStyle(
                          fontSize: 16, fontWeight: FontWeight.w700)),
                  const SizedBox(height: 10),
                  Wrap(
                    spacing: 10,
                    runSpacing: 10,
                    children: product.colors!.map((color) {
                      final selected = _selectedColor == color;
                      final hex =
                          _colorHexMap[color] ?? const Color(0xFF6B7280);
                      return GestureDetector(
                        onTap: () =>
                            setState(() => _selectedColor = color),
                        child: Container(
                          padding: const EdgeInsets.symmetric(
                              horizontal: 14, vertical: 10),
                          decoration: BoxDecoration(
                            color: selected
                                ? const Color(0xFF7C3AED)
                                : Colors.white,
                            border: Border.all(
                              color: selected
                                  ? const Color(0xFF7C3AED)
                                  : Colors.grey[300]!,
                              width: 2,
                            ),
                            borderRadius: BorderRadius.circular(10),
                          ),
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Container(
                                width: 16,
                                height: 16,
                                decoration: BoxDecoration(
                                  color: hex,
                                  shape: BoxShape.circle,
                                  border: Border.all(
                                      color: Colors.grey[300]!),
                                ),
                              ),
                              const SizedBox(width: 8),
                              Text(
                                color,
                                style: TextStyle(
                                  fontWeight: FontWeight.w600,
                                  color: selected
                                      ? Colors.white
                                      : Colors.grey[700],
                                ),
                              ),
                            ],
                          ),
                        ),
                      );
                    }).toList(),
                  ),
                ],
                // Quantity
                const SizedBox(height: 20),
                const Text('Quantity',
                    style: TextStyle(
                        fontSize: 16, fontWeight: FontWeight.w700)),
                const SizedBox(height: 10),
                Row(
                  children: [
                    _qtyButton(Icons.remove, () {
                      if (_quantity > 1) {
                        setState(() => _quantity--);
                      }
                    }),
                    Padding(
                      padding:
                          const EdgeInsets.symmetric(horizontal: 20),
                      child: Text(
                        '$_quantity',
                        style: const TextStyle(
                            fontSize: 18, fontWeight: FontWeight.w600),
                      ),
                    ),
                    _qtyButton(Icons.add, () {
                      final max = product.stockQuantity ?? 10;
                      if (_quantity < max) {
                        setState(() => _quantity++);
                      }
                    }),
                    const SizedBox(width: 16),
                    Text(
                      '${product.stockQuantity ?? 0} available',
                      style: TextStyle(
                          fontSize: 13, color: Colors.grey[600]),
                    ),
                  ],
                ),
                const SizedBox(height: 24),
                const Divider(),
                const SizedBox(height: 12),
                _buildInfoRow(Icons.local_shipping_outlined,
                    'Free delivery on orders above 10,000 RWF'),
                _buildInfoRow(Icons.verified_user_outlined,
                    'Authentic product guaranteed'),
                _buildInfoRow(
                    Icons.replay, '7-day easy return policy'),
                const SizedBox(height: 40),
              ],
            ),
          ),
        ),
      ],
    );
  }

  Widget _badge(String text, Color color) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 5),
      decoration: BoxDecoration(
        color: color,
        borderRadius: BorderRadius.circular(20),
      ),
      child: Text(
        text,
        style: const TextStyle(
          color: Colors.white,
          fontSize: 12,
          fontWeight: FontWeight.w700,
        ),
      ),
    );
  }

  Widget _qtyButton(IconData icon, VoidCallback onPressed) {
    return GestureDetector(
      onTap: onPressed,
      child: Container(
        width: 40,
        height: 40,
        decoration: BoxDecoration(
          border: Border.all(color: Colors.grey[300]!),
          borderRadius: BorderRadius.circular(10),
        ),
        child: Icon(icon, size: 20, color: Colors.grey[700]),
      ),
    );
  }

  Widget _buildInfoRow(IconData icon, String text) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 6),
      child: Row(
        children: [
          Icon(icon, size: 20, color: AppTheme.successColor),
          const SizedBox(width: 10),
          Expanded(
            child: Text(text,
                style: TextStyle(fontSize: 13, color: Colors.grey[600])),
          ),
        ],
      ),
    );
  }

  bool _validateSizeSelection() {
    if (_product!.sizes != null &&
        _product!.sizes!.isNotEmpty &&
        _selectedSize == null) {
      _showSizeSelectionDialog();
      return false;
    }
    return true;
  }

  void _showSizeSelectionDialog() {
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (BuildContext context) {
        return AlertDialog(
          title: const Text(
            'Size Required',
            style: TextStyle(
              fontWeight: FontWeight.bold,
              color: Color(0xFF1A1A1A),
            ),
          ),
          content: const Text(
            'Please select a size before proceeding.',
            style: TextStyle(
              fontSize: 16,
              color: Color(0xFF666666),
            ),
          ),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(16),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.of(context).pop(),
              child: const Text(
                'OK',
                style: TextStyle(
                  color: Color(0xFF7C3AED),
                  fontWeight: FontWeight.w600,
                ),
              ),
            ),
          ],
        );
      },
    );
  }

  void _handleAddToCart() {
    if (!_validateSizeSelection()) return;
    
    final cart = context.read<CartProvider>();
    cart.addToCart(
      _product!,
      size: _selectedSize,
      color: _selectedColor,
      quantity: _quantity,
    );
    setState(() => _showSuccess = true);
    Future.delayed(const Duration(seconds: 2), () {
      if (mounted) setState(() => _showSuccess = false);
    });
  }

  Widget _buildBottomBar() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 10,
            offset: const Offset(0, -2),
          ),
        ],
      ),
      child: SafeArea(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            if (_showSuccess)
              Container(
                width: double.infinity,
                margin: const EdgeInsets.only(bottom: 10),
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: const Color(0xFFF0FDF4),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: const Color(0xFF10B981)),
                ),
                child: Row(
                  children: const [
                    Icon(Icons.check_circle,
                        color: Color(0xFF10B981), size: 20),
                    SizedBox(width: 8),
                    Text(
                      'Successfully added to cart!',
                      style: TextStyle(
                        color: Color(0xFF10B981),
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ],
                ),
              ),
            Row(
              children: [
                Expanded(
                  child: ElevatedButton.icon(
                    onPressed: _handleAddToCart,
                    icon: const Icon(Icons.shopping_bag_outlined, size: 20),
                    label: const Text('Add to Cart'),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFF7C3AED),
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(vertical: 16),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                    ),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: ElevatedButton(
                    onPressed: () {
                      if (!_validateSizeSelection()) return;
                      _handleAddToCart();
                      // Navigate to checkout
                      if (mounted) {
                        Navigator.of(context).pushNamed('/checkout');
                      }
                    },
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFF059669),
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(vertical: 16),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                    ),
                    child: const Text('Buy Now',
                        style: TextStyle(fontWeight: FontWeight.w700)),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
