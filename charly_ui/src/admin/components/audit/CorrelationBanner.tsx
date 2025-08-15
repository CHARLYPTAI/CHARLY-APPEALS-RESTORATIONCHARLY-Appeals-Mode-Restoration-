import React, { useEffect, useState } from 'react';

interface CorrelationBannerProps {
  correlationId: string | null;
  onClear: () => void;
  eventCount?: number;
  timeWindow?: string;
}

export function CorrelationBanner({ 
  correlationId, 
  onClear, 
  eventCount = 0, 
  timeWindow = '±5 minutes' 
}: CorrelationBannerProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (correlationId) {
      setIsVisible(true);
    } else {
      setIsVisible(false);
    }
  }, [correlationId]);

  const copyCorrelationId = async () => {
    if (correlationId) {
      try {
        await navigator.clipboard.writeText(correlationId);
        // Could add a toast notification here
      } catch (err) {
        console.error('Failed to copy correlation ID:', err);
      }
    }
  };

  const shareDeepLink = async () => {
    if (correlationId) {
      const url = new URL(window.location.href);
      url.hash = `cid=${correlationId}`;
      
      try {
        await navigator.clipboard.writeText(url.toString());
        // Could add a toast notification here
      } catch (err) {
        console.error('Failed to copy deep link:', err);
      }
    }
  };

  if (!isVisible || !correlationId) {
    return null;
  }

  return (
    <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-lg p-4 mb-6">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            <svg className="w-5 h-5 text-indigo-600 dark:text-indigo-400 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h4 className="text-sm font-semibold text-indigo-800 dark:text-indigo-300">
                Correlation Trace Active
              </h4>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-100 dark:bg-indigo-800 text-indigo-800 dark:text-indigo-300">
                {eventCount} event{eventCount !== 1 ? 's' : ''}
              </span>
            </div>
            
            <p className="text-sm text-indigo-700 dark:text-indigo-400 mb-3">
              Showing events for correlation ID <code className="bg-indigo-100 dark:bg-indigo-800 px-1 py-0.5 rounded text-xs font-mono">{correlationId}</code> 
              within {timeWindow} of the original event.
            </p>
            
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={copyCorrelationId}
                className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-indigo-700 dark:text-indigo-300 bg-indigo-100 dark:bg-indigo-800 rounded hover:bg-indigo-200 dark:hover:bg-indigo-700 transition-colors"
              >
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                Copy ID
              </button>
              
              <button
                onClick={shareDeepLink}
                className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-indigo-700 dark:text-indigo-300 bg-indigo-100 dark:bg-indigo-800 rounded hover:bg-indigo-200 dark:hover:bg-indigo-700 transition-colors"
              >
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                </svg>
                Share Link
              </button>
              
              <div className="text-xs text-indigo-600 dark:text-indigo-400 hidden sm:block">
                Use this link to share this exact trace view with team members
              </div>
            </div>
          </div>
        </div>
        
        <button
          onClick={onClear}
          className="flex-shrink-0 p-1 text-indigo-400 hover:text-indigo-600 dark:hover:text-indigo-300 transition-colors"
          title="Clear correlation filter"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      
      {/* Progress indicator for related events */}
      {eventCount > 1 && (
        <div className="mt-3 pt-3 border-t border-indigo-200 dark:border-indigo-700">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-indigo-500 dark:text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 00-2-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v4" />
            </svg>
            <span className="text-xs text-indigo-600 dark:text-indigo-400">
              Events are ordered chronologically to show the complete user journey
            </span>
          </div>
        </div>
      )}
    </div>
  );
}