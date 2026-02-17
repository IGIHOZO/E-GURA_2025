import React from 'react';
import { Link } from 'react-router-dom';
import SEO from '../components/SEO';
import {
  ShoppingBagIcon,
  TruckIcon,
  ShieldCheckIcon,
  HeartIcon,
  UserGroupIcon,
  GlobeAltIcon
} from '@heroicons/react/24/outline';

const About = () => {
  const features = [
    {
      icon: ShoppingBagIcon,
      title: 'Wide Selection',
      description: 'Thousands of products across multiple categories including electronics, fashion, home & living, and more.'
    },
    {
      icon: TruckIcon,
      title: 'Fast Delivery',
      description: 'Free shipping within Kigali. Fast and reliable delivery across Rwanda.'
    },
    {
      icon: ShieldCheckIcon,
      title: 'Secure Shopping',
      description: 'Your data is protected with industry-standard encryption and secure payment methods.'
    },
    {
      icon: HeartIcon,
      title: 'Customer First',
      description: 'Dedicated customer support team ready to help you with any questions or concerns.'
    },
    {
      icon: UserGroupIcon,
      title: 'Trusted by Thousands',
      description: 'Join thousands of satisfied customers who shop with us regularly.'
    },
    {
      icon: GlobeAltIcon,
      title: 'Authentic Products',
      description: 'We guarantee 100% authentic products from verified sellers and brands.'
    }
  ];

  return (
    <>
      <SEO
        title="About E-Gura Store - Rwanda's Trusted Online Shopping Platform"
        description="Learn about E-Gura Store, Rwanda's premier online shopping platform. Serving Kigali and all of Rwanda with quality products, fast delivery, and secure mobile money payments."
        keywords="about E-Gura, E-Gura Store Rwanda, online shopping Kigali, Rwanda e-commerce, trusted online store, mobile money shopping, Kigali delivery"
        canonicalUrl="https://egura.rw/about"
        ogImage="https://egura.rw/og-image.jpg"
        article={{
          title: "About E-Gura Store - Rwanda's Trusted Online Shopping Platform",
          description: "Learn about E-Gura Store's mission to provide quality products and exceptional service to customers across Rwanda.",
          publishedAt: "2024-01-01"
        }}
      />
      <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-orange-600 to-red-600 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">About E-Gura Store</h1>
          <p className="text-xl md:text-2xl opacity-90">Your Trusted Online Shopping Destination in Rwanda</p>
        </div>
      </div>

      {/* Story Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid md:grid-cols-2 gap-12 items-center mb-16">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Our Story</h2>
            <div className="space-y-4 text-gray-700 leading-relaxed">
              <p>
                Welcome to E-Gura Store, Rwanda's premier online shopping destination. We started with a simple mission: to make quality products accessible to everyone across Rwanda.
              </p>
              <p>
                Founded in Kigali, we've grown from a small startup to a trusted e-commerce platform serving thousands of customers. Our commitment to quality, authenticity, and customer satisfaction drives everything we do.
              </p>
              <p>
                Today, we offer a wide range of products from electronics and fashion to home essentials and beauty products, all at competitive prices with the convenience of shopping from home.
              </p>
            </div>
          </div>
          <div className="bg-gradient-to-br from-orange-500 to-red-500 rounded-2xl p-8 text-white">
            <h3 className="text-2xl font-bold mb-6">Why Choose Us?</h3>
            <ul className="space-y-4">
              <li className="flex items-start">
                <span className="text-2xl mr-3">✓</span>
                <span>100% Authentic Products Guaranteed</span>
              </li>
              <li className="flex items-start">
                <span className="text-2xl mr-3">✓</span>
                <span>Free Shipping in Kigali</span>
              </li>
              <li className="flex items-start">
                <span className="text-2xl mr-3">✓</span>
                <span>Secure Payment Options</span>
              </li>
              <li className="flex items-start">
                <span className="text-2xl mr-3">✓</span>
                <span>Easy Returns & Refunds</span>
              </li>
              <li className="flex items-start">
                <span className="text-2xl mr-3">✓</span>
                <span>24/7 Customer Support</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Features Grid */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">What We Offer</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="bg-white rounded-xl shadow-md p-6 hover:shadow-xl transition-shadow">
                <feature.icon className="w-12 h-12 text-orange-600 mb-4" />
                <h3 className="text-xl font-bold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Location */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">Visit Us</h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Our Location</h3>
              <p className="text-gray-700 mb-2">📍 Kigali, Kimironko</p>
              <p className="text-gray-700 mb-2">Near Bank of Kigali, KG 156 St</p>
              <p className="text-gray-700 mb-4">Kigali, Rwanda</p>
              <a
                href="https://maps.app.goo.gl/HSciWZxNHkrDK8xu5"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block bg-orange-600 text-white px-6 py-3 rounded-lg hover:bg-orange-700 transition-colors"
              >
                View on Map
              </a>
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Contact Us</h3>
              <p className="text-gray-700 mb-2">📞 Phone: +250 782 013 955</p>
              <p className="text-gray-700 mb-2">📧 Email: support@egura.store</p>
              <p className="text-gray-700 mb-4">🕐 Hours: Mon-Sat, 9:00 AM - 6:00 PM</p>
              <Link
                to="/contact"
                className="inline-block bg-gray-900 text-white px-6 py-3 rounded-lg hover:bg-gray-800 transition-colors"
              >
                Send Message
              </Link>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl p-12 text-center text-white">
          <h2 className="text-3xl font-bold mb-4">Ready to Start Shopping?</h2>
          <p className="text-xl mb-8 opacity-90">Explore thousands of products at great prices</p>
          <Link
            to="/shop"
            className="inline-block bg-white text-purple-600 px-8 py-4 rounded-lg font-bold text-lg hover:bg-gray-100 transition-colors"
          >
            Browse Products
          </Link>
        </div>
      </div>
    </div>
    </>
  );
};

export default About;