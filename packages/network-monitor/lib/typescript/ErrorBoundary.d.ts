import React, { Component, ErrorInfo, ReactNode } from 'react';
interface ErrorBoundaryProps {
    children: ReactNode;
}
interface ErrorBoundaryState {
    hasError: boolean;
    error: Error | null;
}
export declare class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
    constructor(props: ErrorBoundaryProps);
    static getDerivedStateFromError(error: Error): {
        hasError: boolean;
        error: Error;
    };
    componentDidCatch(error: Error, errorInfo: ErrorInfo): void;
    render(): React.ReactNode;
}
export declare const setupGlobalErrorHandlers: () => void;
export {};
//# sourceMappingURL=ErrorBoundary.d.ts.map