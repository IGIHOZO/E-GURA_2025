import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../config/theme.dart';
import '../providers/cart_provider.dart';
import '../services/user_data_service.dart';
import '../services/payment_service.dart';

class CheckoutScreen extends StatefulWidget {
  const CheckoutScreen({super.key});

  @override
  State<CheckoutScreen> createState() => _CheckoutScreenState();
}

class _CheckoutScreenState extends State<CheckoutScreen> {
  final _formKey = GlobalKey<FormState>();
  int _currentStep = 1;
  bool _isProcessing = false;
  bool _isLoadingUserData = true;
  bool _isLoadingMomoCodes = true;
  List<MomoCode> _momoCodes = [];
  String? _transactionId;
  String? _paymentStatus;
  
  // Customer Info
  final _firstNameController = TextEditingController();
  final _lastNameController = TextEditingController();
  final _emailController = TextEditingController();
  final _phoneController = TextEditingController();
  
  // Shipping Info
  final _addressController = TextEditingController();
  final _cityController = TextEditingController();
  final _districtController = TextEditingController();
  final _countryController = TextEditingController(text: 'Rwanda');
  
  // Payment
  String _paymentMethod = 'mobile_money';
  final _transactionIdController = TextEditingController();

  @override
  void initState() {
    super.initState();
    _loadUserData();
    _loadMomoCodes();
  }

  Future<void> _loadMomoCodes() async {
    setState(() => _isLoadingMomoCodes = true);
    try {
      final codes = await ApiService.getMomoCodes();
      setState(() {
        _momoCodes = codes;
        _isLoadingMomoCodes = false;
      });
    } catch (e) {
      setState(() => _isLoadingMomoCodes = false);
    }
  }

  Future<void> _loadUserData() async {
    final userData = await UserDataService.getUserInfo();
    setState(() {
      _firstNameController.text = userData['name']?.split(' ').first ?? '';
      _lastNameController.text = userData['name']?.split(' ').skip(1).join(' ') ?? '';
      _emailController.text = userData['email'] ?? '';
      _phoneController.text = userData['phone'] ?? '';
      _addressController.text = userData['address'] ?? '';
      _cityController.text = 'Kigali';
      _districtController.text = 'Gasabo';
      _isLoadingUserData = false;
    });
  }

  Future<void> _saveUserData() async {
    await UserDataService.saveUserInfo(
      name: '${_firstNameController.text.trim()} ${_lastNameController.text.trim()}',
      email: _emailController.text.trim(),
      phone: _phoneController.text.trim(),
      address: _addressController.text.trim(),
    );
  }

  @override
  void dispose() {
    _firstNameController.dispose();
    _lastNameController.dispose();
    _emailController.dispose();
    _phoneController.dispose();
    _addressController.dispose();
    _cityController.dispose();
    _districtController.dispose();
    _countryController.dispose();
    _transactionIdController.dispose();
    super.dispose();
  }

  void _nextStep() {
    if (_currentStep < 4) {
      setState(() => _currentStep++);
    }
  }

  void _previousStep() {
    if (_currentStep > 1) {
      setState(() => _currentStep--);
    }
  }

  Future<void> _placeOrder() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _isProcessing = true);

    try {
      // Save user data for next time
      await _saveUserData();

      final cart = context.read<CartProvider>();
      final totalAmount = cart.totalAmount;

      // Create order data like web version
      final orderData = {
        'user': 'guest_user_${DateTime.now().millisecondsSinceEpoch}',
        'customerInfo': {
          'firstName': _firstNameController.text.trim(),
          'lastName': _lastNameController.text.trim(),
          'email': _emailController.text.trim(),
          'phone': _phoneController.text.trim(),
        },
        'shippingAddress': {
          'firstName': _firstNameController.text.trim(),
          'lastName': _lastNameController.text.trim(),
          'email': _emailController.text.trim(),
          'phone': _phoneController.text.trim(),
          'street': _addressController.text.trim(),
          'city': _cityController.text.trim(),
          'country': 'Rwanda',
          'postalCode': '0000'
        },
        'items': cart.items.values.map((item) => {
          'product': item.product.id,
          'name': item.product.name,
          'price': item.product.price,
          'quantity': item.quantity,
          'size': item.selectedSize,
          'color': item.selectedColor
        }).toList(),
        'totalAmount': totalAmount,
        'paymentMethod': _paymentMethod == 'mobile_money' ? 'mobile_money' : _paymentMethod == 'momo_code' ? 'momo_code' : 'cash_on_delivery',
        'status': 'pending',
      };

      // Create order in backend
      final orderResponse = await ApiService.createOrder(orderData: orderData);
      if (!orderResponse['success']) {
        throw Exception(orderResponse['message'] ?? 'Order creation failed');
      }

      final orderId = orderResponse['data']['_id'] ?? orderResponse['data']['id'];
      final orderNumber = orderResponse['data']['orderNumber'] ?? 'Unknown';

      // Create tracking
      await ApiService.createTracking(
        orderId: orderId,
        userId: 'customer_${_phoneController.text}',
        email: _emailController.text.trim(),
        phone: _phoneController.text.trim(),
        shippingAddress: {
          'city': _cityController.text.trim(),
          'address': _addressController.text.trim(),
        },
      );

      String successMessage;
      Color successColor;

      if (_paymentMethod == 'mobile_money') {
        // Initiate InTouch Pay payment
        final cleanPhone = _phoneController.text.replaceAll(RegExp(r'\s+'), '');
        final paymentResponse = await ApiService.initiateMobileMoney(
          orderId: orderId,
          phone: cleanPhone,
          amount: totalAmount,
        );

        if (paymentResponse['success']) {
          _transactionId = paymentResponse['transactionId'];
          _paymentStatus = 'pending';
          successMessage = 'Payment request sent! Please check your phone to approve payment.\n\n'
              'Dial *182# → Select "Pending Approvals" → Enter PIN to confirm';
          successColor = const Color(0xFF10B981);
        } else {
          throw Exception(paymentResponse['message'] ?? 'Payment initiation failed');
        }
      } else if (_paymentMethod == 'momo_code') {
        successMessage = 'Order placed! Please send payment to the MOMO numbers provided.\n\n'
            'Include order #$orderNumber in your payment message for faster processing';
        successColor = const Color(0xFF8B5CF6);
      } else {
        successMessage = 'Order placed successfully!';
        successColor = AppTheme.primaryColor;
      }

      // Clear cart
      cart.clearCart();

      if (mounted) {
        // Show success with detailed instructions
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(successMessage),
            backgroundColor: successColor,
            behavior: SnackBarBehavior.floating,
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
            duration: const Duration(seconds: 6),
          ),
        );

        // Navigate back to home
        Navigator.of(context).popUntil((route) => route.isFirst);
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Order failed: $e'),
            backgroundColor: AppTheme.errorColor,
            behavior: SnackBarBehavior.floating,
            action: SnackBarAction(
              label: 'Support',
              textColor: Colors.white,
              onPressed: () {
                // Could open support contact
              },
            ),
          ),
        );
      }
    } finally {
      if (mounted) setState(() => _isProcessing = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF8F9FA),
      appBar: AppBar(
        title: Text('Checkout ($_currentStep/4)'),
        backgroundColor: Colors.white,
        foregroundColor: const Color(0xFF1F2937),
        elevation: 0,
      ),
      body: SafeArea(
        child: Consumer<CartProvider>(
          builder: (context, cart, _) {
            if (_isLoadingUserData) {
              return const Center(
                child: CircularProgressIndicator(color: AppTheme.primaryColor),
              );
            }
            
            if (cart.items.isEmpty) {
              return Center(
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(
                      Icons.shopping_cart_outlined,
                      size: 64,
                      color: const Color(0xFF9CA3AF),
                    ),
                    const SizedBox(height: 16),
                    const Text(
                      'Your cart is empty',
                      style: TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.w600,
                        color: Color(0xFF6B7280),
                      ),
                    ),
                  ],
                ),
              );
            }

          return Column(
            children: [
              // Progress Steps
              _buildProgressSteps(),
              
              // Form Content
              Expanded(
                child: Form(
                  key: _formKey,
                  child: IndexedStack(
                    index: _currentStep - 1,
                    children: [
                      _buildCustomerInfoStep(),
                      _buildShippingInfoStep(),
                      _buildPaymentStep(),
                      _buildOrderSummaryStep(cart),
                    ],
                  ),
                ),
              ),

              // Navigation Buttons
              _buildNavigationButtons(),
            ],
          );
        },
        ),
      ),
    );
  }

  Widget _buildProgressSteps() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        boxShadow: [
          BoxShadow(color: const Color(0x0D000000), blurRadius: 4, offset: const Offset(0, 2)),
        ],
      ),
      child: Row(
        children: [
          _buildStepIndicator(1, 'Customer', Icons.person_outline),
          _buildStepConnector(),
          _buildStepIndicator(2, 'Shipping', Icons.location_on_outlined),
          _buildStepConnector(),
          _buildStepIndicator(3, 'Payment', Icons.payment_outlined),
          _buildStepConnector(),
          _buildStepIndicator(4, 'Review', Icons.checklist_outlined),
        ],
      ),
    );
  }

  Widget _buildStepIndicator(int step, String label, IconData icon) {
    final isActive = _currentStep == step;
    final isCompleted = _currentStep > step;
    
    return Expanded(
      child: Column(
        children: [
          Container(
            width: 40,
            height: 40,
            decoration: BoxDecoration(
              color: isActive ? AppTheme.primaryColor : isCompleted ? Colors.green : const Color(0xFFD1D5DB),
              shape: BoxShape.circle,
            ),
            child: Icon(
              isCompleted ? Icons.check : icon,
              color: Colors.white,
              size: 20,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            label,
            style: TextStyle(
              fontSize: 12,
              fontWeight: isActive ? FontWeight.w600 : FontWeight.w400,
              color: isActive ? AppTheme.primaryColor : const Color(0xFF4B5563),
            ),
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }

  Widget _buildStepConnector() {
    return Expanded(
      child: Container(
        height: 2,
        color: _currentStep > 1 ? Colors.green : const Color(0xFFD1D5DB),
      ),
    );
  }

  Widget _buildCustomerInfoStep() {
    return Padding(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Customer Information',
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.w700,
              color: Color(0xFF1F2937),
            ),
          ),
          const SizedBox(height: 20),
          
          Row(
            children: [
              Expanded(
                child: TextFormField(
                  controller: _firstNameController,
                  decoration: const InputDecoration(
                    labelText: 'First Name',
                    prefixIcon: Icon(Icons.person_outline),
                  ),
                  validator: (value) {
                    if (value == null || value.isEmpty) {
                      return 'Please enter your first name';
                    }
                    return null;
                  },
                ),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: TextFormField(
                  controller: _lastNameController,
                  decoration: const InputDecoration(
                    labelText: 'Last Name',
                    prefixIcon: Icon(Icons.person_outline),
                  ),
                  validator: (value) {
                    if (value == null || value.isEmpty) {
                      return 'Please enter your last name';
                    }
                    return null;
                  },
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          
          TextFormField(
            controller: _emailController,
            decoration: const InputDecoration(
              labelText: 'Email Address',
              prefixIcon: Icon(Icons.email_outlined),
            ),
            keyboardType: TextInputType.emailAddress,
            autofillHints: const [AutofillHints.email],
            validator: (value) {
              if (value == null || value.isEmpty) {
                return 'Please enter your email';
              }
              if (!value.contains('@')) {
                return 'Please enter a valid email';
              }
              return null;
            },
          ),
          const SizedBox(height: 16),
          
          TextFormField(
            controller: _phoneController,
            decoration: const InputDecoration(
              labelText: 'Phone Number',
              prefixIcon: Icon(Icons.phone_outlined),
            ),
            keyboardType: TextInputType.phone,
            autofillHints: const [AutofillHints.telephoneNumber],
            validator: (value) {
              if (value == null || value.isEmpty) {
                return 'Please enter your phone number';
              }
              return null;
            },
          ),
        ],
      ),
    );
  }

  Widget _buildShippingInfoStep() {
    return Padding(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Shipping Information',
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.w700,
              color: Color(0xFF1F2937),
            ),
          ),
          const SizedBox(height: 20),
          
          TextFormField(
            controller: _addressController,
            decoration: const InputDecoration(
              labelText: 'Delivery Address',
              prefixIcon: Icon(Icons.location_on_outlined),
            ),
            maxLines: 2,
            autofillHints: const [AutofillHints.streetAddressLine1, AutofillHints.fullStreetAddress],
            validator: (value) {
              if (value == null || value.isEmpty) {
                return 'Please enter your address';
              }
              return null;
            },
          ),
          const SizedBox(height: 16),
          
          Row(
            children: [
              Expanded(
                child: TextFormField(
                  controller: _cityController,
                  decoration: const InputDecoration(
                    labelText: 'City',
                    prefixIcon: Icon(Icons.location_city_outlined),
                  ),
                  validator: (value) {
                    if (value == null || value.isEmpty) {
                      return 'Please enter your city';
                    }
                    return null;
                  },
                ),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: TextFormField(
                  controller: _districtController,
                  decoration: const InputDecoration(
                    labelText: 'District',
                    prefixIcon: Icon(Icons.apartment_outlined),
                  ),
                  validator: (value) {
                    if (value == null || value.isEmpty) {
                      return 'Please enter your district';
                    }
                    return null;
                  },
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          
          TextFormField(
            controller: _countryController,
            decoration: const InputDecoration(
              labelText: 'Country',
              prefixIcon: Icon(Icons.public_outlined),
            ),
            enabled: false, // Fixed to Rwanda for now
          ),
        ],
      ),
    );
  }

  Widget _buildPaymentStep() {
    return Padding(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Payment Method',
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.w700,
              color: Color(0xFF1F2937),
            ),
          ),
          const SizedBox(height: 20),
          
          // Free Shipping Notice
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: const Color(0xFFFFF7ED),
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: const Color(0xFFFED7AA)),
            ),
            child: Row(
              children: [
                Icon(Icons.local_shipping_outlined, color: const Color(0xFFEA580C)),
                const SizedBox(width: 12),
                const Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Free Shipping',
                        style: TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.w600,
                          color: Color(0xFFEA580C),
                        ),
                      ),
                      Text(
                        'All orders ship free within Kigali, Rwanda',
                        style: TextStyle(
                          fontSize: 14,
                          color: Color(0xFFEA580C),
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 20),
          
          // Payment Method Selection
          const Text(
            'Choose Payment Method',
            style: TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.w600,
              color: Color(0xFF1F2937),
            ),
          ),
          const SizedBox(height: 12),
          
          // Mobile Money (InTouch Pay) Option - FIXED ICON
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              border: Border.all(
                color: _paymentMethod == 'mobile_money' 
                    ? const Color(0xFF10B981) 
                    : const Color(0xFFE5E7EB),
                width: 2,
              ),
              borderRadius: BorderRadius.circular(12),
              color: _paymentMethod == 'mobile_money' 
                  ? const Color(0xFFF0FDF4) 
                  : Colors.white,
            ),
            child: Column(
              children: [
                Row(
                  children: [
                    Container(
                      width: 100,
                      height: 100,
                      decoration: BoxDecoration(
                        borderRadius: BorderRadius.circular(12),
                        color: _paymentMethod == 'mobile_money' 
                            ? const Color(0xFF10B981) 
                            : const Color(0xFFE5E7EB),
                      ),
                      child: ClipRRect(
                        borderRadius: BorderRadius.circular(8),
                        child: Image.asset(
                          'assets/images/mobile-money.png',
                          width: 56,
                          height: 62,
                          fit: BoxFit.contain,
                        ),
                      ),
                    ),
                    const SizedBox(width: 12),
                    const Expanded(
                      child: Text(
                        'Mobile Money',
                        style: TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.w600,
                          color: Color(0xFF1F2937),
                        ),
                      ),
                    ),
                    Radio<String>(
                      value: 'mobile_money',
                      groupValue: _paymentMethod,
                      onChanged: (value) => setState(() => _paymentMethod = value!),
                      activeColor: const Color(0xFF10B981),
                    ),
                  ],
                ),
                if (_paymentMethod == 'mobile_money') ...[
                  const SizedBox(height: 16),
                  TextFormField(
                    controller: _phoneController,
                    decoration: const InputDecoration(
                      labelText: 'Phone Number',
                      hintText: '250',
                      prefixIcon: Icon(Icons.phone_outlined),
                    ),
                    keyboardType: TextInputType.phone,
                    autofillHints: const [AutofillHints.telephoneNumber],
                    validator: (value) {
                      if (value == null || value.isEmpty) {
                        return 'Please enter your phone number';
                      }
                      // Validate Rwanda phone format
                      final cleanPhone = value.replaceAll(RegExp(r'\s+'), '');
                      if (!RegExp(r'^(250|07|08)\d{8,9}$').hasMatch(cleanPhone)) {
                        return 'Please enter a valid Rwanda phone number';
                      }
                      return null;
                    },
                  ),
                ],
              ],
            ),
          ),
          const SizedBox(height: 12),
          
          // MOMO Code Option - FIXED ICON
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              border: Border.all(
                color: _paymentMethod == 'momo_code' 
                    ? const Color(0xFF8B5CF6) 
                    : const Color(0xFFE5E7EB),
                width: 2,
              ),
              borderRadius: BorderRadius.circular(12),
              color: _paymentMethod == 'momo_code' 
                  ? const Color(0xFFFAF5FF) 
                  : Colors.white,
            ),
            child: Column(
              children: [
                Row(
                  children: [
                    Container(
                      width: 100,
                      height: 100,
                      decoration: BoxDecoration(
                        borderRadius: BorderRadius.circular(12),
                        color: _paymentMethod == 'momo_code' 
                            ? const Color(0xFF8B5CF6) 
                            : const Color(0xFFE5E7EB),
                      ),
                      child: ClipRRect(
                        borderRadius: BorderRadius.circular(8),
                        child: Image.asset(
                          'assets/images/momo-code.png',
                          width: 56,
                          height: 56,
                          fit: BoxFit.contain,
                        ),
                      ),
                    ),
                    const SizedBox(width: 12),
                    const Expanded(
                      child: Text(
                        'MOMO Code',
                        style: TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.w600,
                          color: Color(0xFF1F2937),
                        ),
                      ),
                    ),
                    Radio<String>(
                      value: 'momo_code',
                      groupValue: _paymentMethod,
                      onChanged: (value) => setState(() => _paymentMethod = value!),
                      activeColor: const Color(0xFF8B5CF6),
                    ),
                  ],
                ),
                if (_paymentMethod == 'momo_code') ...[
                  const SizedBox(height: 16),
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: const Color(0xFFEEF2FF),
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(color: const Color(0xFFC7D2FE)),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text(
                          'Available MOMO Codes:',
                          style: TextStyle(
                            fontSize: 14,
                            fontWeight: FontWeight.w600,
                            color: Color(0xFF8B5CF6),
                          ),
                        ),
                        const SizedBox(height: 8),
                        if (_isLoadingMomoCodes)
                          const Center(
                            child: Padding(
                              padding: EdgeInsets.all(16),
                              child: CircularProgressIndicator(
                                color: Color(0xFF8B5CF6),
                              ),
                            ),
                          )
                        else if (_momoCodes.isEmpty)
                          Container(
                            padding: const EdgeInsets.all(16),
                            decoration: BoxDecoration(
                              color: Colors.white,
                              borderRadius: BorderRadius.circular(8),
                              border: Border.all(color: const Color(0xFFE5E7EB)),
                            ),
                            child: const Center(
                              child: Column(
                                children: [
                                  Icon(
                                    Icons.phone_disabled,
                                    size: 48,
                                    color: Color(0xFF9CA3AF),
                                  ),
                                  SizedBox(height: 8),
                                  Text(
                                    'No MOMO codes available',
                                    style: TextStyle(
                                      fontSize: 16,
                                      fontWeight: FontWeight.w600,
                                      color: Color(0xFF6B7280),
                                    ),
                                  ),
                                  SizedBox(height: 4),
                                  Text(
                                    'Please contact support for payment assistance',
                                    style: TextStyle(
                                      fontSize: 14,
                                      color: Color(0xFF9CA3AF),
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          )
                        else
                          ..._momoCodes.map((code) => Padding(
                            padding: const EdgeInsets.only(bottom: 8),
                            child: _buildMomoCodeItem(
                              phoneNumber: code.phoneNumber,
                              accountName: code.accountName,
                              network: code.network,
                              isPrimary: code.isPrimary,
                              isActive: code.isActive,
                              name: code.name,
                              description: code.description,
                              instructions: code.instructions,
                            ),
                          )).toList(),
                        const SizedBox(height: 8),
                        const Text(
                          'Please include order number in payment message for faster processing',
                          style: TextStyle(
                            fontSize: 12,
                            color: Color(0xFF6B7280),
                            fontStyle: FontStyle.italic,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildMomoCodeItem({
    required String phoneNumber,
    required String accountName,
    required String network,
    required bool isPrimary,
    required bool isActive,
    String? name,
    String? description,
    String? instructions,
  }) {
    return Opacity(
      opacity: isActive ? 1.0 : 0.6,
      child: Container(
        margin: const EdgeInsets.only(bottom: 8),
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(8),
          border: Border.all(
            color: !isActive 
                ? const Color(0xFFE5E7EB) 
                : const Color(0xFFE8DCF9),
            width: !isActive ? 1.0 : 2.0,
          ),
        ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header with phone number and badges
          Row(
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Text(
                          phoneNumber,
                          style: TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.bold,
                            color: isActive 
                                ? const Color(0xFF8B5CF6) 
                                : const Color(0xFF6B7280),
                          ),
                        ),
                        const SizedBox(width: 8),
                        // Primary badge
                        if (isPrimary)
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                            decoration: BoxDecoration(
                              color: const Color(0xFF8B5CF6),
                              borderRadius: BorderRadius.circular(10),
                            ),
                            child: const Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                Icon(
                                  Icons.star,
                                  size: 12,
                                  color: Colors.white,
                                ),
                                SizedBox(width: 2),
                                Text(
                                  'Primary',
                                  style: TextStyle(
                                    fontSize: 10,
                                    color: Colors.white,
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        // Status badge
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                          decoration: BoxDecoration(
                            color: isActive 
                                ? const Color(0xFF10B981) 
                                : const Color(0xFFEF4444),
                            borderRadius: BorderRadius.circular(10),
                          ),
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Icon(
                                isActive 
                                    ? Icons.check_circle 
                                    : Icons.cancel,
                                size: 12,
                                color: Colors.white,
                              ),
                              const SizedBox(width: 2),
                              Text(
                                isActive ? 'Active' : 'Inactive',
                                style: const TextStyle(
                                  fontSize: 10,
                                  color: Colors.white,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                    if (name != null && name.isNotEmpty) ...[
                      const SizedBox(height: 2),
                      Text(
                        name,
                        style: const TextStyle(
                          fontSize: 14,
                          fontWeight: FontWeight.w600,
                          color: Color(0xFF1F2937),
                        ),
                      ),
                    ],
                    Text(
                      '($accountName)',
                      style: const TextStyle(
                        fontSize: 14,
                        color: Color(0xFF8B5CF6),
                      ),
                    ),
                  ],
                ),
              ),
              // Network badge
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: network == 'MTN' 
                      ? const Color(0xFFFFF7ED) 
                      : const Color(0xFFFEE2E2),
                  borderRadius: BorderRadius.circular(6),
                ),
                child: Text(
                  network,
                  style: TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.bold,
                    color: network == 'MTN' 
                        ? const Color(0xFFEA580C) 
                        : const Color(0xFFDC2626),
                  ),
                ),
              ),
            ],
          ),
          // Description
          if (description != null && description.isNotEmpty) ...[
            const SizedBox(height: 8),
            Text(
              description,
              style: const TextStyle(
                fontSize: 13,
                color: Color(0xFF6B7280),
              ),
            ),
          ],
          // Instructions
          if (instructions != null && instructions.isNotEmpty) ...[
            const SizedBox(height: 8),
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: const Color(0xFFF3F4F6),
                borderRadius: BorderRadius.circular(6),
                border: Border.all(color: const Color(0xFFE5E7EB)),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'Instructions:',
                    style: TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.w600,
                      color: Color(0xFF8B5CF6),
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    instructions,
                    style: const TextStyle(
                      fontSize: 12,
                      color: Color(0xFF4B5563),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ]),
      ),
    );
  }

  Widget _buildOrderSummaryStep(CartProvider cart) {
    return Padding(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Order Summary',
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.w700,
              color: Color(0xFF1F2937),
            ),
          ),
          const SizedBox(height: 20),
          
          // Order Details Card
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: const Color(0xFFF9FAFB),
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: const Color(0xFFE5E7EB)),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                _buildSummaryRow('Items', '${cart.itemCount}'),
                _buildSummaryRow('Subtotal', '${cart.totalAmount.toStringAsFixed(0)} RWF'),
                _buildSummaryRow('Delivery Fee', 'Free'),
                _buildSummaryRow('Payment Method', _getPaymentMethodDisplay()),
                const Divider(),
                _buildSummaryRow(
                  'Total',
                  '${cart.totalAmount.toStringAsFixed(0)} RWF',
                  isTotal: true,
                ),
              ],
            ),
          ),
          const SizedBox(height: 20),
          
          // Customer Details Card
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: const Color(0xFFF9FAFB),
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: const Color(0xFFE5E7EB)),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'Customer Details',
                  style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w600,
                    color: Color(0xFF1F2937),
                  ),
                ),
                const SizedBox(height: 12),
                _buildDetailRow('Name', '${_firstNameController.text} ${_lastNameController.text}'),
                _buildDetailRow('Phone', _phoneController.text),
                _buildDetailRow('Email', _emailController.text),
                const SizedBox(height: 8),
                const Text(
                  'Shipping Address',
                  style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w600,
                    color: Color(0xFF1F2937),
                  ),
                ),
                const SizedBox(height: 8),
                _buildDetailRow('Address', _addressController.text),
                _buildDetailRow('City', _cityController.text),
                _buildDetailRow('District', _districtController.text),
                _buildDetailRow('Country', _countryController.text),
              ],
            ),
          ),
          const SizedBox(height: 20),
          
          // Payment Instructions
          if (_paymentMethod == 'momo_code') ...[
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: const Color(0xFFFFF7ED),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: const Color(0xFFFED7AA)),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Icon(Icons.info_outline, color: const Color(0xFFEA580C)),
                      const SizedBox(width: 8),
                      const Text(
                        'Payment Instructions',
                        style: TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.w600,
                          color: Color(0xFFEA580C),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  const Text(
                    'Please send payment to the MOMO numbers shown in the payment step. '
                    'Include your order number in the payment message for faster processing.',
                    style: TextStyle(
                      fontSize: 14,
                      color: Color(0xFF92400E),
                    ),
                  ),
                ],
              ),
            ),
          ] else if (_paymentMethod == 'mobile_money') ...[
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: const Color(0xFFECFDF5),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: const Color(0xFFA7F3D0)),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Icon(Icons.phone_android, color: const Color(0xFF10B981)),
                      const SizedBox(width: 8),
                      const Text(
                        'Mobile Money Payment',
                        style: TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.w600,
                          color: Color(0xFF10B981),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  Text(
                    'A payment request will be sent to ${_phoneController.text}. '
                    'Please check your phone and confirm the payment.',
                    style: const TextStyle(
                      fontSize: 14,
                      color: Color(0xFF065F46),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ],
      ),
    );
  }

  String _getPaymentMethodDisplay() {
    switch (_paymentMethod) {
      case 'mobile_money':
        return 'Mobile Money (InTouch Pay)';
      case 'momo_code':
        return 'MOMO Code';
      default:
        return 'Unknown';
    }
  }

  Widget _buildSummaryRow(String label, String value, {bool isTotal = false}) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            label,
            style: TextStyle(
              fontSize: isTotal ? 16 : 14,
              fontWeight: isTotal ? FontWeight.w700 : FontWeight.w400,
              color: const Color(0xFF6B7280),
            ),
          ),
          Text(
            value,
            style: TextStyle(
              fontSize: isTotal ? 16 : 14,
              fontWeight: isTotal ? FontWeight.w700 : FontWeight.w400,
              color: isTotal ? AppTheme.primaryColor : const Color(0xFF6B7280),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildDetailRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 2),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 80,
            child: Text(
              '$label:',
              style: const TextStyle(
                fontSize: 13,
                fontWeight: FontWeight.w500,
                color: Color(0xFF6B7280),
              ),
            ),
          ),
          Expanded(
            child: Text(
              value,
              style: const TextStyle(
                fontSize: 13,
                color: Color(0xFF1F2937),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildNavigationButtons() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        boxShadow: [
          BoxShadow(color: const Color(0x0D000000), blurRadius: 10, offset: const Offset(0, -2)),
        ],
      ),
      child: Row(
          children: [
            if (_currentStep > 1)
              Expanded(
                child: OutlinedButton(
                  onPressed: _isProcessing ? null : _previousStep,
                  style: OutlinedButton.styleFrom(
                    padding: const EdgeInsets.symmetric(vertical: 16),
                  ),
                  child: const Text('Previous'),
                ),
              ),
            if (_currentStep > 1) const SizedBox(width: 16),
            Expanded(
              child: ElevatedButton(
                onPressed: _isProcessing 
                    ? null 
                    : _currentStep == 4 
                        ? _placeOrder 
                        : _nextStep,
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppTheme.primaryColor,
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(vertical: 16),
                ),
                child: _isProcessing
                    ? const SizedBox(
                        height: 20,
                        width: 20,
                        child: CircularProgressIndicator(
                          strokeWidth: 2,
                          valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                        ),
                      )
                    : Text(_currentStep == 4 ? 'Place Order' : 'Next'),
              ),
            ),
          ],
      ),
    );
  }
}