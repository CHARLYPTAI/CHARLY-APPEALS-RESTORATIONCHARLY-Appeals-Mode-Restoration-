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
import TestButton from './pages/TestButton';
import TestAppeals from './pages/TestAppeals';

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
            <Route path="test" element={<TestButton />} />
            <Route path="test-appeals" element={<TestAppeals />} />
          </Route>
        </Routes>
      </div>
    </Router>
  );
}

export default App;