/**
 * Advanced SEO Generator for Rwanda/Kigali Market
 * Generates HIGH-SCORE unique SEO titles and descriptions
 * Targets Kigali-Rwanda specifically with varied templates
 */

class SEOGenerator {
  constructor() {
    // Category to subcategory mapping for auto-detection
    this.categoryMapping = {
      'Electronics': {
        subcategories: ['Phones', 'Laptops', 'Tablets', 'Cameras', 'Headphones', 'Speakers', 'Chargers', 'Accessories'],
        keywords: ['phone', 'iphone', 'samsung', 'laptop', 'computer', 'tablet', 'ipad', 'camera', 'headphone', 'earphone', 'speaker', 'charger', 'cable', 'keyboard', 'mouse', 'tv', 'monitor', 'watch', 'smartwatch']
      },
      "Women's Fashion": {
        subcategories: ['Dresses', 'Tops', 'Skirts', 'Pants', 'Shoes', 'Bags', 'Jewelry', 'Accessories'],
        keywords: ['dress', 'blouse', 'skirt', 'heels', 'handbag', 'necklace', 'earring', 'bracelet', 'scarf', 'clutch', 'gown', 'jumpsuit']
      },
      "Men's Fashion": {
        subcategories: ['Shirts', 'Pants', 'Suits', 'Shoes', 'Watches', 'Accessories'],
        keywords: ['shirt', 'trouser', 'suit', 'tie', 'blazer', 'jacket', 'polo', 'jeans', 'sneaker', 'loafer', 'belt', 'wallet', 'cufflink']
      },
      'Sports & Entertainment': {
        subcategories: ['Sportswear', 'Equipment', 'Fitness', 'Outdoor'],
        keywords: ['yoga', 'gym', 'football', 'basketball', 'tennis', 'running', 'bicycle', 'fitness', 'dumbbell', 'mat', 'ball', 'jersey']
      },
      'Home & Garden': {
        subcategories: ['Furniture', 'Kitchen', 'Bedding', 'Decor', 'Garden'],
        keywords: ['sofa', 'bed', 'table', 'chair', 'lamp', 'curtain', 'pillow', 'blanket', 'pot', 'pan', 'knife', 'blender', 'rug']
      },
      'Beauty & Health': {
        subcategories: ['Skincare', 'Makeup', 'Haircare', 'Perfumes', 'Health'],
        keywords: ['makeup', 'lipstick', 'foundation', 'mascara', 'perfume', 'skincare', 'shampoo', 'conditioner', 'serum', 'cream', 'lotion']
      },
      'Kids & Baby': {
        subcategories: ['Baby Clothing', 'Toys', 'Baby Care', 'Kids Shoes'],
        keywords: ['baby', 'kids', 'toy', 'diaper', 'stroller', 'bottle', 'children', 'infant', 'toddler']
      },
      'Automotive': {
        subcategories: ['Car Accessories', 'Motorcycle', 'Tools'],
        keywords: ['car', 'tire', 'motor', 'vehicle', 'auto', 'engine', 'brake', 'oil', 'battery']
      },
      'Jewelry & Watches': {
        subcategories: ['Necklaces', 'Rings', 'Watches', 'Bracelets'],
        keywords: ['ring', 'necklace', 'watch', 'bracelet', 'gold', 'silver', 'diamond', 'chain', 'pendant']
      },
      'Toys & Hobbies': {
        subcategories: ['Action Figures', 'Educational', 'Games', 'Puzzles'],
        keywords: ['toy', 'game', 'puzzle', 'doll', 'lego', 'robot', 'rc', 'drone']
      }
    };

    // Unique title templates - VARIED formats (no repetition)
    this.titleTemplates = [
      '{name} - Buy Online in Kigali, Rwanda',
      '{name} | Best Price in Kigali',
      'Shop {name} in Rwanda | Fast Delivery',
      '{name} for Sale in Kigali | E-Gura',
      'Buy {name} Online - Kigali Rwanda',
      '{name} | Free Delivery Kigali',
      'Original {name} - Shop Kigali',
      '{name} Available in Rwanda | Order Now',
      'Quality {name} | Kigali Store',
      '{name} - Rwanda\'s Best Prices',
      'Get {name} Delivered in Kigali',
      '{name} | Trusted Seller Rwanda',
      'Affordable {name} in Kigali',
      '{name} - Same Day Delivery Kigali',
      'Premium {name} | Shop Rwanda'
    ];

    // Unique description templates - VARIED formats targeting Kigali-Rwanda
    this.descriptionTemplates = [
      'Buy {name} in Kigali, Rwanda. {category} at unbeatable prices. Fast delivery across Gasabo, Kicukiro, Nyarugenge. Order now!',
      'Shop {name} online at E-Gura. Quality {category} delivered to your door in Kigali. Best prices in Rwanda guaranteed.',
      'Looking for {name}? Get it delivered fast in Kigali. Premium {category} with warranty. Trusted by thousands in Rwanda.',
      '{name} available now in Kigali, Rwanda. Top quality {category}. Free delivery for orders above 50,000 RWF. Shop today!',
      'Order {name} online in Rwanda. Authentic {category} with fast Kigali delivery. Pay on delivery available.',
      'Discover {name} at E-Gura Kigali. {category} at wholesale prices. Delivery to Remera, Kimihurura, Nyamirambo & more.',
      '{name} - Rwanda\'s favorite {category}. Shop online, get it delivered in Kigali within 24 hours. Quality guaranteed.',
      'Get the best {name} in Kigali. Affordable {category} with express delivery. Serving all Rwanda districts.',
      'Shop authentic {name} in Rwanda. {category} from trusted brands. Kigali same-day delivery available.',
      '{name} now available at E-Gura. Premium {category} for Kigali customers. Secure payment, fast shipping.',
      'Buy original {name} online. Best {category} deals in Rwanda. Delivery across Kigali City.',
      '{name} for sale in Kigali, Rwanda. Quality {category} at competitive prices. Order online, pay on delivery.',
      'Find {name} at Rwanda\'s leading online store. {category} with warranty. Fast Kigali delivery.',
      'Shop {name} today in Kigali. Genuine {category} with best prices. Free returns within 7 days.',
      '{name} available for immediate delivery in Rwanda. Top {category} selection. Shop E-Gura Kigali.'
    ];

    // Features for variety
    this.qualifiers = ['Premium', 'Quality', 'Authentic', 'Original', 'Genuine', 'Top-rated', 'Best-selling', 'Popular'];
    this.usedTemplateIndex = { title: -1, desc: -1 };

    // Product-specific specs templates
    this.productSpecs = {
      // Electronics - Chargers
      'charger': {
        specs: ['20W Fast Charging', '65W GaN Technology', '30W USB-C PD', '18W Quick Charge 3.0', '45W Super Fast'],
        features: ['Type-C Port', 'USB-A + USB-C Dual Port', 'Compact Design', 'Overcharge Protection', 'Universal Compatibility'],
        templates: [
          '{name} - {spec}. {feature}. Fast charging for all devices. Buy in Kigali, Rwanda.',
          'Shop {name} with {spec} power output. {feature}. Safe & reliable. Delivery across Rwanda.',
          '{name} featuring {spec}. {feature}. Perfect for iPhone, Samsung & more. Kigali store.'
        ]
      },
      // Electronics - Laptops
      'laptop': {
        specs: ['8GB RAM, 256GB SSD', '16GB RAM, 512GB SSD', '8GB RAM, 512GB SSD, Windows 11', '16GB RAM, 1TB SSD, Windows 11 Pro', '32GB RAM, 1TB NVMe SSD'],
        features: ['Full HD Display', '15.6" Anti-Glare Screen', 'Backlit Keyboard', 'Intel Core i5/i7', 'AMD Ryzen 5/7'],
        templates: [
          '{name} with {spec}. {feature}. Perfect for work & gaming. Order in Kigali, Rwanda.',
          'Shop {name} - {spec}, {feature}. Fast performance for professionals. Delivery across Rwanda.',
          '{name} featuring {spec}. {feature}. Best laptop deals in Kigali. Free delivery available.'
        ]
      },
      // Electronics - Phones
      'phone': {
        specs: ['128GB Storage', '256GB Storage', '512GB Storage', '6.1" Super Retina Display', '6.7" Dynamic AMOLED'],
        features: ['5G Connectivity', 'Triple Camera System', '48MP Main Camera', 'Face ID', 'All-Day Battery'],
        templates: [
          '{name} with {spec}. {feature}. Latest smartphone in Kigali, Rwanda. Shop now!',
          'Buy {name} - {spec}, {feature}. Premium phone at best price. Delivery across Rwanda.',
          '{name} featuring {spec}. {feature}. Authentic with warranty. Kigali\'s trusted store.'
        ]
      },
      'iphone': {
        specs: ['128GB Storage', '256GB Storage', '512GB Storage', '6.1" Super Retina XDR', '6.7" ProMotion Display'],
        features: ['A17 Pro Chip', '48MP Camera System', 'Face ID', 'MagSafe Compatible', 'Ceramic Shield'],
        templates: [
          'Original {name} with {spec}. {feature}. Buy authentic iPhone in Kigali, Rwanda.',
          'Shop {name} - {spec}, {feature}. Genuine Apple product. Fast delivery across Rwanda.',
          '{name} featuring {spec}. {feature}. Best iPhone deals in Kigali. Warranty included.'
        ]
      },
      // Electronics - Headphones/Earphones
      'headphone': {
        specs: ['Active Noise Cancellation', 'Bluetooth 5.3', '40-Hour Battery Life', 'Hi-Res Audio', 'Spatial Audio'],
        features: ['Comfortable Over-Ear Design', 'Foldable & Portable', 'Built-in Microphone', 'Touch Controls', 'Fast Charging'],
        templates: [
          '{name} with {spec}. {feature}. Premium audio experience. Buy in Kigali, Rwanda.',
          'Shop {name} - {spec}, {feature}. Crystal clear sound. Delivery across Rwanda.',
          '{name} featuring {spec}. {feature}. Best headphones in Kigali. Order now!'
        ]
      },
      'earphone': {
        specs: ['Active Noise Cancellation', 'Bluetooth 5.3', '30-Hour Total Battery', 'IPX5 Water Resistant', 'Wireless Charging Case'],
        features: ['In-Ear Comfort Fit', 'Touch Controls', 'Transparency Mode', 'Voice Assistant', 'Fast Pairing'],
        templates: [
          '{name} with {spec}. {feature}. True wireless freedom. Buy in Kigali, Rwanda.',
          'Shop {name} - {spec}, {feature}. Premium earbuds. Fast delivery across Rwanda.',
          '{name} featuring {spec}. {feature}. Best earphones in Kigali. Order today!'
        ]
      },
      // Electronics - Keyboard/Mouse
      'keyboard': {
        specs: ['Mechanical RGB', 'Wireless Bluetooth', 'USB-C Rechargeable', 'Multi-Device Pairing', 'Ergonomic Design'],
        features: ['Backlit Keys', 'Quiet Typing', 'Programmable Keys', 'Long Battery Life', 'Compact Layout'],
        templates: [
          '{name} - {spec}. {feature}. Perfect for work & gaming. Buy in Kigali, Rwanda.',
          'Shop {name} with {spec}. {feature}. Comfortable typing. Delivery across Rwanda.',
          '{name} featuring {spec}. {feature}. Best keyboard deals in Kigali.'
        ]
      },
      'mouse': {
        specs: ['Wireless 2.4GHz', 'Bluetooth 5.0', '16000 DPI Sensor', 'Ergonomic Design', 'USB-C Rechargeable'],
        features: ['Silent Click', 'RGB Lighting', 'Programmable Buttons', '6-Month Battery', 'Adjustable DPI'],
        templates: [
          '{name} - {spec}. {feature}. Precision control. Buy in Kigali, Rwanda.',
          'Shop {name} with {spec}. {feature}. Smooth performance. Delivery across Rwanda.',
          '{name} featuring {spec}. {feature}. Best mouse deals in Kigali.'
        ]
      },
      // Electronics - Watch
      'watch': {
        specs: ['GPS + Cellular', 'Heart Rate Monitor', 'Blood Oxygen Sensor', 'Always-On Display', '50M Water Resistant'],
        features: ['Fitness Tracking', 'Sleep Monitoring', 'Smart Notifications', 'Interchangeable Bands', '18-Hour Battery'],
        templates: [
          '{name} with {spec}. {feature}. Smart health companion. Buy in Kigali, Rwanda.',
          'Shop {name} - {spec}, {feature}. Premium smartwatch. Delivery across Rwanda.',
          '{name} featuring {spec}. {feature}. Best watch deals in Kigali.'
        ]
      },
      // Fashion - Shoes
      'shoes': {
        specs: ['Genuine Leather', 'Breathable Mesh', 'Memory Foam Insole', 'Non-Slip Sole', 'Lightweight Design'],
        features: ['All-Day Comfort', 'Available in All Sizes', 'Durable Construction', 'Easy to Clean', 'Trendy Style'],
        templates: [
          '{name} with {spec}. {feature}. Step in style. Buy in Kigali, Rwanda.',
          'Shop {name} - {spec}, {feature}. Comfortable & stylish. Delivery across Rwanda.',
          '{name} featuring {spec}. {feature}. Best shoe deals in Kigali. Order now!'
        ]
      },
      // Fashion - Dress
      'dress': {
        specs: ['100% Cotton', 'Premium Silk Blend', 'Stretchy Fabric', 'Floral Print', 'Elegant Design'],
        features: ['Available in S/M/L/XL', 'Machine Washable', 'Wrinkle-Free', 'Perfect for All Occasions', 'Trendy Style'],
        templates: [
          '{name} made with {spec}. {feature}. Look stunning. Buy in Kigali, Rwanda.',
          'Shop {name} - {spec}, {feature}. Elegant & comfortable. Delivery across Rwanda.',
          '{name} featuring {spec}. {feature}. Best dress deals in Kigali.'
        ]
      },
      // Default for other products
      'default': {
        specs: ['Premium Quality', 'Top-Grade Materials', 'Professional Grade', 'Best-in-Class', 'Superior Build'],
        features: ['Durable & Long-Lasting', 'Easy to Use', 'Great Value', 'Customer Favorite', 'Highly Rated'],
        templates: [
          '{name} with {spec}. {feature}. Quality you can trust. Buy in Kigali, Rwanda.',
          'Shop {name} - {spec}, {feature}. Best prices in Rwanda. Fast delivery.',
          '{name} featuring {spec}. {feature}. Top seller in Kigali. Order today!'
        ]
      }
    };
  }

  /**
   * Auto-detect category from product name
   */
  detectCategory(productName) {
    const nameLower = (productName || '').toLowerCase();
    
    for (const [category, data] of Object.entries(this.categoryMapping)) {
      for (const keyword of data.keywords) {
        if (nameLower.includes(keyword)) {
          return category;
        }
      }
    }
    return 'Electronics'; // Default
  }

  /**
   * Auto-detect subcategory from product name and category
   */
  detectSubcategory(productName, category) {
    const nameLower = (productName || '').toLowerCase();
    const categoryData = this.categoryMapping[category];
    
    if (!categoryData) return 'General';

    // Match keywords to subcategories
    const subcategoryKeywords = {
      'Phones': ['phone', 'iphone', 'samsung', 'smartphone', 'mobile'],
      'Laptops': ['laptop', 'macbook', 'notebook', 'computer'],
      'Tablets': ['tablet', 'ipad'],
      'Cameras': ['camera', 'dslr', 'mirrorless'],
      'Headphones': ['headphone', 'earphone', 'airpod', 'earbud'],
      'Speakers': ['speaker', 'bluetooth speaker', 'soundbar'],
      'Chargers': ['charger', 'adapter', 'power bank'],
      'Dresses': ['dress', 'gown', 'maxi', 'midi'],
      'Tops': ['blouse', 'top', 'shirt', 't-shirt'],
      'Shoes': ['shoe', 'heel', 'sneaker', 'boot', 'sandal', 'loafer'],
      'Bags': ['bag', 'handbag', 'backpack', 'purse', 'clutch'],
      'Shirts': ['shirt', 'polo', 't-shirt'],
      'Pants': ['pant', 'trouser', 'jeans', 'short'],
      'Suits': ['suit', 'blazer', 'formal'],
      'Watches': ['watch', 'smartwatch'],
      'Jewelry': ['necklace', 'ring', 'bracelet', 'earring', 'chain'],
      'Skincare': ['cream', 'lotion', 'serum', 'moisturizer'],
      'Makeup': ['lipstick', 'foundation', 'mascara', 'makeup'],
      'Perfumes': ['perfume', 'cologne', 'fragrance'],
      'Toys': ['toy', 'doll', 'game', 'puzzle'],
      'Baby Care': ['diaper', 'bottle', 'baby', 'infant'],
      'Furniture': ['sofa', 'bed', 'table', 'chair', 'desk'],
      'Kitchen': ['pot', 'pan', 'knife', 'blender', 'cooker']
    };

    for (const [subcategory, keywords] of Object.entries(subcategoryKeywords)) {
      for (const keyword of keywords) {
        if (nameLower.includes(keyword)) {
          return subcategory;
        }
      }
    }

    return categoryData.subcategories[0] || 'General';
  }

  /**
   * Generate UNIQUE SEO-optimized title (varied format each time)
   */
  generateTitle(product) {
    const productName = product.name || 'Product';
    
    // Get a random template (different from last used)
    let templateIndex;
    do {
      templateIndex = Math.floor(Math.random() * this.titleTemplates.length);
    } while (templateIndex === this.usedTemplateIndex.title && this.titleTemplates.length > 1);
    
    this.usedTemplateIndex.title = templateIndex;
    
    let title = this.titleTemplates[templateIndex].replace('{name}', productName);
    
    // Ensure under 60 characters for SEO (optimal)
    if (title.length > 60) {
      // Use shorter format
      title = `${productName} | Kigali Rwanda`;
    }
    if (title.length > 60) {
      title = productName.substring(0, 57) + '...';
    }

    return title;
  }

  /**
   * Detect product type for specs
   */
  detectProductType(productName) {
    const nameLower = (productName || '').toLowerCase();
    
    // Check specific product types
    const productTypes = ['charger', 'laptop', 'iphone', 'phone', 'headphone', 'earphone', 'keyboard', 'mouse', 'watch', 'shoes', 'dress'];
    
    for (const type of productTypes) {
      if (nameLower.includes(type)) {
        return type;
      }
    }
    
    // Check for variations
    if (nameLower.includes('airpod') || nameLower.includes('earbud')) return 'earphone';
    if (nameLower.includes('macbook') || nameLower.includes('notebook')) return 'laptop';
    if (nameLower.includes('samsung') && (nameLower.includes('galaxy') || nameLower.includes('s2') || nameLower.includes('a5'))) return 'phone';
    if (nameLower.includes('smartwatch') || nameLower.includes('apple watch')) return 'watch';
    if (nameLower.includes('sneaker') || nameLower.includes('boot') || nameLower.includes('heel')) return 'shoes';
    if (nameLower.includes('gown') || nameLower.includes('skirt') || nameLower.includes('blouse')) return 'dress';
    
    return 'default';
  }

  /**
   * Generate UNIQUE product description with TECH SPECS based on product type
   */
  generateDescription(product) {
    const productName = product.name || 'Product';
    const category = product.category || this.detectCategory(productName);
    const productType = this.detectProductType(productName);
    
    // Get product-specific specs
    const specData = this.productSpecs[productType] || this.productSpecs['default'];
    
    // Random spec and feature
    const spec = this.randomChoice(specData.specs);
    const feature = this.randomChoice(specData.features);
    
    // Use product-specific template
    const template = this.randomChoice(specData.templates);
    
    let description = template
      .replace(/{name}/g, productName)
      .replace(/{spec}/g, spec)
      .replace(/{feature}/g, feature)
      .replace(/{category}/g, category);
    
    // Ensure under 160 characters for meta description
    if (description.length > 160) {
      description = description.substring(0, 157) + '...';
    }

    return description;
  }

  /**
   * Generate meta keywords based on product name
   */
  generateKeywords(product) {
    const keywords = [];
    const productName = product.name || 'Product';
    
    // Add product name variations
    keywords.push(productName.toLowerCase());
    keywords.push(`${productName.toLowerCase()} kigali`);
    keywords.push(`${productName.toLowerCase()} rwanda`);
    keywords.push(`buy ${productName.toLowerCase()}`);
    
    // Add category
    if (product.category) {
      keywords.push(product.category.toLowerCase());
      keywords.push(`${product.category.toLowerCase()} kigali`);
    }

    // Add colors
    if (product.colors && product.colors.length > 0) {
      product.colors.slice(0, 3).forEach(color => {
        keywords.push(`${color.toLowerCase()} ${productName.toLowerCase()}`);
      });
    }

    // Add materials
    if (product.material && product.material.length > 0) {
      product.material.slice(0, 2).forEach(mat => {
        keywords.push(`${mat.toLowerCase()} ${productName.toLowerCase()}`);
      });
    }

    // Add Rwanda locations
    keywords.push('kigali fashion');
    keywords.push('rwanda shopping');
    keywords.push('E-Gura Store');

    return keywords.slice(0, 15); // Limit to 15 keywords
  }

  /**
   * Generate complete SEO package with AUTO-FILL data
   * Returns all fields needed to fill the product form (except price)
   */
  generateSEOPackage(product) {
    try {
      // Validate product input
      if (!product || typeof product !== 'object') {
        throw new Error('Invalid product data');
      }

      const productName = product.name || 'Product';
      
      // Auto-detect category and subcategory
      const detectedCategory = product.category || this.detectCategory(productName);
      const detectedSubcategory = product.subcategory || this.detectSubcategory(productName, detectedCategory);

      // Ensure product has minimum required fields
      const safeProduct = {
        name: productName,
        category: detectedCategory,
        subcategory: detectedSubcategory,
        price: product.price || 0,
        material: Array.isArray(product.material) ? product.material : [],
        colors: Array.isArray(product.colors) ? product.colors : [],
        gender: product.gender || 'unisex',
        ...product
      };

      const title = this.generateTitle(safeProduct);
      const description = this.generateDescription(safeProduct);
      const keywordsArray = this.generateKeywords(safeProduct);
      const keywords = Array.isArray(keywordsArray) ? keywordsArray.join(', ') : keywordsArray;
      const metaDescription = this.generateMetaDescription(safeProduct);

      // Calculate SEO score
      const seoScore = this.analyzeSEOScore(title, description, keywordsArray);

      return {
        success: true,
        // SEO Fields
        title: title || 'Quality Product | Rwanda',
        description: description || 'Shop quality products in Kigali, Rwanda.',
        metaDescription: metaDescription || 'Quality products available in Kigali.',
        keywords: keywords || 'products, kigali, rwanda',
        
        // AUTO-FILL fields (category & subcategory detected)
        autoFill: {
          category: detectedCategory,
          subcategory: detectedSubcategory,
          seoTitle: title,
          seoDescription: description,
          metaKeywords: keywords,
          // Suggested values
          stockQuantity: 100,
          isActive: true,
          isFeatured: false
        },
        
        // SEO Score
        seoScore: seoScore.score,
        seoGrade: seoScore.grade,
        seoFeedback: seoScore.feedback,
        
        metaTags: {
          'og:title': title,
          'og:description': metaDescription,
          'og:type': 'product',
          'og:locale': 'en_RW',
          'twitter:card': 'summary_large_image',
          'twitter:title': title,
          'twitter:description': metaDescription
        },
        structuredData: this.generateStructuredData(safeProduct, title, description)
      };
    } catch (error) {
      console.error('SEO Generation Error:', error);
      
      const productName = product?.name || 'Product';
      const detectedCategory = this.detectCategory(productName);
      
      // Return safe fallback with auto-fill
      return {
        success: true,
        title: `${productName} | Kigali Rwanda`,
        description: `Shop ${productName} in Kigali, Rwanda. Quality products at best prices.`,
        metaDescription: `Buy ${productName} in Kigali, Rwanda.`,
        keywords: `${detectedCategory}, kigali, rwanda`,
        autoFill: {
          category: detectedCategory,
          subcategory: this.detectSubcategory(productName, detectedCategory),
          seoTitle: `${productName} | Kigali Rwanda`,
          seoDescription: `Shop ${productName} in Kigali, Rwanda.`,
          metaKeywords: `${detectedCategory}, kigali, rwanda`,
          stockQuantity: 100,
          isActive: true,
          isFeatured: false
        },
        seoScore: 70,
        seoGrade: 'B',
        metaTags: {},
        structuredData: {}
      };
    }
  }

  /**
   * Generate meta description (shorter version)
   */
  generateMetaDescription(product) {
    try {
      const category = product.category || 'Products';
      const location = 'Kigali';
      const qualifier = this.randomChoice(['Quality', 'Premium', 'Best', 'Top']);
      
      let meta = `${qualifier} ${category} in ${location}, Rwanda.`;
      
      if (product.price) {
        meta += ` From ${product.price.toLocaleString()} RWF.`;
      }
      
      // Ensure under 160 characters
      if (meta.length > 160) {
        meta = meta.substring(0, 157) + '...';
      }
      
      return meta;
    } catch (error) {
      return `Shop ${product.name || 'products'} in Kigali, Rwanda.`;
    }
  }

  /**
   * Generate structured data (Schema.org)
   */
  generateStructuredData(product, title, description) {
    return {
      '@context': 'https://schema.org',
      '@type': 'Product',
      'name': title,
      'description': description,
      'image': product.mainImage || product.images?.[0],
      'offers': {
        '@type': 'Offer',
        'price': product.price,
        'priceCurrency': 'RWF',
        'availability': product.stockQuantity > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
        'seller': {
          '@type': 'Organization',
          'name': 'E-Gura Store',
          'address': {
            '@type': 'PostalAddress',
            'addressLocality': 'Kigali',
            'addressCountry': 'RW'
          }
        }
      },
      'aggregateRating': product.averageRating ? {
        '@type': 'AggregateRating',
        'ratingValue': product.averageRating,
        'reviewCount': product.totalReviews || 0
      } : undefined
    };
  }

  /**
   * Get demographic from product
   */
  getDemographic(product) {
    if (product.gender) {
      if (product.gender === 'female') return 'Women';
      if (product.gender === 'male') return 'Men';
      return 'Everyone';
    }
    
    // Infer from category or name
    const name = (product.name || '').toLowerCase();
    if (name.includes('women') || name.includes('ladies')) return 'Women';
    if (name.includes('men') || name.includes('guys')) return 'Men';
    if (name.includes('kids') || name.includes('children')) return 'Kids';
    
    return 'Everyone';
  }

  /**
   * Random choice helper
   */
  randomChoice(array) {
    return array[Math.floor(Math.random() * array.length)];
  }

  /**
   * Analyze SEO score
   */
  analyzeSEOScore(title, description, keywords) {
    let score = 0;
    const feedback = [];

    // Title analysis
    if (title.length >= 30 && title.length <= 60) {
      score += 20;
      feedback.push('✅ Title length is optimal');
    } else {
      feedback.push('⚠️ Title should be 30-60 characters');
    }

    if (title.toLowerCase().includes('kigali') || title.toLowerCase().includes('rwanda')) {
      score += 15;
      feedback.push('✅ Title includes location keywords');
    }

    // Description analysis
    if (description.length >= 120 && description.length <= 160) {
      score += 20;
      feedback.push('✅ Description length is optimal');
    } else {
      feedback.push('⚠️ Description should be 120-160 characters');
    }

    if (description.toLowerCase().includes('kigali') || description.toLowerCase().includes('rwanda')) {
      score += 15;
      feedback.push('✅ Description includes location keywords');
    }

    // Keywords analysis
    if (keywords.length >= 5 && keywords.length <= 15) {
      score += 15;
      feedback.push('✅ Good number of keywords');
    }

    const hasLocationKeywords = keywords.some(k => 
      k.includes('kigali') || k.includes('rwanda')
    );
    if (hasLocationKeywords) {
      score += 15;
      feedback.push('✅ Keywords include location terms');
    }

    return {
      score: score,
      grade: score >= 80 ? 'A' : score >= 60 ? 'B' : score >= 40 ? 'C' : 'D',
      feedback: feedback
    };
  }
}

// Create singleton instance
const seoGenerator = new SEOGenerator();

module.exports = seoGenerator;
