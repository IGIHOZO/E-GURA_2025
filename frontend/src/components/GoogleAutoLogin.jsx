import React, { useEffect, useState } from 'react';

/**
 * Simplified Google Auto-Login Component
 * 
 * IMPORTANT: Browsers cannot automatically detect Google accounts for security/privacy reasons.
 * This component provides:
 * 1. Auto-login for returning users (via localStorage)
 * 2. One-click Google Sign-In button
 * 3. Session persistence
 */

const GoogleAutoLogin = () => {
  const [user, setUser] = useState(null);
  const [showLoginButton, setShowLoginButton] = useState(false);

  useEffect(() => {
    // Check for existing session
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
      try {
        const userData = JSON.parse(savedUser);
        setUser(userData);
        console.log('✅ Auto-logged in:', userData.email || userData.name);
      } catch (e) {
        console.error('Error parsing saved user:', e);
        setShowLoginButton(true);
      }
    } else {
      // No saved session, show login button
      setShowLoginButton(true);
    }
  }, []);

  const handleGoogleLogin = () => {
    // Simulate Google login (in production, use actual Google OAuth)
    const mockUser = {
      email: 'user@gmail.com',
      name: 'E-Gura Customer',
      picture: null,
      loginMethod: 'google',
      loginTime: new Date().toISOString()
    };
    
    localStorage.setItem('currentUser', JSON.stringify(mockUser));
    setUser(mockUser);
    setShowLoginButton(false);
    
    console.log('✅ Logged in with Google');
    
    // Reload to update auth state
    window.location.reload();
  };

  const handleLogout = () => {
    localStorage.removeItem('currentUser');
    localStorage.removeItem('google_user');
    setUser(null);
    setShowLoginButton(true);
    console.log('👋 Logged out');
    window.location.reload();
  };

  if (user) {
    return (
      <div className="fixed top-20 right-4 bg-white border border-gray-200 rounded-lg shadow-lg p-4 z-40 max-w-xs">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 bg-red-600 rounded-full flex items-center justify-center text-white font-bold">
            {user.name ? user.name[0].toUpperCase() : 'U'}
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-gray-900">{user.name || 'User'}</p>
            <p className="text-xs text-gray-600">{user.email || 'Logged in'}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full text-sm text-red-600 hover:text-red-700 font-medium"
        >
          Logout
        </button>
      </div>
    );
  }

  if (showLoginButton) {
    return (
      <div className="fixed top-20 right-4 bg-white border border-gray-200 rounded-lg shadow-lg p-4 z-40">
        <p className="text-sm text-gray-600 mb-3">Sign in to continue</p>
        <button
          onClick={handleGoogleLogin}
          className="flex items-center gap-3 bg-white border border-gray-300 rounded-lg px-4 py-2 hover:bg-gray-50 transition-colors w-full"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          <span className="text-sm font-medium text-gray-700">Sign in with Google</span>
        </button>
      </div>
    );
  }

  return null;
};

export default GoogleAutoLogin;
