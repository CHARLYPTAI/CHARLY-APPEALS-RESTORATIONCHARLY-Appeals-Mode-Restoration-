import React from 'react';

export const IntelligenceSkeleton: React.FC = () => {
  return (
    <div className="p-8 space-y-6 animate-fade-in">
      <div className="h-8 w-56 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse" />
      
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
        <div className="space-y-4">
          <div className="h-6 w-40 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
          <div className="space-y-3">
            <div className="h-4 w-full bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
            <div className="h-4 w-5/6 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
            <div className="h-4 w-4/5 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="h-6 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
              <div className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
            </div>
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                  <div className="h-4 w-3/4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          <div className="space-y-4">
            <div className="h-6 w-28 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
            <div className="space-y-2">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex items-center space-x-3">
                  <div className="h-4 w-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                  <div className="h-4 w-40 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-6 border border-blue-200 dark:border-blue-800">
        <div className="space-y-3">
          <div className="h-5 w-48 bg-blue-200 dark:bg-blue-800 rounded animate-pulse" />
          <div className="h-4 w-full bg-blue-100 dark:bg-blue-900 rounded animate-pulse" />
          <div className="h-4 w-4/5 bg-blue-100 dark:bg-blue-900 rounded animate-pulse" />
        </div>
      </div>
    </div>
  );
};