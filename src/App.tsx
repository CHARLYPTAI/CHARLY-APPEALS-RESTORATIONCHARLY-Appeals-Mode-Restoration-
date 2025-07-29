import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Layout from './layout/Layout';
import Dashboard from './pages/Dashboard';
import Portfolio from './pages/Portfolio';
import Appeals from './pages/Appeals';
import Filing from './pages/Filing';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import Analytics from './pages/Analytics';
import Billing from './pages/Billing';
import Security from './pages/Security';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Toaster position="top-right" />
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="portfolio" element={<Portfolio />} />
            <Route path="appeals" element={<Appeals />} />
            <Route path="filing" element={<Filing />} />
            <Route path="reports" element={<Reports />} />
            <Route path="settings" element={<Settings />} />
            <Route path="analytics" element={<Analytics />} />
            <Route path="billing" element={<Billing />} />
            <Route path="security" element={<Security />} />
          </Route>
        </Routes>
      </div>
    </Router>
  );
}

export default App;