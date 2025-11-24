# SEWITHDEBBY API Documentation

## Overview
SEWITHDEBBY is a comprehensive ecommerce platform for African fashion, specifically designed for the Kigali market. This API provides full functionality for product management, order processing, payment gateways, and user management.

## Base URL
```
http://localhost:5000/api
```

## Authentication
Most endpoints require authentication using JWT tokens. Include the token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

---

## 🔐 Authentication Endpoints

### Register User
```http
POST /auth/register
```
**Body:**
```json
{
  "firstName": "Alice",
  "lastName": "Uwimana",
  "email": "alice@example.com",
  "phone": "+250788123456",
  "password": "password123"
}
```

### Login User
```http
POST /auth/login
```
**Body:**
```json
{
  "email": "alice@example.com",
  "password": "password123"
}
```

---

## 🛍️ Product Endpoints

### Get All Products
```http
GET /products?page=1&limit=12&category=Dresses&minPrice=10000&maxPrice=100000&sort=price_asc
```

### Get Featured Products
```http
GET /products/featured
```

### Get New Arrivals
```http
GET /products/new-arrivals
```

### Get Sale Products
```http
GET /products/sale
```

### Get Product by ID
```http
GET /products/:id
```

### Search Products
```http
GET /products/search?q=ankara&category=Dresses&priceRange=10000-50000
```

### Get Product Categories
```http
GET /products/categories
```

---

## 🛒 Order Management

### Create Order
```http
POST /orders
```
**Body:**
```json
{
  "items": [
    {
      "product": "64f8a1b2c3d4e5f6a7b8c9d0",
      "quantity": 2,
      "size": "M",
      "color": "Blue/Orange"
    }
  ],
  "shippingAddress": {
    "firstName": "Alice",
    "lastName": "Uwimana",
    "phone": "+250788123456",
    "email": "alice@example.com",
    "address": "123 Kimihurura Street",
    "city": "Kigali",
    "district": "Gasabo",
    "postalCode": "00001",
    "country": "Rwanda",
    "instructions": "Call before delivery"
  },
  "paymentMethod": "mobile_money",
  "notes": "Please deliver in the morning",
  "couponCode": "WELCOME10"
}
```

### Get User Orders
```http
GET /orders/user-orders?page=1&limit=10&status=confirmed
```

### Get Order by ID
```http
GET /orders/:orderId
```

### Cancel Order
```http
POST /orders/:orderId/cancel
```
**Body:**
```json
{
  "reason": "Changed my mind"
}
```

### Return Order
```http
POST /orders/:orderId/return
```
**Body:**
```json
{
  "reason": "Size doesn't fit"
}
```

### Track Order (Public)
```http
GET /orders/track/:orderNumber
```

---

## 💳 Payment Gateway Endpoints

### Mobile Money Payment

#### Initiate Mobile Money Payment
```http
POST /payments/mobile-money/initiate
```
**Body:**
```json
{
  "orderId": "64f8a1b2c3d4e5f6a7b8c9d0",
  "provider": "momo",
  "phoneNumber": "+250788123456",
  "amount": 53100
}
```

#### Verify Mobile Money Payment
```http
GET /payments/mobile-money/verify/:transactionId
```

### MOMO Pay Payment

#### Initiate MOMO Pay Payment
```http
POST /payments/momo-pay/initiate
```
**Body:**
```json
{
  "orderId": "64f8a1b2c3d4e5f6a7b8c9d0",
  "amount": 53100,
  "callbackUrl": "https://sewithdebby.com/payment/callback"
}
```

#### MOMO Pay Callback (Webhook)
```http
POST /payments/momo-pay/callback
```
**Body:**
```json
{
  "transactionId": "MP123456789",
  "status": "success",
  "responseCode": "00",
  "responseMessage": "Payment successful"
}
```

### Cash on Delivery

#### Process Cash on Delivery
```http
POST /payments/cash-on-delivery
```
**Body:**
```json
{
  "orderId": "64f8a1b2c3d4e5f6a7b8c9d0",
  "amount": 53100,
  "changeRequired": 0,
  "deliveryInstructions": "Call before delivery"
}
```

### Payment Management

#### Get Payment Status
```http
GET /payments/status/:paymentId
```

#### Get User Payments
```http
GET /payments/user-payments?page=1&limit=10&status=completed
```

#### Refund Payment
```http
POST /payments/refund/:paymentId
```
**Body:**
```json
{
  "reason": "Customer requested refund",
  "amount": 53100
}
```

---

## 👤 User Management

### Get User Profile
```http
GET /users/profile
```

### Update User Profile
```http
PUT /users/profile
```
**Body:**
```json
{
  "firstName": "Alice",
  "lastName": "Uwimana",
  "phone": "+250788123456",
  "profile": {
    "gender": "female",
    "dateOfBirth": "1990-01-01",
    "bio": "Fashion enthusiast"
  },
  "preferences": {
    "size": "M",
    "favoriteColors": ["Blue", "Red"],
    "favoriteCategories": ["Dresses", "Accessories"]
  }
}
```

### Address Management

#### Add Address
```http
POST /users/addresses
```
**Body:**
```json
{
  "type": "home",
  "firstName": "Alice",
  "lastName": "Uwimana",
  "phone": "+250788123456",
  "address": "123 Kimihurura Street",
  "city": "Kigali",
  "district": "Gasabo",
  "postalCode": "00001",
  "country": "Rwanda",
  "isDefault": true,
  "instructions": "Call before delivery"
}
```

#### Update Address
```http
PUT /users/addresses/:addressId
```

#### Delete Address
```http
DELETE /users/addresses/:addressId
```

### Payment Method Management

#### Add Payment Method
```http
POST /users/payment-methods
```
**Body:**
```json
{
  "type": "mobile_money",
  "provider": "momo",
  "accountNumber": "+250788123456",
  "isDefault": true
}
```

#### Update Payment Method
```http
PUT /users/payment-methods/:methodId
```

#### Delete Payment Method
```http
DELETE /users/payment-methods/:methodId
```

### Get User Analytics
```http
GET /users/analytics?period=30
```

---

## 🤖 AI Features

### Get AI Recommendations
```http
POST /ai/recommendations
```
**Body:**
```json
{
  "userId": "64f8a1b2c3d4e5f6a7b8c9d0",
  "productId": "64f8a1b2c3d4e5f6a7b8c9d0",
  "userPreferences": {
    "style": "traditional",
    "colors": ["blue", "red"],
    "budget": 50000
  },
  "location": "Kigali"
}
```

### Virtual Try-On
```http
POST /ai/virtual-tryon
```
**Body:**
```json
{
  "productId": "64f8a1b2c3d4e5f6a7b8c9d0",
  "userImage": "data:image/jpeg;base64,...",
  "bodyType": "hourglass",
  "skinTone": "medium",
  "preferences": {
    "style": "modern",
    "occasion": "wedding"
  }
}
```

### Style Analysis
```http
POST /ai/style-analysis
```
**Body:**
```json
{
  "userImage": "data:image/jpeg;base64,...",
  "preferences": {
    "style": "traditional",
    "colors": ["blue", "red"]
  },
  "occasion": "church",
  "location": "Kigali"
}
```

### Get Kigali Fashion Trends
```http
GET /ai/kigali-trends
```

### Smart Search
```http
POST /ai/smart-search
```
**Body:**
```json
{
  "query": "ankara dress for wedding",
  "userPreferences": {
    "style": "traditional",
    "budget": 50000
  },
  "location": "Kigali"
}
```

### Size Recommendation
```http
POST /ai/size-recommendation
```
**Body:**
```json
{
  "productId": "64f8a1b2c3d4e5f6a7b8c9d0",
  "userMeasurements": {
    "bust": 36,
    "waist": 28,
    "hips": 38
  },
  "bodyType": "hourglass",
  "preferences": {
    "fit": "comfortable"
  }
}
```

---

## 📊 Admin Endpoints

### Get Order Analytics
```http
GET /orders/admin/analytics?period=30
```

### Get All Orders (Admin)
```http
GET /orders/admin/all-orders?page=1&limit=20&status=confirmed&paymentMethod=mobile_money&search=alice
```

### Update Order Status (Admin)
```http
PUT /orders/:orderId/status
```
**Body:**
```json
{
  "status": "shipped",
  "trackingNumber": "TRK123456789",
  "estimatedDelivery": "2024-01-20",
  "adminNote": "Shipped via express delivery"
}
```

---

## 📝 Review Endpoints

### Create Review
```http
POST /reviews
```
**Body:**
```json
{
  "productId": "64f8a1b2c3d4e5f6a7b8c9d0",
  "rating": 5,
  "comment": "Beautiful dress, perfect fit!"
}
```

### Get Product Reviews
```http
GET /reviews/product/:productId?page=1&limit=10
```

---

## 🔧 Error Responses

All endpoints return consistent error responses:

```json
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error message"
}
```

## 📈 Success Responses

Successful responses follow this format:

```json
{
  "success": true,
  "data": { ... },
  "message": "Operation completed successfully"
}
```

---

## 🚀 Getting Started

1. **Install Dependencies:**
   ```bash
   cd backend
   npm install
   ```

2. **Set Environment Variables:**
   Create a `.env` file:
   ```
   PORT=5000
   MONGO_URI=mongodb://localhost:27017/sewithdebby
   JWT_SECRET=your-secret-key
   OPENAI_API_KEY=your-openai-key
   MOMO_MERCHANT_ID=your-momo-merchant-id
   ```

3. **Seed Sample Data:**
   ```bash
   node utils/seedData.js
   ```

4. **Start the Server:**
   ```bash
   node index.js
   ```

---

## 💡 Payment Gateway Integration

### Mobile Money Providers
- **MOMO (MTN)**: Most popular in Rwanda
- **Airtel Money**: Alternative mobile money
- **M-Pesa**: Available in some regions

### MOMO Pay Integration
- QR Code generation
- Payment URL creation
- Webhook callbacks
- Transaction verification

### Cash on Delivery
- Order confirmation
- Delivery instructions
- Payment collection tracking
- Change calculation

---

## 🎯 Features Summary

### ✅ Implemented Features
- [x] Complete product catalog with advanced filtering
- [x] Mobile money payment integration (MOMO, Airtel Money)
- [x] MOMO Pay gateway with QR codes
- [x] Cash on delivery processing
- [x] Comprehensive order management
- [x] User profile and address management
- [x] AI-powered recommendations and virtual try-on
- [x] Kigali-specific fashion trends
- [x] Smart search with location context
- [x] Size recommendation system
- [x] Order tracking and status updates
- [x] Payment refund processing
- [x] Admin analytics and management
- [x] Review and rating system
- [x] SEO optimization for Kigali market

### 🔄 Payment Flow Examples

#### Mobile Money Flow:
1. User creates order
2. Initiates mobile money payment
3. Receives payment prompt on phone
4. Completes payment
5. System verifies payment
6. Order status updated to confirmed

#### MOMO Pay Flow:
1. User creates order
2. Initiates MOMO Pay payment
3. Receives QR code or payment URL
4. Scans QR code or visits URL
5. Completes payment
6. Webhook callback updates order

#### Cash on Delivery Flow:
1. User creates order
2. Selects cash on delivery
3. Order confirmed immediately
4. Payment collected upon delivery
5. Order status updated to delivered

---

## 🌍 Kigali-Specific Features

- **Local Currency**: All prices in RWF (Rwandan Francs)
- **Local Payment Methods**: MOMO, Airtel Money, Cash on Delivery
- **Local Addresses**: Kigali districts and neighborhoods
- **Local Fashion**: Ankara, Kitenge, traditional wear
- **Local Events**: Church services, weddings, cultural events
- **Local Weather**: Tropical highland climate considerations
- **Local SEO**: Kigali-specific keywords and meta tags

This API provides a complete ecommerce solution tailored specifically for the Kigali fashion market with full payment gateway integration and AI-powered features. 