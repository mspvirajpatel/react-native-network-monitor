/* eslint-disable no-unused-vars */
/* eslint-disable @typescript-eslint/no-unused-vars */

/**
 * DebugLogger
 *
 * Singleton logger used by the debug monitor. Collects logs for requests,
 * responses, errors, info, database and navigation events and notifies
 * subscribers when new log entries are available.
 */
class DebugLogger {
  logs = [];
  listeners = [];
  isNetworkPatched = false;
  baseUrl = '';
  customUrls = [];
  notifyTimeout = null;

  /**
   * Private constructor to enforce singleton pattern. Use DebugLogger.getInstance() to access the shared instance.
   */
  constructor() {}

  /**
   * getInstance
   *
   * Return the shared DebugLogger singleton instance.
   */
  static getInstance() {
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
  setBaseUrl(url) {
    this.baseUrl = url;
  }

  /**
   * getBaseUrl
   *
   * @returns Current base URL string
   */
  getBaseUrl() {
    return this.baseUrl;
  }

  /**
   * getCustomUrls
   *
   * @returns Array of custom URL entries
   */
  getCustomUrls() {
    return this.customUrls;
  }

  /**
   * addCustomUrl
   *
   * Add a custom URL entry and notify subscribers.
   * @param entry - Custom URL to add
   */
  addCustomUrl(entry) {
    const exists = this.customUrls.some(u => u.url === entry.url);
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
  removeCustomUrl(url) {
    this.customUrls = this.customUrls.filter(u => u.url !== url);
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
  notify() {
    if (this.notifyTimeout) {
      clearTimeout(this.notifyTimeout);
    }
    this.notifyTimeout = setTimeout(() => {
      const currentLogs = this.getLogs();
      this.listeners.forEach(listener => listener(currentLogs));
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
  calculateSize(data) {
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
  logRequest(data) {
    const reqId = data.reqId || Math.random().toString(36).substring(7);
    if (data._isAxios && data.axiosConfig) {
      data.axiosConfig.__reqId = reqId;
    }
    const log = {
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
  logResponse(data) {
    const size = this.calculateSize(data.data);
    if (data.reqId) {
      const logIndex = this.logs.findIndex(l => l.id === data.reqId);
      if (logIndex !== -1) {
        const existingLog = this.logs[logIndex];
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
  logError(data) {
    if (data.reqId) {
      const logIndex = this.logs.findIndex(l => l.id === data.reqId);
      if (logIndex !== -1) {
        const existingLog = this.logs[logIndex];
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
  logInfo(message, data) {
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
  logDatabase(query, data) {
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
  logNavigation(route, params) {
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
  getLogs() {
    return [...this.logs];
  }

  /**
   * clearLogs
   *
   * Remove all recorded logs and notify subscribers.
   */
  clearLogs() {
    this.logs = [];
    this.notify();
  }

  /**
   * subscribe
   *
   * Subscribe to log updates. Returns an unsubscribe function.
   */
  subscribe(listener) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  /**
   * init
   *
   * Placeholder for future initialization logic.
   */
  logWebSocket(data) {
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
  logPerformance(data) {
    this.logs.unshift({
      id: Math.random().toString(36).substring(7),
      type: 'performance',
      timestamp: new Date().toISOString(),
      message: `FPS: ${data.fps}${data.droppedFrames ? ` | Dropped: ${data.droppedFrames}` : ''}${data.jsHeapSize ? ` | Heap: ${(data.jsHeapSize / 1048576).toFixed(1)}MB` : ''}`,
      durationMs: data.fps,
      size: `${(data.jsHeapSize || 0) > 0 ? (data.jsHeapSize / 1048576).toFixed(1) + 'MB' : ''}`,
      status: data.fps < 30 ? 1 : data.fps < 55 ? 0 : undefined
    });
    this.notify();
  }
  init() {}
}

/**
 * Shared logger instance used by the package.
 */
export const Logger = DebugLogger.getInstance();
export default Logger;
//# sourceMappingURL=Logger.js.map