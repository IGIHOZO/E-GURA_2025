import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import Navigation from './components/Navigation';
import HomeNewDesign from './pages/HomeNewDesign';
import HomeAdvanced from './pages/HomeAdvanced';
import Home from './pages/Home';
import HomeNew from './pages/HomeNew';
import HomeModern from './pages/HomeModern';
import TestPage from './TestPage';
import AuthPage from './pages/AuthPage';
import OrderTracking from './pages/OrderTracking';
import Shop from './pages/Shop';
import ShopNew from './pages/ShopNew';
import ShopAliExpress from './pages/ShopAliExpress';
import CategoryPage from './pages/CategoryPage';
import ProductDetail from './pages/ProductDetail';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import OrderSuccess from './pages/OrderSuccess';
import Orders from './pages/Orders';
import CustomerAccount from './pages/CustomerAccount';
import CustomerPortal from './pages/CustomerPortal';
import MyAccount from './pages/MyAccount';
import QuickAuth from './pages/QuickAuth';
import AdminDashboardNew from './pages/AdminDashboardNew';
import AdminDashboard from './pages/AdminDashboard';
import AdminAdvancedDashboard from './pages/AdminAdvancedDashboard';
import AdminDashboardComplete from './pages/AdminDashboardComplete';
import AdvancedAdminDashboard from './pages/AdvancedAdminDashboard';
import AdminLogin from './pages/AdminLogin';
import ProtectedAdminRoute from './components/ProtectedAdminRoute';
import AdminShippingSettings from './components/AdminShippingSettings';
import AISEOGenerator from './components/AISEOGenerator';
import About from './pages/About';
import Contact from './pages/Contact';
import Blog from './pages/Blog';
import BlogPost from './pages/BlogPost';
import VirtualTryOn from './components/VirtualTryOn';
import AdvancedVirtualTryOn from './components/AdvancedVirtualTryOn';
import AdvancedMLTryOn from './components/AdvancedMLTryOn';
import Footer from './layouts/Footer';
import GoogleAutoLogin from './components/GoogleAutoLogin';
import { CartProvider } from './context/CartContext';
import { AuthProvider } from './context/AuthContext';
import { WishlistProvider } from './context/WishlistContext';
import { useState, useEffect } from 'react';

// Error Boundary Component
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Something went wrong</h1>
            <p className="text-gray-600 mb-4">We're working to fix this issue.</p>
            <button 
              onClick={() => window.location.reload()} 
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

function App() {
  console.log('App component rendering - Full version with routing');
  const [products, setProducts] = useState([]);

  // Load products for NLWeb chat
  useEffect(() => {
    const loadProducts = async () => {
      try {
<<<<<<< HEAD
        const response = await fetch('/api/products');
=======
        const response = await fetch('http://localhost:5000/api/products');
>>>>>>> 1a15362f9dae7bb17aa91f0abab9fb8ce9627742
        const data = await response.json();
        setProducts(data.data || data || []);
      } catch (error) {
        console.error('Failed to load products for NLWeb:', error);
        // Fallback to mock products for NLWeb chat
        const mockProducts = [
          { _id: '1', name: 'African Print Dress', price: 45000 },
          { _id: '2', name: 'Ankara Top', price: 25000 },
          { _id: '3', name: 'Traditional Kente Skirt', price: 35000 },
          { _id: '4', name: 'Beaded Necklace Set', price: 15000 },
          { _id: '5', name: 'African Print Blazer', price: 55000 }
        ];
        setProducts(mockProducts);
      }
    };
    loadProducts();
  }, []);
  
  return (
    <HelmetProvider>
      <ErrorBoundary>
        <AuthProvider>
          <WishlistProvider>
            <CartProvider>
              <Router>
              <div className="App min-h-screen flex flex-col overflow-x-hidden w-full">
              <Navigation />
              <main className="flex-grow overflow-x-hidden w-full">
                <Routes>
                  <Route path="/" element={<HomeModern />} />
                  <Route path="/test" element={<TestPage />} />
                  <Route path="/home-new" element={<HomeNew />} />
                  <Route path="/home-old-design" element={<HomeNewDesign />} />
                  <Route path="/home-old" element={<HomeAdvanced />} />
                  <Route path="/shop" element={<ShopAliExpress />} />
                  <Route path="/shop-new" element={<ShopNew />} />
                  <Route path="/shop-old" element={<Shop />} />
                  <Route path="/category/:slug" element={<CategoryPage />} />
                  <Route path="/product/:id" element={<ProductDetail />} />
                  <Route path="/cart" element={<Cart />} />
                  <Route path="/checkout" element={<Checkout />} />
                  <Route path="/order-success" element={<OrderSuccess />} />
                  <Route path="/orders" element={<Orders />} />
                  <Route path="/account" element={<MyAccount />} />
                  <Route path="/my-account" element={<MyAccount />} />
                  <Route path="/customer-portal" element={<CustomerPortal />} />
                  <Route path="/quick-auth" element={<QuickAuth />} />
                  
                  {/* Admin Routes - Protected */}
                  <Route path="/admin/login" element={<AdminLogin />} />
                  <Route path="/admin" element={
                    <ProtectedAdminRoute>
                      <AdvancedAdminDashboard />
                    </ProtectedAdminRoute>
                  } />
                  <Route path="/admin/advanced" element={
                    <ProtectedAdminRoute>
                      <AdvancedAdminDashboard />
                    </ProtectedAdminRoute>
                  } />
                  <Route path="/admin/simple" element={
                    <ProtectedAdminRoute>
                      <AdminDashboard />
                    </ProtectedAdminRoute>
                  } />
                  <Route path="/admin/shipping" element={
                    <ProtectedAdminRoute>
                      <AdminShippingSettings />
                    </ProtectedAdminRoute>
                  } />
                  <Route path="/admin/seo-generator" element={
                    <ProtectedAdminRoute>
                      <AISEOGenerator />
                    </ProtectedAdminRoute>
                  } />
                  <Route path="/about" element={<About />} />
                  <Route path="/contact" element={<Contact />} />
                  <Route path="/blog" element={<Blog />} />
                  <Route path="/blog/:id" element={<BlogPost />} />
                  <Route path="/virtual-tryon" element={<VirtualTryOn />} />
                  <Route path="/advanced-tryon" element={<AdvancedVirtualTryOn />} />
                  <Route path="/ml-tryon" element={<AdvancedMLTryOn />} />
                  <Route path="/track" element={<OrderTracking />} />
                  <Route path="/track/:trackingId" element={<OrderTracking />} />
                  <Route path="/login" element={<AuthPage />} />
                  <Route path="/register" element={<AuthPage />} />
                  <Route path="*" element={<Home />} />
                </Routes>
              </main>
              <Footer />
              </div>
            </Router>
          </CartProvider>
        </WishlistProvider>
        </AuthProvider>
      </ErrorBoundary>
    </HelmetProvider>
  );
}

export default App; 