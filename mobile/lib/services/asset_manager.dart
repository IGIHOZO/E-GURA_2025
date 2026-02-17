import 'package:flutter/services.dart';
import 'package:flutter/foundation.dart';

class AssetManager {
  static const String _logoPath = 'assets/images/logo.jpeg';
  
  static Future<void> preloadAssets() async {
    try {
      // Preload critical assets to avoid AssetManifest.bin issues
      await rootBundle.loadString('AssetManifest.json');
      debugPrint('[AssetManager] Assets preloaded successfully');
    } catch (e) {
      debugPrint('[AssetManager] Asset preloading failed: $e');
      // Silently continue - this prevents console spam
    }
  }
  
  static String getLogoPath() {
    return _logoPath;
  }
}
