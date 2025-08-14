// 🍎 Error Boundary - Apple Reliability Excellence
// "It's better to be a pirate than to join the navy" - Steve Jobs

import React, { Component, ReactNode } from 'react';
import { APPLE_COLORS, NEUTRAL_COLORS } from '../design/colors';
import { SPACING } from '../design/spacing';
import { Button } from './Button';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error Boundary caught an error:', error, errorInfo);
    
    // In production, you might want to log this to an error reporting service
    if (process.env.NODE_ENV === 'production') {
      // Example: Sentry, LogRocket, etc.
      // reportError(error, errorInfo);
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined });
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI with Apple design
      return (
        <div style={styles.container}>
          <div style={styles.content}>
            <div style={styles.iconContainer}>
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke={APPLE_COLORS.RED} strokeWidth="1.5">
                <circle cx="12" cy="12" r="10"/>
                <path d="m15 9-6 6"/>
                <path d="m9 9 6 6"/>
              </svg>
            </div>
            
            <h1 style={styles.title}>Something went wrong</h1>
            <p style={styles.message}>
              We're sorry, but something unexpected happened. Our team has been notified.
            </p>
            
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details style={styles.details}>
                <summary style={styles.summary}>Error Details</summary>
                <pre style={styles.errorText}>
                  {this.state.error.name}: {this.state.error.message}
                  {this.state.error.stack && `\n\n${this.state.error.stack}`}
                </pre>
              </details>
            )}
            
            <div style={styles.actions}>
              <Button variant="primary" onClick={this.handleRetry}>
                Try Again
              </Button>
              <Button variant="secondary" onClick={this.handleReload}>
                Reload Page
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

const styles = {
  container: {
    minHeight: '50vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.XL,
  },

  content: {
    textAlign: 'center' as const,
    maxWidth: '500px',
    width: '100%',
  },

  iconContainer: {
    marginBottom: SPACING.XL,
    display: 'flex',
    justifyContent: 'center',
  },

  title: {
    fontSize: '32px',
    fontWeight: 600,
    color: NEUTRAL_COLORS.GRAY_900,
    fontFamily: "'SF Pro Display', -apple-system, sans-serif",
    margin: 0,
    marginBottom: SPACING.LG,
  },

  message: {
    fontSize: '16px',
    color: NEUTRAL_COLORS.GRAY_600,
    lineHeight: 1.5,
    margin: 0,
    marginBottom: SPACING.XL,
  },

  details: {
    textAlign: 'left' as const,
    marginBottom: SPACING.XL,
    padding: SPACING.MD,
    backgroundColor: NEUTRAL_COLORS.GRAY_50,
    borderRadius: '8px',
    border: `1px solid ${NEUTRAL_COLORS.GRAY_200}`,
  },

  summary: {
    fontSize: '14px',
    fontWeight: 600,
    color: NEUTRAL_COLORS.GRAY_700,
    cursor: 'pointer',
    marginBottom: SPACING.SM,
  },

  errorText: {
    fontSize: '12px',
    fontFamily: 'monospace',
    color: APPLE_COLORS.RED,
    whiteSpace: 'pre-wrap' as const,
    wordBreak: 'break-all' as const,
    margin: 0,
  },

  actions: {
    display: 'flex',
    gap: SPACING.MD,
    justifyContent: 'center',
    flexWrap: 'wrap' as const,
  },
} as const;