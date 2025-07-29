import { Component, type ReactNode } from "react";

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    console.error("ErrorBoundary caught error:", error);
    console.error("Stack trace:", error.stack);
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error("ErrorBoundary componentDidCatch:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-4 text-red-600 bg-red-50 border border-red-200 rounded-lg">
          <h1 className="text-xl font-bold mb-2">⚠️ Something went wrong</h1>
          <div className="text-sm">
            <p className="font-medium mb-1">Error: {this.state.error?.message}</p>
            <details className="mt-2">
              <summary className="cursor-pointer text-gray-600">Show details</summary>
              <pre className="mt-1 text-xs bg-gray-100 p-2 rounded overflow-auto">
                {this.state.error?.stack}
              </pre>
            </details>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}