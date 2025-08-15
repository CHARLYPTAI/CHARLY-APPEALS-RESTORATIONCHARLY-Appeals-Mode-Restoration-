import React from 'react';
import { Navigation, NavigationMobile } from '../components/Navigation';
import { ThemeToggle } from '../components/ThemeToggle';
import { useTheme } from '../design-system/ThemeProvider';

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const { colors } = useTheme();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors duration-300">
      {/* Top Bar - Jony Ive inspired minimal header */}
      <header className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-b border-gray-200 dark:border-gray-800 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Brand */}
            <div className="flex items-center gap-3">
              <div className="flex items-baseline gap-1">
                <h1 className="text-2xl font-light tracking-tight text-gray-900 dark:text-gray-100">
                  CHARLY
                </h1>
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Commercial
                </span>
              </div>
            </div>
            
            {/* Actions */}
            <div className="flex items-center gap-1">
              {/* Theme Toggle */}
              <ThemeToggle size="md" />
              
              {/* Divider */}
              <div className="w-px h-6 bg-gray-200 dark:bg-gray-700 mx-2" />
              
              {/* Notifications */}
              <button className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200">
                <span className="sr-only">Notifications</span>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
                </svg>
              </button>
              
              {/* User Menu */}
              <button className="flex items-center gap-2 p-2 text-gray-700 hover:text-gray-900 dark:text-gray-300 dark:hover:text-gray-100 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200">
                <div className="w-7 h-7 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                  <span className="text-xs font-semibold text-white">U</span>
                </div>
                <span className="text-sm font-medium hidden sm:block">User</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation - Desktop */}
      <div className="hidden md:block">
        <Navigation />
      </div>
      
      {/* Navigation - Mobile */}
      <NavigationMobile />

      {/* Main Content with generous spacing */}
      <main className="max-w-7xl mx-auto px-6 lg:px-8 py-8 lg:py-12">
        <div className="space-y-8">
          {children}
        </div>
      </main>
      
      {/* Subtle footer spacer */}
      <div className="h-16" />
    </div>
  );
}