const { sequelize, testConnection } = require('./config/database');
const { Product, Category } = require('./models');

const sampleProducts = [
  {
    name: "African Print Maxi Dress",
    description: "Beautiful African print maxi dress perfect for special occasions. Made with high-quality Ankara fabric featuring vibrant colors and traditional patterns.",
    price: 45000,
    originalPrice: 55000,
    category: "Women's Fashion",
    subcategory: "Dresses",
    brand: "SEWITHDEBBY",
    gender: "female",
    ageGroup: "adult",
    material: ["Cotton", "Ankara Fabric"],
    care: ["Hand wash", "Hang dry"],
    sizes: ["XS", "S", "M", "L", "XL"],
    colors: ["Blue", "Red", "Green"],
    variants: [
      {
        size: "M",
        color: "Blue",
        price: 45000,
        stockQuantity: 10,
        sku: "APMD-BLU-M"
      },
      {
        size: "L",
        color: "Blue",
        price: 45000,
        stockQuantity: 8,
        sku: "APMD-BLU-L"
      }
    ],
    mainImage: "https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=400&h=400&fit=crop",
    images: [
      "https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=400&h=400&fit=crop",
      "https://images.unsplash.com/photo-1539008835657-9e8e9680c956?w=400&h=400&fit=crop"
    ],
    isActive: true,
    isFeatured: true,
    isNew: true,
    tags: ["african print", "maxi dress", "ankara", "traditional"],
    stockQuantity: 18,
    lowStockThreshold: 5,
    sku: "APMD-001"
  },
  {
    name: "Men's Kente Shirt",
    description: "Traditional Kente shirt for men, perfect for cultural events and special occasions. Authentic Ghanaian design with premium fabric.",
    price: 35000,
    originalPrice: 40000,
    category: "Men's Fashion",
    subcategory: "Shirts",
    brand: "SEWITHDEBBY",
    gender: "male",
    ageGroup: "adult",
    material: ["Cotton", "Kente Fabric"],
    care: ["Dry clean only"],
    sizes: ["S", "M", "L", "XL", "XXL"],
    colors: ["Gold", "Black", "Red"],
    variants: [
      {
        size: "M",
        color: "Gold",
        price: 35000,
        stockQuantity: 12,
        sku: "MKS-GLD-M"
      }
    ],
    mainImage: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop",
    images: [
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop"
    ],
    isActive: true,
    isFeatured: true,
    tags: ["kente", "traditional", "ghanaian", "cultural"],
    stockQuantity: 12,
    lowStockThreshold: 3,
    sku: "MKS-001"
  },
  {
    name: "Children's Dashiki Set",
    description: "Adorable dashiki set for children, perfect for family gatherings and cultural celebrations. Comfortable and stylish.",
    price: 25000,
    originalPrice: 30000,
    category: "Kids & Baby",
    subcategory: "Traditional Wear",
    brand: "SEWITHDEBBY",
    gender: "unisex",
    ageGroup: "kids",
    material: ["Cotton", "African Print"],
    care: ["Machine wash", "Tumble dry"],
    sizes: ["2-3Y", "4-5Y", "6-7Y", "8-9Y"],
    colors: ["Multi-color", "Blue", "Pink"],
    variants: [
      {
        size: "4-5Y",
        color: "Multi-color",
        price: 25000,
        stockQuantity: 15,
        sku: "CDS-MC-4-5Y"
      }
    ],
    mainImage: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400&h=400&fit=crop",
    images: [
      "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400&h=400&fit=crop"
    ],
    isActive: true,
    isNew: true,
    tags: ["dashiki", "children", "traditional", "cultural"],
    stockQuantity: 15,
    lowStockThreshold: 5,
    sku: "CDS-001"
  },
  {
    name: "Women's Kitenge Skirt",
    description: "Elegant kitenge skirt with modern cut, perfect for office wear or casual outings. Comfortable and versatile.",
    price: 28000,
    originalPrice: 32000,
    category: "Women's Fashion",
    subcategory: "Skirts",
    brand: "SEWITHDEBBY",
    gender: "female",
    ageGroup: "adult",
    material: ["Cotton", "Kitenge Fabric"],
    care: ["Hand wash", "Line dry"],
    sizes: ["XS", "S", "M", "L"],
    colors: ["Purple", "Green", "Orange"],
    variants: [
      {
        size: "M",
        color: "Purple",
        price: 28000,
        stockQuantity: 20,
        sku: "WKS-PUR-M"
      }
    ],
    mainImage: "https://images.unsplash.com/photo-1583496661160-fb5886a1aaaa?w=400&h=400&fit=crop",
    images: [
      "https://images.unsplash.com/photo-1583496661160-fb5886a1aaaa?w=400&h=400&fit=crop"
    ],
    isActive: true,
    tags: ["kitenge", "skirt", "office wear", "versatile"],
    stockQuantity: 20,
    lowStockThreshold: 5,
    sku: "WKS-001"
  },
  {
    name: "Men's Agbada Ensemble",
    description: "Complete Agbada ensemble for special occasions. Traditional Nigerian attire made with premium fabric and excellent craftsmanship.",
    price: 85000,
    originalPrice: 100000,
    category: "Men's Fashion",
    subcategory: "Traditional Wear",
    brand: "SEWITHDEBBY",
    gender: "male",
    ageGroup: "adult",
    material: ["Silk", "Damask"],
    care: ["Dry clean only"],
    sizes: ["M", "L", "XL", "XXL"],
    colors: ["White", "Cream", "Gold"],
    variants: [
      {
        size: "L",
        color: "White",
        price: 85000,
        stockQuantity: 5,
        sku: "MAE-WHT-L"
      }
    ],
    mainImage: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop",
    images: [
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop"
    ],
    isActive: true,
    isSale: true,
    tags: ["agbada", "nigerian", "traditional", "formal"],
    stockQuantity: 5,
    lowStockThreshold: 2,
    sku: "MAE-001"
  }
];

async function seedProducts() {
  try {
    console.log('🌱 Starting product seeding...');

    // Test connection first
    await testConnection();

    // Clear existing products (for development)
    await Product.destroy({ where: {} });

    // Add sample products
    for (const productData of sampleProducts) {
      const product = await Product.create(productData);
      console.log(`✅ Added: ${product.name} (${product.sku})`);
    }

    console.log(`🎉 Successfully seeded ${sampleProducts.length} products!`);

    // Verify products were added
    const count = await Product.count();
    console.log(`📊 Total products in database: ${count}`);

  } catch (error) {
    console.error('❌ Error seeding products:', error.message);
    console.error(error);
  } finally {
    await sequelize.close();
  }
}

seedProducts();
