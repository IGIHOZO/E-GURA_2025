import 'package:flutter/material.dart';

class Category {
  final String id;
  final String name;
  final String icon;
  final String? description;
  final int subcategoryCount;

  Category({
    required this.id,
    required this.name,
    required this.icon,
    this.description,
    this.subcategoryCount = 0,
  });

  factory Category.fromJson(Map<String, dynamic> json) {
    return Category(
      id: json['id']?.toString() ?? '',
      name: json['name']?.toString() ?? '',
      icon: json['icon']?.toString() ?? '📦',
      description: json['description']?.toString(),
      subcategoryCount: json['subcategoryCount'] is int
          ? json['subcategoryCount']
          : int.tryParse(json['subcategoryCount']?.toString() ?? '0') ?? 0,
    );
  }

  IconData get materialIcon {
    switch (id) {
      case 'womens-fashion':
        return Icons.checkroom;
      case 'mens-fashion':
        return Icons.dry_cleaning;
      case 'kids-baby':
        return Icons.child_care;
      case 'shoes-footwear':
        return Icons.ice_skating;
      case 'bags-accessories':
        return Icons.shopping_bag_outlined;
      case 'jewelry-watches':
        return Icons.watch;
      case 'beauty-personal-care':
        return Icons.face_retouching_natural;
      case 'sports-outdoor':
        return Icons.sports_soccer;
      case 'home-living':
        return Icons.home_outlined;
      case 'traditional-cultural':
        return Icons.diversity_3;
      case 'special-occasions':
        return Icons.celebration;
      case 'custom-tailored':
        return Icons.content_cut;
      case 'electronics':
        return Icons.devices;
      case 'books-media':
        return Icons.menu_book;
      case 'toys-games':
        return Icons.sports_esports;
      case 'health-wellness':
        return Icons.health_and_safety;
      case 'automotive':
        return Icons.directions_car;
      case 'pet-supplies':
        return Icons.pets;
      case 'office-stationery':
        return Icons.edit_note;
      default:
        return Icons.category;
    }
  }
}
