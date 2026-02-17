/**
 * Product Categories and Subcategories Configuration
 * Hierarchical structure for e-commerce categorization
 */

const categories = [
  {
    id: 'womens-fashion',
    name: "Women's Fashion",
    icon: '👗',
    description: 'Fashion and accessories for women',
    subcategories: [
      { id: 'dresses', name: 'Dresses', icon: '👗' },
      { id: 'tops-blouses', name: 'Tops & Blouses', icon: '👚' },
      { id: 'skirts', name: 'Skirts', icon: '🩱' },
      { id: 'pants-jeans', name: 'Pants & Jeans', icon: '👖' },
      { id: 'outerwear', name: 'Outerwear & Jackets', icon: '🧥' },
      { id: 'activewear', name: 'Activewear', icon: '🏃‍♀️' },
      { id: 'lingerie', name: 'Lingerie & Sleepwear', icon: '👙' },
      { id: 'traditional', name: 'Traditional Wear', icon: '🎎' },
      { id: 'maternity', name: 'Maternity Wear', icon: '🤰' }
    ]
  },
  {
    id: 'mens-fashion',
    name: "Men's Fashion",
    icon: '👔',
    description: 'Fashion and accessories for men',
    subcategories: [
      { id: 'shirts', name: 'Shirts', icon: '👔' },
      { id: 'tshirts-polos', name: 'T-Shirts & Polos', icon: '👕' },
      { id: 'pants-jeans', name: 'Pants & Jeans', icon: '👖' },
      { id: 'suits', name: 'Suits & Blazers', icon: '🤵' },
      { id: 'outerwear', name: 'Outerwear & Jackets', icon: '🧥' },
      { id: 'activewear', name: 'Activewear', icon: '🏃' },
      { id: 'underwear', name: 'Underwear & Sleepwear', icon: '🩲' },
      { id: 'traditional', name: 'Traditional Wear', icon: '🎩' }
    ]
  },
  {
    id: 'kids-baby',
    name: 'Kids & Baby',
    icon: '👶',
    description: 'Clothing for children and babies',
    subcategories: [
      { id: 'baby-0-2', name: 'Baby (0-2 years)', icon: '👶' },
      { id: 'toddler-2-5', name: 'Toddler (2-5 years)', icon: '🧒' },
      { id: 'kids-5-12', name: 'Kids (5-12 years)', icon: '👧' },
      { id: 'teen-13-18', name: 'Teen (13-18 years)', icon: '🧑' },
      { id: 'boys', name: 'Boys Clothing', icon: '👦' },
      { id: 'girls', name: 'Girls Clothing', icon: '👧' },
      { id: 'school-uniforms', name: 'School Uniforms', icon: '🎒' },
      { id: 'baby-accessories', name: 'Baby Accessories', icon: '🍼' }
    ]
  },
  {
    id: 'shoes-footwear',
    name: 'Shoes & Footwear',
    icon: '👟',
    description: 'Footwear for all occasions',
    subcategories: [
      { id: 'sneakers', name: 'Sneakers & Athletic', icon: '👟' },
      { id: 'formal-shoes', name: 'Formal Shoes', icon: '👞' },
      { id: 'heels', name: 'Heels & Pumps', icon: '👠' },
      { id: 'sandals', name: 'Sandals & Flip-Flops', icon: '🩴' },
      { id: 'boots', name: 'Boots', icon: '👢' },
      { id: 'flats', name: 'Flats & Loafers', icon: '🥿' },
      { id: 'kids-shoes', name: 'Kids Shoes', icon: '👟' },
      { id: 'slippers', name: 'Slippers & House Shoes', icon: '🩴' }
    ]
  },
  {
    id: 'bags-accessories',
    name: 'Bags & Accessories',
    icon: '👜',
    description: 'Bags, purses, and fashion accessories',
    subcategories: [
      { id: 'handbags', name: 'Handbags', icon: '👜' },
      { id: 'backpacks', name: 'Backpacks', icon: '🎒' },
      { id: 'wallets', name: 'Wallets & Purses', icon: '👛' },
      { id: 'travel-bags', name: 'Travel Bags & Luggage', icon: '🧳' },
      { id: 'belts', name: 'Belts', icon: '🔗' },
      { id: 'hats-caps', name: 'Hats & Caps', icon: '🧢' },
      { id: 'scarves', name: 'Scarves & Wraps', icon: '🧣' },
      { id: 'sunglasses', name: 'Sunglasses', icon: '🕶️' }
    ]
  },
  {
    id: 'jewelry-watches',
    name: 'Jewelry & Watches',
    icon: '💍',
    description: 'Jewelry, watches, and fine accessories',
    subcategories: [
      { id: 'necklaces', name: 'Necklaces', icon: '📿' },
      { id: 'earrings', name: 'Earrings', icon: '💎' },
      { id: 'bracelets', name: 'Bracelets & Bangles', icon: '📿' },
      { id: 'rings', name: 'Rings', icon: '💍' },
      { id: 'watches-men', name: 'Men\'s Watches', icon: '⌚' },
      { id: 'watches-women', name: 'Women\'s Watches', icon: '⌚' },
      { id: 'jewelry-sets', name: 'Jewelry Sets', icon: '💎' },
      { id: 'custom-jewelry', name: 'Custom Jewelry', icon: '✨' }
    ]
  },
  {
    id: 'beauty-personal-care',
    name: 'Beauty & Personal Care',
    icon: '💄',
    description: 'Beauty products and personal care items',
    subcategories: [
      { id: 'makeup', name: 'Makeup', icon: '💄' },
      { id: 'skincare', name: 'Skincare', icon: '🧴' },
      { id: 'haircare', name: 'Haircare', icon: '💇' },
      { id: 'fragrances', name: 'Fragrances', icon: '🌸' },
      { id: 'nail-care', name: 'Nail Care', icon: '💅' },
      { id: 'bath-body', name: 'Bath & Body', icon: '🛁' },
      { id: 'grooming-men', name: 'Men\'s Grooming', icon: '🪒' },
      { id: 'beauty-tools', name: 'Beauty Tools', icon: '🪮' }
    ]
  },
  {
    id: 'sports-outdoor',
    name: 'Sports & Outdoor',
    icon: '⚽',
    description: 'Sportswear and outdoor equipment',
    subcategories: [
      { id: 'gym-fitness', name: 'Gym & Fitness', icon: '🏋️' },
      { id: 'running', name: 'Running & Jogging', icon: '🏃' },
      { id: 'yoga', name: 'Yoga & Pilates', icon: '🧘' },
      { id: 'team-sports', name: 'Team Sports', icon: '⚽' },
      { id: 'outdoor-gear', name: 'Outdoor Gear', icon: '🏕️' },
      { id: 'swimming', name: 'Swimming & Water Sports', icon: '🏊' },
      { id: 'cycling', name: 'Cycling', icon: '🚴' },
      { id: 'sports-accessories', name: 'Sports Accessories', icon: '🎾' }
    ]
  },
  {
    id: 'home-living',
    name: 'Home & Living',
    icon: '🏠',
    description: 'Home decor and living essentials',
    subcategories: [
      { id: 'bedding', name: 'Bedding & Linens', icon: '🛏️' },
      { id: 'curtains', name: 'Curtains & Drapes', icon: '🪟' },
      { id: 'cushions', name: 'Cushions & Pillows', icon: '🛋️' },
      { id: 'rugs-carpets', name: 'Rugs & Carpets', icon: '🧶' },
      { id: 'kitchen-textiles', name: 'Kitchen Textiles', icon: '🍽️' },
      { id: 'bathroom', name: 'Bathroom Essentials', icon: '🚿' },
      { id: 'home-decor', name: 'Home Decor', icon: '🖼️' },
      { id: 'storage', name: 'Storage & Organization', icon: '📦' }
    ]
  },
  {
    id: 'traditional-cultural',
    name: 'Traditional & Cultural',
    icon: '🎎',
    description: 'Traditional and cultural clothing',
    subcategories: [
      { id: 'rwandan-traditional', name: 'Rwandan Traditional', icon: '🇷🇼' },
      { id: 'african-prints', name: 'African Prints', icon: '🌍' },
      { id: 'kitenge', name: 'Kitenge & Ankara', icon: '👘' },
      { id: 'cultural-accessories', name: 'Cultural Accessories', icon: '👑' },
      { id: 'wedding-traditional', name: 'Traditional Wedding', icon: '💒' },
      { id: 'ceremonial', name: 'Ceremonial Wear', icon: '🎭' },
      { id: 'cultural-jewelry', name: 'Cultural Jewelry', icon: '📿' },
      { id: 'handmade-crafts', name: 'Handmade Crafts', icon: '🎨' }
    ]
  },
  {
    id: 'special-occasions',
    name: 'Special Occasions',
    icon: '🎉',
    description: 'Clothing for special events',
    subcategories: [
      { id: 'wedding-dresses', name: 'Wedding Dresses', icon: '👰' },
      { id: 'evening-gowns', name: 'Evening Gowns', icon: '👗' },
      { id: 'cocktail-dresses', name: 'Cocktail Dresses', icon: '🍸' },
      { id: 'prom-dresses', name: 'Prom Dresses', icon: '💃' },
      { id: 'party-wear', name: 'Party Wear', icon: '🎊' },
      { id: 'formal-suits', name: 'Formal Suits', icon: '🤵' },
      { id: 'graduation', name: 'Graduation Attire', icon: '🎓' },
      { id: 'religious-occasions', name: 'Religious Occasions', icon: '⛪' }
    ]
  },
  {
    id: 'custom-tailored',
    name: 'Custom & Tailored',
    icon: '✂️',
    description: 'Custom-made and tailored items',
    subcategories: [
      { id: 'custom-dresses', name: 'Custom Dresses', icon: '👗' },
      { id: 'custom-suits', name: 'Custom Suits', icon: '🤵' },
      { id: 'alterations', name: 'Alterations & Repairs', icon: '🧵' },
      { id: 'bespoke', name: 'Bespoke Design', icon: '✨' },
      { id: 'made-to-measure', name: 'Made to Measure', icon: '📏' },
      { id: 'embroidery', name: 'Embroidery & Monogram', icon: '🪡' },
      { id: 'fabric-selection', name: 'Fabric Selection', icon: '🧶' },
      { id: 'design-consultation', name: 'Design Consultation', icon: '💼' }
    ]
  },
  {
    id: 'electronics',
    name: 'Electronics',
    icon: '💻',
    description: 'Electronic devices and accessories',
    subcategories: [
      { id: 'computers-laptops', name: 'Computers & Laptops', icon: '💻' },
      { id: 'phones-tablets', name: 'Phones & Tablets', icon: '📱' },
      { id: 'storage-devices', name: 'Storage Devices (Flash Drives, Hard Disks)', icon: '💾' },
      { id: 'headphones-audio', name: 'Headphones & Audio', icon: '🎧' },
      { id: 'cameras', name: 'Cameras & Photography', icon: '📷' },
      { id: 'smart-watches', name: 'Smart Watches & Wearables', icon: '⌚' },
      { id: 'chargers-cables', name: 'Chargers & Cables', icon: '🔌' },
      { id: 'gaming', name: 'Gaming Consoles & Accessories', icon: '🎮' },
      { id: 'tv-monitors', name: 'TVs & Monitors', icon: '📺' },
      { id: 'home-appliances', name: 'Home Appliances', icon: '🏠' }
    ]
  },
  {
    id: 'books-media',
    name: 'Books & Media',
    icon: '📚',
    description: 'Books, magazines, and media products',
    subcategories: [
      { id: 'fiction', name: 'Fiction & Literature', icon: '📖' },
      { id: 'non-fiction', name: 'Non-Fiction', icon: '📕' },
      { id: 'educational', name: 'Educational & Textbooks', icon: '🎓' },
      { id: 'children-books', name: "Children's Books", icon: '📚' },
      { id: 'magazines', name: 'Magazines & Periodicals', icon: '📰' },
      { id: 'ebooks', name: 'E-Books', icon: '💻' },
      { id: 'audiobooks', name: 'Audiobooks', icon: '🎧' },
      { id: 'stationery', name: 'Stationery & Writing', icon: '✏️' }
    ]
  },
  {
    id: 'toys-games',
    name: 'Toys & Games',
    icon: '🎮',
    description: 'Toys, games, and entertainment for all ages',
    subcategories: [
      { id: 'action-figures', name: 'Action Figures & Dolls', icon: '🪆' },
      { id: 'board-games', name: 'Board Games & Puzzles', icon: '🎲' },
      { id: 'educational-toys', name: 'Educational Toys', icon: '🧮' },
      { id: 'outdoor-toys', name: 'Outdoor & Sports Toys', icon: '⚽' },
      { id: 'baby-toys', name: 'Baby & Toddler Toys', icon: '🧸' },
      { id: 'building-blocks', name: 'Building Blocks & Construction', icon: '🧱' },
      { id: 'rc-vehicles', name: 'RC Vehicles & Drones', icon: '🚁' },
      { id: 'arts-crafts', name: 'Arts & Crafts Kits', icon: '🎨' }
    ]
  },
  {
    id: 'health-wellness',
    name: 'Health & Wellness',
    icon: '💊',
    description: 'Health, fitness, and wellness products',
    subcategories: [
      { id: 'vitamins-supplements', name: 'Vitamins & Supplements', icon: '💊' },
      { id: 'fitness-equipment', name: 'Fitness Equipment', icon: '🏋️' },
      { id: 'personal-care', name: 'Personal Care', icon: '🧴' },
      { id: 'medical-supplies', name: 'Medical Supplies', icon: '🩺' },
      { id: 'wellness-devices', name: 'Wellness Devices', icon: '⌚' },
      { id: 'nutrition', name: 'Nutrition & Diet', icon: '🥗' },
      { id: 'yoga-meditation', name: 'Yoga & Meditation', icon: '🧘' },
      { id: 'first-aid', name: 'First Aid & Safety', icon: '🚑' }
    ]
  },
  {
    id: 'automotive',
    name: 'Automotive',
    icon: '🚗',
    description: 'Car accessories and automotive products',
    subcategories: [
      { id: 'car-electronics', name: 'Car Electronics', icon: '📱' },
      { id: 'car-care', name: 'Car Care & Cleaning', icon: '🧽' },
      { id: 'interior-accessories', name: 'Interior Accessories', icon: '🪑' },
      { id: 'exterior-accessories', name: 'Exterior Accessories', icon: '🚗' },
      { id: 'tools-equipment', name: 'Tools & Equipment', icon: '🔧' },
      { id: 'oils-fluids', name: 'Oils & Fluids', icon: '🛢️' },
      { id: 'tires-wheels', name: 'Tires & Wheels', icon: '🛞' },
      { id: 'motorcycle', name: 'Motorcycle Accessories', icon: '🏍️' }
    ]
  },
  {
    id: 'pet-supplies',
    name: 'Pet Supplies',
    icon: '🐾',
    description: 'Products for pets and animals',
    subcategories: [
      { id: 'dog-supplies', name: 'Dog Supplies', icon: '🐕' },
      { id: 'cat-supplies', name: 'Cat Supplies', icon: '🐈' },
      { id: 'bird-supplies', name: 'Bird Supplies', icon: '🦜' },
      { id: 'fish-aquarium', name: 'Fish & Aquarium', icon: '🐠' },
      { id: 'pet-food', name: 'Pet Food & Treats', icon: '🍖' },
      { id: 'pet-toys', name: 'Pet Toys', icon: '🎾' },
      { id: 'grooming', name: 'Grooming & Care', icon: '✂️' },
      { id: 'pet-accessories', name: 'Pet Accessories', icon: '🦴' }
    ]
  },
  {
    id: 'office-stationery',
    name: 'Office & Stationery',
    icon: '📝',
    description: 'Office supplies and stationery',
    subcategories: [
      { id: 'writing-instruments', name: 'Writing Instruments', icon: '🖊️' },
      { id: 'notebooks-pads', name: 'Notebooks & Pads', icon: '📓' },
      { id: 'office-furniture', name: 'Office Furniture', icon: '🪑' },
      { id: 'desk-accessories', name: 'Desk Accessories', icon: '📎' },
      { id: 'filing-storage', name: 'Filing & Storage', icon: '🗂️' },
      { id: 'printers-scanners', name: 'Printers & Scanners', icon: '🖨️' },
      { id: 'office-electronics', name: 'Office Electronics', icon: '💼' },
      { id: 'packaging', name: 'Packaging & Shipping', icon: '📦' }
    ]
  }
];

/**
 * Get all main categories
 */
const getMainCategories = () => {
  return categories.map(cat => ({
    id: cat.id,
    name: cat.name,
    icon: cat.icon,
    description: cat.description,
    subcategoryCount: cat.subcategories.length
  }));
};

/**
 * Get subcategories for a specific main category
 */
const getSubcategories = (mainCategoryId) => {
  const category = categories.find(cat => cat.id === mainCategoryId);
  return category ? category.subcategories : [];
};

/**
 * Get category by ID
 */
const getCategoryById = (categoryId) => {
  return categories.find(cat => cat.id === categoryId);
};

/**
 * Get subcategory by ID
 */
const getSubcategoryById = (mainCategoryId, subcategoryId) => {
  const category = categories.find(cat => cat.id === mainCategoryId);
  if (!category) return null;
  return category.subcategories.find(sub => sub.id === subcategoryId);
};

/**
 * Search categories and subcategories
 */
const searchCategories = (query) => {
  const results = [];
  const lowerQuery = query.toLowerCase();
  
  categories.forEach(category => {
    // Check main category
    if (category.name.toLowerCase().includes(lowerQuery)) {
      results.push({
        type: 'category',
        ...category
      });
    }
    
    // Check subcategories
    category.subcategories.forEach(sub => {
      if (sub.name.toLowerCase().includes(lowerQuery)) {
        results.push({
          type: 'subcategory',
          mainCategory: category.name,
          mainCategoryId: category.id,
          ...sub
        });
      }
    });
  });
  
  return results;
};

module.exports = {
  categories,
  getMainCategories,
  getSubcategories,
  getCategoryById,
  getSubcategoryById,
  searchCategories
};
