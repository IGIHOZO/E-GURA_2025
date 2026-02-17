import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { CartProvider } from './context/CartContext';
import { AuthProvider } from './context/AuthContext';
import { WishlistProvider } from './context/WishlistProvider';

// Simple lazy loading without complex chunks
const HomeModern = lazy(() => import('./pages/HomeModern'));

// Simple loading component
const PageLoader = () => (
  <div className="min-h-screen bg-gray-50 flex items-center justify-center">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
      <p className="text-gray-600">Loading...</p>
    </div>
  </div>
);

function SimpleApp() {
  console.log('SimpleApp rendering');
  
  return (
    <AuthProvider>
      <WishlistProvider>
        <CartProvider>
          <Router>
            <div className="App min-h-screen bg-white">
              <header className="bg-blue-600 text-white p-4">
                <h1 className="text-2xl font-bold">🛍️ Deby E-commerce (Debug Mode)</h1>
              </header>
              
              <main className="p-4">
                <Suspense fallback={<PageLoader />}>
                  <Routes>
                    <Route path="/" element={<HomeModern />} />
                    <Route path="*" element={
                      <div className="text-center py-20">
                        <h2 className="text-3xl font-bold text-gray-900 mb-4">Debug Mode Active</h2>
                        <p className="text-gray-600 mb-4">The application is running in simplified mode.</p>
                        <p className="text-sm text-gray-500">If you see this, React Router is working correctly.</p>
                      </div>
                    } />
                  </Routes>
                </Suspense>
              </main>
              
              <footer className="bg-gray-800 text-white p-4 text-center">
                <p>Deby E-commerce - Debug Version</p>
              </footer>
            </div>
          </Router>
        </CartProvider>
      </WishlistProvider>
    </AuthProvider>
  );
}

export default SimpleApp;
