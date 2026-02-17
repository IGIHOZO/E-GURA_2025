const { sequelize, testConnection } = require('./config/database');
const { Product } = require('./models');

// Random data generators
const categories = [
  "Women's Fashion",
  "Men's Fashion",
  "Kids & Baby",
  "Electronics",
  "Home & Garden",
  "Beauty & Health",
  "Sports & Entertainment",
  "Automotive",
  "Toys & Hobbies",
  "Jewelry & Watches"
];

const subcategories = {
  "Women's Fashion": ["Dresses", "Tops", "Skirts", "Pants", "Accessories"],
  "Men's Fashion": ["Shirts", "Pants", "Suits", "Jackets", "Accessories"],
  "Kids & Baby": ["Boys", "Girls", "Baby", "Toys", "School Supplies"],
  "Electronics": ["Phones", "Laptops", "Tablets", "Accessories", "Audio"],
  "Home & Garden": ["Furniture", "Decor", "Kitchen", "Bedding", "Garden"],
  "Beauty & Health": ["Skincare", "Makeup", "Haircare", "Wellness", "Fragrance"],
  "Sports & Entertainment": ["Fitness", "Outdoor", "Gaming", "Sports Gear"],
  "Automotive": ["Parts", "Accessories", "Tools", "Care Products"],
  "Toys & Hobbies": ["Action Figures", "Puzzles", "Games", "Crafts"],
  "Jewelry & Watches": ["Necklaces", "Rings", "Watches", "Bracelets"]
};

const brands = ["E-Gura Store", "SEWITHDEBBY", "Nike", "Adidas", "Zara", "H&M", "Uniqlo", "Samsung", "LG", "Sony"];
const colors = ["Black", "White", "Blue", "Red", "Green", "Yellow", "Purple", "Pink", "Orange", "Brown", "Gray"];
const sizes = ["XS", "S", "M", "L", "XL", "XXL"];
const materials = ["Cotton", "Polyester", "Silk", "Denim", "Leather", "Wool", "Linen"];

const productNames = [
  "Premium", "Classic", "Modern", "Vintage", "Luxury", "Elegant", "Stylish", 
  "Comfortable", "Designer", "Professional", "Casual", "Sporty", "Chic"
];

const productTypes = [
  "Shirt", "Dress", "Pants", "Jacket", "Shoes", "Bag", "Watch", "Phone",
  "Laptop", "Headphones", "Speaker", "Camera", "Sofa", "Table", "Lamp",
  "Perfume", "Cream", "Lipstick", "Toy", "Game", "Book", "Tablet"
];

const imageUrls = [
  "photo-1523275335684-37898b6baf30",
  "photo-1505740420928-5e560c06d30e",
  "photo-1542291026-7eec264c27ff",
  "photo-1572635196237-14b3f281503f",
  "photo-1553062407-98eeb64c6a62",
  "photo-1560343090-f0409e92791a",
  "photo-1441986300917-64674bd600d8",
  "photo-1523380677598-64d85d015339",
  "photo-1485230895905-ec40ba36b9bc",
  "photo-1491553895911-0055eca6402d",
  "photo-1556742049-0cfed4f6a45d",
  "photo-1583496661160-fb5886a1aaaa",
  "photo-1595777457583-95e059d581b8",
  "photo-1539008835657-9e8e9680c956",
  "photo-1507003211169-0a1dd7228f2d",
  "photo-1544367567-0f2fcb009e0b"
];

function getRandomItem(array) {
  return array[Math.floor(Math.random() * array.length)];
}

function getRandomItems(array, count) {
  const shuffled = [...array].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

function getRandomPrice(min = 5000, max = 100000) {
  return Math.floor((Math.random() * (max - min) + min) / 1000) * 1000;
}

function generateRandomProduct(index) {
  const category = getRandomItem(categories);
  const subcategory = getRandomItem(subcategories[category]);
  const basePrice = getRandomPrice(5000, 100000);
  const discount = Math.random() > 0.5 ? Math.random() * 0.3 + 0.1 : 0; // 0-40% discount
  const price = Math.floor(basePrice * (1 - discount) / 1000) * 1000;
  const originalPrice = discount > 0 ? basePrice : null;
  
  const productName = `${getRandomItem(productNames)} ${getRandomItem(productTypes)}`;
  const brand = getRandomItem(brands);
  const selectedColors = getRandomItems(colors, Math.floor(Math.random() * 3) + 1);
  const selectedSizes = getRandomItems(sizes, Math.floor(Math.random() * 4) + 2);
  const stockQuantity = Math.floor(Math.random() * 50) + 10;
  
  return {
    name: `${productName} ${index}`,
    description: `High-quality ${productName.toLowerCase()} perfect for everyday use. ${category} product with excellent features and modern design. Made with premium materials for lasting durability.`,
    shortDescription: `${productName} - ${category}`,
    price: price,
    originalPrice: originalPrice,
    category: category,
    subcategory: subcategory,
    brand: brand,
    gender: ["Women's Fashion", "Beauty & Health"].includes(category) ? "female" : 
            ["Men's Fashion", "Automotive"].includes(category) ? "male" : "unisex",
    ageGroup: category === "Kids & Baby" ? "kids" : "adult",
    material: getRandomItems(materials, Math.floor(Math.random() * 2) + 1),
    care: ["Machine wash", "Hand wash", "Dry clean"],
    sizes: selectedSizes,
    colors: selectedColors,
    variants: selectedSizes.slice(0, 2).map((size, i) => ({
      size: size,
      color: selectedColors[0],
      price: price,
      stockQuantity: Math.floor(stockQuantity / 2),
      sku: `${productName.substring(0, 3).toUpperCase()}-${size}-${i}`
    })),
    mainImage: `https://images.unsplash.com/${getRandomItem(imageUrls)}?w=400&h=400&fit=crop&q=80`,
    images: [
      `https://images.unsplash.com/${getRandomItem(imageUrls)}?w=400&h=400&fit=crop&q=80`,
      `https://images.unsplash.com/${getRandomItem(imageUrls)}?w=400&h=400&fit=crop&q=80`
    ],
    isActive: true,
    isFeatured: Math.random() > 0.7,
    isNew: Math.random() > 0.6,
    isSale: discount > 0,
    isBestSeller: Math.random() > 0.8,
    tags: [category.toLowerCase(), productName.toLowerCase(), brand.toLowerCase()],
    stockQuantity: stockQuantity,
    lowStockThreshold: 5,
    sku: `PROD-${String(index).padStart(4, '0')}`,
    averageRating: (Math.random() * 2 + 3).toFixed(1), // 3.0-5.0
    totalReviews: Math.floor(Math.random() * 500),
    salesCount: Math.floor(Math.random() * 1000),
    weight: Math.floor(Math.random() * 2000) + 100,
    dimensions: {
      length: Math.floor(Math.random() * 50) + 10,
      width: Math.floor(Math.random() * 50) + 10,
      height: Math.floor(Math.random() * 50) + 10
    },
    freeShipping: Math.random() > 0.5,
    shippingCost: Math.random() > 0.5 ? 0 : Math.floor(Math.random() * 5000) + 1000
  };
}

async function seedRandomProducts(count = 35) {
  try {
    console.log(`🌱 Starting random product seeding (${count} products)...`);

    // Test connection first
    await testConnection();

    // Check current products
    const currentCount = await Product.count();
    console.log(`📊 Current products in database: ${currentCount}`);

    if (currentCount > 0) {
      console.log('⚠️  Clearing existing products...');
      await Product.destroy({ where: {} });
      console.log('✅ Existing products cleared');
    }

    // Generate and add random products
    console.log(`\n🔄 Generating ${count} random products...`);
    const products = [];
    
    for (let i = 1; i <= count; i++) {
      const productData = generateRandomProduct(i);
      products.push(productData);
      
      if (i % 5 === 0) {
        process.stdout.write(`\r📦 Generated: ${i}/${count} products`);
      }
    }
    
    console.log(`\n\n💾 Saving products to database...`);
    
    // Bulk create for better performance
    await Product.bulkCreate(products);
    
    console.log(`\n✅ Successfully seeded ${count} random products!`);

    // Verify products were added
    const finalCount = await Product.count();
    console.log(`📊 Total products in database: ${finalCount}`);
    
    // Show sample of created products
    const samples = await Product.findAll({ 
      limit: 5,
      attributes: ['name', 'category', 'price', 'sku']
    });
    
    console.log('\n📋 Sample products:');
    samples.forEach(p => {
      console.log(`   - ${p.name} | ${p.category} | RWF ${p.price.toLocaleString()} | ${p.sku}`);
    });

    console.log('\n🎉 Done! You can now test pagination on the shop page.');
    console.log(`💡 With ${count} products and 24 per page, you'll have ${Math.ceil(count/24)} pages.`);

  } catch (error) {
    console.error('❌ Error seeding products:', error.message);
    console.error(error);
  } finally {
    await sequelize.close();
  }
}

// Get count from command line argument or default to 35
const productCount = parseInt(process.argv[2]) || 35;
seedRandomProducts(productCount);
