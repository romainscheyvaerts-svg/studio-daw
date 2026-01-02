/**
 * ERROR BOUNDARY COMPONENT
 *
 * Catches React errors and displays a user-friendly error message
 * instead of crashing the entire application.
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);

    this.setState({
      error,
      errorInfo,
    });

    // Call optional error handler
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Log to error reporting service in production
    if (process.env.NODE_ENV === 'production') {
      // TODO: Send to error tracking service (Sentry, LogRocket, etc.)
      // logErrorToService(error, errorInfo);
    }
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <div className="min-h-screen bg-black flex items-center justify-center p-6">
          <div className="max-w-2xl w-full bg-gray-900 rounded-lg border border-red-500/30 p-8">
            {/* Error Icon */}
            <div className="flex items-center justify-center w-16 h-16 mx-auto mb-6 rounded-full bg-red-500/20">
              <svg
                className="w-8 h-8 text-red-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>

            {/* Error Title */}
            <h1 className="text-2xl font-black text-red-500 text-center mb-4 uppercase">
              Something Went Wrong
            </h1>

            {/* Error Description */}
            <p className="text-gray-400 text-center mb-8">
              An unexpected error occurred. Don't worry, your work should be saved.
              Try refreshing the page or click the button below to continue.
            </p>

            {/* Error Details (Development Only) */}
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mb-6 bg-black/50 rounded p-4 border border-gray-800">
                <summary className="text-sm font-bold text-red-400 cursor-pointer mb-2 uppercase">
                  Error Details (Development Only)
                </summary>
                <div className="mt-2 space-y-2">
                  <div>
                    <div className="text-xs text-gray-500 uppercase mb-1">Error Message:</div>
                    <div className="text-sm text-red-400 font-mono">
                      {this.state.error.message}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 uppercase mb-1">Stack Trace:</div>
                    <pre className="text-xs text-gray-400 overflow-auto max-h-48 font-mono">
                      {this.state.error.stack}
                    </pre>
                  </div>
                  {this.state.errorInfo && (
                    <div>
                      <div className="text-xs text-gray-500 uppercase mb-1">Component Stack:</div>
                      <pre className="text-xs text-gray-400 overflow-auto max-h-48 font-mono">
                        {this.state.errorInfo.componentStack}
                      </pre>
                    </div>
                  )}
                </div>
              </details>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={this.handleReset}
                className="flex-1 px-6 py-3 bg-cyan-500 hover:bg-cyan-600 text-black font-black rounded uppercase transition-colors"
              >
                Try Again
              </button>
              <button
                onClick={() => window.location.reload()}
                className="flex-1 px-6 py-3 bg-gray-800 hover:bg-gray-700 text-white font-bold rounded uppercase transition-colors"
              >
                Reload Page
              </button>
            </div>

            {/* Help Text */}
            <p className="text-xs text-gray-600 text-center mt-6">
              If this problem persists, please report it on GitHub or contact support.
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Hook to use error boundary in functional components
 * Throws error to nearest ErrorBoundary
 */
export const useErrorHandler = () => {
  const [error, setError] = React.useState<Error | null>(null);

  React.useEffect(() => {
    if (error) {
      throw error;
    }
  }, [error]);

  return setError;
};

/**
 * Higher-order component to wrap a component with ErrorBoundary
 */
export const withErrorBoundary = <P extends object>(
  Component: React.ComponentType<P>,
  fallback?: ReactNode
) => {
  return (props: P) => (
    <ErrorBoundary fallback={fallback}>
      <Component {...props} />
    </ErrorBoundary>
  );
};
