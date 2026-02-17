# Shipping Address Feature

## Overview
The shipping address feature allows customers to enter their delivery information (phone number, receiver name, and location) when adding items to cart or making purchases. This information is used to automatically create customer accounts for seamless shopping experience.

## Features

### 1. Shipping Address Form
- **Phone Number**: Validates Rwandan phone number format (+250, 250, or 0 prefix)
- **Receiver Name**: Full name of the person receiving the order
- **Location**: Detailed delivery address with landmarks and district information

### 2. Automatic Account Creation
- Creates customer account using phone number as identifier
- Generates email: `{phoneNumber}@sewithdebb.com`
- Generates password: `SEW{last6Digits}`
- Stores customer data in both API and localStorage (fallback)

### 3. Form Validation
- Phone number must be valid Rwandan format
- Receiver name must be at least 2 characters
- Location must be at least 5 characters for detailed address
- Real-time error clearing when user starts typing

### 4. Customer Data Management
- Checks for existing customers by phone number
- Updates existing customer information if found
- Creates new customer account if not found
- Stores shipping addresses separately for future use

## Implementation Details

### Files Modified
1. `frontend/src/pages/ProductDetail.jsx` - Main component with shipping modal
2. `frontend/src/services/api.js` - Added customer API endpoints
3. `frontend/src/utils/customerUtils.js` - Utility functions for customer management

### Key Functions

#### Customer Utilities (`customerUtils.js`)
- `validateRwandanPhone()` - Validates phone number format
- `formatPhoneNumber()` - Standardizes phone number format
- `createCustomerData()` - Creates customer account data
- `createShippingAddressData()` - Creates shipping address data
- `storeCustomerLocally()` - Stores customer in localStorage
- `storeShippingAddressLocally()` - Stores address in localStorage

#### API Endpoints (`api.js`)
- `customerAPI.createAccount()` - Creates customer account
- `customerAPI.getByPhone()` - Gets customer by phone number
- `customerAPI.addShippingAddress()` - Adds shipping address

### User Flow
1. User selects product size and clicks "Add to Cart" or "Buy Now"
2. Shipping address modal appears
3. User fills in phone number, receiver name, and location
4. Form validates input and shows errors if any
5. System checks if customer exists by phone number
6. If new customer, creates account automatically
7. Adds shipping address to customer profile
8. Adds item to cart with shipping information
9. Shows success message with account credentials
10. User can use credentials to log in later

### Data Storage
- **API First**: Attempts to store data via API endpoints
- **localStorage Fallback**: Stores data locally if API fails
- **Customer Data**: Stored in `localStorage.customers`
- **Shipping Addresses**: Stored in `localStorage.shippingAddresses`

### Account Credentials Display
- Shows phone number, email, and password in success message
- Displays for 8 seconds to give user time to save
- Clear instructions to save credentials for future login

## Benefits
1. **Seamless Experience**: No separate registration required
2. **Automatic Account Creation**: Customers get accounts without extra steps
3. **Data Persistence**: Information saved for future orders
4. **Validation**: Ensures data quality and format
5. **Fallback Support**: Works offline with localStorage
6. **User-Friendly**: Clear instructions and error messages

## Future Enhancements
- SMS verification for phone numbers
- Address autocomplete for Kigali locations
- Multiple shipping addresses per customer
- Address validation and geocoding
- Integration with delivery services 