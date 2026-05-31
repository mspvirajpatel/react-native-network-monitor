import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Logger } from './Logger';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
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

  ErrorUtils.setGlobalHandler((error: Error, isFatal?: boolean) => {
    Logger.logInfo(`[CRITICAL${isFatal ? ' FATAL' : ''}] ${error.name}: ${error.message}`);
    Logger.logInfo(`[STACK] ${error.stack || 'No stack trace'}`);

    if (originalHandler) {
      originalHandler(error, isFatal);
    }
  });

  if (typeof global !== 'undefined') {
    const originalOnError = (global as any).onerror;
    (global as any).onerror = (message: string, source?: string, lineno?: number, colno?: number, error?: Error) => {
      Logger.logInfo(`[GLOBAL ERROR] ${message} at ${source}:${lineno}:${colno}`);
      if (originalOnError) originalOnError(message, source, lineno, colno, error);
    };

    const originalOnRejection = (global as any).onunhandledrejection;
    (global as any).onunhandledrejection = (event: any) => {
      const reason = event?.reason || event?.detail?.reason || 'Unknown';
      Logger.logInfo(`[UNHANDLED PROMISE REJECTION] ${reason?.message || reason}`);
      if (originalOnRejection) originalOnRejection(event);
    };
  }
};
