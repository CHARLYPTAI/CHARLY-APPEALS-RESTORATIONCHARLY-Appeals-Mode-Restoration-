// ============================================================================
// CHARLY PLATFORM - SENTRY ERROR TRACKING CONFIGURATION
// Apple CTO Enterprise Monitoring - Phase 3B
// ============================================================================

import * as Sentry from '@sentry/react';
// React import for types
// import React from 'react';

// Initialize Sentry for error tracking and performance monitoring
export function initSentry() {
  const dsn = import.meta.env.VITE_SENTRY_DSN;
  const environment = import.meta.env.VITE_ENVIRONMENT || 'development';
  const release = import.meta.env.VITE_APP_VERSION || '1.0.0';
  
  // Only initialize in production or if DSN is provided
  if (!dsn && environment === 'production') {
    console.warn('Sentry DSN not configured for production environment');
    return;
  }
  
  if (!dsn) {
    console.info('Sentry not initialized - no DSN provided');
    return;
  }

  Sentry.init({
    dsn,
    environment,
    release: `charly@${release}`,
    
    // Performance Monitoring
    integrations: [
      Sentry.browserTracingIntegration({
        // Track user interactions
        enableInp: true,
        
        // Custom performance marks
        markBackgroundTransactions: true,
        
        // Network request tracking
        traceFetch: true,
        traceXHR: true,
        
        // Filter out noise
        shouldCreateSpanForRequest: (url) => {
          // Don't track internal health checks or static assets
          return !url.includes('/health') && 
                 !url.includes('/metrics') &&
                 !url.match(/\.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$/);
        },
      }),
    ],
    
    // Performance sampling
    tracesSampleRate: environment === 'production' ? 0.1 : 1.0,
    
    // Session replay for debugging (lower rate in production)
    replaysSessionSampleRate: environment === 'production' ? 0.01 : 0.1,
    replaysOnErrorSampleRate: 1.0,
    
    // Error filtering
    beforeSend(event, hint) {
      // Filter out known noise
      const error = hint.originalException;
      
      if (error && typeof error === 'object' && 'message' in error) {
        const message = error.message as string;
        
        // Filter out common non-actionable errors
        if (
          message.includes('Non-Error promise rejection') ||
          message.includes('ResizeObserver loop limit exceeded') ||
          message.includes('Script error') ||
          message.includes('Network request failed')
        ) {
          return null;
        }
      }
      
      // Add user context if available
      if (typeof window !== 'undefined' && window.localStorage) {
        const userEmail = window.localStorage.getItem('userEmail');
        if (userEmail) {
          event.user = { email: userEmail };
        }
      }
      
      return event;
    },
    
    // Additional context
    initialScope: {
      tags: {
        component: 'charly-frontend',
        platform: 'react',
      },
    },
    
    // Debug mode for development
    debug: environment === 'development',
    
    // Capture unhandled promise rejections
    captureUnhandledRejections: true,
    
    // Security: Don't send sensitive headers
    sendDefaultPii: false,
  });
  
  console.info(`Sentry initialized for ${environment} environment`);
}

// Enhanced error boundary with Sentry integration
export const SentryErrorBoundary = Sentry.ErrorBoundary;

// Performance monitoring helpers
export function trackPerformance(name: string, operation: () => Promise<void> | void) {
  return Sentry.withActiveSpan(Sentry.startInactiveSpan({ name }), async () => {
    try {
      await operation();
    } catch (error) {
      Sentry.captureException(error);
      throw error;
    }
  });
}

// Custom error tracking for business logic
export function trackError(error: Error, context?: Record<string, unknown>) {
  Sentry.withScope((scope) => {
    if (context) {
      scope.setContext('business_context', context);
    }
    Sentry.captureException(error);
  });
}

// Track user actions for better debugging
export function trackUserAction(action: string, data?: Record<string, unknown>) {
  Sentry.addBreadcrumb({
    message: action,
    category: 'user_action',
    level: 'info',
    data,
    timestamp: Date.now() / 1000,
  });
}

// Track API calls
export function trackApiCall(method: string, url: string, status?: number, duration?: number) {
  Sentry.addBreadcrumb({
    message: `${method} ${url}`,
    category: 'api',
    level: status && status >= 400 ? 'error' : 'info',
    data: {
      method,
      url,
      status,
      duration,
    },
    timestamp: Date.now() / 1000,
  });
}

export default Sentry;