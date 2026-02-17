import React from 'react';
import { Helmet } from 'react-helmet-async';
import { Link, useLocation } from 'react-router-dom';
import { ChevronRightIcon, HomeIcon } from '@heroicons/react/24/outline';

/**
 * BreadcrumbSchema Component
 * Provides both visual breadcrumbs and structured data for SEO
 */
const BreadcrumbSchema = ({ items = [], productName = null, categoryName = null }) => {
  const location = useLocation();
  
  // Auto-generate breadcrumb items if not provided
  const breadcrumbItems = items.length > 0 ? items : generateBreadcrumbs(location.pathname, productName, categoryName);
  
  // Generate structured data schema
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": breadcrumbItems.map((item, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "name": item.name,
      "item": `https://egura.rw${item.path}`
    }))
  };

  return (
    <>
      {/* Structured Data */}
      <Helmet>
        <script type="application/ld+json">
          {JSON.stringify(breadcrumbSchema)}
        </script>
      </Helmet>

      {/* Visual Breadcrumbs */}
      <nav aria-label="Breadcrumb" className="bg-gray-50 px-4 py-3 rounded-lg mb-6">
        <ol className="flex items-center space-x-2 text-sm">
          <li>
            <Link 
              to="/" 
              className="flex items-center text-gray-500 hover:text-purple-600 transition-colors"
              aria-label="Home"
            >
              <HomeIcon className="w-4 h-4" />
            </Link>
          </li>
          {breadcrumbItems.map((item, index) => (
            <li key={index} className="flex items-center">
              <ChevronRightIcon className="w-4 h-4 text-gray-400 mx-2" />
              {index === breadcrumbItems.length - 1 ? (
                <span className="text-gray-900 font-medium" aria-current="page">
                  {item.name}
                </span>
              ) : (
                <Link 
                  to={item.path} 
                  className="text-gray-500 hover:text-purple-600 transition-colors"
                >
                  {item.name}
                </Link>
              )}
            </li>
          ))}
        </ol>
      </nav>
    </>
  );
};

// Helper function to generate breadcrumbs from pathname
function generateBreadcrumbs(pathname, productName, categoryName) {
  const paths = pathname.split('/').filter(Boolean);
  const breadcrumbs = [];
  
  paths.forEach((path, index) => {
    const currentPath = '/' + paths.slice(0, index + 1).join('/');
    
    // Map path segments to readable names
    let name = path.charAt(0).toUpperCase() + path.slice(1);
    
    if (path === 'shop') {
      name = 'Shop';
    } else if (path === 'product' && productName) {
      name = productName;
    } else if (path === 'blog') {
      name = 'Blog';
    } else if (path === 'cart') {
      name = 'Shopping Cart';
    } else if (path === 'checkout') {
      name = 'Checkout';
    } else if (path === 'tracking') {
      name = 'Order Tracking';
    } else if (path === 'about') {
      name = 'About Us';
    } else if (path === 'contact') {
      name = 'Contact';
    } else if (categoryName && index === paths.length - 1) {
      name = categoryName;
    }
    
    breadcrumbs.push({
      name,
      path: currentPath
    });
  });
  
  return breadcrumbs;
}

export default BreadcrumbSchema;
