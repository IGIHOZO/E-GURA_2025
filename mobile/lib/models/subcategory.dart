import 'package:flutter/material.dart';

class Subcategory {
  final String id;
  final String name;
  final String categoryId;
  final String? description;
  final String? icon;
  final int productCount;

  Subcategory({
    required this.id,
    required this.name,
    required this.categoryId,
    this.description,
    this.icon,
    this.productCount = 0,
  });

  factory Subcategory.fromJson(Map<String, dynamic> json) {
    return Subcategory(
      id: json['id']?.toString() ?? '',
      name: json['name']?.toString() ?? '',
      categoryId: json['categoryId']?.toString() ?? '',
      description: json['description']?.toString(),
      icon: json['icon']?.toString(),
      productCount: json['productCount'] is int
          ? json['productCount']
          : int.tryParse(json['productCount']?.toString() ?? '0') ?? 0,
    );
  }

  IconData get materialIcon {
    switch (id.toLowerCase()) {
      case 'dresses':
        return Icons.dry_cleaning;
      case 'tops':
        return Icons.checkroom;
      case 'bottoms':
        return Icons.style;
      case 'shoes':
        return Icons.ice_skating;
      case 'accessories':
        return Icons.watch;
      case 'electronics':
        return Icons.devices;
      case 'phones':
        return Icons.smartphone;
      case 'laptops':
        return Icons.laptop;
      case 'gaming':
        return Icons.sports_esports;
      case 'home':
        return Icons.home_outlined;
      case 'furniture':
        return Icons.chair;
      case 'kitchen':
        return Icons.kitchen;
      case 'books':
        return Icons.menu_book;
      case 'media':
        return Icons.play_circle;
      case 'toys':
        return Icons.toys;
      case 'games':
        return Icons.videogame_asset;
      case 'beauty':
        return Icons.face_retouching_natural;
      case 'health':
        return Icons.health_and_safety;
      case 'sports':
        return Icons.sports_soccer;
      case 'outdoor':
        return Icons.local_florist;
      case 'automotive':
        return Icons.directions_car;
      case 'pet':
        return Icons.pets;
      default:
        return Icons.category;
    }
  }
}
