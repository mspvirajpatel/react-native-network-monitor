"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.setupGlobalErrorHandlers = exports.ErrorBoundary = void 0;
var _react = require("react");
var _Logger = require("./Logger");
class ErrorBoundary extends _react.Component {
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
    _Logger.Logger.logInfo(`[RENDER ERROR] ${error.name}: ${error.message}`);
    _Logger.Logger.logInfo(`[RENDER ERROR STACK] Component Stack: ${errorInfo.componentStack || 'N/A'}`);
  }
  render() {
    if (this.state.hasError) {
      return null;
    }
    return this.props.children;
  }
}
exports.ErrorBoundary = ErrorBoundary;
const setupGlobalErrorHandlers = () => {
  const originalHandler = ErrorUtils.getGlobalHandler && ErrorUtils.getGlobalHandler();
  ErrorUtils.setGlobalHandler((error, isFatal) => {
    _Logger.Logger.logInfo(`[CRITICAL${isFatal ? ' FATAL' : ''}] ${error.name}: ${error.message}`);
    _Logger.Logger.logInfo(`[STACK] ${error.stack || 'No stack trace'}`);
    if (originalHandler) {
      originalHandler(error, isFatal);
    }
  });
  if (typeof global !== 'undefined') {
    const originalOnError = globalThis.onerror;
    globalThis.onerror = (message, source, lineno, colno, error) => {
      _Logger.Logger.logInfo(`[GLOBAL ERROR] ${message} at ${source}:${lineno}:${colno}`);
      if (typeof originalOnError === 'function') originalOnError(message, source, lineno, colno, error);
    };
    const originalOnRejection = globalThis.onunhandledrejection;
    globalThis.onunhandledrejection = event => {
      const reason = event?.reason || event?.detail?.reason || 'Unknown';
      _Logger.Logger.logInfo(`[UNHANDLED PROMISE REJECTION] ${reason?.message || reason}`);
      if (typeof originalOnRejection === 'function') originalOnRejection(event);
    };
  }
};
exports.setupGlobalErrorHandlers = setupGlobalErrorHandlers;
//# sourceMappingURL=ErrorBoundary.js.map