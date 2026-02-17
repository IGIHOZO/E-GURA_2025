import React from 'react';
import SEO from '../components/SEO';

const SEOTest = () => {
  return (
    <>
      <SEO
        title="SEO Test Page - E-Gura Store"
        description="Testing SEO implementation for E-Gura Store frontend. Verify meta tags, structured data, and optimization."
        keywords="SEO test, E-Gura Store, meta tags, structured data, Rwanda e-commerce"
        canonicalUrl="https://egura.rw/seo-test"
        ogImage="https://egura.rw/og-image.jpg"
        product={{
          name: "Test Product",
          description: "Test product for SEO verification",
          image: "/test-product.jpg",
          price: 25000,
          url: "https://egura.rw/product/test",
          inStock: true,
          rating: 4.5,
          reviewCount: 128
        }}
      />
      
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-6">SEO Implementation Test</h1>
          
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">✅ SEO Features Implemented</h2>
            <ul className="space-y-2">
              <li>✅ Dynamic Meta Tags (Title, Description, Keywords)</li>
              <li>✅ Open Graph Tags (Facebook, LinkedIn)</li>
              <li>✅ Twitter Card Optimization</li>
              <li>✅ Structured Data (Product Schema)</li>
              <li>✅ Canonical URLs</li>
              <li>✅ Geographic Targeting (Rwanda, Kigali)</li>
              <li>✅ Mobile Optimization</li>
              <li>✅ Favicon Implementation</li>
              <li>✅ Robots.txt Configuration</li>
              <li>✅ Sitemap Generation</li>
            </ul>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">🔍 How to Verify SEO</h2>
            <ol className="space-y-2">
              <li>1. Open browser developer tools (F12)</li>
              <li>2. Check the "Elements" tab for meta tags</li>
              <li>3. View page source to see all SEO tags</li>
              <li>4. Use Facebook Debug Tool to test Open Graph</li>
              <li>5. Use Google Rich Results Test for structured data</li>
              <li>6. Check mobile responsiveness</li>
            </ol>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">📊 Expected SEO Results</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="font-medium mb-2">Search Rankings</h3>
                <p>Improved visibility for Rwanda-based searches</p>
              </div>
              <div>
                <h3 className="font-medium mb-2">Rich Snippets</h3>
                <p>Product information in search results</p>
              </div>
              <div>
                <h3 className="font-medium mb-2">Social Sharing</h3>
                <p>Optimized previews on social platforms</p>
              </div>
              <div>
                <h3 className="font-medium mb-2">Local SEO</h3>
                <p>Better visibility in Kigali area searches</p>
              </div>
            </div>
          </div>
          
          <div className="mt-8 text-center">
            <a 
              href="/shop" 
              className="inline-block bg-orange-500 text-white px-6 py-3 rounded-lg hover:bg-orange-600 transition-colors"
            >
              Go to Shop →
            </a>
          </div>
        </div>
      </div>
    </>
  );
};

export default SEOTest;
