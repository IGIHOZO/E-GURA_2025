import React, { Suspense, lazy, useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import Navigation from './components/Navigation';
import Footer from './layouts/Footer';
import ScrollToTop from './components/ScrollToTop';
import ScrollToTopButton from './components/ScrollToTopButton';
import { CartProvider } from './context/CartContext';
import { AuthProvider } from './context/AuthContext';
import { WishlistProvider } from './context/WishlistContext';
import { useDeviceDetection } from './utils/deviceDetection';
import { DesktopPerformanceMonitor } from './components/DesktopOptimized';
import RealDeviceInstall from './components/RealDeviceInstall';
import OfflinePage from './components/OfflinePage';
import { useNetworkStatus } from './utils/pwaUtils';

// CUSTOMER-FACING ROUTES (Storefront) - Minimal bundle
const HomeModern = lazy(() => import('./pages/HomeModern'));
const Shop = lazy(() => import('./pages/Shop'));
const ProductDetail = lazy(() => import('./pages/ProductDetail'));
const CategoryPage = lazy(() => import('./pages/CategoryPage'));

// CHECKOUT FLOW - Separate chunk
const Cart = lazy(() => import('./pages/Cart'));
const Checkout = lazy(() => import('./pages/Checkout'));
const OrderSuccess = lazy(() => import('./pages/OrderSuccess'));

// CUSTOMER AUTH - Separate chunk
const AuthPage = lazy(() => import('./pages/AuthPage'));
const CustomerAccount = lazy(() => import('./pages/CustomerAccount'));
const MyAccount = lazy(() => import('./pages/MyAccount'));
const Orders = lazy(() => import('./pages/Orders'));

// ADMIN ROUTES - Completely separate
const AdvancedAdminDashboard = lazy(() => 
  import(/* webpackChunkName: "admin" */ './pages/AdvancedAdminDashboard')
);
const AdminLogin = lazy(() => 
  import(/* webpackChunkName: "admin" */ './pages/AdminLogin')
);

// NON-CRITICAL PAGES - Load on demand
const About = lazy(() => 
  import(/* webpackChunkName: "features" */ './pages/About')
);
const Contact = lazy(() => 
  import(/* webpackChunkName: "features" */ './pages/Contact')
);
const OrderTracking = lazy(() => 
  import(/* webpackChunkName: "features" */ './pages/OrderTracking')
);

// Loading component for Suspense
const PageLoader = () => (
  <div className="min-h-screen bg-gray-50 flex items-center justify-center">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
      <p className="text-gray-600">Loading...</p>
    </div>
  </div>
);

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

function FixedApp() {
  console.log('FixedApp component rendering');
  const [products, setProducts] = useState([]);
  const { device, capabilities, cssClasses } = useDeviceDetection();
  const { isOnline } = useNetworkStatus();

  // Load products for any components that need them
  useEffect(() => {
    const loadProducts = async () => {
      try {
        const response = await fetch('/api/products');
        const data = await response.json();
        setProducts(data.data || data || []);
      } catch (error) {
        console.error('Failed to load products:', error);
        // Fallback to mock products
        const mockProducts = [
          { _id: '1', name: 'African Print Dress', price: 45000 },
          { _id: '2', name: 'Ankara Top', price: 25000 },
          { _id: '3', name: 'Traditional Kente Skirt', price: 35000 }
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
                <ScrollToTop />
                <div className={`App min-h-screen flex flex-col overflow-x-hidden w-full ${cssClasses}`}>
                  <Navigation />
                  <main className="flex-grow overflow-x-hidden w-full">
                    <Suspense fallback={<PageLoader />}>
                      <Routes>
                        <Route path="/" element={<HomeModern />} />
                        <Route path="/shop" element={<Shop />} />
                        <Route path="/category/:slug" element={<CategoryPage />} />
                        <Route path="/product/:id" element={<ProductDetail />} />
                        <Route path="/cart" element={<Cart />} />
                        <Route path="/checkout" element={<Checkout />} />
                        <Route path="/order-success" element={<OrderSuccess />} />
                        <Route path="/orders" element={<Orders />} />
                        <Route path="/account" element={<MyAccount />} />
                        <Route path="/my-account" element={<MyAccount />} />
                        <Route path="/auth" element={<AuthPage />} />
                        <Route path="/login" element={<AuthPage />} />
                        <Route path="/register" element={<AuthPage />} />
                        
                        {/* Admin Routes */}
                        <Route path="/admin/login" element={<AdminLogin />} />
                        <Route path="/admin" element={<AdvancedAdminDashboard />} />
                        
                        {/* Other Pages */}
                        <Route path="/about" element={<About />} />
                        <Route path="/contact" element={<Contact />} />
                        <Route path="/track" element={<OrderTracking />} />
                        <Route path="/track/:trackingId" element={<OrderTracking />} />
                        
                        {/* Fallback */}
                        <Route path="*" element={<HomeModern />} />
                      </Routes>
                    </Suspense>
                  </main>
                  <Footer />
                  <ScrollToTopButton />
                  <DesktopPerformanceMonitor />
                  <RealDeviceInstall />
                  {!isOnline && <OfflinePage />}
                </div>
              </Router>
            </CartProvider>
          </WishlistProvider>
        </AuthProvider>
      </ErrorBoundary>
    </HelmetProvider>
  );
}

export default FixedApp;
