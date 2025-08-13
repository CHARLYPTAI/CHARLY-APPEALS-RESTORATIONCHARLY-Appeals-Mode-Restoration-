import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { ErrorBoundary } from './components/ErrorBoundary';
import Layout from './layout/Layout';
import Dashboard from './pages/Dashboard';
import Portfolio from './pages/Portfolio';
import Appeals from './pages/Appeals';
import Filing from './pages/Filing';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import TestButton from './pages/TestButton';
import TestAppeals from './pages/TestAppeals';
import TestAuth from './pages/TestAuth';
import Login from './pages/Login';
import { BUILD_SHA, BUILD_TIME } from './version';
import { authService } from './lib/auth';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    console.info("CHARLY BUILD", BUILD_SHA, BUILD_TIME);
    fetch("/api/version").then(r => r.json()).then(v =>
      console.info("BACKEND VERSION", v)
    ).catch(e => console.warn("BACKEND VERSION fetch failed", e));

    // Check authentication status on app load
    const checkAuth = () => {
      const authenticated = authService.isAuthenticated();
      console.log('App: Authentication status on load:', authenticated);
      setIsAuthenticated(authenticated);
      setIsLoading(false);
    };

    checkAuth();
  }, []);

  const handleLoginSuccess = () => {
    console.log('App: Login successful, updating auth state');
    setIsAuthenticated(true);
  };

  const handleLogout = async () => {
    console.log('App: Logging out...');
    await authService.logout();
    setIsAuthenticated(false);
  };

  // Show loading screen while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading CHARLY...</p>
        </div>
      </div>
    );
  }

  // Show login screen if not authenticated
  if (!isAuthenticated) {
    return (
      <ErrorBoundary>
        <div className="min-h-screen bg-gray-50 relative">
          <Toaster position="top-right" />
          <Login onLoginSuccess={handleLoginSuccess} />
          {/* Version footer */}
          <div className="fixed bottom-2 right-2 text-xs opacity-70">
            CHARLY • {BUILD_SHA.slice(0,7)} • {BUILD_TIME}
          </div>
        </div>
      </ErrorBoundary>
    );
  }

  // Show authenticated app
  return (
    <ErrorBoundary>
      <Router>
        <div className="min-h-screen bg-gray-50 relative">
          <Toaster position="top-right" />
          <Routes>
            <Route path="/" element={<Layout onLogout={handleLogout} />}>
              <Route index element={
                <ErrorBoundary>
                  <Dashboard />
                </ErrorBoundary>
              } />
              <Route path="portfolio" element={<Portfolio />} />
              <Route path="appeals" element={<Appeals />} />
              <Route path="appeals/:propertyId" element={<Appeals />} />
              <Route path="filing" element={<Filing />} />
              <Route path="reports" element={<Reports />} />
              <Route path="settings" element={<Settings />} />
              <Route path="test" element={<TestButton />} />
              <Route path="test-appeals" element={<TestAppeals />} />
              <Route path="test-auth" element={<TestAuth />} />
            </Route>
          </Routes>
          {/* Version footer */}
          <div className="fixed bottom-2 right-2 text-xs opacity-70">
            CHARLY • {BUILD_SHA.slice(0,7)} • {BUILD_TIME}
          </div>
        </div>
      </Router>
    </ErrorBoundary>
  );
}

export default App;