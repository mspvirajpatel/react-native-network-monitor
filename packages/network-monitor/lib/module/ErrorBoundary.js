import { Component } from 'react';
import { Logger } from './Logger';
export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null
    };
  }
  static getDerivedStateFromError(error) {
    return {
      hasError: true,
      error
    };
  }
  componentDidCatch(error, errorInfo) {
    Logger.logInfo(`[RENDER ERROR] ${error.name}: ${error.message}`);
    Logger.logInfo(`[RENDER ERROR STACK] Component Stack: ${errorInfo.componentStack || 'N/A'}`);
  }
  render() {
    if (this.state.hasError) {
      return null;
    }
    return this.props.children;
  }
}
export const setupGlobalErrorHandlers = () => {
  const originalHandler = ErrorUtils.getGlobalHandler && ErrorUtils.getGlobalHandler();
  ErrorUtils.setGlobalHandler((error, isFatal) => {
    Logger.logInfo(`[CRITICAL${isFatal ? ' FATAL' : ''}] ${error.name}: ${error.message}`);
    Logger.logInfo(`[STACK] ${error.stack || 'No stack trace'}`);
    if (originalHandler) {
      originalHandler(error, isFatal);
    }
  });
  if (typeof global !== 'undefined') {
    const originalOnError = globalThis.onerror;
    globalThis.onerror = (message, source, lineno, colno, error) => {
      Logger.logInfo(`[GLOBAL ERROR] ${message} at ${source}:${lineno}:${colno}`);
      if (typeof originalOnError === 'function') originalOnError(message, source, lineno, colno, error);
    };
    const originalOnRejection = globalThis.onunhandledrejection;
    globalThis.onunhandledrejection = event => {
      const reason = event?.reason || event?.detail?.reason || 'Unknown';
      Logger.logInfo(`[UNHANDLED PROMISE REJECTION] ${reason?.message || reason}`);
      if (typeof originalOnRejection === 'function') originalOnRejection(event);
    };
  }
};
//# sourceMappingURL=ErrorBoundary.js.map