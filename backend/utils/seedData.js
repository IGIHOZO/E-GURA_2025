const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Product = require('../models/Product');
const User = require('../models/User');
const Order = require('../models/Order');
const Payment = require('../models/Payment');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/sewithdebby';

// Sample Products Data
const sampleProducts = [
  {
    name: 'Ankara Print Maxi Dress',
    slug: 'ankara-print-maxi-dress',
    description: 'Beautiful Ankara print maxi dress perfect for special occasions in Kigali. Made with premium African fabric.',
    shortDescription: 'Elegant Ankara print maxi dress for special occasions',
    price: 45000,
    originalPrice: 55000,
    discountPercentage: 18,
    mainImage: 'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=400&h=500&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=400&h=500&fit=crop',
      'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=400&h=500&fit=crop'
    ],
    category: 'Dresses',
    subcategory: 'Maxi Dresses',
    brand: 'SEWITHDEBBY',
    tags: ['ankara', 'maxi dress', 'african print', 'special occasion', 'kigali fashion'],
    gender: 'female',
    ageGroup: 'adult',
    material: ['Cotton', 'Ankara Print'],
    care: ['Hand wash', 'Iron on low heat'],
    sizes: ['XS', 'S', 'M', 'L', 'XL'],
    colors: ['Blue/Orange', 'Red/Green', 'Purple/Yellow'],
    stockQuantity: 25,
    lowStockThreshold: 5,
    sku: 'ANK-MAXI-001',
    isActive: true,
    isFeatured: true,
    isNew: true,
    isBestSeller: true,
    metaTitle: 'Ankara Print Maxi Dress - SEWITHDEBBY',
    metaDescription: 'Beautiful Ankara print maxi dress perfect for special occasions in Kigali',
    keywords: ['ankara dress', 'african fashion', 'kigali', 'maxi dress'],
    weight: 0.8,
    dimensions: { length: 120, width: 10, height: 5 },
    shippingClass: 'standard',
    careInstructions: ['Hand wash in cold water', 'Iron on low heat', 'Do not bleach'],
    returnPolicy: '30 days return policy',
    warranty: '1 year warranty'
  },
  {
    name: 'Traditional Headwrap Set',
    slug: 'traditional-headwrap-set',
    description: 'Authentic traditional headwrap set with matching accessories. Perfect for cultural events and celebrations.',
    shortDescription: 'Traditional headwrap set with matching accessories',
    price: 25000,
    originalPrice: 30000,
    discountPercentage: 17,
    mainImage: 'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=400&h=500&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=400&h=500&fit=crop'
    ],
    category: 'Accessories',
    subcategory: 'Headwraps',
    brand: 'SEWITHDEBBY',
    tags: ['headwrap', 'traditional', 'cultural', 'accessories'],
    gender: 'female',
    ageGroup: 'adult',
    material: ['Cotton', 'Silk'],
    care: ['Hand wash', 'Air dry'],
    sizes: ['One Size'],
    colors: ['Red', 'Blue', 'Green', 'Yellow'],
    stockQuantity: 15,
    lowStockThreshold: 3,
    sku: 'HEAD-001',
    isActive: true,
    isFeatured: true,
    isNew: false,
    isBestSeller: true,
    metaTitle: 'Traditional Headwrap Set - SEWITHDEBBY',
    metaDescription: 'Authentic traditional headwrap set for cultural events',
    keywords: ['headwrap', 'traditional', 'cultural', 'african accessories'],
    weight: 0.3,
    dimensions: { length: 50, width: 50, height: 2 },
    shippingClass: 'standard',
    careInstructions: ['Hand wash in cold water', 'Air dry', 'Iron on low heat'],
    returnPolicy: '30 days return policy',
    warranty: '6 months warranty'
  },
  {
    name: 'Kitenge Skirt and Blouse',
    slug: 'kitenge-skirt-blouse',
    description: 'Elegant Kitenge skirt and blouse set. Perfect for church services and formal events in Rwanda.',
    shortDescription: 'Elegant Kitenge skirt and blouse set for formal events',
    price: 35000,
    originalPrice: 40000,
    discountPercentage: 13,
    mainImage: 'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=400&h=500&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=400&h=500&fit=crop'
    ],
    category: 'Suits',
    subcategory: 'Skirt Suits',
    brand: 'SEWITHDEBBY',
    tags: ['kitenge', 'skirt', 'blouse', 'formal', 'church', 'rwanda'],
    gender: 'female',
    ageGroup: 'adult',
    material: ['Kitenge Fabric', 'Cotton'],
    care: ['Hand wash', 'Iron on medium heat'],
    sizes: ['S', 'M', 'L', 'XL'],
    colors: ['Blue/White', 'Green/Black', 'Red/White'],
    stockQuantity: 20,
    lowStockThreshold: 5,
    sku: 'KIT-SUIT-001',
    isActive: true,
    isFeatured: true,
    isNew: false,
    isBestSeller: true,
    metaTitle: 'Kitenge Skirt and Blouse Set - SEWITHDEBBY',
    metaDescription: 'Elegant Kitenge skirt and blouse set for formal events',
    keywords: ['kitenge', 'skirt suit', 'formal wear', 'church', 'rwanda'],
    weight: 1.2,
    dimensions: { length: 80, width: 15, height: 8 },
    shippingClass: 'standard',
    careInstructions: ['Hand wash in cold water', 'Iron on medium heat', 'Do not bleach'],
    returnPolicy: '30 days return policy',
    warranty: '1 year warranty'
  },
  {
    name: 'African Print Handbag',
    slug: 'african-print-handbag',
    description: 'Stylish handbag made with authentic African print fabric. Perfect for everyday use and special occasions.',
    shortDescription: 'Stylish handbag with authentic African print',
    price: 18000,
    originalPrice: 22000,
    discountPercentage: 18,
    mainImage: 'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=400&h=500&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=400&h=500&fit=crop'
    ],
    category: 'Accessories',
    subcategory: 'Bags',
    brand: 'SEWITHDEBBY',
    tags: ['handbag', 'african print', 'accessories', 'everyday'],
    gender: 'female',
    ageGroup: 'adult',
    material: ['African Print Fabric', 'Leather'],
    care: ['Wipe with damp cloth', 'Keep dry'],
    sizes: ['One Size'],
    colors: ['Multi-color', 'Blue/Orange', 'Red/Green'],
    stockQuantity: 30,
    lowStockThreshold: 8,
    sku: 'BAG-001',
    isActive: true,
    isFeatured: false,
    isNew: true,
    isBestSeller: false,
    metaTitle: 'African Print Handbag - SEWITHDEBBY',
    metaDescription: 'Stylish handbag with authentic African print fabric',
    keywords: ['handbag', 'african print', 'accessories', 'kigali fashion'],
    weight: 0.5,
    dimensions: { length: 30, width: 15, height: 20 },
    shippingClass: 'standard',
    careInstructions: ['Wipe with damp cloth', 'Keep dry', 'Store in cool place'],
    returnPolicy: '30 days return policy',
    warranty: '6 months warranty'
  },
  {
    name: 'Modern African Fusion Dress',
    slug: 'modern-african-fusion-dress',
    description: 'Contemporary dress that fuses modern design with traditional African elements. Perfect for parties and events.',
    shortDescription: 'Contemporary dress with traditional African elements',
    price: 55000,
    originalPrice: 65000,
    discountPercentage: 15,
    mainImage: 'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=400&h=500&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=400&h=500&fit=crop'
    ],
    category: 'Dresses',
    subcategory: 'Cocktail Dresses',
    brand: 'SEWITHDEBBY',
    tags: ['modern', 'african fusion', 'cocktail dress', 'party', 'contemporary'],
    gender: 'female',
    ageGroup: 'adult',
    material: ['Silk', 'African Print', 'Lace'],
    care: ['Dry clean only'],
    sizes: ['XS', 'S', 'M', 'L', 'XL'],
    colors: ['Black/Red', 'Blue/Gold', 'Green/Silver'],
    stockQuantity: 12,
    lowStockThreshold: 3,
    sku: 'FUSION-001',
    isActive: true,
    isFeatured: true,
    isNew: true,
    isBestSeller: false,
    metaTitle: 'Modern African Fusion Dress - SEWITHDEBBY',
    metaDescription: 'Contemporary dress with traditional African elements',
    keywords: ['modern african', 'fusion dress', 'cocktail', 'party', 'contemporary'],
    weight: 1.0,
    dimensions: { length: 100, width: 12, height: 6 },
    shippingClass: 'express',
    careInstructions: ['Dry clean only', 'Store in garment bag'],
    returnPolicy: '30 days return policy',
    warranty: '1 year warranty'
  }
];

// Sample Users Data
const sampleUsers = [
  {
    firstName: 'Alice',
    lastName: 'Uwimana',
    email: 'alice@example.com',
    phone: '+250788123456',
    password: 'password123',
    profile: {
      gender: 'female',
      preferences: {
        newsletter: true,
        marketing: false,
        notifications: true
      }
    },
    addresses: [
      {
        type: 'home',
        firstName: 'Alice',
        lastName: 'Uwimana',
        phone: '+250788123456',
        address: '123 Kimihurura Street',
        city: 'Kigali',
        district: 'Gasabo',
        postalCode: '00001',
        country: 'Rwanda',
        isDefault: true,
        instructions: 'Call before delivery'
      }
    ],
    paymentMethods: [
      {
        type: 'mobile_money',
        provider: 'momo',
        accountNumber: '+250788123456',
        isDefault: true,
        isActive: true
      }
    ],
    preferences: {
      size: 'M',
      favoriteColors: ['Blue', 'Red', 'Green'],
      favoriteCategories: ['Dresses', 'Accessories'],
      budget: { min: 10000, max: 100000 },
      style: ['Traditional', 'Modern']
    },
    role: 'customer'
  },
  {
    firstName: 'John',
    lastName: 'Ndayisaba',
    email: 'john@example.com',
    phone: '+250789123456',
    password: 'password123',
    profile: {
      gender: 'male',
      preferences: {
        newsletter: true,
        marketing: true,
        notifications: true
      }
    },
    addresses: [
      {
        type: 'home',
        firstName: 'John',
        lastName: 'Ndayisaba',
        phone: '+250789123456',
        address: '456 Remera Avenue',
        city: 'Kigali',
        district: 'Kicukiro',
        postalCode: '00002',
        country: 'Rwanda',
        isDefault: true
      }
    ],
    paymentMethods: [
      {
        type: 'mobile_money',
        provider: 'airtel_money',
        accountNumber: '+250789123456',
        isDefault: true,
        isActive: true
      }
    ],
    preferences: {
      size: 'L',
      favoriteColors: ['Black', 'Blue'],
      favoriteCategories: ['Suits', 'Accessories'],
      budget: { min: 20000, max: 150000 },
      style: ['Modern', 'Traditional']
    },
    role: 'customer'
  }
];

// Seed function
const seedData = async () => {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB');

    // Clear existing data
    console.log('Clearing existing data...');
    await Product.deleteMany({});
    await User.deleteMany({});
    await Order.deleteMany({});
    await Payment.deleteMany({});

    // Create products
    console.log('Creating products...');
    const products = await Product.insertMany(sampleProducts);
    console.log(`Created ${products.length} products`);

    // Create users
    console.log('Creating users...');
    const users = await User.insertMany(sampleUsers);
    console.log(`Created ${users.length} users`);

    // Create sample orders
    console.log('Creating sample orders...');
    const sampleOrders = [
      {
        user: users[0]._id,
        items: [
          {
            product: products[0]._id,
            quantity: 1,
            price: products[0].price,
            size: 'M',
            color: 'Blue/Orange'
          }
        ],
        subtotal: products[0].price,
        tax: products[0].price * 0.18,
        shippingCost: 0, // Free shipping over 50,000
        discount: 0,
        total: products[0].price * 1.18,
        paymentMethod: 'mobile_money',
        shippingAddress: users[0].addresses[0],
        status: 'confirmed',
        paymentStatus: 'completed'
      },
      {
        user: users[1]._id,
        items: [
          {
            product: products[1]._id,
            quantity: 2,
            price: products[1].price,
            size: 'One Size',
            color: 'Red'
          },
          {
            product: products[3]._id,
            quantity: 1,
            price: products[3].price,
            size: 'One Size',
            color: 'Multi-color'
          }
        ],
        subtotal: (products[1].price * 2) + products[3].price,
        tax: ((products[1].price * 2) + products[3].price) * 0.18,
        shippingCost: 0,
        discount: 0,
        total: ((products[1].price * 2) + products[3].price) * 1.18,
        paymentMethod: 'cash_on_delivery',
        shippingAddress: users[1].addresses[0],
        status: 'pending',
        paymentStatus: 'pending'
      }
    ];

    const orders = await Order.insertMany(sampleOrders);
    console.log(`Created ${orders.length} orders`);

    // Create sample payments
    console.log('Creating sample payments...');
    const samplePayments = [
      {
        order: orders[0]._id,
        user: users[0]._id,
        amount: orders[0].total,
        paymentMethod: 'mobile_money',
        status: 'completed',
        mobileMoney: {
          provider: 'momo',
          phoneNumber: '+250788123456',
          transactionId: 'MM123456789',
          status: 'success',
          responseCode: '00',
          responseMessage: 'Payment successful',
          initiatedAt: new Date(Date.now() - 3600000),
          completedAt: new Date(Date.now() - 3500000)
        },
        initiatedAt: new Date(Date.now() - 3600000),
        completedAt: new Date(Date.now() - 3500000)
      },
      {
        order: orders[1]._id,
        user: users[1]._id,
        amount: orders[1].total,
        paymentMethod: 'cash_on_delivery',
        status: 'pending',
        cashOnDelivery: {
          amount: orders[1].total,
          changeRequired: 0,
          deliveryInstructions: 'Call before delivery'
        },
        initiatedAt: new Date()
      }
    ];

    const payments = await Payment.insertMany(samplePayments);
    console.log(`Created ${payments.length} payments`);

    console.log('Data seeding completed successfully!');
    console.log('\nSample Data Summary:');
    console.log(`- Products: ${products.length}`);
    console.log(`- Users: ${users.length}`);
    console.log(`- Orders: ${orders.length}`);
    console.log(`- Payments: ${payments.length}`);

    console.log('\nSample User Credentials:');
    console.log('Email: alice@example.com, Password: password123');
    console.log('Email: john@example.com, Password: password123');

    process.exit(0);
  } catch (error) {
    console.error('Error seeding data:', error);
    process.exit(1);
  }
};

// Run seeder if called directly
if (require.main === module) {
  seedData();
}

module.exports = { seedData }; 