import 'package:shared_preferences/shared_preferences.dart';

class UserDataService {
  static const String _addressKey = 'user_address';
  static const String _phoneKey = 'user_phone';
  static const String _nameKey = 'user_name';
  static const String _emailKey = 'user_email';

  static Future<void> saveUserInfo({
    String? name,
    String? email,
    String? address,
    String? phone,
  }) async {
    final prefs = await SharedPreferences.getInstance();
    
    if (name != null) await prefs.setString(_nameKey, name);
    if (email != null) await prefs.setString(_emailKey, email);
    if (address != null) await prefs.setString(_addressKey, address);
    if (phone != null) await prefs.setString(_phoneKey, phone);
  }

  static Future<Map<String, String?>> getUserInfo() async {
    final prefs = await SharedPreferences.getInstance();
    return {
      'name': prefs.getString(_nameKey),
      'email': prefs.getString(_emailKey),
      'address': prefs.getString(_addressKey),
      'phone': prefs.getString(_phoneKey),
    };
  }

  static Future<String?> getAddress() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString(_addressKey);
  }

  static Future<String?> getPhone() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString(_phoneKey);
  }

  static Future<String?> getName() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString(_nameKey);
  }

  static Future<String?> getEmail() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString(_emailKey);
  }

  static Future<void> clearUserData() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_nameKey);
    await prefs.remove(_emailKey);
    await prefs.remove(_addressKey);
    await prefs.remove(_phoneKey);
  }
}
