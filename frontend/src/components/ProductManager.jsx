import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  PlusIcon,
  XMarkIcon,
  PhotoIcon,
  SparklesIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import axios from 'axios';

const ProductManager = ({ products, onProductsUpdate }) => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [seoGenerating, setSeoGenerating] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imagePreview, setImagePreview] = useState('');
  const [mediaType, setMediaType] = useState('image'); // 'image' or 'video'
  const [additionalImages, setAdditionalImages] = useState(['', '', '']);
  const [additionalMediaTypes, setAdditionalMediaTypes] = useState(['image', 'image', 'image']);
  const [hierarchicalCategories, setHierarchicalCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [variants, setVariants] = useState([]);
  const [showVariantManager, setShowVariantManager] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    subcategory: '',
    price: '',
    originalPrice: '',
    stockQuantity: '',
    mainImage: '',
    images: [],
    description: '',
    shortDescription: '',
    seoTitle: '',
    tags: [],
    sizes: [],
    colors: [],
    gender: 'female',
    brand: 'E-Gura Store',
    material: [],
    isFeatured: false,
    isNew: true,
    isSale: false
  });

  // Fetch hierarchical categories on mount
  useEffect(() => {
    fetchHierarchicalCategories();
  }, []);

  const fetchHierarchicalCategories = async () => {
    try {
      const response = await axios.get('/api/categories/hierarchical/all');
      if (response.data.success) {
        setHierarchicalCategories(response.data.categories);
      }
    } catch (error) {
      console.error('Failed to fetch categories:', error);
      // Set empty array as fallback
      setHierarchicalCategories([]);
    }
  };

  // Fetch subcategories when main category changes
  const handleCategoryChange = async (categoryId) => {
    handleInputChange('category', categoryId);
    handleInputChange('subcategory', ''); // Reset subcategory
    
    if (!categoryId) {
      setSubcategories([]);
      return;
    }
    
    try {
      const response = await axios.get(`https://egura.rw/api/categories/hierarchical/${categoryId}/subcategories`);
      if (response.data.success) {
        setSubcategories(response.data.subcategories);
      }
    } catch (error) {
      console.error('Failed to fetch subcategories:', error);
      setSubcategories([]);
    }
  };

  const clothingSizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
  const storageSizes = ['4GB', '8GB', '16GB', '32GB', '64GB', '128GB', '256GB', '512GB', '1TB', '2TB', '4TB'];
  const colors = ['Red', 'Blue', 'Green', 'Black', 'White', 'Pink', 'Yellow', 'Purple', 'Silver', 'Gold'];
  const materials = ['Cotton', 'Polyester', 'Silk', 'Wool', 'Linen', 'Denim', 'Leather', 'Synthetic', 'Plastic', 'Metal', 'Glass'];

  // Categories that typically don't need sizes
  const categoriesWithoutSizes = [
    'bags-accessories', 'jewelry-watches', 'beauty-personal-care',
    'home-living', 'sports-outdoor'
  ];

  // Categories that use storage sizes (GB, TB)
  const categoriesWithStorageSizes = [
    'electronics'
  ];

  // Subcategories that specifically use storage sizes
  const subcategoriesWithStorageSizes = [
    'storage-devices', 'computers-laptops', 'phones-tablets'
  ];

  // Check if current category needs sizes
  const needsSizes = () => {
    if (!formData.category) return false;
    return !categoriesWithoutSizes.includes(formData.category) && !categoriesWithStorageSizes.includes(formData.category);
  };

  // Check if current category/subcategory uses storage sizes
  const needsStorageSizes = () => {
    if (!formData.category) return false;
    if (categoriesWithStorageSizes.includes(formData.category)) {
      // If subcategory is selected, check if it's a storage device
      if (formData.subcategory) {
        return subcategoriesWithStorageSizes.includes(formData.subcategory);
      }
      return true; // Default to true for electronics
    }
    return false;
  };

  // Get appropriate sizes based on category
  const getSizesForCategory = () => {
    if (needsStorageSizes()) return storageSizes;
    if (needsSizes()) return clothingSizes;
    return [];
  };

  // Intelligent product info extractor
  const extractProductInfo = (productName, categoryName) => {
    const nameLower = productName.toLowerCase();
    
    // Extract year if present (e.g., "Prius 2007" → year: 2007)
    const yearMatch = nameLower.match(/\b(19|20)\d{2}\b/);
    const year = yearMatch ? yearMatch[0] : null;
    
    // Detect automotive products
    const carBrands = ['toyota', 'honda', 'mazda', 'nissan', 'bmw', 'mercedes', 'audi', 'ford', 'chevrolet', 'hyundai', 'kia', 'subaru', 'volkswagen', 'lexus', 'tesla'];
    const detectedCarBrand = carBrands.find(brand => nameLower.includes(brand));
    
    // Detect electronics brands
    const electronicBrands = ['apple', 'samsung', 'sony', 'lg', 'dell', 'hp', 'lenovo', 'asus', 'acer', 'microsoft', 'canon', 'nikon', 'jbl', 'bose', 'beats'];
    const detectedElectronicBrand = electronicBrands.find(brand => nameLower.includes(brand));
    
    // Detect fashion descriptors
    const fashionStyles = ['elegant', 'casual', 'formal', 'vintage', 'modern', 'classic', 'sporty', 'luxury', 'premium'];
    const detectedStyle = fashionStyles.find(style => nameLower.includes(style));
    
    // Detect common attributes
    const attributes = {
      isNew: nameLower.includes('new') || nameLower.includes('latest'),
      isUsed: nameLower.includes('used') || nameLower.includes('second hand'),
      isRefurbished: nameLower.includes('refurbished') || nameLower.includes('renewed'),
      isPremium: nameLower.includes('premium') || nameLower.includes('luxury') || nameLower.includes('deluxe'),
      isWireless: nameLower.includes('wireless') || nameLower.includes('bluetooth'),
      isPortable: nameLower.includes('portable') || nameLower.includes('compact'),
      isProfessional: nameLower.includes('professional') || nameLower.includes('pro'),
    };
    
    return {
      year,
      carBrand: detectedCarBrand,
      electronicBrand: detectedElectronicBrand,
      style: detectedStyle,
      attributes,
      category: categoryName
    };
  };

  // Generate context-aware descriptions based on product type
  const generateContextualDescription = (productName, productInfo, price, features) => {
    const descriptions = [];
    
    // Automotive descriptions
    if (productInfo.carBrand || productInfo.category.toLowerCase().includes('automotive')) {
      descriptions.push(
        `Reliable ${productName} ${productInfo.year ? `(${productInfo.year} model)` : ''} available in Rwanda. ${features} Well-maintained, ${productInfo.attributes.isNew ? 'brand new' : 'excellent condition'}. Perfect for Kigali roads.`,
        `Get ${productName} ${productInfo.year ? `${productInfo.year}` : ''} with confidence. ${features} ${productInfo.carBrand ? `Genuine ${productInfo.carBrand}` : 'Quality vehicle'} with full service history. Financing available.`,
        `${productName} ${productInfo.year ? `- ${productInfo.year} Edition` : ''} in pristine condition. ${features} Fuel efficient, reliable transportation for Rwanda. Test drive in Kigali today.`
      );
    }
    
    // Electronics descriptions
    else if (productInfo.electronicBrand || productInfo.category.toLowerCase().includes('electronics')) {
      descriptions.push(
        `Latest ${productName} ${productInfo.electronicBrand ? `by ${productInfo.electronicBrand}` : ''} with cutting-edge technology. ${features} ${productInfo.attributes.isWireless ? 'Wireless connectivity' : 'High performance'}. Official warranty included.`,
        `${productName} - ${productInfo.attributes.isProfessional ? 'Professional grade' : 'Advanced'} technology at your fingertips. ${features} ${productInfo.electronicBrand ? `Authentic ${productInfo.electronicBrand}` : 'Premium quality'}. Free setup in Kigali.`,
        `Experience innovation with ${productName}. ${features} ${productInfo.attributes.isPortable ? 'Ultra-portable design' : 'Powerful performance'}. ${productInfo.electronicBrand ? `${productInfo.electronicBrand} certified` : 'Quality guaranteed'}. Shop online in Rwanda.`
      );
    }
    
    // Fashion descriptions
    else if (productInfo.category.toLowerCase().includes('fashion') || productInfo.category.toLowerCase().includes('clothing')) {
      descriptions.push(
        `Stunning ${productName} ${productInfo.style ? `in ${productInfo.style} style` : ''} that turns heads. ${features} Perfect for ${productInfo.attributes.isFormal ? 'special occasions' : 'everyday wear'}. Trendy fashion in Kigali.`,
        `Elevate your wardrobe with ${productName}. ${features} ${productInfo.style ? `${productInfo.style.charAt(0).toUpperCase() + productInfo.style.slice(1)} design` : 'Stylish design'} that fits perfectly. ${productInfo.attributes.isPremium ? 'Premium fabrics' : 'Quality materials'}. Express delivery in Rwanda.`,
        `${productName} - Where style meets comfort. ${features} ${productInfo.attributes.isFormal ? 'Elegant sophistication' : 'Casual elegance'} for the modern Rwandan. Available in multiple sizes.`
      );
    }
    
    // Home & Living descriptions
    else if (productInfo.category.toLowerCase().includes('home') || productInfo.category.toLowerCase().includes('furniture')) {
      descriptions.push(
        `Transform your space with ${productName}. ${features} Durable, ${productInfo.attributes.isModern ? 'modern' : 'timeless'} design perfect for Rwandan homes. Easy assembly included.`,
        `${productName} brings comfort to your home. ${features} Quality craftsmanship that lasts. Ideal for Kigali apartments. Free delivery within Rwanda.`,
        `Upgrade your living space with ${productName}. ${features} ${productInfo.attributes.isPremium ? 'Premium materials' : 'Quality construction'}. Stylish and functional for modern homes.`
      );
    }
    
    // Generic but contextual descriptions
    else {
      descriptions.push(
        `Discover ${productName} - the perfect choice for ${productInfo.category.toLowerCase()}. ${features} ${productInfo.attributes.isPremium ? 'Premium quality' : 'Excellent value'} that exceeds expectations.`,
        `${productName}: Your solution for quality ${productInfo.category.toLowerCase()}. ${features} ${productInfo.attributes.isNew ? 'Latest arrival' : 'Proven quality'}. Trusted by customers across Rwanda.`,
        `Get ${productName} today. ${features} ${productInfo.attributes.isProfessional ? 'Professional-grade quality' : 'Reliable performance'}. Perfect for your needs in Kigali.`
      );
    }
    
    return descriptions;
  };

  const handleGenerateSEO = () => {
    // Only require product name - category will be auto-detected
    if (!formData.name || formData.name.length < 3) {
      alert('⚠️ Please enter product name first (minimum 3 characters)');
      return;
    }
    
    // Use the backend API for SEO generation with auto-fill
    generateSEO();
    return;

    const categoryName = hierarchicalCategories.find(c => c.id === formData.category)?.name || 'Fashion';
    const subcategoryName = subcategories.find(s => s.id === formData.subcategory)?.name || '';
    const productName = formData.name;
    const price = formData.price ? `${parseFloat(formData.price).toLocaleString()} RWF` : '';
    const brand = formData.brand || 'E-Gura Store';
    
    // Extract intelligent product information
    const productInfo = extractProductInfo(productName, categoryName);

    // AI-Powered SEO Title Generation with Dynamic Uniqueness
    // Algorithm: Multiple quality indicators + Action verbs + Location + Timestamp uniqueness
    const qualityIndicators = ['Premium', 'Exclusive', 'Quality', 'Best', 'Top', 'Professional', 'Elite', 'Superior', 'Luxury', 'Fine', 'Authentic', 'Genuine', 'Original'];
    const actionVerbs = ['Shop', 'Buy', 'Get', 'Order', 'Discover', 'Find', 'Explore', 'Browse'];
    const locationVariants = [
      'Rwanda', 
      'Kigali', 
      'Kigali Rwanda', 
      'in Rwanda', 
      'in Kigali', 
      'Online Rwanda', 
      'Online Kigali',
      'Kigali, Rwanda',
      'Rwanda Online',
      'Kigali Online'
    ];
    
    // Random selection for uniqueness
    const randomQuality = qualityIndicators[Math.floor(Math.random() * qualityIndicators.length)];
    const randomAction = actionVerbs[Math.floor(Math.random() * actionVerbs.length)];
    const randomLocation = locationVariants[Math.floor(Math.random() * locationVariants.length)];
    
    let seoTitle = '';
    
    // 5 Different title formats for maximum uniqueness
    const titleFormats = [
      // Format 1: Quality + Product + Subcategory + Brand + Location
      () => subcategoryName ? `${randomQuality} ${productName} - ${subcategoryName} | ${brand} ${randomLocation}` : null,
      
      // Format 2: Action + Product + Category + Location
      () => `${randomAction} ${productName} | ${categoryName} ${randomLocation}`,
      
      // Format 3: Product + Quality + Category + Brand
      () => `${productName} - ${randomQuality} ${categoryName} from ${brand}`,
      
      // Format 4: Premium focus (for expensive items)
      () => price && parseFloat(formData.price) > 100000 ? `${productName} | ${randomQuality} ${categoryName} - ${brand} Exclusive` : null,
      
      // Format 5: Location-first SEO
      () => `${randomLocation}: ${randomQuality} ${productName} | ${brand}`
    ];
    
    // Try formats until we get one that fits, prioritizing defined ones
    for (let format of titleFormats) {
      const title = format();
      if (title && title.length <= 60) {
        seoTitle = title;
        break;
      }
    }
    
    // Fallback if nothing fits
    if (!seoTitle || seoTitle.length > 60) {
      seoTitle = `${productName} | ${categoryName} - ${brand}`;
    }

    // AI-Enhanced Meta Description with Maximum Uniqueness
    // Algorithm: Dynamic intros + Product USP + Value props + Urgency + CTAs
    const features = [];
    const benefits = [];
    
    if (formData.material && formData.material.length > 0) {
      features.push(formData.material[0]);
      benefits.push('premium quality');
    }
    if (formData.sizes && formData.sizes.length > 0) {
      features.push(`${formData.sizes.length}+ sizes`);
      benefits.push('perfect fit');
    }
    if (formData.colors && formData.colors.length > 0) {
      features.push(`${formData.colors.length}+ colors`);
      benefits.push('style options');
    }
    
    // Dynamic intro phrases for uniqueness (mixing Kigali & Rwanda)
    const locationForIntro = locationVariants[Math.floor(Math.random() * locationVariants.length)];
    const cityOrCountry = ['Kigali', 'Rwanda', 'Kigali, Rwanda'][Math.floor(Math.random() * 3)];
    
    const introVariants = [
      `Shop ${productName} in ${cityOrCountry}.`,
      `Discover ${productName} in ${locationForIntro}.`,
      `Get ${productName} delivered in ${cityOrCountry}.`,
      `${productName}: ${randomQuality} ${categoryName} in ${locationForIntro}.`,
      `Buy authentic ${productName} - ${cityOrCountry}.`,
      `Experience ${randomQuality.toLowerCase()} ${productName} in ${cityOrCountry}.`,
      `Order ${productName} ${locationForIntro}.`,
      `${productName} available in ${cityOrCountry}.`,
      `Find ${productName} in ${locationForIntro}.`,
      `${cityOrCountry}: ${productName} at ${brand}.`
    ];
    
    // Conversion-optimized CTAs with urgency (mixing Kigali & Rwanda)
    const ctas = [
      'Shop now with free delivery',
      'Order today - Fast delivery to Kigali',
      'Get yours now',
      'Limited stock - Order now',
      'Buy now - Same day delivery in Kigali',
      'Free shipping in Kigali',
      'Order now - Pay on delivery in Rwanda',
      'Fast checkout - Secure payment',
      'Available for immediate delivery',
      'Get it delivered today in Kigali',
      'Fast delivery across Rwanda',
      'Order now - Kigali same-day delivery',
      'Rwanda-wide shipping available',
      'Shop now - Deliver to Kigali'
    ];
    
    // Value propositions for variety (with location)
    const valueProps = [
      'Best prices in Rwanda',
      'Authentic products only',
      'Trusted by thousands in Kigali',
      'Top-rated seller in Rwanda',
      'Quality guaranteed',
      '100% satisfaction guaranteed',
      'Secure shopping',
      "Kigali's favorite store",
      "Rwanda's trusted brand",
      'Serving all of Rwanda'
    ];
    
    const randomIntro = introVariants[Math.floor(Math.random() * introVariants.length)];
    const randomCTA = ctas[Math.floor(Math.random() * ctas.length)];
    const randomValue = valueProps[Math.floor(Math.random() * valueProps.length)];
    
    // Multiple ways to present features (adds variety)
    const featurePresentations = [
      () => features.length > 0 ? ` ${features.join(', ')}.` : '',
      () => features.length > 0 ? ` Features: ${features.join(' + ')}.` : '',
      () => features.length > 0 ? `. Comes with ${features.join(', ')}.` : '',
      () => features.length > 0 ? ` - ${features.join(', ')}.` : '',
      () => features.length > 0 ? `. Available in ${features.join(' & ')}.` : ''
    ];
    
    // Multiple ways to present price (adds variety)
    const pricePresentations = price ? [
      `Starting at ${price}`,
      `From ${price}`,
      `Only ${price}`,
      `Just ${price}`,
      `Price: ${price}`,
      `${price} only`,
      `Priced at ${price}`
    ] : [''];
    
    const randomFeature = featurePresentations[Math.floor(Math.random() * featurePresentations.length)]();
    const randomPrice = price ? pricePresentations[Math.floor(Math.random() * pricePresentations.length)] : '';
    
    // Generate context-aware descriptions based on product type
    const contextualDescriptions = generateContextualDescription(productName, productInfo, randomPrice, randomFeature);
    
    // Combine contextual + generic formats for maximum variety
    const allDescFormats = [
      // Contextual descriptions (product-specific)
      ...contextualDescriptions.map(desc => () => desc),
      
      // Generic formats (still useful for variety)
      // Format 1: Classic intro-based
      () => `${randomIntro}${randomFeature} ${randomPrice ? `${randomPrice}.` : ''} ${randomCTA} at ${brand}!`,
      
      // Format 2: Value proposition lead
      () => `${randomValue}! ${productName} in ${cityOrCountry}.${randomFeature} ${randomPrice ? `${randomPrice}.` : ''} ${randomCTA}!`,
      
      // Format 3: Question format (engaging)
      () => `Looking for ${randomQuality.toLowerCase()} ${categoryName}? ${productName} in ${locationForIntro}.${randomFeature} ${randomPrice ? `${randomPrice}.` : ''} ${randomCTA}!`,
      
      // Format 4: Direct product focus
      () => `${productName}: ${randomValue} in ${cityOrCountry}.${randomFeature} ${randomCTA}. ${randomPrice ? `${randomPrice}.` : 'Great value!'}`,
      
      // Format 5: Brand storytelling
      () => `${brand} presents ${productName}. ${randomValue}.${randomFeature} Available in ${locationForIntro}. ${randomPrice ? `${randomPrice}.` : ''} ${randomCTA}!`,
      
      // Format 6: Benefits-first approach
      () => `${randomValue} - that's ${brand}'s promise. ${productName} in ${cityOrCountry}.${randomFeature} ${randomPrice ? `${randomPrice}.` : ''} ${randomCTA}!`,
      
      // Format 7: Location-first emphasis
      () => `${cityOrCountry}'s choice for ${categoryName}! ${productName}${randomFeature} ${randomPrice ? `${randomPrice}.` : ''} ${randomCTA}. ${randomValue}!`,
      
      // Format 8: Urgency-driven
      () => `${randomCTA}! ${productName} in ${locationForIntro}.${randomFeature} ${randomValue}. ${randomPrice ? `${randomPrice}.` : 'Amazing price!'} At ${brand}!`,
      
      // Format 9: Feature-first highlight
      () => `${randomFeature ? randomFeature.trim() : randomQuality + ' quality'} ${productName} available in ${cityOrCountry}. ${randomPrice ? `${randomPrice}.` : ''} ${randomCTA}. ${randomValue}!`
    ];
    
    // Pick random format (contextual descriptions have higher probability)
    let seoDescription = allDescFormats[Math.floor(Math.random() * allDescFormats.length)]();
    
    // Optimize length (150-160 chars for best SERP display)
    if (seoDescription.length > 160) {
      const shortLocation = ['Kigali', 'Rwanda'][Math.floor(Math.random() * 2)];
      const shortCTA = ctas[Math.floor(Math.random() * ctas.length)];
      
      // Multiple short formats for variety even when truncating
      const shortFormats = [
        `${productName} in ${shortLocation}. ${randomPrice ? `${randomPrice}.` : ''} ${shortCTA}!`,
        `${randomValue}! ${productName} - ${shortLocation}. ${randomPrice ? `${randomPrice}.` : ''} ${shortCTA}!`,
        `Get ${productName} in ${shortLocation}. ${randomPrice ? `${randomPrice}.` : ''} ${randomValue}. ${shortCTA}!`,
        `${productName}: ${categoryName} in ${shortLocation}. ${randomPrice ? `${randomPrice}.` : ''} ${shortCTA}!`,
        `${shortLocation}'s ${productName}. ${randomPrice ? `${randomPrice}.` : ''} ${randomValue}. ${shortCTA}!`
      ];
      
      seoDescription = shortFormats[Math.floor(Math.random() * shortFormats.length)];
    }

    // Generate detailed product description (now context-aware!)
    const detailedDescription = generateDetailedDescription(productName, categoryName, subcategoryName, productInfo);

    // AI-Powered Keyword Generation using LSI (Latent Semantic Indexing)
    // Algorithm: Primary keywords + Long-tail + Location-based + Intent-based + Semantic variations
    const primaryKeywords = [
      productName.toLowerCase(),
      categoryName.toLowerCase(),
      subcategoryName ? subcategoryName.toLowerCase() : ''
    ];
    
    // Long-tail keywords (3-4 word phrases with higher conversion) - Mixed locations
    const longTailKeywords = [
      `buy ${productName.toLowerCase()} online rwanda`,
      `${productName.toLowerCase()} price in kigali`,
      `best ${categoryName.toLowerCase()} rwanda`,
      `affordable ${productName.toLowerCase()} kigali`,
      `${categoryName.toLowerCase()} online shopping rwanda`,
      `${productName.toLowerCase()} shop kigali`,
      `buy ${categoryName.toLowerCase()} kigali rwanda`,
      `${productName.toLowerCase()} delivery kigali`
    ];
    
    // Location-based keywords for local SEO (Kigali + Rwanda mix)
    const locationKeywords = [
      `${productName.toLowerCase()} kigali`,
      `${categoryName.toLowerCase()} rwanda`,
      `${productName.toLowerCase()} rwanda`,
      `${categoryName.toLowerCase()} kigali`,
      `kigali online shopping`,
      'rwanda e-commerce',
      'kigali e-commerce',
      'shopping in kigali',
      'buy online rwanda'
    ];
    
    // Intent-based keywords (buyer intent optimization) - With locations
    const intentKeywords = [
      `buy ${productName.toLowerCase()} kigali`,
      `${productName.toLowerCase()} for sale rwanda`,
      `order ${productName.toLowerCase()} online`,
      `${productName.toLowerCase()} delivery rwanda`,
      `${productName.toLowerCase()} delivery kigali`,
      `purchase ${productName.toLowerCase()} rwanda`
    ];
    
    // Semantic variations (related terms for better ranking)
    const semanticKeywords = [
      'premium quality',
      'fast delivery',
      'secure payment',
      brand.toLowerCase(),
      `${brand.toLowerCase()} store`
    ];
    
    // Combine all keyword types for comprehensive SEO coverage
    const keywords = [
      ...primaryKeywords,
      ...longTailKeywords,
      ...locationKeywords,
      ...intentKeywords,
      ...semanticKeywords
    ].filter(k => k && k.trim() !== '').slice(0, 20); // Limit to top 20 most relevant

    setFormData(prev => ({
      ...prev,
      seoTitle,
      shortDescription: seoDescription,
      description: detailedDescription,
      tags: keywords
    }));

    alert('✅ Professional SEO generated! Title, description, and keywords optimized for search engines.');
  };

  // Generate detailed product description (context-aware)
  const generateDetailedDescription = (productName, categoryName, subcategoryName, productInfo) => {
    const category = categoryName.toLowerCase();
    const subcategory = subcategoryName ? subcategoryName.toLowerCase() : '';
    const brand = formData.brand || 'E-Gura Store';
    
    let description = '';
    let keyFeatures = [];
    let deliveryInfo = [];
    
    // AUTOMOTIVE DESCRIPTIONS
    if (productInfo.carBrand || category.includes('automotive') || category.includes('car')) {
      description = `${productName} ${productInfo.year ? `(${productInfo.year} Model)` : ''} - Your Next Reliable Vehicle in Rwanda.\n\n`;
      description += `This ${productInfo.carBrand ? `${productInfo.carBrand.toUpperCase()}` : ''} ${productName} is ${productInfo.attributes.isNew ? 'brand new' : 'in excellent condition'} and ready for Kigali's roads. `;
      description += `${productInfo.year ? `The ${productInfo.year} edition` : 'This model'} offers reliable performance, fuel efficiency, and comfortable transportation for you and your family.\n\n`;
      
      keyFeatures = [
        `${productInfo.year ? `${productInfo.year} model year` : 'Well-maintained vehicle'}`,
        `${productInfo.carBrand ? `Genuine ${productInfo.carBrand.toUpperCase()} brand` : 'Quality vehicle'}`,
        `${productInfo.attributes.isNew ? 'Brand new condition' : 'Excellent working condition'}`,
        'Fuel efficient engine',
        'Comfortable interior',
        'Perfect for Kigali city and upcountry travel',
        'Full service history available',
        'Test drive available in Kigali'
      ];
      
      deliveryInfo = [
        'Vehicle inspection available',
        'Financing options available',
        'Registration assistance provided',
        'Warranty options available',
        'Trade-in accepted'
      ];
    }
    
    // ELECTRONICS DESCRIPTIONS
    else if (productInfo.electronicBrand || category.includes('electronics') || category.includes('computer') || category.includes('phone')) {
      description = `${productName} ${productInfo.electronicBrand ? `by ${productInfo.electronicBrand.toUpperCase()}` : ''} - Advanced Technology for Modern Life.\n\n`;
      description += `Experience ${productInfo.attributes.isProfessional ? 'professional-grade' : 'cutting-edge'} technology with the ${productName}. `;
      description += `${productInfo.electronicBrand ? `Authentic ${productInfo.electronicBrand.toUpperCase()} product` : 'This device'} combines innovation, performance, and reliability. `;
      description += `${productInfo.attributes.isWireless ? 'Enjoy wireless freedom and seamless connectivity. ' : ''}`;
      description += `Perfect for work, entertainment, and staying connected in Rwanda.\n\n`;
      
      keyFeatures = [
        `${productInfo.electronicBrand ? `Genuine ${productInfo.electronicBrand.toUpperCase()} product` : 'Authentic electronics'}`,
        `${productInfo.attributes.isProfessional ? 'Professional-grade performance' : 'High performance'}`,
        `${productInfo.attributes.isWireless ? 'Wireless/Bluetooth connectivity' : 'Advanced connectivity'}`,
        `${productInfo.attributes.isPortable ? 'Portable and lightweight design' : 'Reliable and durable'}`,
        `${productInfo.attributes.isNew ? 'Brand new with original packaging' : 'Excellent condition'}`,
        'Official warranty included',
        'Free setup and installation in Kigali',
        'Technical support available'
      ];
      
      deliveryInfo = [
        'Free delivery within Kigali',
        'Express delivery available',
        'Secure packaging',
        '14-day return policy for electronics',
        '100% authentic guarantee'
      ];
    }
    
    // FASHION DESCRIPTIONS
    else if (category.includes('fashion') || category.includes('clothing') || category.includes('dress') || category.includes('shoes')) {
      description = `${productName} ${productInfo.style ? `- ${productInfo.style.charAt(0).toUpperCase() + productInfo.style.slice(1)} Style` : ''} from ${brand}.\n\n`;
      description += `Elevate your wardrobe with this ${productInfo.style ? `${productInfo.style}` : 'stunning'} ${productName}. `;
      description += `Designed for the modern Rwandan who values both style and comfort. `;
      description += `${productInfo.attributes.isPremium ? 'Crafted from premium materials' : 'Quality construction'} ensures lasting beauty and durability. `;
      description += `Perfect for ${productInfo.attributes.isFormal ? 'special occasions and formal events' : 'everyday wear and casual outings'}.\n\n`;
      
      keyFeatures = [
        `${productInfo.style ? `${productInfo.style.charAt(0).toUpperCase() + productInfo.style.slice(1)} design` : 'Stylish design'}`,
        `${productInfo.attributes.isPremium ? 'Premium quality fabrics' : 'Quality materials'}`,
        `${formData.sizes?.length > 0 ? `Available in multiple sizes: ${formData.sizes.join(', ')}` : 'Various sizes available'}`,
        `${formData.colors?.length > 0 ? `Multiple colors: ${formData.colors.join(', ')}` : 'Multiple color options'}`,
        'Perfect fit and comfort',
        'Easy care and maintenance',
        'Trendy and fashionable',
        'Suitable for Rwandan climate'
      ];
      
      deliveryInfo = [
        'Free delivery in Kigali',
        'Fast nationwide shipping',
        '7-day return and exchange',
        'Size guide available',
        'Quality guaranteed'
      ];
    }
    
    // HOME & LIVING DESCRIPTIONS
    else if (category.includes('home') || category.includes('living') || category.includes('furniture')) {
      description = `${productName} - Transform Your Living Space.\n\n`;
      description += `Upgrade your home with the ${productName}. ${productInfo.attributes.isPremium ? 'Crafted from premium materials' : 'Quality construction'} ensures durability and style. `;
      description += `This ${subcategory || 'home item'} combines functionality with ${productInfo.attributes.isModern ? 'modern' : 'timeless'} design, perfect for Rwandan homes and apartments. `;
      description += `Whether for your living room, bedroom, or office, this piece adds comfort and elegance to any space.\n\n`;
      
      keyFeatures = [
        `${productInfo.attributes.isPremium ? 'Premium materials' : 'Quality construction'}`,
        `${productInfo.attributes.isModern ? 'Modern design' : 'Timeless style'}`,
        'Durable and long-lasting',
        'Easy to assemble',
        'Space-efficient design',
        'Perfect for Kigali apartments',
        'Stylish and functional',
        'Easy to clean and maintain'
      ];
      
      deliveryInfo = [
        'Free delivery within Kigali',
        'Assembly service available',
        'Nationwide shipping',
        '30-day return policy',
        'Quality warranty included'
      ];
    }
    
    // GENERIC DESCRIPTIONS (fallback)
    else {
      description = `${productName} from ${brand} - Quality You Can Trust.\n\n`;
      description += `Discover the ${productName}, a premium ${category} product carefully selected for quality and value. `;
      description += `${productInfo.attributes.isPremium ? 'Premium quality' : 'Excellent value'} that meets the highest standards. `;
      description += `Perfect for your needs in Rwanda.\n\n`;
      
      keyFeatures = [
        `Premium ${category}`,
        `Authentic ${brand} product`,
        `${productInfo.attributes.isNew ? 'Brand new' : 'Excellent condition'}`,
        'Quality guaranteed',
        'Reliable and durable',
        'Great value for money',
        'Trusted by customers',
        'Perfect for Rwandan market'
      ];
      
      deliveryInfo = [
        'Free delivery in Kigali',
        'Fast nationwide shipping',
        '7-day return policy',
        '100% quality guarantee',
        'Customer support available'
      ];
    }
    
    // Add specifications if materials are provided
    if (formData.material && formData.material.length > 0) {
      description += `**Specifications:**\n`;
      description += `• Materials: ${formData.material.join(', ')}\n`;
      if (formData.sizes?.length > 0 && !category.includes('automotive')) {
        description += `• Available Sizes: ${formData.sizes.join(', ')}\n`;
      }
      if (formData.colors?.length > 0) {
        description += `• Available Colors: ${formData.colors.join(', ')}\n`;
      }
      description += `\n`;
    }
    
    // Add key features
    description += `**Key Features:**\n`;
    keyFeatures.forEach(feature => {
      description += `• ${feature}\n`;
    });
    
    // Add delivery info
    description += `\n**Delivery & Service:**\n`;
    deliveryInfo.forEach(info => {
      description += `• ${info}\n`;
    });
    
    // Add closing statement
    const closingStatements = {
      automotive: `\n\nVisit us in Kigali for a test drive or contact us for more information. ${brand} - Your trusted automotive partner in Rwanda.`,
      electronics: `\n\nShop with confidence at ${brand}, Rwanda's trusted electronics destination. Contact us for technical support and inquiries.`,
      fashion: `\n\nShop with confidence at ${brand}, Rwanda's premier fashion destination. Style meets quality in Kigali.`,
      home: `\n\nTransform your home with ${brand}, Rwanda's trusted home & living store. Quality furniture for Rwandan homes.`,
      default: `\n\nShop with confidence at ${brand}, Rwanda's trusted online marketplace.`
    };
    
    if (category.includes('automotive') || category.includes('car')) {
      description += closingStatements.automotive;
    } else if (category.includes('electronics') || category.includes('computer') || category.includes('phone')) {
      description += closingStatements.electronics;
    } else if (category.includes('fashion') || category.includes('clothing')) {
      description += closingStatements.fashion;
    } else if (category.includes('home') || category.includes('furniture')) {
      description += closingStatements.home;
    } else {
      description += closingStatements.default;
    }
    
    return description;
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Handle media file upload (image or video)
  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    const isImage = file.type.startsWith('image/');
    const isVideo = file.type.startsWith('video/');
    
    if (!isImage && !isVideo) {
      alert('Please upload an image or video file');
      return;
    }

    // Validate file size (max 50MB for videos, 5MB for images)
    const maxSize = isVideo ? 50 * 1024 * 1024 : 5 * 1024 * 1024;
    if (file.size > maxSize) {
      alert(`${isVideo ? 'Video' : 'Image'} size should be less than ${isVideo ? '50MB' : '5MB'}`);
      return;
    }

    // Set media type
    setMediaType(isVideo ? 'video' : 'image');

    setUploadingImage(true);
    try {
      // Convert to base64
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result;
        setImagePreview(base64String);
        setFormData(prev => ({ ...prev, mainImage: base64String }));
        setUploadingImage(false);
      };
      reader.onerror = () => {
        alert('Failed to read image file');
        setUploadingImage(false);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Image upload error:', error);
      alert('Failed to upload image');
      setUploadingImage(false);
    }
  };

  // Handle image/video URL input
  const handleImageURL = (url) => {
    setFormData(prev => ({ ...prev, mainImage: url }));
    setImagePreview(url);
    
    // Auto-detect video from URL extension
    const videoExtensions = ['.mp4', '.webm', '.ogg', '.mov', '.avi'];
    const isVideoUrl = videoExtensions.some(ext => url.toLowerCase().includes(ext));
    setMediaType(isVideoUrl ? 'video' : 'image');
  };

  // Handle additional image/video URL
  const handleAdditionalImageURL = (index, url) => {
    const newImages = [...additionalImages];
    newImages[index] = url;
    setAdditionalImages(newImages);
    
    // Auto-detect video from URL extension
    const videoExtensions = ['.mp4', '.webm', '.ogg', '.mov', '.avi'];
    const isVideoUrl = videoExtensions.some(ext => url.toLowerCase().includes(ext));
    const newMediaTypes = [...additionalMediaTypes];
    newMediaTypes[index] = isVideoUrl ? 'video' : 'image';
    setAdditionalMediaTypes(newMediaTypes);
    
    // Update formData images array
    setFormData(prev => ({
      ...prev,
      images: newImages.filter(img => img && img.trim() !== '')
    }));
  };

  // Handle additional media upload (image or video)
  const handleAdditionalImageUpload = async (index, e) => {
    const file = e.target.files[0];
    if (!file) return;

    const isImage = file.type.startsWith('image/');
    const isVideo = file.type.startsWith('video/');
    
    if (!isImage && !isVideo) {
      alert('Please upload an image or video file');
      return;
    }

    const maxSize = isVideo ? 50 * 1024 * 1024 : 5 * 1024 * 1024;
    if (file.size > maxSize) {
      alert(`${isVideo ? 'Video' : 'Image'} size should be less than ${isVideo ? '50MB' : '5MB'}`);
      return;
    }

    // Update media type for this slot
    const newMediaTypes = [...additionalMediaTypes];
    newMediaTypes[index] = isVideo ? 'video' : 'image';
    setAdditionalMediaTypes(newMediaTypes);

    try {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result;
        const newImages = [...additionalImages];
        newImages[index] = base64String;
        setAdditionalImages(newImages);
        
        setFormData(prev => ({
          ...prev,
          images: newImages.filter(img => img && img.trim() !== '')
        }));
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Image upload error:', error);
      alert('Failed to upload image');
    }
  };

  const handleArrayToggle = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].includes(value)
        ? prev[field].filter(item => item !== value)
        : [...prev[field], value]
    }));
  };

  // Variant Management
  const addVariant = () => {
    const newVariant = {
      id: Date.now(),
      size: formData.sizes[0] || '',
      color: formData.colors[0] || '',
      price: formData.price || '',
      stockQuantity: '',
      image: ''
    };
    setVariants([...variants, newVariant]);
  };

  const updateVariant = (id, field, value) => {
    setVariants(variants.map(v => v.id === id ? { ...v, [field]: value } : v));
  };

  const removeVariant = (id) => {
    setVariants(variants.filter(v => v.id !== id));
  };

  const generateVariantsFromSelection = () => {
    const newVariants = [];
    if (formData.sizes.length > 0 && formData.colors.length === 0) {
      // Only sizes selected
      formData.sizes.forEach(size => {
        newVariants.push({
          id: Date.now() + Math.random(),
          size,
          color: '',
          price: formData.price || '',
          stockQuantity: '',
          image: ''
        });
      });
    } else if (formData.colors.length > 0 && formData.sizes.length === 0) {
      // Only colors selected
      formData.colors.forEach(color => {
        newVariants.push({
          id: Date.now() + Math.random(),
          size: '',
          color,
          price: formData.price || '',
          stockQuantity: '',
          image: ''
        });
      });
    } else if (formData.sizes.length > 0 && formData.colors.length > 0) {
      // Both sizes and colors selected
      formData.sizes.forEach(size => {
        formData.colors.forEach(color => {
          newVariants.push({
            id: Date.now() + Math.random(),
            size,
            color,
            price: formData.price || '',
            stockQuantity: '',
            image: ''
          });
        });
      });
    }
    setVariants(newVariants);
    setShowVariantManager(true);
    alert(`✅ Generated ${newVariants.length} variants! Now set individual prices and stock.`);
  };

  const generateSEO = async () => {
    if (!formData.name || formData.name.length < 3) {
      alert('⚠️ Please enter a product name first (minimum 3 characters)');
      return;
    }

    setSeoGenerating(true);
    
    // Use a flag to prevent state updates after unmount
    let isMounted = true;
    
    try {
      console.log('🤖 Generating SEO for:', formData.name);
      
      // Use public SEO endpoint (no auth required)
      const response = await axios.post('/api/admin/generate-seo-public', {
        product: {
          name: formData.name,
          category: formData.category,
          price: parseFloat(formData.price) || 0,
          description: formData.description || ''
        }
      }, {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 10000
      });

      // Only update state if component is still mounted
      if (!isMounted) return;

      console.log('SEO Response:', response.data);

      if (response.data && response.data.success) {
        console.log('✅ SEO Generated Successfully');
        const seoData = response.data;
        const autoFill = seoData.autoFill || {};
        
        // AUTO-FILL entire form (except price)
        setFormData(prev => {
          const newData = {
            ...prev,
            // SEO fields
            seoTitle: seoData.title || prev.seoTitle || '',
            description: seoData.description || prev.description || '',
            shortDescription: seoData.metaDescription || prev.shortDescription || '',
            // Auto-detected category & subcategory
            category: autoFill.category || prev.category || '',
            subcategory: autoFill.subcategory || prev.subcategory || '',
            // Default stock (keep price unchanged)
            stockQuantity: prev.stockQuantity || autoFill.stockQuantity || 100,
            isActive: prev.isActive !== undefined ? prev.isActive : true,
            isFeatured: prev.isFeatured !== undefined ? prev.isFeatured : false
          };
          
          // Handle tags/keywords safely
          if (seoData.keywords && typeof seoData.keywords === 'string') {
            const keywordArray = seoData.keywords.split(',').map(k => k.trim()).filter(k => k.length > 0);
            if (keywordArray.length > 0) {
              newData.tags = keywordArray;
            }
          }
          
          return newData;
        });
        
        setSeoGenerating(false);
        
        // Show SEO score feedback
        const scoreMsg = seoData.seoScore ? `\n\n📊 SEO Score: ${seoData.seoScore}/100 (Grade: ${seoData.seoGrade})` : '';
        alert(`✅ Form auto-filled successfully!${scoreMsg}\n\n• Category: ${autoFill.category || 'detected'}\n• Subcategory: ${autoFill.subcategory || 'detected'}\n• Title, description & keywords generated\n• Only PRICE needs to be set manually`);
      } else {
        throw new Error('Invalid response from SEO service');
      }
    } catch (error) {
      if (!isMounted) return;
      
      console.error('❌ SEO generation failed:', error);
      setSeoGenerating(false);
      
      // Don't crash - just show a friendly message
      const errorMsg = error.response?.data?.error || error.message || 'Unknown error';
      alert('⚠️ SEO generation failed: ' + errorMsg + '\n\nDon\'t worry! SEO will be auto-generated when you save the product.');
    }
    
    // Cleanup function
    return () => {
      isMounted = false;
    };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate required fields
    if (!formData.name || formData.name.trim().length < 3) {
      alert('⚠️ Product name is required (minimum 3 characters)');
      return;
    }
    
    if (!formData.price || parseFloat(formData.price) <= 0) {
      alert('⚠️ Valid price is required');
      return;
    }
    
    if (!formData.stockQuantity || parseInt(formData.stockQuantity) < 0) {
      alert('⚠️ Stock quantity is required (must be 0 or greater)');
      return;
    }
    
    // Image is now optional - will use placeholder if not provided
    if (!formData.mainImage) {
      const confirmed = confirm('⚠️ No image provided. A placeholder image will be used. Continue?');
      if (!confirmed) return;
    }

    setLoading(true);
    try {
      console.log('📦 Creating product:', formData);

      const productData = {
        ...formData,
        price: parseFloat(formData.price),
        originalPrice: formData.originalPrice ? parseFloat(formData.originalPrice) : null,
        stockQuantity: parseInt(formData.stockQuantity) || 0,
        mainImage: formData.mainImage || 'https://via.placeholder.com/800x800?text=Product+Image',
        discountPercentage: formData.originalPrice 
          ? Math.round(((parseFloat(formData.originalPrice) - parseFloat(formData.price)) / parseFloat(formData.originalPrice)) * 100)
          : 0,
        isSale: formData.originalPrice && parseFloat(formData.originalPrice) > parseFloat(formData.price)
      };

      // Only include variants if they exist
      if (variants && variants.length > 0) {
        productData.variants = variants.map(v => ({
          size: v.size,
          color: v.color,
          price: parseFloat(v.price) || parseFloat(formData.price),
          stockQuantity: parseInt(v.stockQuantity) || 0,
          image: v.image || formData.mainImage
        }));
      }

      console.log('📊 Product data being sent:', {
        name: productData.name,
        basePrice: productData.price,
        variantCount: productData.variants ? productData.variants.length : 0,
        hasVariants: !!productData.variants
      });

      const token = localStorage.getItem('adminToken');
      if (!token) {
        alert('❌ Authentication required. Please login again.');
        setLoading(false);
        return;
      }

      const response = await axios.post(
        '/api/admin/products',
        productData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.success) {
        console.log('✅ Product created:', response.data.data);
        alert('✅ Product created successfully!');
        
        // Reset form
        setFormData({
          name: '',
          category: '',
          subcategory: '',
          price: '',
          originalPrice: '',
          stockQuantity: '',
          mainImage: '',
          images: [],
          description: '',
          shortDescription: '',
          seoTitle: '',
          tags: [],
          sizes: [],
          colors: [],
          gender: 'female',
          brand: 'E-Gura Store',
          material: [],
          isFeatured: false,
          isNew: true,
          isSale: false
        });
        setSubcategories([]);
        setVariants([]);
        setShowVariantManager(false);
        
        setImagePreview('');
        setShowCreateModal(false);
        
        // Refresh products list
        if (onProductsUpdate) {
          onProductsUpdate();
        }
      }
    } catch (error) {
      console.error('❌ Error creating product:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      
      let errorMessage = 'Failed to create product';
      
      if (error.response?.data) {
        // Extract error message from backend response
        if (error.response.data.message) {
          errorMessage = error.response.data.message;
        } else if (error.response.data.error) {
          errorMessage = error.response.data.error;
        } else if (typeof error.response.data === 'string') {
          errorMessage = error.response.data;
        }
        
        // Show validation details if available
        if (error.response.data.details && Array.isArray(error.response.data.details)) {
          const details = error.response.data.details.map(d => d.message || d).join('\n');
          errorMessage += '\n\nDetails:\n' + details;
        }
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      alert('❌ ' + errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {/* Create Product Button */}
      <button
        onClick={() => setShowCreateModal(true)}
        className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-lg hover:shadow-lg transition-all flex items-center gap-2"
      >
        <PlusIcon className="h-5 w-5" />
        Add New Product
      </button>

      {/* Create Product Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowCreateModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="sticky top-0 bg-gradient-to-r from-purple-600 to-pink-600 text-white p-6 flex justify-between items-center">
                <div>
                  <h3 className="text-2xl font-bold">Create New Product</h3>
                  <p className="text-purple-100 mt-1">Add a new product with automatic SEO generation</p>
                </div>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="text-white hover:bg-white/20 p-2 rounded-lg transition-all"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="p-6 space-y-6">
                {/* Basic Information */}
                <div className="bg-purple-50 rounded-lg p-6">
                  <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <PhotoIcon className="h-5 w-5 text-purple-600" />
                    Basic Information
                  </h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Product Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => handleInputChange('name', e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                        placeholder="e.g., Elegant Summer Dress"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Main Category <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={formData.category}
                        onChange={(e) => handleCategoryChange(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                        required
                      >
                        <option value="">Select Main Category</option>
                        {hierarchicalCategories.map(cat => (
                          <option key={cat.id} value={cat.id}>
                            {cat.icon} {cat.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {subcategories.length > 0 && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Subcategory
                        </label>
                        <select
                          value={formData.subcategory}
                          onChange={(e) => handleInputChange('subcategory', e.target.value)}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                        >
                          <option value="">Select Subcategory (Optional)</option>
                          {subcategories.map(sub => (
                            <option key={sub.id} value={sub.id}>
                              {sub.icon} {sub.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Price (RWF) <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        value={formData.price}
                        onChange={(e) => handleInputChange('price', e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                        placeholder="25000"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Original Price (RWF)
                      </label>
                      <input
                        type="number"
                        value={formData.originalPrice}
                        onChange={(e) => handleInputChange('originalPrice', e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                        placeholder="35000"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Stock Quantity <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        value={formData.stockQuantity}
                        onChange={(e) => handleInputChange('stockQuantity', e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                        placeholder="50"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Gender
                      </label>
                      <select
                        value={formData.gender}
                        onChange={(e) => handleInputChange('gender', e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      >
                        <option value="female">Female</option>
                        <option value="male">Male</option>
                        <option value="unisex">Unisex</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Images */}
                <div className="bg-blue-50 rounded-lg p-6">
                  <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <PhotoIcon className="h-5 w-5 text-blue-600" />
                    Product Media (Optional - Images or Videos)
                  </h4>
                  
                  <div className="space-y-4">
                    {/* Image Upload */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Upload Image or Video (Optional)
                      </label>
                      <div className="flex items-center gap-4">
                        <label className="flex-1 cursor-pointer">
                          <div className="border-2 border-dashed border-blue-300 rounded-lg p-6 hover:border-blue-500 transition-all text-center">
                            {uploadingImage ? (
                              <div className="flex flex-col items-center gap-2">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                                <span className="text-sm text-gray-600">Uploading...</span>
                              </div>
                            ) : (
                              <div className="flex flex-col items-center gap-2">
                                <PhotoIcon className="h-12 w-12 text-blue-500" />
                                <span className="text-sm font-medium text-gray-700">Click to upload image or video</span>
                                <span className="text-xs text-gray-500">PNG, JPG, GIF up to 5MB | MP4, WebM up to 50MB</span>
                              </div>
                            )}
                          </div>
                          <input
                            type="file"
                            accept="image/*,video/*"
                            onChange={handleImageUpload}
                            className="hidden"
                          />
                        </label>
                      </div>
                    </div>

                    {/* OR Divider */}
                    <div className="flex items-center gap-4">
                      <div className="flex-1 border-t border-gray-300"></div>
                      <span className="text-sm font-medium text-gray-500">OR</span>
                      <div className="flex-1 border-t border-gray-300"></div>
                    </div>

                    {/* Media URL */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Media URL (Optional)
                      </label>
                      <input
                        type="url"
                        value={formData.mainImage.startsWith('data:') ? '' : formData.mainImage}
                        onChange={(e) => handleImageURL(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                        placeholder="https://example.com/image.jpg or video.mp4"
                      />
                      <p className="mt-1 text-xs text-gray-500">
                        💡 Tip: Use Unsplash for images or paste direct video URL
                      </p>
                    </div>

                    {/* Media Preview */}
                    {(formData.mainImage || imagePreview) && (
                      <div className="mt-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          {mediaType === 'video' ? '🎥 Video Preview' : '🖼️ Image Preview'}
                        </label>
                        <div className="relative inline-block">
                          {mediaType === 'video' ? (
                            <video
                              src={imagePreview || formData.mainImage}
                              controls
                              className="w-full max-w-md h-48 object-cover rounded-lg border-2 border-blue-300 shadow-lg"
                            >
                              Your browser does not support video preview.
                            </video>
                          ) : (
                            <img
                              src={imagePreview || formData.mainImage}
                              alt="Preview"
                              className="w-48 h-48 object-cover rounded-lg border-2 border-blue-300 shadow-lg"
                              onError={(e) => {
                                e.target.src = 'https://via.placeholder.com/200x200?text=Image+Not+Found';
                              }}
                            />
                          )}
                          <button
                            type="button"
                            onClick={() => {
                              setFormData(prev => ({ ...prev, mainImage: '' }));
                              setImagePreview('');
                              setMediaType('image');
                            }}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-all"
                          >
                            <XMarkIcon className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Additional Media (3 more) */}
                <div className="bg-cyan-50 rounded-lg p-6">
                  <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <PhotoIcon className="h-5 w-5 text-cyan-600" />
                    Additional Media (Optional - Up to 3 more Images/Videos)
                  </h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {[0, 1, 2].map((index) => (
                      <div key={index} className="space-y-3">
                        <label className="block text-sm font-medium text-gray-700">
                          Media {index + 1}
                        </label>
                        
                        {/* Upload Button */}
                        <label className="cursor-pointer block">
                          <div className="border-2 border-dashed border-cyan-300 rounded-lg p-4 hover:border-cyan-500 transition-all text-center bg-white">
                            <PhotoIcon className="h-10 w-10 text-cyan-500 mx-auto mb-2" />
                            <span className="text-xs text-gray-600 block">Click to upload</span>
                            <span className="text-xs text-gray-400">Image/Video (max 50MB)</span>
                          </div>
                          <input
                            type="file"
                            accept="image/*,video/*"
                            onChange={(e) => handleAdditionalImageUpload(index, e)}
                            className="hidden"
                          />
                        </label>
                        
                        {/* OR Divider */}
                        <div className="flex items-center gap-2">
                          <div className="flex-1 border-t border-cyan-300"></div>
                          <span className="text-xs text-gray-500">OR</span>
                          <div className="flex-1 border-t border-cyan-300"></div>
                        </div>
                        
                        {/* URL Input */}
                        <input
                          type="url"
                          value={additionalImages[index] || ''}
                          onChange={(e) => handleAdditionalImageURL(index, e.target.value)}
                          className="w-full px-3 py-2 border border-cyan-300 rounded-lg text-sm focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                          placeholder="Paste media URL"
                        />
                        
                        {/* Preview */}
                        {additionalImages[index] && (
                          <div className="relative">
                            {additionalMediaTypes[index] === 'video' ? (
                              <video
                                src={additionalImages[index]}
                                controls
                                className="w-full h-32 object-cover rounded-lg border-2 border-cyan-300"
                              >
                                Your browser does not support video preview.
                              </video>
                            ) : (
                              <img
                                src={additionalImages[index]}
                                alt={`Additional ${index + 1}`}
                                className="w-full h-32 object-cover rounded-lg border-2 border-cyan-300"
                                onError={(e) => {
                                  e.target.src = 'https://via.placeholder.com/150?text=Image+Error';
                                }}
                              />
                            )}
                            <button
                              type="button"
                              onClick={() => {
                                handleAdditionalImageURL(index, '');
                                const newMediaTypes = [...additionalMediaTypes];
                                newMediaTypes[index] = 'image';
                                setAdditionalMediaTypes(newMediaTypes);
                              }}
                              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-all shadow-lg"
                            >
                              <XMarkIcon className="h-4 w-4" />
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                  
                  <p className="mt-4 text-xs text-gray-500 flex items-center gap-1">
                    💡 <span>Add multiple product views to help customers see details</span>
                  </p>
                </div>

                {/* SEO & Description */}
                <div className="bg-green-50 rounded-lg p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                      <SparklesIcon className="h-5 w-5 text-green-600" />
                      SEO & Description
                    </h4>
                    <button
                      type="button"
                      onClick={handleGenerateSEO}
                      disabled={!formData.name || formData.name.length < 3}
                      className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-4 py-2 rounded-lg hover:shadow-lg transition-all disabled:opacity-50 flex items-center gap-2"
                    >
                      <SparklesIcon className="h-4 w-4" />
                      Generate Intelligent SEO ✨
                    </button>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        SEO Title
                      </label>
                      <input
                        type="text"
                        value={formData.seoTitle}
                        onChange={(e) => handleInputChange('seoTitle', e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                        placeholder="Will be auto-generated"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Detailed Description
                        <span className="text-xs text-gray-500 ml-2">(Auto-generated with rich formatting)</span>
                      </label>
                      <textarea
                        value={formData.description}
                        onChange={(e) => handleInputChange('description', e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 font-mono text-sm"
                        rows="12"
                        placeholder="Will be auto-generated with detailed product information, features, materials, and delivery details..."
                      />
                      <p className="mt-1 text-xs text-gray-500">
                        💡 Tip: Click "Generate Professional SEO" to auto-fill with detailed, SEO-optimized content
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Short Description
                      </label>
                      <textarea
                        value={formData.shortDescription}
                        onChange={(e) => handleInputChange('shortDescription', e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                        rows="2"
                        placeholder="Will be auto-generated"
                      />
                    </div>
                  </div>
                </div>

                {/* Sizes - Dynamic based on category */}
                {(needsSizes() || needsStorageSizes()) && (
                  <div className="bg-pink-50 rounded-lg p-6">
                    <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      Available {needsStorageSizes() ? 'Storage Capacities' : 'Sizes'}
                      <span className="text-xs text-gray-500">
                        {needsStorageSizes() ? '(GB, TB)' : '(Clothing sizes)'}
                      </span>
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {getSizesForCategory().map(size => (
                        <button
                          key={size}
                          type="button"
                          onClick={() => handleArrayToggle('sizes', size)}
                          className={`px-4 py-2 rounded-lg font-medium transition-all ${
                            formData.sizes.includes(size)
                              ? 'bg-purple-600 text-white'
                              : 'bg-white text-gray-700 border border-gray-300 hover:border-purple-600'
                          }`}
                        >
                          {size}
                        </button>
                      ))}
                    </div>
                    {needsStorageSizes() && (
                      <p className="text-xs text-gray-600 mt-2">
                        💡 Tip: Select storage capacities for devices like flash drives, hard disks, phones, etc.
                      </p>
                    )}
                  </div>
                )}
                {!needsSizes() && !needsStorageSizes() && (
                  <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                    <p className="text-sm text-blue-700">
                      ℹ️ <strong>Size/Capacity selection not needed</strong> for this category (Accessories, Jewelry, Beauty, Home items)
                    </p>
                  </div>
                )}

                {/* Colors */}
                <div className="bg-yellow-50 rounded-lg p-6">
                  <h4 className="font-semibold text-gray-900 mb-4">Available Colors</h4>
                  <div className="flex flex-wrap gap-2">
                    {colors.map(color => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => handleArrayToggle('colors', color)}
                        className={`px-4 py-2 rounded-lg font-medium transition-all ${
                          formData.colors.includes(color)
                            ? 'bg-purple-600 text-white'
                            : 'bg-white text-gray-700 border border-gray-300 hover:border-purple-600'
                        }`}
                      >
                        {color}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Materials */}
                <div className="bg-indigo-50 rounded-lg p-6">
                  <h4 className="font-semibold text-gray-900 mb-4">Materials</h4>
                  <div className="flex flex-wrap gap-2">
                    {materials.map(material => (
                      <button
                        key={material}
                        type="button"
                        onClick={() => handleArrayToggle('material', material)}
                        className={`px-4 py-2 rounded-lg font-medium transition-all ${
                          formData.material.includes(material)
                            ? 'bg-indigo-600 text-white'
                            : 'bg-white text-gray-700 border border-gray-300 hover:border-indigo-600'
                        }`}
                      >
                        {material}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Variant Manager */}
                {(formData.sizes.length > 0 || formData.colors.length > 0) && (
                    <div className="bg-orange-50 rounded-lg p-6">
                      <div className="flex justify-between items-center mb-4">
                        <h4 className="font-semibold text-gray-900">Product Variants</h4>
                        <button
                          type="button"
                          onClick={generateVariantsFromSelection}
                          className="bg-gradient-to-r from-orange-600 to-red-600 text-white px-4 py-2 rounded-lg hover:shadow-lg transition-all flex items-center gap-2"
                        >
                          <SparklesIcon className="h-4 w-4" />
                          Generate Variants
                        </button>
                      </div>

                      {variants.length > 0 && (
                        <>
                          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-3">
                            <p className="text-sm text-blue-800">
                              <strong>💡 Tip:</strong> Set individual prices for each variant. Base price: <strong>{formData.price ? parseFloat(formData.price).toLocaleString() : '0'} RWF</strong>
                            </p>
                          </div>
                          <div className="space-y-3 max-h-96 overflow-y-auto">
                            {variants.map((variant, index) => (
                              <div key={variant.id} className="bg-white rounded-lg p-4 border border-gray-200 hover:border-orange-300 transition-all">
                                <div className="grid grid-cols-5 gap-3 items-center">
                                  <div>
                                    <label className="text-xs font-medium text-gray-600 block mb-1">Size/Capacity</label>
                                    <input
                                      type="text"
                                      value={variant.size}
                                      onChange={(e) => updateVariant(variant.id, 'size', e.target.value)}
                                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                                      placeholder="Size"
                                      readOnly
                                    />
                                  </div>
                                  <div>
                                    <label className="text-xs font-medium text-gray-600 block mb-1">Color</label>
                                    <input
                                      type="text"
                                      value={variant.color}
                                      onChange={(e) => updateVariant(variant.id, 'color', e.target.value)}
                                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                                      placeholder="Color"
                                      readOnly
                                    />
                                  </div>
                                  <div>
                                    <label className="text-xs font-medium text-gray-600 block mb-1">
                                      Price (RWF) <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                      type="number"
                                      value={variant.price}
                                      onChange={(e) => updateVariant(variant.id, 'price', e.target.value)}
                                      className="w-full px-2 py-1 border-2 border-orange-300 rounded text-sm font-semibold focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                                      placeholder="Price"
                                      min="0"
                                      step="100"
                                    />
                                    {variant.price && parseFloat(variant.price) !== parseFloat(formData.price) && (
                                      <span className="text-xs text-orange-600 block mt-1">
                                        {parseFloat(variant.price) > parseFloat(formData.price) ? '↑' : '↓'} 
                                        {' '}{Math.abs(parseFloat(variant.price) - parseFloat(formData.price)).toLocaleString()} RWF
                                      </span>
                                    )}
                                  </div>
                                  <div>
                                    <label className="text-xs font-medium text-gray-600 block mb-1">Stock</label>
                                    <input
                                      type="number"
                                      value={variant.stockQuantity}
                                      onChange={(e) => updateVariant(variant.id, 'stockQuantity', e.target.value)}
                                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                                      placeholder="Stock"
                                      min="0"
                                    />
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => removeVariant(variant.id)}
                                    className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 transition-all text-sm h-8 mt-5"
                                  >
                                    Remove
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  )}

                {/* Product Status */}
                <div className="bg-gray-50 rounded-lg p-6">
                  <h4 className="font-semibold text-gray-900 mb-4">Product Status</h4>
                  <div className="space-y-3">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.isFeatured}
                        onChange={(e) => handleInputChange('isFeatured', e.target.checked)}
                        className="w-5 h-5 text-purple-600 rounded focus:ring-2 focus:ring-purple-500"
                      />
                      <span className="text-gray-700 font-medium">⭐ Featured Product</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.isNew}
                        onChange={(e) => handleInputChange('isNew', e.target.checked)}
                        className="w-5 h-5 text-purple-600 rounded focus:ring-2 focus:ring-purple-500"
                      />
                      <span className="text-gray-700 font-medium">🆕 New Arrival</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.isSale}
                        onChange={(e) => handleInputChange('isSale', e.target.checked)}
                        className="w-5 h-5 text-purple-600 rounded focus:ring-2 focus:ring-purple-500"
                      />
                      <span className="text-gray-700 font-medium">🔥 On Sale</span>
                    </label>
                  </div>
                </div>

                {/* Submit Buttons */}
                <div className="flex gap-4 pt-4 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-lg hover:shadow-lg transition-all font-medium disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        Creating...
                      </>
                    ) : (
                      <>
                        <CheckCircleIcon className="h-5 w-5" />
                        Create Product
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ProductManager;
