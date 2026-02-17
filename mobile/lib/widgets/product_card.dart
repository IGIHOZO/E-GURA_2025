import 'dart:io';
import 'package:flutter/material.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:shimmer/shimmer.dart';
import '../config/api_config.dart';
import '../config/theme.dart';
import '../models/product.dart';
// import '../services/image_cache_service.dart';

class ProductCard extends StatelessWidget {
  final Product product;
  final VoidCallback? onTap;
  final int animationIndex;
  final bool isFlashDeal;

  const ProductCard({
    super.key,
    required this.product,
    this.onTap,
    this.animationIndex = 0,
    this.isFlashDeal = false,
  });

  @override
  Widget build(BuildContext context) {
    return TweenAnimationBuilder<double>(
      tween: Tween(begin: 0.0, end: 1.0),
      duration: Duration(milliseconds: 400 + (animationIndex * 50)),
      curve: Curves.easeOutCubic,
      builder: (context, value, child) {
        return Opacity(
          opacity: value,
          child: Transform.translate(
            offset: Offset(0, 20 * (1 - value)),
            child: child,
          ),
        );
      },
      child: GestureDetector(
        onTap: onTap,
        child: Container(
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: Colors.grey[100]!),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              _buildImage(),
              _buildInfo(),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildImage() {
    final imageUrl = product.mainImage != null
        ? ApiConfig.imageUrl(product.mainImage!)
        : null;

    return Stack(
      children: [
        ClipRRect(
          borderRadius: const BorderRadius.vertical(top: Radius.circular(12)),
          child: AspectRatio(
            aspectRatio: 1.0,
            child: imageUrl != null
                ? CachedNetworkImage(
                    imageUrl: imageUrl,
                    fit: BoxFit.cover,
                    placeholder: (_, __) => Shimmer.fromColors(
                      baseColor: const Color(0xFFF5F5F5),
                      highlightColor: const Color(0xFFE0E0E0),
                      child: Container(color: Colors.white),
                    ),
                    errorWidget: (_, __, ___) => Container(
                      color: Colors.grey[100],
                      child: const Icon(Icons.image, size: 80, color: Colors.grey),
                    ),
                  )
                : Container(
                    color: Colors.grey[100],
                    child: const Icon(Icons.image, size: 80, color: Colors.grey),
                  ),
          ),
        ),
        // Discount badge — green for flash deals, red otherwise
        if (product.hasDiscount)
          Positioned(
            top: 8,
            left: 8,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  colors: isFlashDeal
                      ? [const Color(0xFF10B981), const Color(0xFF059669)]
                      : [const Color(0xFFEF4444), const Color(0xFFDC2626)],
                ),
                borderRadius: BorderRadius.circular(20),
              ),
              child: Text(
                '-${product.discountPercentage}% OFF',
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 10,
                  fontWeight: FontWeight.w700,
                ),
              ),
            ),
          ),
        // Featured badge
        if (product.isFeatured && !product.hasDiscount)
          Positioned(
            top: 8,
            left: 8,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
              decoration: BoxDecoration(
                color: AppTheme.primaryColor,
                borderRadius: BorderRadius.circular(20),
              ),
              child: const Text(
                'Featured',
                style: TextStyle(
                  color: Colors.white,
                  fontSize: 10,
                  fontWeight: FontWeight.w700,
                ),
              ),
            ),
          ),
        // Wishlist heart button
        Positioned(
          top: 8,
          right: 8,
          child: Container(
            padding: const EdgeInsets.all(6),
            decoration: BoxDecoration(
              color: Colors.white,
              shape: BoxShape.circle,
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withOpacity(0.1),
                  blurRadius: 4,
                ),
              ],
            ),
            child: Icon(
              Icons.favorite_border,
              size: 16,
              color: Colors.grey[600],
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildInfo() {
    return Expanded(
      child: Padding(
        padding: const EdgeInsets.fromLTRB(8, 6, 8, 8),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              product.name,
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
              style: const TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.w500,
                height: 1.2,
                color: Color(0xFF1A1A2E),
              ),
            ),
            const SizedBox(height: 4),
            // Stars row
            Row(
              children: [
                ...List.generate(5, (i) {
                  final rating = product.averageRating ?? 0;
                  return Icon(
                    i < rating.floor() ? Icons.star : Icons.star_border,
                    size: 11,
                    color: i < rating.floor()
                        ? AppTheme.starColor
                        : Colors.grey[300],
                  );
                }),
                if ((product.totalReviews ?? 0) > 0) ...[
                  const SizedBox(width: 3),
                  Text(
                    '(${product.totalReviews})',
                    style: TextStyle(fontSize: 9, color: Colors.grey[500]),
                  ),
                ],
              ],
            ),
            const Spacer(),
            // Price row — matches web: price in red/green, RWF separate
            if (isFlashDeal) ...[
              Row(
                crossAxisAlignment: CrossAxisAlignment.baseline,
                textBaseline: TextBaseline.alphabetic,
                children: [
                  Flexible(
                    child: Text(
                      Product.formatNumber(product.flashDealPrice),
                      style: const TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.w900,
                        color: Color(0xFF059669),
                      ),
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                  const SizedBox(width: 2),
                  const Text(
                    'RWF',
                    style: TextStyle(fontSize: 9, color: Color(0xFF1A1A2E)),
                  ),
                ],
              ),
              Text(
                '${Product.formatNumber(product.price)} RWF',
                style: TextStyle(
                  fontSize: 10,
                  color: Colors.grey[400],
                  decoration: TextDecoration.lineThrough,
                ),
              ),
              const SizedBox(height: 2),
              Text(
                'Save ${product.formattedSavings}',
                style: const TextStyle(
                  fontSize: 9,
                  fontWeight: FontWeight.w700,
                  color: Color(0xFF059669),
                ),
              ),
            ] else ...[
              Row(
                crossAxisAlignment: CrossAxisAlignment.baseline,
                textBaseline: TextBaseline.alphabetic,
                children: [
                  Flexible(
                    child: Text(
                      Product.formatNumber(product.price),
                      style: const TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.w800,
                        color: Color(0xFFDC2626),
                      ),
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                  const SizedBox(width: 2),
                  const Text(
                    'RWF',
                    style: TextStyle(fontSize: 9, color: Color(0xFF1A1A2E)),
                  ),
                ],
              ),
              const SizedBox(height: 2),
              if (product.hasDiscount)
                Text(
                  '-${product.discountPercentage}%',
                  style: const TextStyle(
                    fontSize: 9,
                    fontWeight: FontWeight.w700,
                    color: Color(0xFFDC2626),
                  ),
                )
              else
                Text(
                  'Free shipping',
                  style: TextStyle(
                    fontSize: 9,
                    fontWeight: FontWeight.w500,
                    color: Colors.green[600],
                  ),
                ),
            ],
          ],
        ),
      ),
    );
  }
}
