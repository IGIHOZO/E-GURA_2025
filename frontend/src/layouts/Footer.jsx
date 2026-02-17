import React from 'react';
import { Link } from 'react-router-dom';
import Logo from '../components/Logo';
import { 
  ShoppingBagIcon, 
  SparklesIcon, 
  PhoneIcon, 
  EnvelopeIcon,
  MapPinIcon
} from '@heroicons/react/24/outline';
import { 
  FaInstagram, 
  FaFacebook, 
  FaThreads 
} from 'react-icons/fa6';

const Footer = () => {
  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Section */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center space-x-3 mb-4">
              <Logo size="lg" />
              <span className="text-2xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">E-Gura Store</span>
            </div>
            <p className="text-gray-400 mb-6 max-w-md">
              Your One-Stop Shop for Quality Products in Rwanda. 
              Discover amazing deals on electronics, fashion, accessories, and more with fast delivery across Kigali.
            </p>
            <div className="flex space-x-4">
              <Link
                to="/shop"
                className="inline-flex items-center px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
              >
                <ShoppingBagIcon className="h-4 w-4 mr-2" />
                Shop Now
              </Link>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2 text-gray-400">
              <li>
                <Link to="/" className="hover:text-white transition-colors">Home</Link>
              </li>
              <li>
                <Link to="/shop" className="hover:text-white transition-colors">Shop</Link>
              </li>
              <li>
                <Link to="/cart" className="hover:text-white transition-colors">Cart</Link>
              </li>
              <li>
                <Link to="/account" className="hover:text-white transition-colors">Account</Link>
              </li>
            </ul>
          </div>

          {/* Categories */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Categories</h3>
            <ul className="space-y-2 text-gray-400">
              <li>
                <Link to="/shop?category=Dresses" className="hover:text-white transition-colors">Dresses</Link>
              </li>
              <li>
                <Link to="/shop?category=Tops" className="hover:text-white transition-colors">Tops</Link>
              </li>
              <li>
                <Link to="/shop?category=Bottoms" className="hover:text-white transition-colors">Bottoms</Link>
              </li>
              <li>
                <Link to="/shop?category=Suits" className="hover:text-white transition-colors">Suits</Link>
              </li>
              <li>
                <Link to="/shop?category=Accessories" className="hover:text-white transition-colors">Accessories</Link>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Contact</h3>
            <div className="space-y-3 text-gray-400">
              <div className="flex items-start">
                <MapPinIcon className="h-5 w-5 mr-2 text-orange-500 flex-shrink-0 mt-0.5" />
                <span>KG 7 Ave, Kigali, Rwanda</span>
              </div>
              <div className="flex items-center">
                <PhoneIcon className="h-5 w-5 mr-2 text-orange-500" />
                <a href="tel:+250782013955" className="hover:text-white transition-colors">+250 782 013 955</a>
              </div>
              <div className="flex items-center">
                <EnvelopeIcon className="h-5 w-5 mr-2 text-orange-500" />
                <a href="mailto:info@egurastore.com" className="hover:text-white transition-colors">info@egurastore.com</a>
              </div>
            </div>
            
            {/* Social Media Links */}
            <div className="mt-6">
              <h4 className="text-sm font-semibold mb-3">Follow Us</h4>
              <div className="flex space-x-4">
                <a 
                  href="https://www.instagram.com/egurastore/?hl=en" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-pink-500 transition-colors"
                  aria-label="Instagram"
                >
                  <FaInstagram className="h-6 w-6" />
                </a>
                <a 
                  href="https://www.facebook.com/egurastore/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-blue-500 transition-colors"
                  aria-label="Facebook"
                >
                  <FaFacebook className="h-6 w-6" />
                </a>
                <a 
                  href="https://www.threads.com/@egurastore" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-white transition-colors"
                  aria-label="Threads"
                >
                  <FaThreads className="h-6 w-6" />
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="border-t border-gray-800 mt-8 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-400 text-sm">
              &copy; 2024 E-Gura Store. All rights reserved.
            </p>
            <div className="flex space-x-6 mt-4 md:mt-0">
              <Link to="/about" className="text-gray-400 hover:text-white text-sm transition-colors">
                About Us
              </Link>
              <Link to="/contact" className="text-gray-400 hover:text-white text-sm transition-colors">
                Contact
              </Link>
              <Link to="/privacy-policy" className="text-gray-400 hover:text-white text-sm transition-colors">
                Privacy Policy
              </Link>
              <Link to="/terms-of-service" className="text-gray-400 hover:text-white text-sm transition-colors">
                Terms of Service
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer; 