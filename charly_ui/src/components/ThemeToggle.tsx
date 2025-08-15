import React from 'react';
import { useTheme } from '../design-system/ThemeProvider';

interface ThemeToggleProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function ThemeToggle({ className = '', size = 'md' }: ThemeToggleProps) {
  const { mode, toggleMode } = useTheme();
  
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10', 
    lg: 'w-12 h-12'
  };
  
  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  };

  return (
    <button
      onClick={toggleMode}
      className={`
        ${sizeClasses[size]}
        relative inline-flex items-center justify-center
        rounded-lg
        transition-all duration-200 ease-out
        bg-gray-100 hover:bg-gray-200 
        dark:bg-gray-800 dark:hover:bg-gray-700
        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
        dark:focus:ring-offset-gray-900
        ${className}
      `}
      aria-label={`Switch to ${mode === 'light' ? 'dark' : 'light'} mode`}
      title={`Switch to ${mode === 'light' ? 'dark' : 'light'} mode`}
    >
      {/* Sun icon for light mode */}
      <svg
        className={`
          ${iconSizes[size]}
          absolute inset-0 m-auto
          text-amber-500
          transition-all duration-300 ease-out
          ${mode === 'dark' ? 'opacity-0 rotate-90 scale-0' : 'opacity-100 rotate-0 scale-100'}
        `}
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
        />
      </svg>
      
      {/* Moon icon for dark mode */}
      <svg
        className={`
          ${iconSizes[size]}
          absolute inset-0 m-auto
          text-slate-700 dark:text-slate-300
          transition-all duration-300 ease-out
          ${mode === 'light' ? 'opacity-0 -rotate-90 scale-0' : 'opacity-100 rotate-0 scale-100'}
        `}
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
        />
      </svg>
    </button>
  );
}

// Compact inline toggle variant
export function ThemeToggleInline({ className = '' }: { className?: string }) {
  const { mode, toggleMode } = useTheme();
  
  return (
    <button
      onClick={toggleMode}
      className={`
        group inline-flex items-center gap-2 px-3 py-1.5
        text-sm font-medium
        text-gray-600 hover:text-gray-900
        dark:text-gray-400 dark:hover:text-gray-100
        rounded-lg
        hover:bg-gray-100 dark:hover:bg-gray-800
        transition-all duration-200 ease-out
        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1
        ${className}
      `}
      aria-label={`Switch to ${mode === 'light' ? 'dark' : 'light'} mode`}
    >
      <span className="text-xs opacity-75">
        {mode === 'light' ? 'Light' : 'Dark'}
      </span>
      
      {/* Toggle indicator */}
      <div className="relative w-8 h-4 bg-gray-300 dark:bg-gray-600 rounded-full transition-colors duration-200">
        <div
          className={`
            absolute top-0.5 w-3 h-3 bg-white dark:bg-gray-300 rounded-full
            transition-transform duration-200 ease-out
            ${mode === 'dark' ? 'translate-x-4' : 'translate-x-0.5'}
          `}
        />
      </div>
    </button>
  );
}