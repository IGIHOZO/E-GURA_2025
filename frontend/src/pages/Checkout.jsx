import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import axios from 'axios';
import { 
  ArrowLeftIcon,
  ShoppingBagIcon,
  TruckIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  UserIcon,
  MapPinIcon,
  PhoneIcon,
  EnvelopeIcon,
  CreditCardIcon,
  XMarkIcon,
  PencilIcon,
  PlusIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import SEOHead from '../components/SEOHead';
import { CustomerAccountManager } from '../utils/customerAccountManager';
import { smsAPI } from '../services/smsApi';
import OptimizedCheckoutAuth from '../components/OptimizedCheckoutAuth';
import CartoonCheckoutLayout from '../components/CartoonCheckoutLayout';
import Enhanced3DCheckout from '../components/Enhanced3DCheckout';
import StorageCleanup from '../utils/storageCleanup';

const Checkout = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const { items: cart, clearCart } = useCart();
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('mobile_money');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [isUserAuthenticated, setIsUserAuthenticated] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [notification, setNotification] = useState(null);
  
  // Handle auth completion - FIXED to use correct current user data
  const handleAuthComplete = async (userData) => {
    console.log('✅ Auth completed:', userData);
    setIsUserAuthenticated(true);
    
    // IMPORTANT: Clear any old shipping data first
    localStorage.removeItem('savedShippingAddress');
    
    // Fetch full user data with addresses from backend
    try {
      const response = await axios.get(`https://egura.rw/api/auth/check-phone`, {
        params: { phone: userData.phone }
      });
      
      if (response.data.exists && response.data.user) {
        const fullUserData = response.data.user;
        console.log('📦 Full user data loaded:', fullUserData);
        console.log('👤 User:', fullUserData.firstName, fullUserData.lastName);
        
        // Get the MOST RECENT address (last one added) - from THIS user's registration
        const addresses = fullUserData.addresses || [];
        const latestAddress = addresses[addresses.length - 1]; // Most recent address
        
        console.log('📍 Total addresses for this user:', addresses.length);
        console.log('📍 Latest address:', latestAddress);
        
        // Update order details with complete user data - THIS USER ONLY
        setOrderDetails({
          customerInfo: {
            firstName: fullUserData.firstName || '',
            lastName: fullUserData.lastName || '',
            email: fullUserData.email || '',
            phoneNumber: fullUserData.phone || ''
          },
          shippingInfo: {
            receiverName: `${fullUserData.firstName} ${fullUserData.lastName}`.trim(),
            phoneNumber: fullUserData.phone || '',
            address: latestAddress?.address || '',
            city: latestAddress?.city || 'Kigali',
            district: latestAddress?.district || 'Gasabo',
            country: latestAddress?.country || 'Rwanda'
          }
        });
        
        console.log('✅ Forms auto-filled with THIS USER\'S address');
        console.log('📍 Receiver:', `${fullUserData.firstName} ${fullUserData.lastName}`);
        console.log('📍 Address:', latestAddress?.address);
      }
    } catch (err) {
      console.error('Error loading full user data:', err);
      // Still update with basic data if fetch fails
      if (userData) {
        setOrderDetails({
          customerInfo: {
            firstName: userData.firstName || '',
            lastName: userData.lastName || '',
            email: userData.email || '',
            phoneNumber: userData.phone || ''
          },
          shippingInfo: {
            receiverName: `${userData.firstName} ${userData.lastName}`.trim(),
            phoneNumber: userData.phone || '',
            address: '',
            city: 'Kigali',
            district: 'Gasabo',
            country: 'Rwanda'
          }
        });
      }
    }
  };
  
  // Initialize with user data if logged in - AUTO-FILL everything
  const initializeOrderDetails = () => {
    // Check multiple sources for user data
    const savedUser = localStorage.getItem('user') || localStorage.getItem('currentUser');
    if (savedUser) {
      try {
        const userData = JSON.parse(savedUser);
        console.log('🔍 Initializing with user data:', userData);
        
        const firstName = userData.firstName || userData.name?.split(' ')[0] || '';
        const lastName = userData.lastName || userData.name?.split(' ').slice(1).join(' ') || '';
        const email = userData.email || userData.phoneNumber + '@customer.com' || '';
        const phoneNumber = userData.phoneNumber || userData.phone || '';
        
        // Get the MOST RECENT address (from registration)
        const addresses = userData.addresses || [];
        const latestAddress = addresses[addresses.length - 1];
        
        return {
          customerInfo: {
            firstName: firstName,
            lastName: lastName,
            email: email,
            phoneNumber: phoneNumber
          },
          shippingInfo: {
            receiverName: `${firstName} ${lastName}`.trim(),
            phoneNumber: phoneNumber,
            address: latestAddress?.address || '',
            city: latestAddress?.city || 'Kigali',
            district: latestAddress?.district || 'Gasabo',
            country: latestAddress?.country || 'Rwanda'
          }
        };
      } catch (error) {
        console.error('Error parsing user data:', error);
      }
    }
    
    return {
      customerInfo: {
        firstName: '',
        lastName: '',
        email: '',
        phoneNumber: ''
      },
      shippingInfo: {
        receiverName: '',
        phoneNumber: '',
        address: '',
        city: 'Kigali',
        district: 'Gasabo',
        country: 'Rwanda'
      }
    };
  };

  const [orderDetails, setOrderDetails] = useState(initializeOrderDetails());
  const [formErrors, setFormErrors] = useState({});
  const [savedAddress, setSavedAddress] = useState(null);
  const [showNewAddressForm, setShowNewAddressForm] = useState(false);

  const cartTotal = Array.isArray(cart) ? cart.reduce((total, item) => {
    const price = Number(item.price) || 0;
    const quantity = Number(item.quantity) || 0;
    return total + (price * quantity);
  }, 0) : 0;
  
  // Calculate shipping cost dynamically from admin settings
  const [shippingCost, setShippingCost] = useState(0);
  const [shippingInfo, setShippingInfo] = useState({ isFreeShipping: false, reason: '' });
  const totalAmount = cartTotal + shippingCost;

  // Fetch shipping cost when cart changes
  useEffect(() => {
    const calculateShipping = async () => {
      if (cartTotal === 0 || !Array.isArray(cart) || cart.length === 0) {
        setShippingCost(2000);
        return;
      }

      try {
        const response = await axios.post('/api/shipping/calculate', {
          items: cart.map(item => ({
            productId: item.id || item._id,
            product: item.id || item._id,
            quantity: item.quantity
          })),
          subtotal: cartTotal
        });

        if (response.data.success) {
          setShippingCost(response.data.shippingFee);
          setShippingInfo({
            isFreeShipping: response.data.isFreeShipping,
            reason: response.data.reason
          });
          console.log('🚚 Shipping calculated:', response.data);
        }
      } catch (error) {
        console.error('Error calculating shipping:', error);
        // Fallback to default shipping cost
        setShippingCost(0);
      }
    };

    calculateShipping();
  }, [cart, cartTotal]);

  useEffect(() => {
    try {
      // Check if user is logged in
      const userId = localStorage.getItem('userId');
      const userPhone = localStorage.getItem('userPhone');
      const isAuth = !!(userId || userPhone);
      setIsUserAuthenticated(isAuth);
      setCheckingAuth(false);
      
      // If authenticated, load user data including shipping address
      if (isAuth) {
        const savedUser = localStorage.getItem('user');
        if (savedUser) {
          try {
            const userData = JSON.parse(savedUser);
            console.log('📦 Loading user data with addresses:', userData);
            
            // Get the MOST RECENT address (from registration)
            const addresses = userData.addresses || [];
            const latestAddress = addresses[addresses.length - 1];
            
            setOrderDetails(prev => ({
              ...prev,
              customerInfo: {
                firstName: userData.firstName || '',
                lastName: userData.lastName || '',
                email: userData.email || '',
                phoneNumber: userData.phone || ''
              },
              shippingInfo: {
                receiverName: `${userData.firstName} ${userData.lastName}`.trim(),
                phoneNumber: userData.phone || '',
                address: latestAddress?.address || '',
                city: latestAddress?.city || 'Kigali',
                district: latestAddress?.district || 'Gasabo',
                country: latestAddress?.country || 'Rwanda'
              }
            }));
            
            console.log('✅ Customer info and shipping address auto-filled');
            console.log('📍 Using address:', latestAddress?.address);
          } catch (err) {
            console.error('Error loading user data:', err);
          }
        }
      }
      
      if (!cart || cart.length === 0) {
        console.log('Cart is empty, redirecting to cart page');
        navigate('/cart');
        return;
      }
      
      // CLEAR any old saved shipping address to prevent wrong data
      localStorage.removeItem('savedShippingAddress');
      console.log('🗑️ Cleared old shipping address cache');

      // If user is logged in, auto-fill customer info
      if (isAuthenticated && user) {
        console.log('🔍 Current user object:', user);
        
        const firstName = user.firstName || user.name?.split(' ')[0] || '';
        const lastName = user.lastName || user.name?.split(' ').slice(1).join(' ') || '';
        const email = user.email || (user.phoneNumber ? user.phoneNumber + '@egura.rw' : '');
        const phoneNumber = user.phoneNumber || user.phone || '';
        
        console.log('📝 Extracted info:', { firstName, lastName, email, phoneNumber });
        
        // Force update with setTimeout to ensure state is set
        setTimeout(() => {
          setOrderDetails(prev => ({
            ...prev,
            customerInfo: {
              firstName: firstName,
              lastName: lastName,
              email: email,
              phoneNumber: phoneNumber
            },
            shippingInfo: {
              ...prev.shippingInfo,
              receiverName: `${firstName} ${lastName}`.trim(),
              phoneNumber: phoneNumber
            }
          }));
          
          console.log('✅ Auto-filled customer info from logged in user:', {
            firstName,
            lastName,
            email,
            phoneNumber
          });
        }, 100);
      }
    } catch (error) {
      console.error('Error in checkout useEffect:', error);
      // Don't crash, just log the error
    }
  }, [cart, navigate, isAuthenticated, user]);

  const handleCustomerInfoChange = (field, value) => {
    setOrderDetails(prev => ({
      ...prev,
      customerInfo: {
        ...prev.customerInfo,
        [field]: value
      }
    }));
    
    // If email changed, try to load customer data
    if (field === 'email' && value.includes('@')) {
      const customer = CustomerAccountManager.getCustomerByEmail(value);
      if (customer) {
        console.log('✅ Returning customer detected!', customer);
        // Auto-fill customer info
        setOrderDetails(prev => ({
          ...prev,
          customerInfo: {
            firstName: customer.firstName,
            lastName: customer.lastName,
            email: customer.email,
            phoneNumber: customer.phoneNumber
          }
        }));
        
        // Load default shipping address
        const defaultAddress = CustomerAccountManager.getDefaultShippingAddress(value);
        if (defaultAddress) {
          setOrderDetails(prev => ({
            ...prev,
            shippingInfo: defaultAddress
          }));
          setSavedAddress(defaultAddress);
          console.log('✅ Default shipping address loaded');
        }
      }
    }
    
    // Clear error for this field
    if (formErrors[field]) {
      setFormErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleShippingInfoChange = (field, value) => {
    console.log(`Shipping info changed: ${field} = ${value}`);
    setOrderDetails(prev => ({
      ...prev,
      shippingInfo: {
        ...prev.shippingInfo,
        [field]: value
      }
    }));
    
    // Clear error for this field
    if (formErrors[field]) {
      setFormErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateCustomerInfo = () => {
    const { customerInfo } = orderDetails;
    const errors = {};
    
    if (!customerInfo.firstName?.trim()) {
      errors.firstName = 'First name is required';
    }
    
    if (!customerInfo.lastName?.trim()) {
      errors.lastName = 'Last name is required';
    }
    
    if (!customerInfo.email?.trim()) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(customerInfo.email)) {
      errors.email = 'Please enter a valid email address';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateShippingInfo = () => {
    const { shippingInfo } = orderDetails;
    const errors = {};
    
    if (!shippingInfo.receiverName?.trim()) {
      errors.receiverName = 'Receiver name is required';
    }
    
    if (!shippingInfo.phoneNumber?.trim()) {
      errors.phoneNumber = 'Phone number is required';
    }
    
    if (!shippingInfo.address?.trim()) {
      errors.address = 'Address is required';
    }
    
    if (!shippingInfo.city?.trim()) {
      errors.city = 'City is required';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleNextStep = () => {
    if (currentStep === 1) {
      if (validateCustomerInfo()) {
        // Auto-fill shipping info with customer information
        const fullName = `${orderDetails.customerInfo.firstName} ${orderDetails.customerInfo.lastName}`.trim();
        const customerPhone = orderDetails.customerInfo.phoneNumber;
        
        setOrderDetails(prev => ({
          ...prev,
          shippingInfo: {
            ...prev.shippingInfo,
            receiverName: fullName,
            phoneNumber: customerPhone || prev.shippingInfo.phoneNumber
          }
        }));
        
        console.log('✅ Auto-copied customer info to shipping:', {
          receiverName: fullName,
          phoneNumber: customerPhone
        });
        
        setCurrentStep(2);
      }
    } else if (currentStep === 2) {
      if (validateShippingInfo()) {
        // Save shipping address for future use
        const shippingData = {
          receiverName: orderDetails.shippingInfo.receiverName,
          phoneNumber: orderDetails.shippingInfo.phoneNumber,
          address: orderDetails.shippingInfo.address,
          city: orderDetails.shippingInfo.city
        };
        localStorage.setItem('savedShippingAddress', JSON.stringify(shippingData));
        setCurrentStep(3);
      }
    }
  };

  const handlePreviousStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const sendOrderEmail = async (orderData) => {
    try {
      // Simulate sending email
      console.log('Sending order confirmation email to:', orderData.customerInfo.email);
      
      // In a real implementation, you would send an actual email here
      // For now, we'll just log the email data
      const emailData = {
        to: orderData.customerInfo.email,
        subject: `Order Confirmation - ${orderData.id}`,
        body: `
          Dear ${orderData.customerInfo.firstName} ${orderData.customerInfo.lastName},
          
          Thank you for your order! Your order has been successfully placed.
          
          Order Details:
          - Order ID: ${orderData.id}
          - Total Amount: RWF ${orderData.total.toLocaleString()}
          - Payment Method: ${orderData.paymentInfo.method}
          
          Payment Instructions:
          Please send payment to MOMO number: 0782540683 (Uwase)
          
          We will process your order once payment is confirmed.
          
          Best regards,
          E-Gura Store Team
        `
      };
      
      console.log('Email data:', emailData);
      return true;
    } catch (error) {
      console.error('Error sending email:', error);
      return false;
    }
  };

  const [completedOrder, setCompletedOrder] = useState(null);

  const handlePaymentSubmit = async (paymentData) => {
    console.log('💳 Payment button clicked!', paymentData);
    setIsLoading(true);
    setPaymentStatus('pending');
    
    try {
      console.log('📦 Creating order...');
      
      // Create order object
      const order = {
        id: `ORDER_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        orderNumber: `ORD-${Date.now()}`,
        customerId: user?.id || `CUST_${Date.now()}`,
        customerInfo: orderDetails.customerInfo,
        shippingInfo: orderDetails.shippingInfo,
        items: cart,
        total: totalAmount,
        subtotal: cartTotal,
        shippingCost: shippingCost,
        paymentMethod: paymentMethod === 'mobile_money' ? 'Mobile Money' : 'Cash on Delivery',
        paymentInfo: {
          method: paymentMethod === 'mobile_money' ? 'Mobile Money (InTouch Pay)' : 'Cash on Delivery',
          phone: phoneNumber || orderDetails.shippingInfo.phoneNumber,
          transactionId: null,
          status: 'pending'
        },
        status: 'pending',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      console.log('✅ Order created:', order);

      // Save order to backend
      try {
        console.log('📤 Sending order to backend...');
        console.log('Cart items:', order.items);
        
        const backendOrder = await axios.post('/api/orders', {
          user: order.customerId,
          items: order.items.map(item => ({
            product: item._id || item.id || '507f1f77bcf86cd799439011', // Use fallback ID if not available
            name: item.name,
            price: item.price,
            quantity: item.quantity,
            size: item.selectedSize,
            color: item.selectedColor
          })),
          totalAmount: order.total,
          status: order.status,
          paymentMethod: order.paymentMethod.toLowerCase().replace(' ', '_'),
          shippingAddress: {
            firstName: order.customerInfo.firstName,
            lastName: order.customerInfo.lastName,
            email: order.customerInfo.email,
            phone: order.shippingInfo.phoneNumber,
            street: order.shippingInfo.address,
            city: order.shippingInfo.city || 'Kigali',
            country: 'Rwanda',
            postalCode: order.shippingInfo.postalCode || '0000'
          }
        });
        console.log('✅ Order saved to backend:', backendOrder.data);
        
        // Get the created order ID from backend
        const createdOrderId = backendOrder.data.data._id || backendOrder.data.data.id;
        order.backendOrderId = createdOrderId;
        
        // If mobile money payment, initiate InTouch Pay
        if (paymentMethod === 'mobile_money' && phoneNumber) {
          console.log('💰 Initiating InTouch Pay payment...');
          
          try {
            const paymentResponse = await axios.post(`/api/payments/orders/pay/${createdOrderId}`, {
              type: 'momo',
              phone: phoneNumber
            });
            
            console.log('✅ InTouch Pay response:', paymentResponse.data);
            
            if (paymentResponse.data.success) {
              order.paymentInfo.transactionId = paymentResponse.data.transactionId;
              order.paymentInfo.status = 'pending';
              order.paymentInfo.responseCode = paymentResponse.data.responseCode;
              order.paymentInfo.apiResponse = paymentResponse.data;
              
              setNotification({
                type: 'success',
                title: 'Payment Request Sent!',
                message: `Please check your phone (${phoneNumber}) to approve the payment`,
                details: {
                  order: order.orderNumber,
                  transactionId: paymentResponse.data.transactionId,
                  amount: order.total.toLocaleString() + ' RWF',
                  status: paymentResponse.data.data?.status || 'Pending'
                },
                instructions: [
                  'Dial *182# on your phone',
                  'Select "Pending Approvals"',
                  'Enter your PIN to approve payment',
                  'You\'ll receive confirmation SMS'
                ]
              });
            } else {
              throw new Error(paymentResponse.data.message || 'Payment initiation failed');
            }
          } catch (paymentError) {
            console.error('❌ Payment initiation failed:', paymentError);
            
            const errorMsg = paymentError.response?.data?.error || paymentError.message;
            const errorCode = paymentError.response?.data?.responseCode;
            
            setNotification({
              type: 'error',
              title: 'Payment Failed',
              message: errorMsg,
              details: {
                order: order.orderNumber,
                errorCode: errorCode
              },
              support: {
                phone: '+250 782 013 955',
                email: 'egurastore@gmail.com'
              }
            });
            
            alert(`
━━━━━━━━━━━━━━━━━━━━━━━
⚠️ PAYMENT FAILED
━━━━━━━━━━━━━━━━━━━━━━━

Order: ${order.orderNumber}
Error: ${errorMsg}
${errorCode ? 'Code: ' + errorCode : ''}

Please contact support:
📞 +250 782 013 955
📧 egurastore@gmail.com
━━━━━━━━━━━━━━━━━━━━━━━
            `.trim());
          }
        } else {
          // Cash on delivery - no payment needed
          setNotification({
            type: 'success',
            title: 'Order Placed Successfully!',
            message: 'Pay cash when your order is delivered',
            details: {
              order: order.orderNumber,
              total: order.total.toLocaleString() + ' RWF',
              paymentMethod: 'Cash on Delivery'
            }
          });
        }
        
      } catch (backendError) {
        console.error('❌ Failed to save order to backend:', backendError);
        setNotification({
          type: 'error',
          title: 'Order Creation Failed',
          message: 'Unable to create your order. Please try again.',
          details: {
            error: backendError.response?.data?.message || backendError.message
          },
          support: {
            phone: '+250 782 013 955',
            email: 'egurastore@gmail.com'
          }
        });
        setIsLoading(false);
        setPaymentStatus('failed');
        return;
      }

      // Create or update customer account
      const customerAccount = CustomerAccountManager.createOrUpdateAccount(
        orderDetails.customerInfo,
        orderDetails.shippingInfo
      );
      
      // Add order to customer history
      CustomerAccountManager.addOrderToCustomer(orderDetails.customerInfo.email, order);
      
      console.log('✅ Customer account created/updated:', customerAccount.email);

      // Clean storage if needed before saving
      StorageCleanup.autoCleanup();

      // Save order to localStorage (lightweight version for admin)
      try {
        const existingAdminOrders = JSON.parse(localStorage.getItem('adminOrders') || '[]');
        
        // Keep only last 50 orders to prevent quota issues
        if (existingAdminOrders.length >= 50) {
          existingAdminOrders.shift(); // Remove oldest
        }
        
        // Create lightweight order object (remove large data)
        const lightOrder = {
          id: order.id,
          orderNumber: order.orderNumber,
          customerInfo: order.customerInfo,
          total: order.total,
          status: order.status,
          paymentMethod: order.paymentMethod,
          trackingId: order.trackingId,
          createdAt: order.createdAt,
          itemCount: order.items.length
        };
        
        existingAdminOrders.push(lightOrder);
        localStorage.setItem('adminOrders', JSON.stringify(existingAdminOrders));
        
        console.log('✅ Order saved to localStorage (lightweight)');
        console.log('📊 Total orders in admin:', existingAdminOrders.length);
      } catch (storageError) {
        console.error('⚠️ LocalStorage quota exceeded, clearing old data...');
        // Clear old data and retry
        localStorage.removeItem('orders');
        localStorage.removeItem('customer_orders');
        localStorage.removeItem('all_orders');
        
        // Save just this order
        localStorage.setItem('adminOrders', JSON.stringify([{
          id: order.id,
          orderNumber: order.orderNumber,
          customerInfo: order.customerInfo,
          total: order.total,
          status: order.status,
          createdAt: order.createdAt
        }]));
        console.log('✅ Storage cleaned and order saved');
      }

      // Store order for navigation
      setCompletedOrder(order);

      // Send order confirmation SMS
      try {
        await smsAPI.sendOrderConfirmation(
          orderDetails.shippingInfo.phoneNumber,
          {
            orderNumber: order.orderNumber,
            total: order.total
          }
        );
        console.log('📱 Order confirmation SMS sent successfully');
      } catch (smsError) {
        console.error('SMS send failed (non-blocking):', smsError);
        // Don't block order if SMS fails
      }

      // Send admin alert SMS
      try {
        const adminPhone = '0782540683'; // Admin phone
        await smsAPI.sendAdminAlert(
          adminPhone,
          `New order: ${order.orderNumber} - ${order.total.toLocaleString()} RWF from ${orderDetails.customerInfo.firstName} ${orderDetails.customerInfo.lastName}`
        );
        console.log('📱 Admin alert SMS sent successfully');
      } catch (smsError) {
        console.error('Admin SMS failed (non-blocking):', smsError);
      }

      // Create order tracking
      try {
        console.log('📦 Creating order tracking...');
        const trackingResponse = await axios.post('/api/tracking/create', {
          orderId: order.id,
          userId: order.customerId,
          email: order.customerInfo.email,
          phone: order.shippingInfo.phoneNumber,
          shippingAddress: {
            city: order.shippingInfo.city || 'Kigali',
            address: order.shippingInfo.address || ''
          }
        });
        
        if (trackingResponse.data.success) {
          order.trackingId = trackingResponse.data.tracking.trackingId;
          console.log('✅ Tracking created:', order.trackingId);
        }
      } catch (trackingError) {
        console.error('⚠️ Failed to create tracking:', trackingError);
        // Don't block order if tracking fails
      }

      // Send confirmation email (simulated)
      await sendOrderEmail(order);

      // Clear cart only after successful payment initiation
      clearCart();
      
      // Set status based on payment method
      if (paymentMethod === 'mobile_money') {
        setPaymentStatus('pending');
      } else {
        setPaymentStatus('success');
      }
      setIsLoading(false);
      
      // Show payment modal
      setShowPaymentModal(true);
      
    } catch (error) {
      console.error('Error creating order:', error);
      setPaymentStatus('failed');
      setIsLoading(false);
      setNotification({
        type: 'error',
        title: 'Order Processing Failed',
        message: 'An unexpected error occurred. Please try again.',
        support: {
          phone: '+250 782 013 955',
          email: 'egurastore@gmail.com'
        }
      });
    }
  };

  const steps = [
    { id: 1, title: 'Customer Information', icon: UserIcon },
    { id: 2, title: 'Shipping Details', icon: MapPinIcon },
    { id: 3, title: 'Payment', icon: ShoppingBagIcon }
  ];

  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <ShoppingBagIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Your cart is empty</h2>
          <p className="text-gray-600 mb-6">Add some items to your cart to checkout</p>
          <button
            onClick={() => navigate('/shop')}
            className="bg-orange-500 text-white px-6 py-3 rounded-lg hover:bg-orange-600 transition-colors"
          >
          Continue Shopping
        </button>
      </div>
    </div>
  );
}

  // Show auth screen if not authenticated
  if (!isUserAuthenticated && !checkingAuth) {
    return (
      <>
        <SEOHead 
          title="Verify Phone - E-Gura Store"
          description="Quick phone verification to complete your order"
          pageType="checkout"
        />
        {/* Cartoon Checkout Layout - Cart and Auth Side by Side */}
        <CartoonCheckoutLayout onAuthComplete={handleAuthComplete} />
      </>
    );
  }

  return (
    <>
      <SEOHead 
        title="Checkout - E-Gura Store"
        description="Complete your purchase securely with MTN Mobile Money. Fast, safe, and convenient payment for your fashion items."
        keywords="checkout, payment, MTN Mobile Money, fashion, Kigali, Rwanda"
        pageType="checkout"
      />
      
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <button
                onClick={() => navigate('/cart')}
                className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeftIcon className="h-5 w-5 mr-2" />
                Back to Cart
              </button>
              <h1 className="text-2xl font-bold text-gray-900">Checkout</h1>
              <div className="w-20"></div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2">
              {/* Progress Steps */}
              <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                <div className="flex items-center justify-between">
                  {steps.map((step, index) => (
                    <div key={step.id} className="flex items-center">
                      <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                        currentStep >= step.id 
                          ? 'bg-orange-500 border-orange-500 text-white' 
                          : 'border-gray-300 text-gray-400'
                      }`}>
                        {currentStep > step.id ? (
                          <CheckCircleIcon className="h-6 w-6" />
                        ) : (
                          <step.icon className="h-5 w-5" />
                        )}
                      </div>
                      <span className={`ml-3 text-sm font-medium ${
                        currentStep >= step.id ? 'text-gray-900' : 'text-gray-500'
                      }`}>
                        {step.title}
                      </span>
                      {index < steps.length - 1 && (
                        <div className={`w-16 h-0.5 mx-4 ${
                          currentStep > step.id ? 'bg-orange-500' : 'bg-gray-300'
                        }`} />
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Step Content */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                {currentStep === 1 && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-6"
                  >
                    <h2 className="text-xl font-semibold text-gray-900 mb-6">Customer Information</h2>
                    
                    {isAuthenticated && user && (
                      <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                        <p className="text-green-800 font-medium">
                          ✅ Logged in as {user.firstName || user.name} - Information auto-filled below
                        </p>
                      </div>
                    )}
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">First Name *</label>
                        <input
                          type="text"
                          value={orderDetails.customerInfo.firstName}
                          onChange={(e) => handleCustomerInfoChange('firstName', e.target.value)}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                          placeholder="Enter your first name"
                          required
                        />
                        {formErrors.firstName && (
                          <p className="text-red-500 text-sm mt-1">{formErrors.firstName}</p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Last Name *</label>
                        <input
                          type="text"
                          value={orderDetails.customerInfo.lastName}
                          onChange={(e) => handleCustomerInfoChange('lastName', e.target.value)}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                          placeholder="Enter your last name"
                          required
                        />
                        {formErrors.lastName && (
                          <p className="text-red-500 text-sm mt-1">{formErrors.lastName}</p>
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Email *</label>
                      <input
                        type="email"
                        value={orderDetails.customerInfo.email}
                        onChange={(e) => handleCustomerInfoChange('email', e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                        placeholder="Enter your email address"
                        required
                      />
                      {formErrors.email && (
                        <p className="text-red-500 text-sm mt-1">{formErrors.email}</p>
                      )}
                    </div>

                    <div className="flex justify-end">
                      <button
                        onClick={handleNextStep}
                        className="px-6 py-3 rounded-lg font-semibold text-white transition-colors bg-orange-500 hover:bg-orange-600"
                      >
                        Continue to Shipping
                      </button>
                    </div>
                  </motion.div>
                )}

                {currentStep === 2 && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-6"
                  >
                    <h2 className="text-xl font-semibold text-gray-900 mb-6">Shipping Information</h2>
                    
                    {/* Saved Address Display */}
                    {savedAddress && !showNewAddressForm && (
                      <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start space-x-3">
                            <CheckCircleIcon className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                            <div>
                              <h4 className="font-semibold text-green-800 mb-1">
                                Default Shipping Address
                              </h4>
                              <div className="text-sm text-green-700 space-y-1">
                                <p><strong>{savedAddress.receiverName}</strong></p>
                                <p>{savedAddress.phoneNumber}</p>
                                <p>{savedAddress.address}, {savedAddress.city}</p>
                              </div>
                            </div>
                          </div>
                          <div className="flex flex-col gap-2">
                            <button
                              onClick={() => {
                                console.log('✏️ Edit Address clicked');
                                console.log('Current saved address:', savedAddress);
                                // Pre-fill with saved address for editing
                                setOrderDetails(prev => ({
                                  ...prev,
                                  shippingInfo: {
                                    receiverName: savedAddress.receiverName || '',
                                    phoneNumber: savedAddress.phoneNumber || '',
                                    address: savedAddress.address || '',
                                    city: savedAddress.city || 'Kigali',
                                    country: savedAddress.country || 'Rwanda'
                                  }
                                }));
                                setShowNewAddressForm(true);
                                console.log('✅ Form opened for editing');
                              }}
                              className="text-xs bg-blue-100 text-blue-700 px-3 py-1 rounded-md hover:bg-blue-200 transition-colors flex items-center gap-1"
                            >
                              <PencilIcon className="h-3 w-3" />
                              Edit Address
                            </button>
                            <button
                              onClick={() => {
                                console.log('➕ New Address clicked');
                                // Clear form for new address but keep name/phone from customer info
                                setOrderDetails(prev => ({
                                  ...prev,
                                  shippingInfo: {
                                    receiverName: `${prev.customerInfo.firstName} ${prev.customerInfo.lastName}`.trim(),
                                    phoneNumber: prev.customerInfo.phoneNumber,
                                    address: '',
                                    city: 'Kigali',
                                    country: 'Rwanda'
                                  }
                                }));
                                setShowNewAddressForm(true);
                                console.log('✅ Form opened for new address');
                              }}
                              className="text-xs bg-green-100 text-green-700 px-3 py-1 rounded-md hover:bg-green-200 transition-colors flex items-center gap-1"
                            >
                              <PlusIcon className="h-3 w-3" />
                              New Address
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {/* New Address Form */}
                    {(!savedAddress || showNewAddressForm) && (
                      <div className="space-y-6">
                        {savedAddress && showNewAddressForm && (
                          <div className="flex items-center justify-between bg-blue-50 border border-blue-200 rounded-lg p-3">
                            <p className="text-sm text-blue-800 font-medium">
                              ✏️ Editing shipping address
                            </p>
                            <button
                              onClick={() => {
                                setShowNewAddressForm(false);
                                // Restore saved address
                                setOrderDetails(prev => ({
                                  ...prev,
                                  shippingInfo: savedAddress
                                }));
                              }}
                              className="text-xs bg-white text-blue-700 px-3 py-1 rounded-md hover:bg-blue-100 transition-colors"
                            >
                              Cancel
                            </button>
                          </div>
                        )}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Receiver Name *
                            </label>
                            <div className="relative">
                              <UserIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                              <input
                                type="text"
                                value={orderDetails.shippingInfo.receiverName}
                                onChange={(e) => handleShippingInfoChange('receiverName', e.target.value)}
                                placeholder="Full name"
                                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                              />
                            </div>
                            {formErrors.receiverName && (
                              <p className="text-red-500 text-sm mt-1">{formErrors.receiverName}</p>
                            )}
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Phone Number *
                            </label>
                            <div className="relative">
                              <PhoneIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                              <input
                                type="tel"
                                value={orderDetails.shippingInfo.phoneNumber}
                                onChange={(e) => handleShippingInfoChange('phoneNumber', e.target.value)}
                                placeholder="Phone number"
                                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                              />
                            </div>
                            {formErrors.phoneNumber && (
                              <p className="text-red-500 text-sm mt-1">{formErrors.phoneNumber}</p>
                            )}
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Street Address *
                          </label>
                          <div className="relative">
                            <MapPinIcon className="absolute left-3 top-3 h-5 w-5 text-gray-400 pointer-events-none" />
                            <textarea
                              value={orderDetails.shippingInfo.address || ''}
                              onChange={(e) => {
                                console.log('Address changed:', e.target.value);
                                handleShippingInfoChange('address', e.target.value);
                              }}
                              onFocus={() => console.log('Address field focused')}
                              placeholder="Street address, building, floor, room number..."
                              rows={3}
                              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 resize-none"
                              style={{ pointerEvents: 'auto' }}
                            />
                          </div>
                          {formErrors.address && (
                            <p className="text-red-500 text-sm mt-1">{formErrors.address}</p>
                          )}
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            City *
                          </label>
                          <input
                            type="text"
                            value={orderDetails.shippingInfo.city}
                            onChange={(e) => handleShippingInfoChange('city', e.target.value)}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                            placeholder="Kigali"
                          />
                          {formErrors.city && (
                            <p className="text-red-500 text-sm mt-1">{formErrors.city}</p>
                          )}
                        </div>

                        {/* Save Address Checkbox */}
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            id="saveAddress"
                            defaultChecked={true}
                            className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                          />
                          <label htmlFor="saveAddress" className="ml-2 text-sm text-gray-700">
                            Save this address as default for future orders
                          </label>
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      <button
                        onClick={handlePreviousStep}
                        className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        Back
                      </button>
                      <button
                        onClick={handleNextStep}
                        className="px-6 py-3 rounded-lg font-semibold text-white transition-colors bg-orange-500 hover:bg-orange-600"
                      >
                        Continue to Payment
                      </button>
                    </div>
                  </motion.div>
                )}

                {currentStep === 3 && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-6"
                  >
                    <h2 className="text-xl font-semibold text-gray-900 mb-6">Payment Method</h2>
                    
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                      <div className="flex items-center">
                        <TruckIcon className="h-6 w-6 text-yellow-600 mr-3" />
                        <div>
                          <p className="font-medium text-yellow-800">Free Shipping</p>
                          <p className="text-sm text-yellow-700">All orders ship free within Kigali, Rwanda</p>
                        </div>
                      </div>
                    </div>

                    {/* Payment Method Selection */}
                    <div className="mb-6">
                      <h4 className="font-medium text-gray-900 mb-3">Choose Payment Method</h4>
                      <div className="space-y-3">
                        <label className="flex items-center p-4 border-2 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                          <input
                            type="radio"
                            value="mobile_money"
                            checked={paymentMethod === 'mobile_money'}
                            onChange={(e) => setPaymentMethod(e.target.value)}
                            className="text-orange-600 focus:ring-orange-500"
                          />
                          <PhoneIcon className="w-5 h-5 ml-3 text-green-600" />
                          <span className="ml-3 font-medium">Mobile Money (InTouch Pay)</span>
                        </label>
                        
                        <label className="flex items-center p-4 border-2 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                          <input
                            type="radio"
                            value="cash_on_delivery"
                            checked={paymentMethod === 'cash_on_delivery'}
                            onChange={(e) => setPaymentMethod(e.target.value)}
                            className="text-orange-600 focus:ring-orange-500"
                          />
                          <TruckIcon className="w-5 h-5 ml-3 text-orange-600" />
                          <span className="ml-3 font-medium">Cash on Delivery</span>
                        </label>
                      </div>

                      {/* Phone Number Input for Mobile Money */}
                      {paymentMethod === 'mobile_money' && (
                        <div className="mt-4">
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Phone Number
                          </label>
                          <input
                            type="tel"
                            placeholder="250 788 940718"
                            value={phoneNumber}
                            onChange={(e) => setPhoneNumber(e.target.value)}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                          />
                        </div>
                      )}
                    </div>

                    {/* Payment Status Display */}
                    {paymentStatus && (
                      <div className={`mb-6 p-4 rounded-lg ${
                        paymentStatus === 'pending'
                          ? 'bg-blue-50 border border-blue-200'
                          : paymentStatus === 'success' 
                          ? 'bg-green-50 border border-green-200' 
                          : paymentStatus === 'failed' 
                          ? 'bg-red-50 border border-red-200' 
                          : 'bg-yellow-50 border border-yellow-200'
                      }`}>
                        <div className="flex items-center">
                          {paymentStatus === 'pending' ? (
                            <div className="h-6 w-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mr-3" />
                          ) : paymentStatus === 'success' ? (
                            <CheckCircleIcon className="h-6 w-6 text-green-500 mr-3" />
                          ) : paymentStatus === 'failed' ? (
                            <ExclamationTriangleIcon className="h-6 w-6 text-red-500 mr-3" />
                          ) : (
                            <div className="h-6 w-6 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin mr-3" />
                          )}
                          <div>
                            <p className={`font-medium ${
                              paymentStatus === 'pending'
                                ? 'text-blue-800'
                                : paymentStatus === 'success' 
                                ? 'text-green-800' 
                                : paymentStatus === 'failed' 
                                ? 'text-red-800' 
                                : 'text-yellow-800'
                            }`}>
                              {paymentStatus === 'pending'
                                ? 'Payment Pending!'
                                : paymentStatus === 'success' 
                                ? 'Payment Successful!' 
                                : paymentStatus === 'failed' 
                                ? 'Payment Failed' 
                                : 'Processing Payment...'
                              }
                            </p>
                            <p className={`text-sm ${
                              paymentStatus === 'pending'
                                ? 'text-blue-600'
                                : paymentStatus === 'success' 
                                ? 'text-green-600' 
                                : paymentStatus === 'failed' 
                                ? 'text-red-600' 
                                : 'text-yellow-600'
                            }`}>
                              {paymentStatus === 'pending'
                                ? 'Payment request sent. Please check your phone for confirmation.'
                                : paymentStatus === 'success' 
                                ? 'Your order has been confirmed and payment received.' 
                                : paymentStatus === 'failed' 
                                ? 'Please try again or contact support if the problem persists.' 
                                : 'Please wait while we process your payment...'
                              }
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Payment Buttons */}
                    <div className="space-y-4">
                      {paymentMethod === 'mobile_money' && (
                        <button
                          onClick={() => {
                            // Validate phone number
                            if (!phoneNumber || phoneNumber.trim() === '') {
                              setNotification({
                                type: 'error',
                                title: 'Phone Number Required',
                                message: 'Please enter your phone number for Mobile Money payment'
                              });
                              return;
                            }
                            
                            // Validate phone format (Rwanda: 250xxxxxxxxx or 07xxxxxxxx)
                            const cleanPhone = phoneNumber.replace(/\s+/g, '');
                            if (!/^(250|07|08)\d{8,9}$/.test(cleanPhone)) {
                              setNotification({
                                type: 'error',
                                title: 'Invalid Phone Number',
                                message: 'Please enter a valid Rwanda phone number',
                                details: {
                                  example: '250788940718'
                                }
                              });
                              return;
                            }
                            
                            handlePaymentSubmit({
                              method: 'mobile_money',
                              status: 'pending',
                              phone: cleanPhone
                            });
                          }}
                          disabled={isLoading || !phoneNumber}
                          className="w-full bg-green-600 text-white py-4 px-6 rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-semibold text-lg shadow-lg hover:shadow-xl"
                        >
                          {isLoading ? (
                            <div className="flex items-center justify-center">
                              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                              Processing...
                            </div>
                          ) : (
                            'Pay with Mobile Money'
                          )}
                        </button>
                      )}

                      {paymentMethod === 'cash_on_delivery' && (
                        <button
                          onClick={() => {
                            handlePaymentSubmit({
                              method: 'cash_on_delivery',
                              status: 'success'
                            });
                          }}
                          disabled={isLoading}
                          className="w-full bg-orange-600 text-white py-4 px-6 rounded-lg hover:bg-orange-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-semibold text-lg shadow-lg hover:shadow-xl"
                        >
                          {isLoading ? (
                            <div className="flex items-center justify-center">
                              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                              Processing...
                            </div>
                          ) : (
                            'Place Order (Cash on Delivery)'
                          )}
                        </button>
                      )}
                    </div>

                    <div className="flex justify-start">
                      <button
                        onClick={handlePreviousStep}
                        className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        Back to Shipping
                      </button>
                    </div>
                  </motion.div>
                )}
              </div>
            </div>

            {/* Enhanced 3D Order Summary Sidebar */}
            <div className="lg:col-span-1">
              <Enhanced3DCheckout cart={cart} cartTotal={cartTotal} shippingCost={shippingCost} />
            </div>
          </div>
        </div>

        {/* Payment Modal */}
        {showPaymentModal && (
          <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl p-8 max-w-md w-full mx-4 shadow-2xl">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-gray-900">Payment Instructions</h3>
                <button
                  onClick={() => setShowPaymentModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>
              
              <div className="space-y-6">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center">
                    <CheckCircleIcon className="h-8 w-8 text-green-600 mr-3 flex-shrink-0" />
                    <div>
                      <h4 className="font-bold text-green-800 text-lg">Order Placed Successfully!</h4>
                      <p className="text-sm text-green-700">Your order has been created and confirmation email sent.</p>
                    </div>
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                  <h4 className="font-bold text-blue-800 text-lg mb-3">Payment Instructions</h4>
                  <p className="text-sm text-blue-700 mb-4">
                    Please send payment to the following MOMO number:
                  </p>
                  <div className="bg-white border-2 border-blue-300 rounded-lg p-4 text-center">
                    <p className="font-bold text-2xl text-blue-800">
                      0782540683 (Uwase)
                    </p>
                  </div>
                  <p className="text-sm text-blue-700 mt-3 text-center">
                    Amount: <strong className="text-lg">RWF {totalAmount.toLocaleString()}</strong>
                  </p>
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <h4 className="font-semibold text-yellow-800 mb-2">Important Notes</h4>
                  <ul className="text-sm text-yellow-700 space-y-1">
                    <li>• Please include your order ID in the payment message</li>
                    <li>• Payment confirmation may take 5-10 minutes</li>
                    <li>• You will receive an email confirmation once payment is verified</li>
                    <li>• Orders are processed after payment confirmation</li>
                  </ul>
                </div>

                <div className="flex space-x-3">
                  <button
                    onClick={() => setShowPaymentModal(false)}
                    className="flex-1 px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors font-medium"
                  >
                    Close
                  </button>
                  <button
                    onClick={() => {
                      setShowPaymentModal(false);
                      navigate('/order-success', { 
                        state: { 
                          orderData: completedOrder,
                          orderId: completedOrder?.id,
                          customerId: completedOrder?.customerId,
                          customerName: `${orderDetails.customerInfo.firstName} ${orderDetails.customerInfo.lastName}`,
                          trackingId: completedOrder?.trackingId
                        } 
                      });
                    }}
                    className="flex-1 px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors font-semibold"
                  >
                    View Order
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Professional Notification Modal */}
      {notification && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden"
          >
            {/* Header */}
            <div className={`p-6 ${
              notification.type === 'success' ? 'bg-green-50' : 
              notification.type === 'error' ? 'bg-red-50' : 'bg-blue-50'
            }`}>
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-4">
                  {notification.type === 'success' ? (
                    <CheckCircleIcon className="h-10 w-10 text-green-600 flex-shrink-0" />
                  ) : notification.type === 'error' ? (
                    <ExclamationTriangleIcon className="h-10 w-10 text-red-600 flex-shrink-0" />
                  ) : (
                    <PhoneIcon className="h-10 w-10 text-blue-600 flex-shrink-0" />
                  )}
                  <div>
                    <h3 className={`text-xl font-bold ${
                      notification.type === 'success' ? 'text-green-900' :
                      notification.type === 'error' ? 'text-red-900' : 'text-blue-900'
                    }`}>
                      {notification.title}
                    </h3>
                    <p className={`text-sm mt-1 ${
                      notification.type === 'success' ? 'text-green-700' :
                      notification.type === 'error' ? 'text-red-700' : 'text-blue-700'
                    }`}>
                      {notification.message}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setNotification(null);
                    if (notification.type === 'success') {
                      navigate('/orders');
                    }
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>
            </div>

            {/* Details */}
            {notification.details && (
              <div className="p-6 bg-gray-50 border-t border-gray-200">
                <h4 className="font-semibold text-gray-900 mb-3">Transaction Details</h4>
                <dl className="space-y-2">
                  {Object.entries(notification.details).map(([key, value]) => (
                    <div key={key} className="flex justify-between text-sm">
                      <dt className="text-gray-600 capitalize">{key.replace(/([A-Z])/g, ' $1')}:</dt>
                      <dd className="font-medium text-gray-900">{value || 'N/A'}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            )}

            {/* Instructions */}
            {notification.instructions && (
              <div className="p-6 bg-blue-50 border-t border-blue-200">
                <h4 className="font-semibold text-blue-900 mb-3">How to Complete Payment</h4>
                <ol className="space-y-2">
                  {notification.instructions.map((step, index) => (
                    <li key={index} className="flex items-start text-sm text-blue-800">
                      <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center mr-3 text-xs font-bold">
                        {index + 1}
                      </span>
                      <span className="pt-0.5">{step}</span>
                    </li>
                  ))}
                </ol>
              </div>
            )}

            {/* Support Info */}
            {notification.support && (
              <div className="p-6 bg-gray-100 border-t border-gray-200">
                <h4 className="font-semibold text-gray-900 mb-2">Need Help?</h4>
                <div className="text-sm space-y-1">
                  <p className="text-gray-700">
                    📞 <a href={`tel:${notification.support.phone}`} className="text-blue-600 hover:underline">{notification.support.phone}</a>
                  </p>
                  <p className="text-gray-700">
                    📧 <a href={`mailto:${notification.support.email}`} className="text-blue-600 hover:underline">{notification.support.email}</a>
                  </p>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="p-6 bg-white border-t border-gray-200">
              <button
                onClick={() => {
                  setNotification(null);
                  if (notification.type === 'success') {
                    navigate('/orders');
                  }
                }}
                className={`w-full py-3 px-6 rounded-lg font-semibold text-white transition-colors ${
                  notification.type === 'success' 
                    ? 'bg-green-600 hover:bg-green-700'
                    : notification.type === 'error'
                    ? 'bg-red-600 hover:bg-red-700'
                    : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                {notification.type === 'success' ? 'View My Orders' : 'Close'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </>
  );
};

export default Checkout; 
