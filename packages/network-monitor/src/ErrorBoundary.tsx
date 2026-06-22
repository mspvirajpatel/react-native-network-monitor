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

  if (typeof globalThis !== 'undefined') {
    const originalOnError = (globalThis as Record<string, unknown>).onerror;
    (globalThis as Record<string, unknown>).onerror = (message: string, source?: string, lineno?: number, colno?: number, error?: Error) => {
      Logger.logInfo(`[GLOBAL ERROR] ${message} at ${source}:${lineno}:${colno}`);
      if (typeof originalOnError === 'function') (originalOnError as Function)(message, source, lineno, colno, error);
    };

    const originalOnRejection = (globalThis as Record<string, unknown>).onunhandledrejection;
    (globalThis as any).onunhandledrejection = (event: { reason?: { message?: string }; detail?: { reason?: unknown } }) => {
      const reason = event?.reason || (event as any)?.detail?.reason || 'Unknown';
      Logger.logInfo(`[UNHANDLED PROMISE REJECTION] ${reason?.message || reason}`);
      if (typeof originalOnRejection === 'function') (originalOnRejection as (e: unknown) => void)(event);
    };
  }
};
