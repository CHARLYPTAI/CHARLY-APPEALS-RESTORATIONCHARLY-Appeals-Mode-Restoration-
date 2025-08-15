import React from 'react';

// Route components (stubs for now)
function PortfolioPage() {
  return (
    <div className="space-y-6">
      <div className="md:flex md:items-center md:justify-between">
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
            Portfolio
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Manage your property portfolio and track assessment appeals
          </p>
        </div>
        <div className="mt-4 flex md:mt-0 md:ml-4">
          <button className="ml-3 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
            Add Property
          </button>
        </div>
      </div>
      
      <div className="bg-white shadow rounded-lg p-6">
        <p className="text-gray-500">Portfolio table will be implemented here</p>
      </div>
    </div>
  );
}

function AnalysisPage() {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Analysis</h2>
      <div className="bg-white shadow rounded-lg p-6">
        <p className="text-gray-500">Property analysis tools will be implemented here</p>
      </div>
    </div>
  );
}

function IntelligencePage() {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Intelligence</h2>
      <div className="bg-white shadow rounded-lg p-6">
        <p className="text-gray-500">Market intelligence and insights will be implemented here</p>
      </div>
    </div>
  );
}

function AppealsPage() {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Appeals</h2>
      <div className="bg-white shadow rounded-lg p-6">
        <p className="text-gray-500">Appeals management will be implemented here</p>
      </div>
    </div>
  );
}

function ResultsPage() {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Results</h2>
      <div className="bg-white shadow rounded-lg p-6">
        <p className="text-gray-500">Appeals results and reporting will be implemented here</p>
      </div>
    </div>
  );
}

function SettingsPage() {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Settings</h2>
      <div className="bg-white shadow rounded-lg p-6">
        <p className="text-gray-500">Application settings will be implemented here</p>
      </div>
    </div>
  );
}

// Simple routing (would use React Router in real app)
export const routes = {
  '/portfolio': PortfolioPage,
  '/analysis': AnalysisPage,
  '/intelligence': IntelligencePage,
  '/appeals': AppealsPage,
  '/results': ResultsPage,
  '/settings': SettingsPage,
};

export function Router({ currentPath = '/portfolio' }: { currentPath?: string }) {
  const Component = routes[currentPath as keyof typeof routes] || PortfolioPage;
  return <Component />;
}