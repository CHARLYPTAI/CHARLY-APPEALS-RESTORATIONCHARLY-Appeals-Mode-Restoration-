import React, { useEffect } from 'react';
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
import { BUILD_SHA, BUILD_TIME } from './version';

function App() {
  useEffect(() => {
    console.info('CHARLY BUILD', BUILD_SHA, BUILD_TIME);
  }, []);

  return (
    <ErrorBoundary>
      <Router>
        <div className="min-h-screen bg-gray-50 relative">
          <Toaster position="top-right" />
          <Routes>
            <Route path="/" element={<Layout />}>
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
          <div className="fixed bottom-2 right-2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-75 font-mono">
            CHARLY • {BUILD_SHA} • {new Date(BUILD_TIME).toLocaleString()}
          </div>
        </div>
      </Router>
    </ErrorBoundary>
  );
}

export default App;