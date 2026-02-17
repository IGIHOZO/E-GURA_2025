const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const morgan = require('morgan');
const dotenv = require('dotenv');
const axios = require('axios');

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));
app.use(morgan('dev'));

// Basic route
app.get('/', (req, res) => {
  res.send('SEWITHDEBBY API is running');
});

// Mock data for testing without MongoDB
let mockProducts = [
  {
    _id: '1',
    name: "African Print Maxi Dress",
    description: "Beautiful traditional African print maxi dress perfect for special occasions.",
    shortDescription: "Traditional African print maxi dress",
    price: 45000,
    originalPrice: 55000,
    discountPercentage: 18,
    category: "Dresses",
    subcategory: "Maxi Dresses",
    brand: "SEWITHDEBBY",
    mainImage: "https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=400&h=500&fit=crop",
    images: [
      "https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=400&h=500&fit=crop",
      "https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=400&h=500&fit=crop&crop=face"
    ],
    gender: "female",
    ageGroup: "adult",
    material: ["Ankara", "Cotton"],
    care: ["Hand wash", "Cold water"],
    sizes: ["XS", "S", "M", "L", "XL"],
    colors: ["Blue/Orange", "Red/Green", "Purple/Yellow"],
    stockQuantity: 45,
    lowStockThreshold: 5,
    sku: "AFR-MAXI-001",
    isActive: true,
    isFeatured: true,
    isNew: true,
    isSale: true,
    isBestSeller: false,
    tags: ["african", "traditional", "maxi", "dress", "ankara"],
    averageRating: 4.8,
    totalReviews: 124,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    _id: '2',
    name: "Traditional Headwrap Set",
    description: "Elegant headwrap set made with premium African fabric.",
    shortDescription: "Traditional African headwrap set",
    price: 25000,
    originalPrice: 30000,
    discountPercentage: 17,
    category: "Accessories",
    subcategory: "Headwraps",
    brand: "SEWITHDEBBY",
    mainImage: "https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=400&h=500&fit=crop",
    images: [
      "https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=400&h=500&fit=crop",
      "https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=400&h=500&fit=crop&crop=face"
    ],
    gender: "female",
    ageGroup: "adult",
    material: ["Cotton", "Silk"],
    care: ["Hand wash", "Cold water"],
    sizes: ["One Size"],
    colors: ["Red", "Blue", "Green", "Yellow"],
    stockQuantity: 35,
    lowStockThreshold: 3,
    sku: "AFR-HEAD-001",
    isActive: true,
    isFeatured: false,
    isNew: false,
    isSale: true,
    isBestSeller: true,
    tags: ["headwrap", "traditional", "african", "accessory"],
    averageRating: 4.9,
    totalReviews: 89,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    _id: '3',
    name: "Kitenge Skirt and Blouse",
    description: "Modern African fusion outfit featuring a beautiful kitenge skirt and matching blouse.",
    shortDescription: "Modern African fusion skirt and blouse set",
    price: 35000,
    originalPrice: 40000,
    discountPercentage: 13,
    category: "Suits",
    subcategory: "African Suits",
    brand: "SEWITHDEBBY",
    mainImage: "https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=400&h=500&fit=crop",
    images: [
      "https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=400&h=500&fit=crop",
      "https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=400&h=500&fit=crop&crop=face"
    ],
    gender: "female",
    ageGroup: "adult",
    material: ["Kitenge", "Cotton"],
    care: ["Hand wash", "Cold water"],
    sizes: ["S", "M", "L", "XL"],
    colors: ["Blue/White", "Green/Black", "Red/White"],
    stockQuantity: 28,
    lowStockThreshold: 5,
    sku: "AFR-SUIT-001",
    isActive: true,
    isFeatured: true,
    isNew: true,
    isSale: false,
    isBestSeller: false,
    tags: ["kitenge", "skirt", "blouse", "african", "suit"],
    averageRating: 4.7,
    totalReviews: 156,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    _id: '4',
    name: "African Print Handbag",
    description: "Stylish handbag made with authentic African print fabric.",
    shortDescription: "African print handbag with multiple compartments",
    price: 18000,
    originalPrice: 22000,
    discountPercentage: 18,
    category: "Accessories",
    subcategory: "Bags",
    brand: "SEWITHDEBBY",
    mainImage: "https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=400&h=500&fit=crop",
    images: [
      "https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=400&h=500&fit=crop",
      "https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=400&h=500&fit=crop&crop=face"
    ],
    gender: "female",
    ageGroup: "adult",
    material: ["African Print", "Leather", "Canvas"],
    care: ["Wipe clean", "Do not wash"],
    sizes: ["One Size"],
    colors: ["Multi-color", "Blue/Orange", "Red/Green"],
    stockQuantity: 22,
    lowStockThreshold: 3,
    sku: "AFR-BAG-001",
    isActive: true,
    isFeatured: false,
    isNew: false,
    isSale: false,
    isBestSeller: true,
    tags: ["handbag", "african print", "accessory", "bag"],
    averageRating: 4.6,
    totalReviews: 203,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    _id: '5',
    name: "Modern African Fusion Dress",
    description: "Contemporary African fusion dress combining traditional patterns with modern design.",
    shortDescription: "Contemporary African fusion dress",
    price: 55000,
    originalPrice: 65000,
    discountPercentage: 15,
    category: "Dresses",
    subcategory: "Evening Dresses",
    brand: "SEWITHDEBBY",
    mainImage: "https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=400&h=500&fit=crop",
    images: [
      "https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=400&h=500&fit=crop",
      "https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=400&h=500&fit=crop&crop=face"
    ],
    gender: "female",
    ageGroup: "adult",
    material: ["Silk", "African Print"],
    care: ["Dry clean only"],
    sizes: ["XS", "S", "M", "L", "XL"],
    colors: ["Black/Red", "Blue/Gold", "Green/Silver"],
    stockQuantity: 18,
    lowStockThreshold: 2,
    sku: "AFR-FUSION-001",
    isActive: true,
    isFeatured: true,
    isNew: true,
    isSale: false,
    isBestSeller: false,
    tags: ["fusion", "modern", "african", "dress", "evening"],
    averageRating: 4.5,
    totalReviews: 98,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    _id: '6',
    name: "African Print Shirt",
    description: "Casual African print shirt perfect for everyday wear.",
    shortDescription: "Casual African print shirt",
    price: 22000,
    originalPrice: 28000,
    discountPercentage: 21,
    category: "Tops",
    subcategory: "Shirts",
    brand: "SEWITHDEBBY",
    mainImage: "https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=400&h=500&fit=crop",
    images: [
      "https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=400&h=500&fit=crop",
      "https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=400&h=500&fit=crop&crop=face"
    ],
    gender: "female",
    ageGroup: "adult",
    material: ["Cotton", "African Print"],
    care: ["Machine wash", "Cold water"],
    sizes: ["XS", "S", "M", "L", "XL"],
    colors: ["Blue/Orange", "Red/Green", "Yellow/Black"],
    stockQuantity: 32,
    lowStockThreshold: 5,
    sku: "AFR-SHIRT-001",
    isActive: true,
    isFeatured: false,
    isNew: false,
    isSale: true,
    isBestSeller: true,
    tags: ["shirt", "african print", "casual", "top"],
    averageRating: 4.4,
    totalReviews: 167,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    _id: '7',
    name: "Traditional Beaded Necklace",
    description: "Handcrafted beaded necklace with traditional African patterns.",
    shortDescription: "Handcrafted beaded necklace",
    price: 12000,
    originalPrice: 15000,
    discountPercentage: 20,
    category: "Accessories",
    subcategory: "Jewelry",
    brand: "SEWITHDEBBY",
    mainImage: "https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=400&h=500&fit=crop",
    images: [
      "https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=400&h=500&fit=crop",
      "https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=400&h=500&fit=crop&crop=face"
    ],
    gender: "female",
    ageGroup: "adult",
    material: ["Beads", "Leather", "Metal"],
    care: ["Wipe clean", "Store in dry place"],
    sizes: ["One Size"],
    colors: ["Multi-color", "Red/Black", "Blue/White"],
    stockQuantity: 25,
    lowStockThreshold: 3,
    sku: "AFR-NECK-001",
    isActive: true,
    isFeatured: false,
    isNew: false,
    isSale: true,
    isBestSeller: false,
    tags: ["necklace", "beaded", "traditional", "jewelry"],
    averageRating: 4.3,
    totalReviews: 89,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    _id: '8',
    name: "African Print Pants",
    description: "Comfortable African print pants perfect for casual and formal occasions.",
    shortDescription: "Comfortable African print pants",
    price: 28000,
    originalPrice: 35000,
    discountPercentage: 20,
    category: "Bottoms",
    subcategory: "Pants",
    brand: "SEWITHDEBBY",
    mainImage: "https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=400&h=500&fit=crop",
    images: [
      "https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=400&h=500&fit=crop",
      "https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=400&h=500&fit=crop&crop=face"
    ],
    gender: "female",
    ageGroup: "adult",
    material: ["Cotton", "African Print"],
    care: ["Machine wash", "Cold water"],
    sizes: ["XS", "S", "M", "L", "XL"],
    colors: ["Blue/Orange", "Red/Green", "Purple/Yellow"],
    stockQuantity: 30,
    lowStockThreshold: 5,
    sku: "AFR-PANTS-001",
    isActive: true,
    isFeatured: false,
    isNew: false,
    isSale: true,
    isBestSeller: false,
    tags: ["pants", "african print", "casual", "formal"],
    averageRating: 4.2,
    totalReviews: 134,
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

// Mock orders data
const mockOrders = [
  {
    _id: '1',
    user: {
      _id: 'user1',
      name: 'Alice Uwimana',
      email: 'alice@example.com',
      phone: '+250788123456'
    },
    items: [
      {
        product: '1',
        name: 'African Print Maxi Dress',
        price: 45000,
        quantity: 1,
        size: 'M',
        color: 'Blue/Orange'
      }
    ],
    totalAmount: 45000,
    status: 'pending',
    paymentMethod: 'mobile_money',
    shippingAddress: {
      street: '123 Kigali Street',
      city: 'Kigali',
      country: 'Rwanda',
      postalCode: '0000'
    },
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

// Mock users data
const mockUsers = [
  {
    _id: 'user1',
    name: 'Alice Uwimana',
    email: 'alice@example.com',
    phone: '+250788123456',
    role: 'customer',
    createdAt: new Date()
  }
];

// Mock API routes for testing
app.get('/api/products', (req, res) => {
  const { limit = 20, category, minPrice, maxPrice, sort, inStock, new: isNew, sale } = req.query;
  
  let filteredProducts = [...mockProducts];
  
  // Apply filters
  if (category) {
    filteredProducts = filteredProducts.filter(p => p.category === category);
  }
  
  if (minPrice || maxPrice) {
    filteredProducts = filteredProducts.filter(p => {
      const price = p.price;
      return (!minPrice || price >= parseInt(minPrice)) && (!maxPrice || price <= parseInt(maxPrice));
    });
  }
  
  if (inStock === 'true') {
    filteredProducts = filteredProducts.filter(p => p.stockQuantity > 0);
  }
  
  if (isNew === 'true') {
    filteredProducts = filteredProducts.filter(p => p.isNew);
  }
  
  if (sale === 'true') {
    filteredProducts = filteredProducts.filter(p => p.isSale);
  }
  
  // Apply sorting
  if (sort) {
    switch (sort) {
      case 'price_asc':
        filteredProducts.sort((a, b) => a.price - b.price);
        break;
      case 'price_desc':
        filteredProducts.sort((a, b) => b.price - a.price);
        break;
      case 'featured':
        filteredProducts.sort((a, b) => b.isFeatured - a.isFeatured);
        break;
      case 'newest':
        filteredProducts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        break;
      case 'rating':
        filteredProducts.sort((a, b) => b.averageRating - a.averageRating);
        break;
    }
  }
  
  // Apply limit
  const limitedProducts = filteredProducts.slice(0, parseInt(limit));
  
  res.json({
    success: true,
    data: limitedProducts,
    pagination: {
      page: 1,
      limit: parseInt(limit),
      total: filteredProducts.length,
      pages: Math.ceil(filteredProducts.length / parseInt(limit))
    }
  });
});

// Image upload route
app.post('/api/upload/image', (req, res) => {
  // Generate a consistent image URL based on timestamp
  const timestamp = Date.now();
  const uploadedImageUrl = `https://images.unsplash.com/photo-${timestamp}?w=400&h=500&fit=crop&auto=format&q=80`;
  
  console.log('Image uploaded:', uploadedImageUrl);
  
  res.json({
    success: true,
    imageUrl: uploadedImageUrl,
    url: uploadedImageUrl, // Add url for compatibility
    message: 'Image uploaded successfully'
  });
});

app.post('/api/upload/images', (req, res) => {
  // Mock multiple images upload response
  const imageCount = req.body.count || 3;
  const mockImageUrls = Array.from({ length: imageCount }, () => 
    `https://images.unsplash.com/photo-${Math.random().toString(36).substring(7)}?w=400&h=500&fit=crop`
  );
  
  res.json({
    success: true,
    imageUrls: mockImageUrls,
    message: 'Images uploaded successfully'
  });
});

app.get('/api/products/featured', (req, res) => {
  const featuredProducts = mockProducts.filter(p => p.isFeatured);
  res.json({
    success: true,
    data: featuredProducts
  });
});

app.get('/api/products/new-arrivals', (req, res) => {
  const newProducts = mockProducts.filter(p => p.isNew);
  res.json({
    success: true,
    data: newProducts
  });
});

app.get('/api/products/sale', (req, res) => {
  const saleProducts = mockProducts.filter(p => p.isSale);
  res.json({
    success: true,
    data: saleProducts
  });
});

app.get('/api/products/categories', (req, res) => {
  const categories = [...new Set(mockProducts.map(p => p.category))];
  const subcategories = [...new Set(mockProducts.map(p => p.subcategory).filter(Boolean))];
  const brands = [...new Set(mockProducts.map(p => p.brand))];
  
  res.json({
    success: true,
    data: {
      categories,
      subcategories,
      brands
    }
  });
});

app.get('/api/products/search', (req, res) => {
  const { q, limit = 10 } = req.query;
  
  let searchResults = mockProducts;
  
  if (q) {
    searchResults = mockProducts.filter(p => 
      p.name.toLowerCase().includes(q.toLowerCase()) ||
      p.description.toLowerCase().includes(q.toLowerCase()) ||
      p.tags.some(tag => tag.toLowerCase().includes(q.toLowerCase()))
    );
  }
  
  const limitedResults = searchResults.slice(0, parseInt(limit));
  
  res.json({
    success: true,
    data: limitedResults
  });
});

app.get('/api/products/:id', (req, res) => {
  const product = mockProducts.find(p => p._id === req.params.id);
  
  if (!product) {
    return res.status(404).json({
      success: false,
      message: 'Product not found'
    });
  }
  
  res.json({
    success: true,
    data: product
  });
});

// Mock orders API
app.post('/api/orders', (req, res) => {
  try {
    const { items, user, shippingAddress, paymentMethod } = req.body;
    
    // Calculate total
    const totalAmount = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    // Create new order
    const newOrder = {
      _id: Date.now().toString(),
      user,
      items,
      totalAmount,
      status: 'pending',
      paymentMethod,
      shippingAddress,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    mockOrders.push(newOrder);
    
    res.status(201).json({
      success: true,
      data: newOrder,
      message: 'Order created successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error creating order',
      error: error.message
    });
  }
});

app.get('/api/orders', (req, res) => {
  res.json({
    success: true,
    data: mockOrders,
    pagination: {
      page: 1,
      limit: 10,
      total: mockOrders.length,
      pages: 1
    }
  });
});

app.get('/api/orders/:id', (req, res) => {
  const order = mockOrders.find(o => o._id === req.params.id);
  if (!order) {
    return res.status(404).json({
      success: false,
      message: 'Order not found'
    });
  }
  res.json({
    success: true,
    data: order
  });
});

app.put('/api/orders/:id/status', (req, res) => {
  const { status } = req.body;
  const order = mockOrders.find(o => o._id === req.params.id);
  if (!order) {
    return res.status(404).json({
      success: false,
      message: 'Order not found'
    });
  }
  
  order.status = status;
  order.updatedAt = new Date();
  
  res.json({
    success: true,
    data: order,
    message: 'Order status updated'
  });
});

// Payment routes
app.post('/api/payments/process', (req, res) => {
  try {
    const { orderId, paymentMethod, amount } = req.body;
    
    // Simulate payment processing
    const paymentResult = {
      success: true,
      transactionId: `TXN_${Date.now()}`,
      orderId,
      amount,
      paymentMethod,
      status: 'completed',
      message: 'Payment processed successfully'
    };
    
    // Update order status
    const order = mockOrders.find(o => o._id === orderId);
    if (order) {
      order.status = 'paid';
      order.updatedAt = new Date();
    }
    
    res.json(paymentResult);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Payment processing failed',
      error: error.message
    });
  }
});

// Cart routes
app.post('/api/cart/add', (req, res) => {
  try {
    const { productId, quantity, size, color } = req.body;
    const product = mockProducts.find(p => p._id === productId);
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }
    
    const cartItem = {
      productId,
      name: product.name,
      price: product.price,
      image: product.mainImage,
      quantity,
      size,
      color
    };
    
    res.json({
      success: true,
      data: cartItem,
      message: 'Item added to cart'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error adding to cart',
      error: error.message
    });
  }
});

// User routes
app.get('/api/users', (req, res) => {
  res.json({
    success: true,
    data: mockUsers,
    pagination: {
      page: 1,
      limit: 10,
      total: mockUsers.length,
      pages: 1
    }
  });
});

// Mock admin API
app.get('/api/admin/products', (req, res) => {
  res.json({
    success: true,
    data: mockProducts,
    pagination: {
      page: 1,
      limit: 20,
      total: mockProducts.length,
      pages: 1
    }
  });
});

app.post('/api/admin/products', (req, res) => {
  console.log('Creating new product:', req.body);
  
  const newProduct = {
    _id: Date.now().toString(),
    ...req.body,
    createdAt: new Date(),
    updatedAt: new Date()
  };
  
  console.log('New product created:', newProduct);
  mockProducts.push(newProduct);
  
  console.log('Total products in mockProducts:', mockProducts.length);
  
  res.status(201).json({
    success: true,
    data: newProduct,
    message: 'Product created successfully'
  });
});

app.put('/api/admin/products/:id', (req, res) => {
  const productIndex = mockProducts.findIndex(p => p._id === req.params.id);
  
  if (productIndex === -1) {
    return res.status(404).json({
      success: false,
      message: 'Product not found'
    });
  }
  
  mockProducts[productIndex] = {
    ...mockProducts[productIndex],
    ...req.body,
    updatedAt: new Date()
  };
  
  res.json({
    success: true,
    data: mockProducts[productIndex],
    message: 'Product updated successfully'
  });
});

app.delete('/api/admin/products/:id', (req, res) => {
  const productIndex = mockProducts.findIndex(p => p._id === req.params.id);
  
  if (productIndex === -1) {
    return res.status(404).json({
      success: false,
      message: 'Product not found'
    });
  }
  
  mockProducts.splice(productIndex, 1);
  
  res.json({
    success: true,
    message: 'Product deleted successfully'
  });
});

// Mock orders admin API
app.get('/api/admin/orders', (req, res) => {
  const mockOrders = [
    {
      _id: '1',
      orderNumber: 'ORD-001',
      items: [{ name: 'African Print Maxi Dress', price: 45000, quantity: 1 }],
      total: 47000,
      status: 'pending',
      paymentMethod: 'mobile_money',
      shippingAddress: { firstName: 'John', lastName: 'Doe', email: 'john@example.com' },
      createdAt: new Date()
    }
  ];
  
  res.json({
    success: true,
    data: mockOrders,
    pagination: {
      page: 1,
      limit: 20,
      total: mockOrders.length,
      pages: 1
    }
  });
});

// Mock users admin API
app.get('/api/admin/users', (req, res) => {
  const mockUsers = [
    {
      _id: '1',
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      phone: '+250123456789',
      isActive: true,
      createdAt: new Date()
    }
  ];
  
  res.json({
    success: true,
    data: mockUsers,
    pagination: {
      page: 1,
      limit: 20,
      total: mockUsers.length,
      pages: 1
    }
  });
});

// Mock analytics API
app.get('/api/admin/analytics', (req, res) => {
  res.json({
    success: true,
    data: {
      revenue: { total: 1250000, period: 30 },
      orders: { total: 45, recent: [] },
      products: { total: mockProducts.length, active: mockProducts.filter(p => p.isActive).length, lowStock: 3 },
      users: { total: 120, active: 115 },
      payments: { total: 45, methods: [] },
      topProducts: []
    }
  });
});

// Mock shipping addresses API
app.post('/api/customers/shipping-addresses', (req, res) => {
  try {
    const { phoneNumber, receiverName, location } = req.body;
    
    // Mock response - in real app this would save to database
    res.json({
      success: true,
      message: 'Shipping address saved successfully',
      data: {
        id: Date.now().toString(),
        phoneNumber,
        receiverName,
        location,
        isDefault: true,
        createdAt: new Date()
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error saving shipping address',
      error: error.message
    });
  }
});

app.get('/api/customers/shipping-addresses', (req, res) => {
  try {
    const { phoneNumber } = req.query;
    
    // Mock response - in real app this would fetch from database
    const mockAddresses = phoneNumber ? [
      {
        id: '1',
        phoneNumber,
        receiverName: 'John Doe',
        location: 'Kigali, Rwanda',
        isDefault: true,
        createdAt: new Date()
      }
    ] : [];
    
    res.json({
      success: true,
      data: mockAddresses
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching shipping addresses',
      error: error.message
    });
  }
});

// Mock customer API routes
app.post('/api/customers/create-account', (req, res) => {
  try {
    const { phoneNumber, firstName, lastName, email } = req.body;
    
    res.json({
      success: true,
      message: 'Customer account created successfully',
      data: {
        id: Date.now().toString(),
        phoneNumber,
        firstName,
        lastName,
        email,
        createdAt: new Date()
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error creating customer account',
      error: error.message
    });
  }
});

app.get('/api/customers/phone/:phoneNumber', (req, res) => {
  try {
    const { phoneNumber } = req.params;
    
    // Mock customer data
    const customer = {
      id: '1',
      phoneNumber,
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      createdAt: new Date()
    };
    
    res.json({
      success: true,
      data: customer
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching customer',
      error: error.message
    });
  }
});

app.put('/api/customers/profile', (req, res) => {
  try {
    const { firstName, lastName, email } = req.body;
    
    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        id: '1',
        firstName,
        lastName,
        email,
        updatedAt: new Date()
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating profile',
      error: error.message
    });
  }
});

// Direct payment route to handle /api/orders/pay/new
app.post('/api/orders/pay/:orderId', (req, res) => {
  try {
    const { orderId } = req.params;
    const { type, phone, orderData } = req.body;
    
    console.log('Payment request received:', { orderId, type, phone, orderData });
    
    if (type === 'momo') {
      if (!phone) {
        return res.status(400).json({ message: 'Phone number is required for MOMO payment' });
      }
      
      // Create a mock order for payment processing
      const mockOrder = {
        _id: orderId === 'new' ? `order_${Date.now()}` : orderId,
        total: orderData?.total || 25000,
        externalId: `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        paymentStatus: 'pending',
        status: 'pending'
      };
      
      // Mock InTouch Pay API response
      const mockResponse = {
        success: true,
        status: 'Pending',
        message: 'Payment request sent. Please check your phone for confirmation.',
        transactionId: mockOrder.externalId,
        responsecode: '1000'
      };
      
      console.log('Mock InTouch Pay Response:', mockResponse);
      
      res.json({
        success: true,
        data: mockResponse,
        transactionId: mockOrder.externalId,
        message: 'Payment request sent. Please check your phone for confirmation.',
        status: 'pending',
        responseCode: '1000'
      });
    } else {
      res.status(400).json({ message: 'Unsupported payment type' });
    }
  } catch (error) {
    console.error('Payment processing error:', error);
    res.status(500).json({ message: 'Error processing payment', error: error.message });
  }
});

// Payment status route
app.get('/api/orders/status/:orderId', (req, res) => {
  try {
    const { orderId } = req.params;
    
    // Mock order status
    const mockOrder = {
      _id: orderId,
      paymentStatus: 'pending',
      status: 'pending',
      total: 25000
    };
    
    res.json({
      success: true,
      order: mockOrder
    });
  } catch (error) {
    console.error('Get payment status error:', error);
    res.status(500).json({ message: 'Error retrieving payment status', error: error.message });
  }
});

// SMS Routes
const smsRoutes = require('./routes/sms');
app.use('/api/sms', smsRoutes);

// InTouch Pay Callback endpoint (based on Java implementation)
app.post('/api/payments/callback/:transactionId', (req, res) => {
  try {
    const { transactionId } = req.params;
    const callbackData = req.body.jsonpayload || req.body;
    
    console.log('InTouch Pay Callback received:', { 
      transactionId, 
      callbackData 
    });
    
    // Parse callback data according to InTouch Pay API documentation
    const { 
      requesttransactionid, 
      transactionid, 
      responsecode, 
      status, 
      statusdesc, 
      referenceno 
    } = callbackData;
    
    // Check if payment was successful (response code '01' means successful)
    if (responsecode === '01' || status === 'Successfully') {
      console.log('Payment completed successfully for transaction:', requesttransactionid);
      
      // In a real implementation, you would update the order status in the database
      // For now, we'll just log the success
      
      res.json({
        message: 'success',
        success: true,
        request_id: requesttransactionid
      });
    } else {
      console.log('Payment failed for transaction:', requesttransactionid);
      
      res.json({
        message: 'failed',
        success: false,
        request_id: requesttransactionid
      });
    }
  } catch (error) {
    console.error('InTouch Pay callback error:', error);
    res.status(500).json({ message: 'Error processing callback', error: error.message });
  }
});



// Export mockProducts and mockOrders so admin routes can access them
global.mockProducts = mockProducts;
global.mockOrders = mockOrders;

// Import and use route files (these will be used when MongoDB is available)
// const authRoutes = require('./routes/auth');
// const productRoutes = require('./routes/product');
// const orderRoutes = require('./routes/order');
// const reviewRoutes = require('./routes/review');
const adminRoutes = require('./routes/admin');
// const aiRoutes = require('./routes/ai');
const paymentRoutes = require('./routes/payment');
// const userRoutes = require('./routes/user');

// Routes
// app.use('/api/products', productRoutes);
// app.use('/api/orders', orderRoutes);
// app.use('/api/reviews', reviewRoutes);
app.use('/api/admin', adminRoutes);
// app.use('/api/ai', aiRoutes);
app.use('/api/payments', paymentRoutes);
// app.use('/api/users', userRoutes);

// MongoDB connection
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/sewithdebby';
const PORT = process.env.PORT || 5000;

// Configure mongoose to not buffer commands and set shorter timeout
mongoose.set('bufferCommands', false);
mongoose.set('bufferTimeoutMS', 3000);

// Start server even if MongoDB fails
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log('📝 Using mock data for testing (MongoDB not required)');
  
  // Try to connect to MongoDB with shorter timeout
  mongoose.connect(MONGO_URI, { 
    serverSelectionTimeoutMS: 3000,
    connectTimeoutMS: 3000
  })
    .then(() => {
      console.log('✅ MongoDB connected successfully');
      console.log('🔄 Switching to real database mode');
    })
    .catch((err) => {
      console.log('⚠️  MongoDB connection failed - using mock data mode');
      console.log('   Error:', err.message);
      console.log('✅ Server is running with mock data');
    });
}); 