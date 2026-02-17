import React, { useEffect } from 'react';
import { Helmet } from 'react-helmet-async';

const SEO = ({ 
  title, 
  description, 
  keywords, 
  canonicalUrl, 
  ogImage, 
  ogType = 'website',
  article,
  product,
  category,
  noIndex = false,
  structuredData
}) => {
  // Default values
  const defaultTitle = 'E-Gura Store - Rwanda\'s #1 Online Shopping Platform | Kigali';
  const defaultDescription = 'Rwanda\'s #1 online shopping platform. Buy electronics, fashion, home appliances in Kigali. Free delivery in Kimironko, Remera, Nyarutarama, Kicukiro, Gasabo. MTN MoMo & Airtel Money. Order now!';
  const defaultKeywords = 'online shopping Rwanda, buy online Kigali, E-Gura store, Kigali online shop, Rwanda e-commerce, mobile money shopping, electronics Kigali, fashion Rwanda, home appliances Kigali, Kimironko shopping, Remera online store, Nyarutarama delivery, Gikondo shopping, Kicukiro online, Gasabo e-commerce, free delivery Kigali, MTN MoMo Rwanda, Airtel Money shopping, Kacyiru online, Nyamirambo shopping';
  const defaultCanonical = 'https://egura.rw/';
  const defaultOgImage = 'https://egura.rw/og-image.jpg';

  const finalTitle = title || defaultTitle;
  const finalDescription = description || defaultDescription;
  const finalKeywords = keywords || defaultKeywords;
  const finalCanonical = canonicalUrl || defaultCanonical;
  const finalOgImage = ogImage || defaultOgImage;

  // Generate structured data based on page type
  const generateStructuredData = () => {
    if (structuredData) return structuredData;

    if (product) {
      return {
        "@context": "https://schema.org",
        "@type": "Product",
        "name": product.name,
        "description": product.description || finalDescription,
        "image": product.image || finalOgImage,
        "brand": {
          "@type": "Brand",
          "name": "E-Gura Store"
        },
        "offers": {
          "@type": "Offer",
          "url": product.url || finalCanonical,
          "priceCurrency": "RWF",
          "price": product.price,
          "availability": product.inStock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
          "seller": {
            "@type": "Organization",
            "name": "E-Gura Store",
            "url": "https://egura.rw"
          }
        },
        "aggregateRating": product.rating ? {
          "@type": "AggregateRating",
          "ratingValue": product.rating,
          "reviewCount": product.reviewCount || 1
        } : undefined
      };
    }

    if (category) {
      return {
        "@context": "https://schema.org",
        "@type": "CollectionPage",
        "name": category.name,
        "description": category.description || finalDescription,
        "url": finalCanonical,
        "mainEntity": {
          "@type": "ItemList",
          "numberOfItems": category.itemCount || 0,
          "itemListElement": category.items?.map((item, index) => ({
            "@type": "ListItem",
            "position": index + 1,
            "url": item.url
          }))
        }
      };
    }

    if (article) {
      return {
        "@context": "https://schema.org",
        "@type": "Article",
        "headline": article.title,
        "description": article.description || finalDescription,
        "image": article.image || finalOgImage,
        "author": {
          "@type": "Organization",
          "name": "E-Gura Store"
        },
        "publisher": {
          "@type": "Organization",
          "name": "E-Gura Store",
          "logo": {
            "@type": "ImageObject",
            "url": "https://egura.rw/logo.png"
          }
        },
        "datePublished": article.publishedAt,
        "dateModified": article.updatedAt || article.publishedAt,
        "mainEntityOfPage": {
          "@type": "WebPage",
          "@id": finalCanonical
        }
      };
    }

    // Default organization structured data
    return {
      "@context": "https://schema.org",
      "@type": "Organization",
      "@id": "https://egura.rw/#organization",
      "name": "E-Gura Store",
      "alternateName": "E-Gura",
      "description": finalDescription,
      "url": "https://egura.rw",
      "logo": "https://egura.rw/logo.png",
      "image": finalOgImage,
      "telephone": "+250782013955",
      "email": "support@egura.rw",
      "address": {
        "@type": "PostalAddress",
        "streetAddress": "Kimironko, Near Bank of Kigali, KG 156 St",
        "addressLocality": "Kigali",
        "addressRegion": "Kigali City",
        "postalCode": "00000",
        "addressCountry": "RW"
      },
      "geo": {
        "@type": "GeoCoordinates",
        "latitude": -1.9441,
        "longitude": 30.0619
      },
      "openingHoursSpecification": [
        {
          "@type": "OpeningHoursSpecification",
          "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
          "opens": "00:00",
          "closes": "23:59"
        }
      ],
      "priceRange": "RWF 1000 - 5000000",
      "currenciesAccepted": "RWF",
      "paymentAccepted": ["Mobile Money", "MTN MoMo", "Airtel Money", "Cash on Delivery", "Bank Transfer"],
      "areaServed": {
        "@type": "Country",
        "name": "Rwanda"
      },
      "sameAs": [
        "https://www.facebook.com/egurastore",
        "https://www.instagram.com/egurastore",
        "https://twitter.com/egurastore",
        "https://www.linkedin.com/company/egurastore"
      ]
    };
  };

  const structuredDataJson = generateStructuredData();

  useEffect(() => {
    // Update page title for better SEO
    document.title = finalTitle;
    
    // Update meta description
    let metaDescription = document.querySelector('meta[name="description"]');
    if (!metaDescription) {
      metaDescription = document.createElement('meta');
      metaDescription.name = 'description';
      document.head.appendChild(metaDescription);
    }
    metaDescription.content = finalDescription;

    // Update canonical URL
    let canonicalLink = document.querySelector('link[rel="canonical"]');
    if (!canonicalLink) {
      canonicalLink = document.createElement('link');
      canonicalLink.rel = 'canonical';
      document.head.appendChild(canonicalLink);
    }
    canonicalLink.href = finalCanonical;
  }, [finalTitle, finalDescription, finalCanonical]);

  return (
    <Helmet>
      {/* Basic Meta Tags */}
      <title>{finalTitle}</title>
      <meta name="description" content={finalDescription} />
      <meta name="keywords" content={finalKeywords} />
      <meta name="author" content="E-Gura Store" />
      
      {/* Robots */}
      <meta name="robots" content={noIndex ? 'noindex, nofollow' : 'index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1'} />
      <meta name="googlebot" content={noIndex ? 'noindex, nofollow' : 'index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1'} />
      <meta name="bingbot" content={noIndex ? 'noindex, nofollow' : 'index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1'} />
      
      {/* Canonical */}
      <link rel="canonical" href={finalCanonical} />
      
      {/* Open Graph */}
      <meta property="og:type" content={ogType} />
      <meta property="og:url" content={finalCanonical} />
      <meta property="og:site_name" content="E-Gura Store" />
      <meta property="og:title" content={finalTitle} />
      <meta property="og:description" content={finalDescription} />
      <meta property="og:image" content={finalOgImage} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:image:alt" content={finalTitle} />
      <meta property="og:locale" content="en_RW" />
      
      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:site" content="@egurastore" />
      <meta name="twitter:creator" content="@egurastore" />
      <meta name="twitter:url" content={finalCanonical} />
      <meta name="twitter:title" content={finalTitle} />
      <meta name="twitter:description" content={finalDescription} />
      <meta name="twitter:image" content={finalOgImage} />
      <meta name="twitter:image:alt" content={finalTitle} />
      
      {/* Additional Meta Tags */}
      <meta name="theme-color" content="#8B5CF6" />
      <meta name="msapplication-TileColor" content="#8B5CF6" />
      <meta name="msapplication-TileImage" content="/mstile-144x144.png" />
      
      {/* Geographic Meta Tags */}
      <meta name="geo.region" content="RW" />
      <meta name="geo.placename" content="Kigali" />
      <meta name="geo.position" content="-1.9441;30.0619" />
      <meta name="ICBM" content="-1.9441, 30.0619" />
      
      {/* Language & Region */}
      <meta name="language" content="English" />
      <meta name="country" content="Rwanda" />
      <meta name="distribution" content="global" />
      <meta name="rating" content="general" />
      <meta name="referrer" content="no-referrer-when-downgrade" />
      
      {/* Structured Data */}
      <script type="application/ld+json">
        {JSON.stringify(structuredDataJson)}
      </script>
      
      {/* Favicon */}
      <link rel="icon" type="image/png" href="/favicon.png" />
      <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
      <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
    </Helmet>
  );
};

export default SEO;
