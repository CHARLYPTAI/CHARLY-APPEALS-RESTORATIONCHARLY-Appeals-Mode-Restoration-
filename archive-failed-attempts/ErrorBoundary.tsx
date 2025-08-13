import { Component, type ReactNode, type ErrorInfo } from "react";
import { env } from "@/lib/env";

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error, errorInfo: null };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('🚨 ErrorBoundary caught an error:', error, errorInfo);
    console.error('🚨 Error message:', error.message);
    console.error('🚨 Error stack:', error.stack);
    console.error('🚨 Component stack:', errorInfo.componentStack);
    
    // Call optional error handler
    this.props.onError?.(error, errorInfo);
    
    // Send to error tracking service in production
    if (env.environment === 'production') {
      // Placeholder for error monitoring service (Sentry, LogRocket, etc.)
      // Sentry.captureException(error, { extra: errorInfo });
      console.error('Production error captured:', { error: error.message, stack: error.stack, componentStack: errorInfo.componentStack });
    }
    
    // Update state with error info
    this.setState({ errorInfo });
  }

  private handleRefresh = () => {
    window.location.reload();
  };

  private handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-zinc-100">
          <div className="max-w-md mx-auto text-center p-6 bg-white rounded-xl shadow-lg">
            <div className="text-red-500 mb-4">
              <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.732 15.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            
            <h1 className="text-2xl font-semibold text-zinc-900 mb-2">
              Something went wrong
            </h1>
            
            <p className="text-zinc-600 mb-4">
              We've encountered an unexpected error in the CHARLY application. Please try refreshing the page or contact support if the issue persists.
            </p>
            
            {(env.environment === 'development' || env.enableDebugMode) && this.state.error && (
              <details open className="text-left mb-4">
                <summary className="cursor-pointer text-sm text-zinc-500 hover:text-zinc-700">
                  Show error details (development only)
                </summary>
                <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded text-xs">
                  <p className="font-semibold text-red-800 mb-1">Error Message:</p>
                  <p className="text-red-700 mb-2 font-mono">{this.state.error.message}</p>
                  <p className="font-semibold text-red-800 mb-1">Error Name:</p>
                  <p className="text-red-700 mb-2 font-mono">{this.state.error.name}</p>
                  {this.state.error.stack && (
                    <>
                      <p className="font-semibold text-red-800 mb-1">Stack Trace:</p>
                      <pre className="text-red-600 whitespace-pre-wrap overflow-auto max-h-48 text-xs font-mono bg-red-100 p-2 rounded">
                        {this.state.error.stack}
                      </pre>
                    </>
                  )}
                  {this.state.errorInfo && (
                    <>
                      <p className="font-semibold text-red-800 mb-1 mt-3">Component Stack:</p>
                      <pre className="text-red-600 whitespace-pre-wrap overflow-auto max-h-32 text-xs font-mono bg-red-100 p-2 rounded">
                        {this.state.errorInfo.componentStack}
                      </pre>
                    </>
                  )}
                </div>
              </details>
            )}
            
            <div className="flex gap-3 justify-center">
              <button
                onClick={this.handleReset}
                className="px-4 py-2 bg-zinc-200 text-zinc-700 rounded-xl hover:bg-zinc-300 transition-all duration-200 hover:scale-105 focus:ring-2 focus:ring-zinc-400 focus:ring-offset-2"
              >
                Try Again
              </button>
              <button
                onClick={this.handleRefresh}
                className="px-4 py-2 bg-zinc-900 text-white rounded-xl hover:bg-zinc-800 transition-all duration-200 hover:scale-105 focus:ring-2 focus:ring-zinc-600 focus:ring-offset-2"
              >
                Refresh Page
              </button>
            </div>
            
            <p className="text-xs text-zinc-500 mt-4">
              If this error continues, please contact support with the error details above.
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Default export for backward compatibility
export default ErrorBoundary;