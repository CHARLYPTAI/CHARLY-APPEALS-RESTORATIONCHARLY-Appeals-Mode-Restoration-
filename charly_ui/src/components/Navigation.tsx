import React, { useState } from 'react';

const tabs = [
  { id: 'portfolio', name: 'Portfolio', href: '/portfolio' },
  { id: 'analysis', name: 'Analysis', href: '/analysis' },
  { id: 'intelligence', name: 'Intelligence', href: '/intelligence' },
  { id: 'appeals', name: 'Appeals', href: '/appeals' },
  { id: 'results', name: 'Results', href: '/results' },
  { id: 'settings', name: 'Settings', href: '/settings' },
];

export function Navigation() {
  const [activeTab, setActiveTab] = useState('portfolio');

  return (
    <nav className="bg-white border-b border-gray-200" aria-label="Tabs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex space-x-8" role="tablist">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              role="tab"
              aria-selected={activeTab === tab.id}
              aria-controls={`${tab.id}-panel`}
              className={`
                whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm
                focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }
              `}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.name}
            </button>
          ))}
        </div>
      </div>
    </nav>
  );
}