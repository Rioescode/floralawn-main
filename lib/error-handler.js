// Global error handler for insecure operations
// This should be imported once at the app level

if (typeof window !== 'undefined' && !window.__globalErrorHandlerSetup) {
  window.__globalErrorHandlerSetup = true;

  const isInsecureError = (msg) => {
    if (!msg) return false;
    const lower = msg.toLowerCase();
    return lower.includes('insecure') || 
           lower.includes('clipboard') ||
           lower.includes('operation is insecure') ||
           lower.includes('document is not focused');
  };

  // Handle regular errors
  const originalErrorHandler = window.onerror;
  window.onerror = function(message, source, lineno, colno, error) {
    if (isInsecureError(message) || isInsecureError(error?.message)) {
      return true; // Prevent default error handling
    }
    if (originalErrorHandler) {
      return originalErrorHandler.call(this, message, source, lineno, colno, error);
    }
    return false;
  };

  // Handle unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    try {
      const reason = event.reason;
      const errorMsg = reason?.message || reason?.toString() || '';
      if (isInsecureError(errorMsg)) {
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();
        return false;
      }
    } catch (e) {
      // Ignore errors in error handler
    }
  }, true);

  // Handle regular errors with capture
  window.addEventListener('error', (event) => {
    try {
      const errorMsg = event.message || event.error?.message || '';
      if (isInsecureError(errorMsg)) {
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();
        return false;
      }
    } catch (e) {
      // Ignore errors in error handler
    }
  }, true);
}
