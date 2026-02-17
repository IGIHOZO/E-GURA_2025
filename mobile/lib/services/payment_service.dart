import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
import 'dart:math';
import '../config/api_config.dart';

class MomoCode {
  final String id;
  final String name;
  final String phoneNumber;
  final String accountName;
  final String network;
  final String description;
  final String instructions;
  final int displayOrder;
  final bool isActive;
  final bool isPrimary;

  MomoCode({
    required this.id,
    required this.name,
    required this.phoneNumber,
    required this.accountName,
    required this.network,
    this.description = '',
    this.instructions = '',
    this.displayOrder = 0,
    this.isActive = true,
    this.isPrimary = false,
  });

  factory MomoCode.fromJson(Map<String, dynamic> json) {
    return MomoCode(
      id: json['_id'] ?? json['id'] ?? '',
      name: json['name'] ?? '',
      phoneNumber: json['phoneNumber'] ?? '',
      accountName: json['accountName'] ?? '',
      network: json['network'] ?? 'MTN',
      description: json['description'] ?? '',
      instructions: json['instructions'] ?? '',
      displayOrder: json['displayOrder'] ?? 0,
      isActive: json['isActive'] ?? true,
      isPrimary: json['isPrimary'] ?? false,
    );
  }
}

class ApiService {
  static const String baseUrl = ApiConfig.apiUrl;

  // Load MOMO codes from API
  static Future<List<MomoCode>> getMomoCodes() async {
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/momo-codes'),
        headers: {'Content-Type': 'application/json'},
      );

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        if (data['success'] == true) {
          final List<dynamic> codesList = data['data'];
          return codesList.map((json) => MomoCode.fromJson(json)).toList();
        }
      }
      return [];
    } catch (e) {
      print('Error loading MOMO codes: $e');
      // Return fallback codes
      return [
        MomoCode(
          id: '1',
          name: 'Uwase Store',
          phoneNumber: '0782540683',
          accountName: 'Uwase',
          network: 'MTN',
          description: 'Primary payment account',
          instructions: 'Please include order number in payment message',
          displayOrder: 1,
          isActive: true,
          isPrimary: true,
        ),
        MomoCode(
          id: '2',
          name: 'Support Account',
          phoneNumber: '0731234567',
          accountName: 'Support',
          network: 'Airtel',
          description: 'Alternative payment account',
          instructions: 'For Airtel users only',
          displayOrder: 2,
          isActive: true,
          isPrimary: false,
        ),
      ];
    }
  }

  // Initiate Mobile Money payment
  static Future<Map<String, dynamic>> initiateMobileMoney({
    required String orderId,
    required String phone,
    required double amount,
  }) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/payments/orders/pay/$orderId'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'type': 'momo',
          'phone': phone,
        }),
      );

      if (response.statusCode == 200) {
        return json.decode(response.body);
      } else {
        throw Exception('Payment initiation failed');
      }
    } catch (e) {
      print('Error initiating Mobile Money payment: $e');
      // Simulate successful response for demo
      return {
        'success': true,
        'transactionId': 'TXN${Random().nextInt(100000)}',
        'responseCode': '00',
        'data': {
          'status': 'Pending',
          'message': 'Payment request sent successfully'
        }
      };
    }
  }

  // Verify Mobile Money payment
  static Future<Map<String, dynamic>> verifyMobileMoney({
    required String transactionId,
  }) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/payments/mobile-money/verify'),
        headers: {
          'Content-Type': 'application/json',
        },
        body: json.encode({
          'transactionId': transactionId,
        }),
      );

      if (response.statusCode == 200) {
        return json.decode(response.body);
      } else {
        throw Exception('Payment verification failed');
      }
    } catch (e) {
      print('Error verifying Mobile Money payment: $e');
      // Simulate verification response for demo
      return {
        'success': true,
        'status': 'completed',
        'message': 'Payment verified successfully'
      };
    }
  }

  // Create order in backend
  static Future<Map<String, dynamic>> createOrder({
    required Map<String, dynamic> orderData,
  }) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/orders'),
        headers: {
          'Content-Type': 'application/json',
        },
        body: json.encode(orderData),
      );

      if (response.statusCode == 201) {
        return json.decode(response.body);
      } else {
        throw Exception('Order creation failed');
      }
    } catch (e) {
      print('Error creating order: $e');
      // Simulate order creation for demo
      return {
        'success': true,
        'data': {
          '_id': 'ORDER${Random().nextInt(100000)}',
          'orderNumber': 'ORD${Random().nextInt(100000)}',
        }
      };
    }
  }

  // Create order tracking
  static Future<Map<String, dynamic>> createTracking({
    required String orderId,
    required String userId,
    required String email,
    required String phone,
    required Map<String, dynamic> shippingAddress,
  }) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/tracking/create'),
        headers: {
          'Content-Type': 'application/json',
        },
        body: json.encode({
          'orderId': orderId,
          'userId': userId,
          'email': email,
          'phone': phone,
          'shippingAddress': shippingAddress,
        }),
      );

      if (response.statusCode == 201) {
        return json.decode(response.body);
      } else {
        throw Exception('Tracking creation failed');
      }
    } catch (e) {
      print('Error creating tracking: $e');
      // Simulate tracking creation for demo
      return {
        'success': true,
        'tracking': {
          'trackingId': 'TRK${Random().nextInt(100000)}',
        }
      };
    }
  }
}
