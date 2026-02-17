import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import Navigation from './components/Navigation';
import Footer from './layouts/Footer';
import PerformanceMonitor from './components/PerformanceMonitor';
import ScrollToTop from './components/ScrollToTop';
import ScrollToTopButton from './components/ScrollToTopButton';
import PageLoadingBar from './components/PageLoadingBar';
import { CartProvider } from './context/CartContext';
import { AuthProvider } from './context/AuthContext';
import { WishlistProvider } from './context/WishlistContext';
import { useState, useEffect } from 'react';

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
const QuickAuth = lazy(() => import('./pages/QuickAuth'));
const SMSLogin = lazy(() => import('./pages/SMSLogin'));

// ADMIN ROUTES - Completely separate (never loaded for customers)
const AdvancedAdminDashboard = lazy(() => 
  import(/* webpackChunkName: "admin" */ './pages/AdvancedAdminDashboard')
);
const AdminDashboard = lazy(() => 
  import(/* webpackChunkName: "admin" */ './pages/AdminDashboard')
);
const AdminLogin = lazy(() => 
  import(/* webpackChunkName: "admin" */ './pages/AdminLogin')
);

// MARKETING TOOLS - Separate chunk
const Blog = lazy(() => 
  import(/* webpackChunkName: "marketing" */ './pages/Blog')
);
const BlogPost = lazy(() => 
  import(/* webpackChunkName: "marketing" */ './pages/BlogPost')
);

// NON-CRITICAL PAGES - Load on demand
const About = lazy(() => 
  import(/* webpackChunkName: "features" */ './pages/About')
);
const Contact = lazy(() => 
  import(/* webpackChunkName: "features" */ './pages/Contact')
);
const PrivacyPolicy = lazy(() => 
  import(/* webpackChunkName: "features" */ './pages/PrivacyPolicy')
);
const TermsOfService = lazy(() => 
  import(/* webpackChunkName: "features" */ './pages/TermsOfService')
);
const OrderTracking = lazy(() => 
  import(/* webpackChunkName: "features" */ './pages/OrderTracking')
);

// LEGACY/TEST PAGES - Separate chunk
const Home = lazy(() => import(/* webpackChunkName: "legacy" */ './pages/Home'));
const HomeNew = lazy(() => import(/* webpackChunkName: "legacy" */ './pages/HomeNew'));
const HomeNewDesign = lazy(() => import(/* webpackChunkName: "legacy" */ './pages/HomeNewDesign'));
const HomeAdvanced = lazy(() => import(/* webpackChunkName: "legacy" */ './pages/HomeAdvanced'));
const TestPage = lazy(() => import(/* webpackChunkName: "legacy" */ './TestPage'));
const ShopNew = lazy(() => import(/* webpackChunkName: "legacy" */ './pages/ShopNew'));
const ShopAliExpress = lazy(() => import(/* webpackChunkName: "legacy" */ './pages/ShopAliExpress'));
const CustomerPortal = lazy(() => import(/* webpackChunkName: "features" */ './pages/CustomerPortal'));

// ADMIN COMPONENTS - Additional
const AdminDashboardNew = lazy(() => 
  import(/* webpackChunkName: "admin" */ './pages/AdminDashboardNew')
);
const AdminDashboardComplete = lazy(() => 
  import(/* webpackChunkName: "admin" */ './pages/AdminDashboardComplete')
);
const AdminAdvancedDashboard = lazy(() => 
  import(/* webpackChunkName: "admin" */ './pages/AdminAdvancedDashboard')
);
const StorekeeperDashboard = lazy(() => 
  import(/* webpackChunkName: "admin" */ './pages/StorekeeperDashboard')
);
const AdminShippingSettings = lazy(() => 
  import(/* webpackChunkName: "admin" */ './components/AdminShippingSettings')
);
const AISEOGenerator = lazy(() => 
  import(/* webpackChunkName: "admin" */ './components/AISEOGenerator')
);

// PROTECTED ROUTE COMPONENT
const ProtectedAdminRoute = lazy(() => 
  import(/* webpackChunkName: "admin" */ './components/ProtectedAdminRoute')
);
const ProtectedStorekeeperRoute = lazy(() => 
  import(/* webpackChunkName: "admin" */ './components/ProtectedStorekeeperRoute')
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

function App() {
  console.log('App component rendering - Full version with routing');
  const [products, setProducts] = useState([]);

  // Load products for NLWeb chat
  useEffect(() => {
    const loadProducts = async () => {
      try {
        const response = await fetch('/api/products');
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
        <PerformanceMonitor />
        <AuthProvider>
          <WishlistProvider>
            <CartProvider>
              <Router basename="/egura">
              <PageLoadingBar />
              <ScrollToTop />
              <div className="App min-h-screen flex flex-col overflow-x-hidden w-full">
              <Navigation />
              <main className="flex-grow overflow-x-hidden w-full">
                <Suspense fallback={<PageLoader />}>
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
                      <Suspense fallback={<PageLoader />}>
                        <ProtectedAdminRoute>
                          <AdvancedAdminDashboard />
                        </ProtectedAdminRoute>
                      </Suspense>
                    } />
                    <Route path="/admin/advanced" element={
                      <Suspense fallback={<PageLoader />}>
                        <ProtectedAdminRoute>
                          <AdvancedAdminDashboard />
                        </ProtectedAdminRoute>
                      </Suspense>
                    } />
                    <Route path="/admin/simple" element={
                      <Suspense fallback={<PageLoader />}>
                        <ProtectedAdminRoute>
                          <AdminDashboard />
                        </ProtectedAdminRoute>
                      </Suspense>
                    } />
                    <Route path="/admin/shipping" element={
                      <Suspense fallback={<PageLoader />}>
                        <ProtectedAdminRoute>
                          <AdminShippingSettings />
                        </ProtectedAdminRoute>
                      </Suspense>
                    } />
                    <Route path="/admin/seo-generator" element={
                      <Suspense fallback={<PageLoader />}>
                        <ProtectedAdminRoute>
                          <AISEOGenerator />
                        </ProtectedAdminRoute>
                      </Suspense>
                    } />
                    <Route path="/storekeeper" element={
                      <Suspense fallback={<PageLoader />}>
                        <ProtectedStorekeeperRoute>
                          <StorekeeperDashboard />
                        </ProtectedStorekeeperRoute>
                      </Suspense>
                    } />
                    <Route path="/about" element={<About />} />
                    <Route path="/contact" element={<Contact />} />
                    <Route path="/privacy-policy" element={<PrivacyPolicy />} />
                    <Route path="/terms-of-service" element={<TermsOfService />} />
                    <Route path="/blog" element={<Blog />} />
                    <Route path="/blog/:id" element={<BlogPost />} />
                    <Route path="/track" element={<OrderTracking />} />
                    <Route path="/track/:trackingId" element={<OrderTracking />} />
                    <Route path="/login" element={<AuthPage />} />
                    <Route path="/register" element={<AuthPage />} />
                    <Route path="*" element={<Home />} />
                  </Routes>
                </Suspense>
              </main>
              <Footer />
              <ScrollToTopButton />
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
