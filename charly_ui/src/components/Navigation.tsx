import React, { useState } from 'react';
import { useTheme } from '../design-system/ThemeProvider';

export interface NavigationTab {
  id: string;
  name: string;
  href: string;
  icon?: React.ReactNode;
  badge?: string | number;
}

const tabs: NavigationTab[] = [
  { 
    id: 'portfolio', 
    name: 'Portfolio', 
    href: '/portfolio',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0-1.125.504-1.125 1.125V11.25a9 9 0 00-9-9z" />
      </svg>
    )
  },
  { 
    id: 'analysis', 
    name: 'Analysis', 
    href: '/analysis',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
      </svg>
    )
  },
  { 
    id: 'intelligence', 
    name: 'Intelligence', 
    href: '/intelligence',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
      </svg>
    )
  },
  { 
    id: 'appeals', 
    name: 'Appeals', 
    href: '/appeals',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m6.75 12H9m1.5-12H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0-1.125.504-1.125 1.125V11.25a9 9 0 00-9-9z" />
      </svg>
    )
  },
  { 
    id: 'results', 
    name: 'Results', 
    href: '/results',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M11.35 3.836c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m8.9-4.414c.376.023.75.05 1.124.08 1.131.094 1.976 1.057 1.976 2.192V16.5A2.25 2.25 0 0118 18.75h-2.25m-7.5-10.5H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V18.75m-7.5-10.5h6.375c.621 0 1.125.504 1.125 1.125v9.375m-8.25-3l1.5 1.5 3-3.75" />
      </svg>
    )
  },
  { 
    id: 'settings', 
    name: 'Settings', 
    href: '/settings',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M10.343 3.94c.09-.542.56-.94 1.11-.94h1.093c.55 0 1.02.398 1.11.94l.149.894c.07.424.384.764.78.93.398.164.855.142 1.205-.108l.737-.527a1.125 1.125 0 011.45.12l.773.774c.39.389.44 1.002.12 1.45l-.527.737c-.25.35-.272.806-.107 1.204.165.397.505.71.93.78l.893.15c.543.09.94.56.94 1.109v1.094c0 .55-.397 1.02-.94 1.11l-.893.149c-.425.07-.765.383-.93.78-.165.398-.143.854.107 1.204l.527.738c.32.447.269 1.06-.12 1.45l-.774.773a1.125 1.125 0 01-1.449.12l-.738-.527c-.35-.25-.806-.272-1.203-.107-.397.165-.71.505-.781.929l-.149.894c-.09.542-.56.94-1.11.94h-1.094c-.55 0-1.019-.398-1.11-.94l-.148-.894c-.071-.424-.384-.764-.781-.93-.398-.164-.854-.142-1.204.108l-.738.527c-.447.32-1.06.269-1.45-.12l-.773-.774a1.125 1.125 0 01-.12-1.45l.527-.737c.25-.35.273-.806.108-1.204-.165-.397-.505-.71-.93-.78l-.894-.15c-.542-.09-.94-.56-.94-1.109v-1.094c0-.55.398-1.02.94-1.11l.894-.149c.424-.07.765-.383.93-.78.165-.398.143-.854-.107-1.204l-.527-.738a1.125 1.125 0 01.12-1.45l.773-.773a1.125 1.125 0 011.45-.12l.737.527c.35.25.807.272 1.204.107.397-.165.71-.505.78-.929l.15-.894z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    )
  }
];

interface NavigationProps {
  currentPath?: string;
  onTabChange?: (tabId: string) => void;
}

export function Navigation({ currentPath = '/portfolio', onTabChange }: NavigationProps) {
  const [activeTab, setActiveTab] = useState(() => {
    // Extract active tab from current path
    const path = currentPath.startsWith('/') ? currentPath.slice(1) : currentPath;
    return tabs.find(tab => tab.id === path)?.id || 'portfolio';
  });

  const { colors } = useTheme();

  const handleTabClick = (tabId: string) => {
    setActiveTab(tabId);
    onTabChange?.(tabId);
  };

  return (
    <nav 
      className="relative bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-b border-gray-200 dark:border-gray-800"
      aria-label="Main navigation"
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="relative flex space-x-8" role="tablist">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            
            return (
              <button
                key={tab.id}
                role="tab"
                aria-selected={isActive}
                aria-controls={`${tab.id}-panel`}
                className={`
                  group relative flex items-center gap-2 px-1 py-4
                  text-sm font-medium transition-all duration-200 ease-out
                  focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 
                  focus:ring-offset-white dark:focus:ring-offset-gray-900
                  ${
                    isActive
                      ? 'text-gray-900 dark:text-gray-100'
                      : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                  }
                `}
                onClick={() => handleTabClick(tab.id)}
              >
                {/* Icon */}
                {tab.icon && (
                  <span 
                    className={`
                      transition-all duration-200 ease-out
                      ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400 dark:text-gray-500'}
                      group-hover:text-blue-500 dark:group-hover:text-blue-400
                    `}
                  >
                    {tab.icon}
                  </span>
                )}
                
                {/* Label */}
                <span className="whitespace-nowrap">
                  {tab.name}
                </span>
                
                {/* Badge */}
                {tab.badge && (
                  <span className="ml-1 inline-flex items-center justify-center px-2 py-0.5 text-xs font-medium bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full">
                    {tab.badge}
                  </span>
                )}
                
                {/* Active indicator */}
                <span
                  className={`
                    absolute bottom-0 left-0 right-0 h-0.5
                    bg-blue-600 dark:bg-blue-400
                    transition-all duration-300 ease-out
                    ${isActive ? 'opacity-100 scale-x-100' : 'opacity-0 scale-x-0'}
                  `}
                  aria-hidden="true"
                />
                
                {/* Hover indicator */}
                <span
                  className={`
                    absolute bottom-0 left-0 right-0 h-0.5
                    bg-gray-300 dark:bg-gray-600
                    transition-all duration-200 ease-out
                    ${!isActive ? 'opacity-0 group-hover:opacity-100 scale-x-0 group-hover:scale-x-100' : 'opacity-0'}
                  `}
                  aria-hidden="true"
                />
              </button>
            );
          })}
        </div>
      </div>
      
      {/* Bottom border with subtle gradient */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gray-200 dark:via-gray-700 to-transparent" />
    </nav>
  );
}

// Compact mobile navigation variant
export function NavigationMobile({ currentPath = '/portfolio', onTabChange }: NavigationProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(() => {
    const path = currentPath.startsWith('/') ? currentPath.slice(1) : currentPath;
    return tabs.find(tab => tab.id === path)?.id || 'portfolio';
  });

  const activeTabData = tabs.find(tab => tab.id === activeTab);

  const handleTabClick = (tabId: string) => {
    setActiveTab(tabId);
    setIsOpen(false);
    onTabChange?.(tabId);
  };

  return (
    <div className="md:hidden">
      {/* Mobile tab selector */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-4 py-3 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 text-left"
      >
        <div className="flex items-center gap-2">
          {activeTabData?.icon}
          <span className="font-medium text-gray-900 dark:text-gray-100">
            {activeTabData?.name}
          </span>
        </div>
        
        <svg
          className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      
      {/* Mobile dropdown */}
      {isOpen && (
        <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabClick(tab.id)}
              className={`
                w-full flex items-center gap-3 px-4 py-3 text-left
                transition-colors duration-150 ease-out
                ${
                  activeTab === tab.id
                    ? 'bg-blue-50 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                }
              `}
            >
              {tab.icon}
              <span className="font-medium">{tab.name}</span>
              {tab.badge && (
                <span className="ml-auto inline-flex items-center justify-center px-2 py-0.5 text-xs font-medium bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full">
                  {tab.badge}
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}