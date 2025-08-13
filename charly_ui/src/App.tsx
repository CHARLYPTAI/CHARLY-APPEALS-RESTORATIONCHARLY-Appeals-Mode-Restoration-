// 🍎 CHARLY App - Apple Quality Rebuild
// Steve Jobs Implementation - Perfect is the minimum bar

import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { LoadingDots } from './components/LoadingDots';
import { NEUTRAL_COLORS } from './design/colors';
import { SPACING } from './design/spacing';
import { BUILD_SHA, BUILD_TIME } from './version';
import { authService } from './lib/auth';

// Lazy load pages for optimal performance
const Dashboard = React.lazy(() => import('./pages/Dashboard'));
const Portfolio = React.lazy(() => import('./pages/Portfolio'));
const Appeals = React.lazy(() => import('./pages/Appeals'));
const Analysis = React.lazy(() => import('./pages/Analysis'));
const Intelligence = React.lazy(() => import('./pages/Intelligence'));
const Settings = React.lazy(() => import('./pages/Settings'));
const Login = React.lazy(() => import('./pages/Login'));

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    console.info("🍎 CHARLY BUILD", BUILD_SHA, BUILD_TIME);
    
    // Silent version check
    fetch("/api/version")
      .then(r => r.json())
      .then(v => console.info("Backend version:", v))
      .catch(() => {}); // Silent fail

    // Check authentication
    const checkAuth = () => {
      const authenticated = authService.isAuthenticated();
      setIsAuthenticated(authenticated);
      setIsLoading(false);
    };

    checkAuth();
  }, []);

  // Apple-quality loading screen
  if (isLoading) {
    return (
      <div style={loadingStyles.container}>
        <div style={loadingStyles.content}>
          <h1 style={loadingStyles.logo}>CHARLY</h1>
          <LoadingDots size="lg" />
        </div>
      </div>
    );
  }

  // Login screen
  if (!isAuthenticated) {
    return (
      <React.Suspense fallback={<LoadingScreen />}>
        <Login onLoginSuccess={() => setIsAuthenticated(true)} />
        <VersionFooter />
      </React.Suspense>
    );
  }

  // Main authenticated app
  return (
    <Router>
      <Layout>
        <React.Suspense fallback={<LoadingScreen />}>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/portfolio" element={<Portfolio />} />
            <Route path="/appeals" element={<Appeals />} />
            <Route path="/appeals/:propertyId" element={<Appeals />} />
            <Route path="/analysis" element={<Analysis />} />
            <Route path="/intelligence" element={<Intelligence />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </React.Suspense>
      </Layout>
      <VersionFooter />
    </Router>
  );
}

// Loading screen component
const LoadingScreen: React.FC = () => (
  <div style={loadingStyles.pageContainer}>
    <LoadingDots />
  </div>
);

// Version footer component
const VersionFooter: React.FC = () => (
  <div style={versionStyles.footer}>
    CHARLY • {BUILD_SHA.slice(0,7)} • {BUILD_TIME}
  </div>
);

const loadingStyles = {
  container: {
    minHeight: '100vh',
    backgroundColor: NEUTRAL_COLORS.WHITE,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    textAlign: 'center' as const,
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    gap: SPACING.LG,
  },
  logo: {
    fontSize: '48px',
    fontWeight: 700,
    color: '#007AFF',
    fontFamily: "'SF Pro Display', -apple-system, sans-serif",
    margin: 0,
    letterSpacing: '-1px',
  },
  pageContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '50vh',
  },
};

const versionStyles = {
  footer: {
    position: 'fixed' as const,
    bottom: SPACING.SM,
    right: SPACING.SM,
    fontSize: '12px',
    color: NEUTRAL_COLORS.GRAY_600,
    fontFamily: "'SF Pro Text', -apple-system, sans-serif",
    opacity: 0.7,
  },
};

export default App;