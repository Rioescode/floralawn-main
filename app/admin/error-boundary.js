'use client';

import { Component } from 'react';

export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    // Filter out insecure operation errors (clipboard, etc.)
    const errorMsg = error?.message?.toLowerCase() || '';
    if (
      errorMsg.includes('insecure') || 
      errorMsg.includes('clipboard') ||
      errorMsg.includes('operation is insecure')
    ) {
      // Silently ignore these errors
      return { hasError: false };
    }
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Only log non-clipboard/insecure errors
    const errorMsg = error?.message?.toLowerCase() || '';
    if (
      !errorMsg.includes('insecure') && 
      !errorMsg.includes('clipboard') &&
      !errorMsg.includes('operation is insecure')
    ) {
      console.error('Error caught by boundary:', error, errorInfo);
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Something went wrong</h2>
            <p className="text-gray-600 mb-4">Please refresh the page or contact support.</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              Refresh Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
