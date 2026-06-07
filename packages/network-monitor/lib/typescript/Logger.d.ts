export type LogType = 'request' | 'response' | 'error' | 'info' | 'database' | 'navigation' | 'websocket' | 'performance' | 'action';
export interface StateActionData {
    storeName: string;
    actionType?: string;
    actionPayload?: any;
    diff?: Record<string, {
        prev: any;
        next: any;
    }>;
    snapshot?: any;
}
export interface GraphQLInfo {
    operationType: 'query' | 'mutation' | 'subscription' | 'unknown';
    operationName?: string;
    query?: string;
    variables?: any;
}
export interface LogEntry {
    id: string;
    type: LogType;
    timestamp: string;
    url?: string;
    originalUrl?: string;
    isRedirected?: boolean;
    method?: string;
    requestData?: any;
    responseData?: any;
    requestHeaders?: any;
    responseHeaders?: any;
    headers?: any;
    status?: number;
    message?: string;
    durationMs?: number;
    size?: string;
    stateData?: StateActionData;
    graphql?: GraphQLInfo;
}
export interface CustomUrlEntry {
    title: string;
    url: string;
}
/**
 * DebugLogger
 *
 * Singleton logger used by the debug monitor. Collects logs for requests,
 * responses, errors, info, database and navigation events and notifies
 * subscribers when new log entries are available.
 */
declare class DebugLogger {
    private static instance;
    private logs;
    private listeners;
    isNetworkPatched: boolean;
    private baseUrl;
    private customUrls;
    private notifyTimeout;
    private maxLogs;
    /**
     * Private constructor to enforce singleton pattern. Use DebugLogger.getInstance() to access the shared instance.
     */
    private constructor();
    /**
     * getInstance
     *
     * Return the shared DebugLogger singleton instance.
     */
    static getInstance(): DebugLogger;
    /**
     * setBaseUrl
     *
     * Set the base URL used for redirecting requests inside the monitor.
     * @param url - Base URL to apply
     */
    setBaseUrl(url: string): void;
    /**
     * getBaseUrl
     *
     * @returns Current base URL string
     */
    getBaseUrl(): string;
    /**
     * getCustomUrls
     *
     * @returns Array of custom URL entries
     */
    getCustomUrls(): CustomUrlEntry[];
    /**
     * addCustomUrl
     *
     * Add a custom URL entry and notify subscribers.
     * @param entry - Custom URL to add
     */
    addCustomUrl(entry: CustomUrlEntry): void;
    /**
     * setMaxLogs
     *
     * Configure the maximum number of log entries to retain.
     * Oldest entries are evicted (LRU) when the cap is exceeded.
     * @param count - Maximum log count (default 500)
     */
    setMaxLogs(count: number): void;
    /**
     * getMaxLogs
     *
     * @returns Current maximum log count
     */
    getMaxLogs(): number;
    /**
     * removeCustomUrl
     *
     * Remove a custom URL entry and reset base if it was active.
     * @param url - URL string to remove
     */
    removeCustomUrl(url: string): void;
    /**
     * trimLogs
     *
     * Enforce the maxLogs cap by removing the oldest entries (LRU eviction).
     * Since new entries are unshifted at [0], popping from the end removes
     * the least recently added entries.
     */
    private trimLogs;
    /**
     * notify
     *
     * Notify all subscribers with the latest logs. Uses a debounce mechanism to batch updates.
     * Also enforces the memory cap before notifying.
     */
    private notify;
    /**
     * calculateSize
     *
     * Calculate the size of the given data in kilobytes.
     * @param data - Data to calculate size for
     * @returns Size string in kilobytes
     */
    private calculateSize;
    /**
     * logRequest
     *
     * Record a network request entry.
     * @returns request id string
     */
    logRequest(data: {
        url?: string;
        originalUrl?: string;
        isRedirected?: boolean;
        method?: string;
        data?: any;
        headers?: any;
        reqId?: string;
        _isAxios?: boolean;
        axiosConfig?: any;
        graphql?: GraphQLInfo;
    }): string;
    /**
     * logResponse
     *
     * Attach response data to an existing request log or create a standalone
     * response record.
     */
    logResponse(data: {
        reqId?: string;
        status: number;
        data?: any;
        url?: string;
        originalUrl?: string;
        isRedirected?: boolean;
        method?: string;
        headers?: any;
    }): void;
    /**
     * logError
     *
     * Record a network or generic error for correlation in the monitor UI.
     */
    logError(data: {
        reqId?: string;
        message?: string;
        status?: number;
        data?: any;
        url?: string;
        method?: string;
    }): void;
    /**
     * logInfo
     *
     * Add a general informational log entry (used by the console monitor).
     */
    logInfo(message: string, data?: any): void;
    /**
     * logDatabase
     *
     * Record a database query / event for debugging.
     */
    logDatabase(query: string, data?: any): void;
    /**
     * logNavigation
     *
     * Record a navigation event (route + params) for debugging.
     */
    logNavigation(route: string, params?: any): void;
    /**
     * getLogs
     *
     * @returns A shallow copy of the recorded logs
     */
    getLogs(): LogEntry[];
    /**
     * clearLogs
     *
     * Remove all recorded logs and notify subscribers.
     */
    clearLogs(): void;
    /**
     * subscribe
     *
     * Subscribe to log updates. Returns an unsubscribe function.
     */
    subscribe(listener: (logs: LogEntry[]) => void): () => void;
    /**
     * destroy
     *
     * Clean up all listeners and pending timeouts. Call when the debugger
     * is fully closed to prevent stale callbacks.
     */
    destroy(): void;
    /**
     * init
     *
     * Placeholder for future initialization logic.
     */
    logWebSocket(data: {
        url: string;
        event: 'open' | 'message' | 'close' | 'error';
        message?: string;
        data?: any;
        status?: number;
    }): void;
    logAction(data: StateActionData): void;
    logPerformance(data: {
        fps: number;
        jsHeapSize?: number;
        jsHeapLimit?: number;
        droppedFrames?: number;
    }): void;
    init(): void;
    /**
     * detectGraphQL
     *
     * Detect if a request body contains a GraphQL query/mutation/subscription
     * and extract relevant metadata. Returns null if the request is not GraphQL.
     *
     * @param body - The parsed request body (object or string)
     * @param headers - The request headers
     * @param url - The request URL
     * @returns GraphQLInfo if detected, null otherwise
     */
    static detectGraphQL(body?: any, headers?: any, url?: string): GraphQLInfo | null;
}
/**
 * Shared logger instance used by the package.
 */
export declare const Logger: DebugLogger;
export default Logger;
//# sourceMappingURL=Logger.d.ts.map