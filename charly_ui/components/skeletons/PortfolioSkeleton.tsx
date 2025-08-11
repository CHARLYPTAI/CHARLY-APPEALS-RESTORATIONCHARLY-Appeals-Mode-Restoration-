import React from 'react';

export const PortfolioSkeleton: React.FC = () => {
  return (
    <div className="p-8 space-y-6 animate-fade-in">
      <div className="h-8 w-48 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse" />
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
            <div className="space-y-4">
              <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
              <div className="h-12 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
              <div className="space-y-2">
                <div className="h-3 w-full bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                <div className="h-3 w-3/4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
        <div className="space-y-4">
          <div className="h-6 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-gray-700">
              <div className="flex items-center space-x-4">
                <div className="h-10 w-10 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse" />
                <div className="space-y-2">
                  <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                  <div className="h-3 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                </div>
              </div>
              <div className="h-4 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};