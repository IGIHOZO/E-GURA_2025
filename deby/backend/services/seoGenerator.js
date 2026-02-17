/**
 * Advanced SEO Generator for Rwanda/Kigali Market
 * Generates top-ranking product titles and descriptions
 */

class SEOGenerator {
  constructor() {
    // Rwanda/Kigali specific keywords
    this.rwandaKeywords = {
      locations: [
        'Kigali', 'Rwanda', 'Nyarugenge', 'Gasabo', 'Kicukiro',
        'Kimihurura', 'Remera', 'Gikondo', 'Nyamirambo', 'Kacyiru'
      ],
      qualifiers: [
        'best', 'top', 'quality', 'premium', 'affordable', 'cheap',
        'elegant', 'stylish', 'trendy', 'modern', 'latest', 'new',
        'authentic', 'original', 'genuine', 'branded', 'designer'
      ],
      occasions: [
        'wedding', 'party', 'office', 'casual', 'formal', 'business',
        'church', 'graduation', 'date', 'weekend', 'everyday'
      ],
      demographics: [
        'men', 'women', 'ladies', 'girls', 'boys', 'kids', 'children',
        'youth', 'adults', 'professionals', 'students'
      ],
      seasons: [
        'summer', 'winter', 'rainy season', 'dry season', 'all season'
      ],
      features: [
        'comfortable', 'durable', 'lightweight', 'breathable', 'waterproof',
        'fashionable', 'versatile', 'classic', 'contemporary', 'chic'
      ]
    };

    // Category-specific templates
    this.categoryTemplates = {
      'Dresses': {
        titlePatterns: [
          '{qualifier} {demographic} {category} in {location}',
          '{qualifier} {category} for {occasion} - {location}',
          '{feature} {category} for {demographic} | {location}',
          '{qualifier} {material} {category} - Buy in {location}'
        ],
        descriptionPatterns: [
          'Discover the {qualifier} {category} in {location}, Rwanda. Perfect for {occasion}, our {feature} {category} collection offers {feature2} designs that suit every {demographic}. Shop now for fast delivery across {location2}.',
          'Looking for {qualifier} {category} in {location}? We offer premium {material} {category} perfect for {occasion}. {feature} and {feature2}, our collection is designed for modern {demographic} in Rwanda.',
          'Shop {qualifier} {category} in {location}, Rwanda. Our {feature} collection features {material} {category} ideal for {occasion}. Fast delivery to {location2}, Kigali. Best prices guaranteed!'
        ]
      },
      'Jackets': {
        titlePatterns: [
          '{qualifier} {demographic} {category} - {location}, Rwanda',
          '{material} {category} for {demographic} in {location}',
          '{qualifier} {category} | {feature} & {feature2} - {location}'
        ],
        descriptionPatterns: [
          'Premium {category} in {location}, Rwanda. Our {feature} {material} {category} are perfect for {demographic}. {feature2} designs suitable for {season}. Order now with delivery across Kigali.',
          'Find the {qualifier} {category} in {location}. {feature} {material} {category} for {occasion} and everyday wear. Shop our collection designed for Rwanda\'s climate.'
        ]
      },
      'Shoes': {
        titlePatterns: [
          '{qualifier} {demographic} {category} in {location}, Rwanda',
          '{feature} {category} for {occasion} - {location}',
          '{material} {category} | {qualifier} Prices in {location}'
        ],
        descriptionPatterns: [
          'Shop {qualifier} {category} in {location}, Rwanda. {feature} and {feature2} {material} {category} perfect for {demographic}. Fast delivery across Kigali and Rwanda.',
          'Looking for {qualifier} {category} in {location}? Our {feature} collection offers {material} {category} for {occasion}. Best prices in Rwanda with quick delivery.'
        ]
      },
      'Bags': {
        titlePatterns: [
          '{qualifier} {demographic} {category} - {location}, Rwanda',
          '{material} {category} for {occasion} | {location}',
          '{feature} {category} in {location} - {qualifier} Quality'
        ],
        descriptionPatterns: [
          'Discover {qualifier} {category} in {location}, Rwanda. Our {feature} {material} {category} are perfect for {demographic} and ideal for {occasion}. Shop now!',
          'Premium {category} collection in {location}. {feature} and {feature2} {material} {category} for modern {demographic}. Fast delivery across Rwanda.'
        ]
      }
    };

    // Default template for other categories
    this.defaultTemplate = {
      titlePatterns: [
        '{qualifier} {category} in {location}, Rwanda',
        '{qualifier} {category} for {demographic} - {location}',
        '{feature} {category} | Shop in {location}'
      ],
      descriptionPatterns: [
        'Shop {qualifier} {category} in {location}, Rwanda. {feature} collection perfect for {demographic}. Fast delivery across Kigali.',
        'Find the {qualifier} {category} in {location}. Our {feature} collection offers quality products for {demographic} in Rwanda.'
      ]
    };
  }

  /**
   * Generate SEO-optimized title based on actual product name
   */
  generateTitle(product) {
    // Use the actual product name as the base
    const productName = product.name || 'Product';
    
    // Add location for SEO
    let title = `${productName} | E-Gura Store - Kigali, Rwanda`;

    // Ensure it's under 60 characters for SEO
    if (title.length > 60) {
      title = `${productName} | E-Gura Store`;
    }
    
    if (title.length > 60) {
      title = productName.substring(0, 57) + '...';
    }

    return title;
  }

  /**
   * Generate SEO-optimized description based on product name and details
   */
  generateDescription(product) {
    const productName = product.name || 'Product';
    const category = product.category || 'Products';
    
    // Use product description if provided, otherwise generate one
    if (product.description && product.description.length >= 50) {
      let desc = product.description;
      // Ensure it's under 160 characters for meta description
      if (desc.length > 160) {
        desc = desc.substring(0, 157) + '...';
      }
      return desc;
    }
    
    // Generate description based on product name
    let description = `Shop ${productName} in Kigali, Rwanda. `;
    
    // Add category info
    description += `Quality ${category.toLowerCase()} `;
    
    // Add price if available
    if (product.price) {
      description += `from ${product.price.toLocaleString()} RWF. `;
    }
    
    // Add colors if available
    if (product.colors && product.colors.length > 0) {
      description += `Available in ${product.colors.slice(0, 3).join(', ')}. `;
    }
    
    description += 'Fast delivery across Kigali.';

    // Ensure it's under 160 characters for meta description
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
   * Generate complete SEO package
   */
  generateSEOPackage(product) {
    try {
      // Validate product input
      if (!product || typeof product !== 'object') {
        throw new Error('Invalid product data');
      }

      // Ensure product has minimum required fields
      const safeProduct = {
        name: product.name || 'Product',
        category: product.category || 'Products',
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

      return {
        success: true,
        title: title || 'Quality Product | Rwanda',
        description: description || 'Shop quality products in Kigali, Rwanda.',
        metaDescription: metaDescription || 'Quality products available in Kigali.',
        keywords: keywords || 'products, kigali, rwanda',
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
      
      // Return safe fallback
      return {
        success: true,
        title: `${product.name || 'Product'} | Rwanda`,
        description: `Shop ${product.name || 'products'} in Kigali, Rwanda. Quality products at best prices.`,
        metaDescription: `Buy ${product.name || 'products'} in Kigali, Rwanda.`,
        keywords: `${product.category || 'products'}, kigali, rwanda`,
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
