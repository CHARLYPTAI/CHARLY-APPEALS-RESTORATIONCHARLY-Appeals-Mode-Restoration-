import React from 'react';
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

function App() {
  return (
    <ErrorBoundary>
      <Router>
        <div className="min-h-screen bg-gray-50">
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
        </div>
      </Router>
    </ErrorBoundary>
  );
}

export default App;