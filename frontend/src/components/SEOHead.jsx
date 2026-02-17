import React from 'react';
import { Helmet } from 'react-helmet-async';

const SEOHead = ({ 
  title = "E-Gura Store | Online Shopping in Kigali, Rwanda - Electronics, Fashion & More",
  description = "Rwanda's #1 online shopping platform. Buy electronics, fashion, home appliances in Kigali. Free delivery in Kigali, Kimironko, Remera, Nyarutarama. Mobile Money payments. Order now!",
  keywords = "online shopping Rwanda, buy online Kigali, E-Gura store, Kigali online shop, Rwanda e-commerce, mobile money shopping, electronics Kigali, fashion Rwanda, home appliances Kigali, Kimironko shopping, Remera online store, Nyarutarama delivery, Gikondo shopping, Kicukiro online, Gasabo e-commerce, free delivery Kigali, MTN MoMo Rwanda, Airtel Money shopping",
  image = "/logo.png",
  url = "",
  type = "website",
  product = null,
  pageType = "general"
}) => {
  const fullUrl = url || window.location.href;
  const fullTitle = title.includes("E-Gura Store") ? title : `${title} - E-Gura Store`;
  
  // Base structured data for organization
  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": "https://egura.rw/#organization",
    "name": "E-Gura Store",
    "alternateName": "E-Gura",
    "url": "https://egura.rw",
    "logo": {
      "@type": "ImageObject",
      "url": "https://egura.rw/logo.png",
      "width": 600,
      "height": 600
    },
    "image": "https://egura.rw/og-image.jpg",
    "description": "Rwanda's leading online shopping platform for electronics, fashion, home appliances, and more. Fast delivery in Kigali.",
    "foundingDate": "2024",
    "address": {
      "@type": "PostalAddress",
      "streetAddress": "KG 5 Ave",
      "addressLocality": "Kigali",
      "addressRegion": "Kigali City",
      "addressCountry": "RW"
    },
    "contactPoint": [
      {
        "@type": "ContactPoint",
        "telephone": "+250782013955",
        "contactType": "customer service",
        "areaServed": "RW",
        "availableLanguage": ["English", "Kinyarwanda", "French"],
        "contactOption": "TollFree"
      },
      {
        "@type": "ContactPoint",
        "telephone": "+250782013955",
        "contactType": "sales",
        "areaServed": "RW",
        "availableLanguage": ["English", "Kinyarwanda", "French"]
      }
    ],
    "email": "support@egura.rw",
    "sameAs": [
      "https://www.facebook.com/egurastore",
      "https://www.instagram.com/egurastore",
      "https://twitter.com/egurastore",
      "https://www.linkedin.com/company/egurastore"
    ]
  };

  // Local business schema
  const localBusinessSchema = {
    "@context": "https://schema.org",
    "@type": "OnlineStore",
    "@id": "https://egura.rw/#store",
    "name": "E-Gura Store",
    "description": "Rwanda's #1 online shopping platform for electronics, fashion, home appliances. Free delivery in Kigali (Kimironko, Remera, Nyarutarama, Kicukiro, Gasabo). Secure MTN MoMo & Airtel Money payments.",
    "url": "https://egura.rw",
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
    "areaServed": [
      {
        "@type": "City",
        "name": "Kigali",
        "@id": "https://en.wikipedia.org/wiki/Kigali"
      },
      {
        "@type": "Country",
        "name": "Rwanda",
        "@id": "https://en.wikipedia.org/wiki/Rwanda"
      }
    ],
    "serviceArea": [
      {"@type": "Place", "name": "Kimironko"},
      {"@type": "Place", "name": "Remera"},
      {"@type": "Place", "name": "Nyarutarama"},
      {"@type": "Place", "name": "Kicukiro"},
      {"@type": "Place", "name": "Gasabo"},
      {"@type": "Place", "name": "Gikondo"},
      {"@type": "Place", "name": "Kibagabaga"},
      {"@type": "Place", "name": "Nyamirambo"},
      {"@type": "Place", "name": "Kacyiru"},
      {"@type": "Place", "name": "Gisozi"}
    ],
    "hasMap": "https://maps.google.com/?q=-1.9441,30.0619",
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "4.8",
      "reviewCount": "1250",
      "bestRating": "5",
      "worstRating": "1"
    }
  };

  // WebSite schema
  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": "https://egura.rw/#website",
    "name": "E-Gura Store",
    "alternateName": "E-Gura Rwanda",
    "url": "https://egura.rw",
    "description": "Rwanda's #1 online shopping platform - Buy electronics, fashion, home appliances with free delivery in Kigali",
    "publisher": {
      "@id": "https://egura.rw/#organization"
    },
    "potentialAction": {
      "@type": "SearchAction",
      "target": {
        "@type": "EntryPoint",
        "urlTemplate": "https://egura.rw/shop?search={search_term_string}"
      },
      "query-input": "required name=search_term_string"
    },
    "inLanguage": "en-RW"
  };

  return (
    <Helmet>
      {/* Basic Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      
      {/* Open Graph Meta Tags */}
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:type" content={type} />
      <meta property="og:url" content={fullUrl} />
      <meta property="og:image" content={image} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:site_name" content="E-Gura Store" />
      <meta property="og:locale" content="en_US" />
      
      {/* Twitter Card Meta Tags */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />
      <meta name="twitter:site" content="@sewithdebb" />
      <meta name="twitter:creator" content="@sewithdebb" />
      
      {/* Additional SEO Meta Tags */}
      <link rel="canonical" href={fullUrl} />
      <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
      <meta name="author" content="E-Gura Store" />
      <meta name="copyright" content="E-Gura Store" />
      
      {/* Geographic Meta Tags */}
      <meta name="geo.region" content="RW" />
      <meta name="geo.placename" content="Kigali" />
      <meta name="geo.position" content="-1.9441;30.0619" />
      <meta name="ICBM" content="-1.9441, 30.0619" />
      
      {/* Language and Region */}
      <meta name="language" content="English" />
      <meta name="distribution" content="Rwanda" />
      <meta name="coverage" content="Worldwide" />
      <meta name="rating" content="General" />
      
      {/* Mobile and Viewport */}
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <meta name="format-detection" content="telephone=no" />
      
      {/* Performance and Security */}
      <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
      <meta name="theme-color" content="#8B5CF6" />
      <meta name="msapplication-TileColor" content="#8B5CF6" />
      
      {/* Social Media and Sharing */}
      <meta property="fb:app_id" content="your-facebook-app-id" />
      
      {/* Structured Data */}
      <script type="application/ld+json">
        {JSON.stringify(organizationSchema)}
      </script>
      <script type="application/ld+json">
        {JSON.stringify(localBusinessSchema)}
      </script>
      <script type="application/ld+json">
        {JSON.stringify(websiteSchema)}
      </script>
      
      {/* Product-specific structured data if provided */}
      {product && (
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Product",
            "name": product.name,
            "description": product.description || product.shortDescription,
            "image": product.mainImage,
            "brand": {
              "@type": "Brand",
              "name": "E-Gura Store",
              "logo": "https://egura.rw/logo.png"
            },
            "offers": {
              "@type": "Offer",
              "price": product.price,
              "priceCurrency": "RWF",
              "availability": product.stockQuantity > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
              "seller": {
                "@type": "Organization",
                "name": "E-Gura Store"
              },
              "shippingDetails": {
                "@type": "OfferShippingDetails",
                "shippingRate": {
                  "@type": "MonetaryAmount",
                  "value": "0",
                  "currency": "RWF"
                },
                "deliveryTime": {
                  "@type": "ShippingDeliveryTime",
                  "handlingTime": {
                    "@type": "QuantitativeValue",
                    "minValue": "1",
                    "maxValue": "3",
                    "unitCode": "DAY"
                  },
                  "transitTime": {
                    "@type": "QuantitativeValue",
                    "minValue": "1",
                    "maxValue": "5",
                    "unitCode": "DAY"
                  }
                }
              }
            },
            "aggregateRating": {
              "@type": "AggregateRating",
              "ratingValue": product.averageRating || 4.5,
              "reviewCount": product.totalReviews || 0
            },
            "category": product.category,
            "color": product.availableColors?.join(', '),
            "sku": product._id,
            "mpn": product._id
          })}
        </script>
      )}
      
      {/* Page-specific meta tags */}
      {pageType === "product" && product && (
        <>
          <meta name="product:price:amount" content={product.price} />
          <meta name="product:price:currency" content="RWF" />
          <meta name="product:availability" content={product.stockQuantity > 0 ? "in stock" : "out of stock"} />
          <meta name="product:condition" content="new" />
          <meta name="product:retailer_item_id" content={product._id} />
          <meta name="product:brand" content="E-Gura Store" />
          <meta name="product:category" content={product.category} />
        </>
      )}
      
      {/* Preconnect to external domains for performance */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link rel="preconnect" href="https://images.unsplash.com" />
      
      {/* Favicon and app icons */}
      <link rel="icon" type="image/x-icon" href="/favicon.ico" />
      <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
      <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
      <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
      <link rel="manifest" href="/site.webmanifest" />
    </Helmet>
  );
};

export default SEOHead; 