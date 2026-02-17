import 'package:flutter/material.dart';
import '../models/product.dart';
import '../services/prefetch_service.dart';

class OptimisticUI {
  // Instant like animation without API call
  static void likeProduct(Product product, Function(bool) onSuccess) {
    // Update UI immediately
    onSuccess(true);
    
    // Sync in background
    _syncLikeStatus(product.id, true).catchError((e) {
      // Rollback on error
      onSuccess(false);
    });
  }
  
  // Instant cart add with price from cache
  static Future<bool> addToCart(Product product, int quantity) async {
    // Use cached price for instant response
    final cachedPrice = PrefetchService.getCachedPrice(product.id);
    final displayPrice = cachedPrice ?? product.price;
    
    // Show instant feedback
    return true;
  }
  
  // Background sync for like status
  static Future<void> _syncLikeStatus(String productId, bool isLiked) async {
    try {
      // Simulate API call
      await Future.delayed(const Duration(milliseconds: 500));
      // In real app, this would be actual API call
    } catch (e) {
      debugPrint('[OptimisticUI] Sync failed: $e');
    }
  }
  
  // Instant favorite toggle with animation
  static void toggleFavorite(Product product, Function(bool) onToggle) {
    onToggle(!product.isFavorite);
    
    // Background sync
    _syncFavoriteStatus(product.id, !product.isFavorite).catchError((e) {
      // Rollback on error
      onToggle(product.isFavorite);
    });
  }
  
  // Background sync for favorite status
  static Future<void> _syncFavoriteStatus(String productId, bool isFavorite) async {
    try {
      await Future.delayed(const Duration(milliseconds: 300));
      // Real API call here
    } catch (e) {
      debugPrint('[OptimisticUI] Favorite sync failed: $e');
    }
  }
}
