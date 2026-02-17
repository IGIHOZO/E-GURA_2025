import 'dart:async';
import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../services/api_aggregator.dart';

class BackgroundSync {
  static const String _syncKey = 'background_sync_queue';
  static const Duration _syncInterval = Duration(minutes: 5);
  static Timer? _syncTimer;
  static List<Map<String, dynamic>> _syncQueue = [];
  
  // Start background sync
  static void startSync() {
    _syncTimer?.cancel();
    _syncTimer = Timer.periodic(_syncInterval, (timer) {
      _processSyncQueue();
    });
    
    debugPrint('[BackgroundSync] Started background sync');
  }
  
  // Stop background sync
  static void stopSync() {
    _syncTimer?.cancel();
    debugPrint('[BackgroundSync] Stopped background sync');
  }
  
  // Add operation to sync queue
  static void addToSyncQueue({
    required String operation,
    required Map<String, dynamic> data,
    bool priority = false,
  }) {
    final syncItem = {
      'id': DateTime.now().millisecondsSinceEpoch.toString(),
      'operation': operation,
      'data': data,
      'priority': priority,
      'timestamp': DateTime.now().millisecondsSinceEpoch,
      'retryCount': 0,
    };
    
    if (priority) {
      _syncQueue.insert(0, syncItem);
    } else {
      _syncQueue.add(syncItem);
    }
    
    _saveSyncQueue();
    debugPrint('[BackgroundSync] Added to queue: $operation');
  }
  
  // Process sync queue
  static Future<void> _processSyncQueue() async {
    if (_syncQueue.isEmpty) return;
    
    // Load saved queue
    await _loadSyncQueue();
    
    final itemsToProcess = _syncQueue.take(5).toList(); // Process max 5 items per cycle
    _syncQueue = _syncQueue.skip(5).toList();
    
    debugPrint('[BackgroundSync] Processing ${itemsToProcess.length} items');
    
    for (final item in itemsToProcess) {
      try {
        await _syncItem(item);
        debugPrint('[BackgroundSync] Synced: ${item['operation']}');
      } catch (e) {
        debugPrint('[BackgroundSync] Sync failed: ${item['operation']} - $e');
        
        // Increment retry count
        item['retryCount'] = (item['retryCount'] ?? 0) + 1;
        
        // Re-queue if retry count < 3
        if (item['retryCount'] < 3) {
          _syncQueue.add(item);
        }
      }
    }
    
    await _saveSyncQueue();
  }
  
  // Sync individual item
  static Future<void> _syncItem(Map<String, dynamic> item) async {
    final operation = item['operation'] as String;
    final data = item['data'] as Map<String, dynamic>;
    
    switch (operation) {
      case 'like_product':
        await _syncLikeProduct(data);
        break;
      case 'add_to_cart':
        await _syncAddToCart(data);
        break;
      case 'update_profile':
        await _syncUpdateProfile(data);
        break;
      default:
        debugPrint('[BackgroundSync] Unknown operation: $operation');
    }
  }
  
  // Sync like product
  static Future<void> _syncLikeProduct(Map<String, dynamic> data) async {
    try {
      await APIAggregator.smartRequest(
        endpoint: 'products/${data['productId']}/like',
        data: {'liked': data['liked']},
      );
    } catch (e) {
      debugPrint('[BackgroundSync] Like sync failed: $e');
    }
  }
  
  // Sync add to cart
  static Future<void> _syncAddToCart(Map<String, dynamic> data) async {
    try {
      await APIAggregator.smartRequest(
        endpoint: 'cart/add',
        data: {
          'productId': data['productId'],
          'quantity': data['quantity'],
        },
      );
    } catch (e) {
      debugPrint('[BackgroundSync] Cart sync failed: $e');
    }
  }
  
  // Sync update profile
  static Future<void> _syncUpdateProfile(Map<String, dynamic> data) async {
    try {
      await APIAggregator.smartRequest(
        endpoint: 'profile/update',
        data: data,
      );
    } catch (e) {
      debugPrint('[BackgroundSync] Profile sync failed: $e');
    }
  }
  
  // Save sync queue
  static Future<void> _saveSyncQueue() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString(_syncKey, jsonEncode(_syncQueue));
    } catch (e) {
      debugPrint('[BackgroundSync] Save queue failed: $e');
    }
  }
  
  // Load sync queue
  static Future<void> _loadSyncQueue() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final queueJson = prefs.getString(_syncKey);
      
      if (queueJson != null) {
        final queueData = jsonDecode(queueJson) as List;
        _syncQueue = queueData.cast<Map<String, dynamic>>();
      }
    } catch (e) {
      debugPrint('[BackgroundSync] Load queue failed: $e');
    }
  }
  
  // Clear sync queue
  static Future<void> clearSyncQueue() async {
    _syncQueue.clear();
    await _saveSyncQueue();
    debugPrint('[BackgroundSync] Cleared sync queue');
  }
}
