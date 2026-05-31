/* eslint-disable no-unused-vars */
/* eslint-disable @typescript-eslint/no-unused-vars */
export type LogType = 'request' | 'response' | 'error' | 'info' | 'database' | 'navigation' | 'websocket' | 'performance';

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
  headers?: any; // For backward compatibility
  status?: number;
  message?: string;
  durationMs?: number;
  size?: string;
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
class DebugLogger {
  private static instance: DebugLogger;
  private logs: LogEntry[] = [];
  private listeners: ((logs: LogEntry[]) => void)[] = [];
  public isNetworkPatched = false;
  private baseUrl: string = '';
  private customUrls: CustomUrlEntry[] = [];
  private notifyTimeout: any = null;

  /**
   * Private constructor to enforce singleton pattern. Use DebugLogger.getInstance() to access the shared instance.
   */
  private constructor() {}

  /**
   * getInstance
   *
   * Return the shared DebugLogger singleton instance.
   */
  public static getInstance(): DebugLogger {
    if (!DebugLogger.instance) {
      DebugLogger.instance = new DebugLogger();
    }
    return DebugLogger.instance;
  }

  /**
   * setBaseUrl
   *
   * Set the base URL used for redirecting requests inside the monitor.
   * @param url - Base URL to apply
   */
  public setBaseUrl(url: string) {
    this.baseUrl = url;
  }

  /**
   * getBaseUrl
   *
   * @returns Current base URL string
   */
  public getBaseUrl(): string {
    return this.baseUrl;
  }

  /**
   * getCustomUrls
   *
   * @returns Array of custom URL entries
   */
  public getCustomUrls(): CustomUrlEntry[] {
    return this.customUrls;
  }

  /**
   * addCustomUrl
   *
   * Add a custom URL entry and notify subscribers.
   * @param entry - Custom URL to add
   */
  public addCustomUrl(entry: CustomUrlEntry) {
    const exists = this.customUrls.some((u) => u.url === entry.url);
    if (!exists) {
      this.customUrls = [entry, ...this.customUrls];
    }
  }

  /**
   * removeCustomUrl
   *
   * Remove a custom URL entry and reset base if it was active.
   * @param url - URL string to remove
   */
  public removeCustomUrl(url: string) {
    this.customUrls = this.customUrls.filter((u) => u.url !== url);
    // If the currently active URL is the one we're removing, reset it
    if (this.baseUrl === url) {
      this.baseUrl = '';
    }
  }

  /**
   * notify
   *
   * Notify all subscribers with the latest logs. Uses a debounce mechanism to batch updates.
   */
  private notify() {
    if (this.notifyTimeout) {
      clearTimeout(this.notifyTimeout);
    }
    this.notifyTimeout = setTimeout(() => {
      const currentLogs = this.getLogs();
      this.listeners.forEach((listener) => listener(currentLogs));
      this.notifyTimeout = null;
    }, 100);
  }

  /**
   * calculateSize
   *
   * Calculate the size of the given data in kilobytes.
   * @param data - Data to calculate size for
   * @returns Size string in kilobytes
   */
  private calculateSize(data: any): string {
    try {
      if (!data) return '0.00 kb';
      const str = typeof data === 'string' ? data : JSON.stringify(data);
      return `${(str.length / 1024).toFixed(2)} kb`;
    } catch (e) {
      return '0.00 kb';
    }
  }

  /**
   * logRequest
   *
   * Record a network request entry.
   * @returns request id string
   */
  public logRequest(data: {
    url?: string;
    originalUrl?: string;
    isRedirected?: boolean;
    method?: string;
    data?: any;
    headers?: any;
    reqId?: string;
    _isAxios?: boolean;
    axiosConfig?: any;
  }) {
    const reqId = data.reqId || Math.random().toString(36).substring(7);

    if (data._isAxios && data.axiosConfig) {
      data.axiosConfig.__reqId = reqId;
    }

    const log: LogEntry = {
      id: reqId,
      type: 'request',
      timestamp: new Date().toISOString(),
      url: data.url,
      originalUrl: data.originalUrl,
      isRedirected: data.isRedirected,
      method: data.method?.toUpperCase(),
      requestData: data.data,
      requestHeaders: data.headers
    };

    this.logs.unshift(log);
    if (this.logs.length > 500) {
      this.logs.pop();
    }
    this.notify();
    return reqId;
  }

  /**
   * logResponse
   *
   * Attach response data to an existing request log or create a standalone
   * response record.
   */
  public logResponse(data: {
    reqId?: string;
    status: number;
    data?: any;
    url?: string;
    originalUrl?: string;
    isRedirected?: boolean;
    method?: string;
    headers?: any;
  }) {
    const size = this.calculateSize(data.data);
    if (data.reqId) {
      const logIndex = this.logs.findIndex((l) => l.id === data.reqId);
      if (logIndex !== -1) {
        const existingLog = this.logs[logIndex]!;
        const start = new Date(existingLog.timestamp).getTime();
        const durationMs = Date.now() - start;
        this.logs[logIndex] = {
          ...existingLog,
          type: 'response',
          status: data.status,
          responseData: data.data,
          responseHeaders: data.headers,
          durationMs,
          size
        };
        this.notify();
        return;
      }
    }

    this.logs.unshift({
      id: data.reqId || Math.random().toString(36).substring(7),
      type: 'response',
      timestamp: new Date().toISOString(),
      url: data.url,
      method: data.method?.toUpperCase(),
      status: data.status,
      responseData: data.data,
      responseHeaders: data.headers,
      durationMs: 0,
      size
    });
    this.notify();
  }

  /**
   * logError
   *
   * Record a network or generic error for correlation in the monitor UI.
   */
  public logError(data: {
    reqId?: string;
    message?: string;
    status?: number;
    data?: any;
    url?: string;
    method?: string;
  }) {
    if (data.reqId) {
      const logIndex = this.logs.findIndex((l) => l.id === data.reqId);
      if (logIndex !== -1) {
        const existingLog = this.logs[logIndex]!;
        const start = new Date(existingLog.timestamp).getTime();
        const durationMs = Date.now() - start;
        this.logs[logIndex] = {
          ...existingLog,
          type: 'error',
          status: data.status,
          message: data.message,
          responseData: data.data,
          durationMs
        };
        this.notify();
        return;
      }
    }

    this.logs.unshift({
      id: data.reqId || Math.random().toString(36).substring(7),
      type: 'error',
      timestamp: new Date().toISOString(),
      url: data.url,
      method: data.method?.toUpperCase(),
      status: data.status,
      message: data.message,
      responseData: data.data
    });
    this.notify();
  }

  /**
   * logInfo
   *
   * Add a general informational log entry (used by the console monitor).
   */
  public logInfo(message: string, data?: any) {
    this.logs.unshift({
      id: Math.random().toString(36).substring(7),
      type: 'info',
      timestamp: new Date().toISOString(),
      message,
      requestData: data
    });
    this.notify();
  }

  /**
   * logDatabase
   *
   * Record a database query / event for debugging.
   */
  public logDatabase(query: string, data?: any) {
    this.logs.unshift({
      id: Math.random().toString(36).substring(7),
      type: 'database',
      timestamp: new Date().toISOString(),
      message: query,
      requestData: data
    });
    this.notify();
  }

  /**
   * logNavigation
   *
   * Record a navigation event (route + params) for debugging.
   */
  public logNavigation(route: string, params?: any) {
    this.logs.unshift({
      id: Math.random().toString(36).substring(7),
      type: 'navigation',
      timestamp: new Date().toISOString(),
      message: `Navigated to: ${route}`,
      requestData: params,
      url: route
    });
    this.notify();
  }

  /**
   * getLogs
   *
   * @returns A shallow copy of the recorded logs
   */
  public getLogs(): LogEntry[] {
    return [...this.logs];
  }

  /**
   * clearLogs
   *
   * Remove all recorded logs and notify subscribers.
   */
  public clearLogs() {
    this.logs = [];
    this.notify();
  }

  /**
   * subscribe
   *
   * Subscribe to log updates. Returns an unsubscribe function.
   */
  public subscribe(listener: (logs: LogEntry[]) => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  /**
   * init
   *
   * Placeholder for future initialization logic.
   */
  public logWebSocket(data: {
    url: string;
    event: 'open' | 'message' | 'close' | 'error';
    message?: string;
    data?: any;
    status?: number;
  }) {
    const icon = data.event === 'open' ? '🔗' : data.event === 'close' ? '🔌' : data.event === 'error' ? '⚠️' : '📨';
    this.logs.unshift({
      id: Math.random().toString(36).substring(7),
      type: 'websocket',
      timestamp: new Date().toISOString(),
      url: data.url,
      message: `${icon} WS ${(data.event || '').toUpperCase()}: ${data.message || ''}`,
      requestData: data.data,
      status: data.status
    });
    this.notify();
  }

  public logPerformance(data: {
    fps: number;
    jsHeapSize?: number;
    jsHeapLimit?: number;
    droppedFrames?: number;
  }) {
    this.logs.unshift({
      id: Math.random().toString(36).substring(7),
      type: 'performance',
      timestamp: new Date().toISOString(),
      message: `FPS: ${data.fps}${data.droppedFrames ? ` | Dropped: ${data.droppedFrames}` : ''}${data.jsHeapSize ? ` | Heap: ${(data.jsHeapSize / 1048576).toFixed(1)}MB` : ''}`,
      durationMs: data.fps,
      size: `${(data.jsHeapSize || 0) > 0 ? (data.jsHeapSize! / 1048576).toFixed(1) + 'MB' : ''}`,
      status: data.fps < 30 ? 1 : data.fps < 55 ? 0 : undefined
    });
    this.notify();
  }

  public init() {}
}

/**
 * Shared logger instance used by the package.
 */
export const Logger = DebugLogger.getInstance();
export default Logger;
