"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = exports.Logger = void 0;
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
  maxLogs = 500;

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
   * setMaxLogs
   *
   * Configure the maximum number of log entries to retain.
   * Oldest entries are evicted (LRU) when the cap is exceeded.
   * @param count - Maximum log count (default 500)
   */
  setMaxLogs(count) {
    this.maxLogs = count;
    this.trimLogs();
    this.notify();
  }

  /**
   * getMaxLogs
   *
   * @returns Current maximum log count
   */
  getMaxLogs() {
    return this.maxLogs;
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
   * trimLogs
   *
   * Enforce the maxLogs cap by removing the oldest entries (LRU eviction).
   * Since new entries are unshifted at [0], popping from the end removes
   * the least recently added entries.
   */
  trimLogs() {
    while (this.logs.length > this.maxLogs) {
      this.logs.pop();
    }
  }

  /**
   * notify
   *
   * Notify all subscribers with the latest logs. Uses a debounce mechanism to batch updates.
   * Also enforces the memory cap before notifying.
   */
  notify() {
    if (this.notifyTimeout) {
      clearTimeout(this.notifyTimeout);
    }
    this.notifyTimeout = setTimeout(() => {
      this.trimLogs();
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

    // Auto-detect GraphQL if not provided
    const graphql = data.graphql || DebugLogger.detectGraphQL(data.data, data.headers, data.url);
    const log = {
      id: reqId,
      type: 'request',
      timestamp: new Date().toISOString(),
      url: data.url,
      originalUrl: data.originalUrl,
      isRedirected: data.isRedirected,
      method: data.method?.toUpperCase(),
      requestData: data.data,
      requestHeaders: data.headers,
      graphql: graphql || undefined
    };
    this.logs.unshift(log);
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

    // Detect GraphQL from response shape (has `data` or `errors` at top level)
    let graphqlResponse = null;
    if (data.data && typeof data.data === 'object') {
      const rd = data.data;
      if (rd.data !== undefined || rd.errors !== undefined) {
        graphqlResponse = {
          operationType: 'unknown'
        };
      }
    }
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
          size,
          graphql: existingLog.graphql || graphqlResponse || undefined
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
      size,
      graphql: graphqlResponse || undefined
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
   * destroy
   *
   * Clean up all listeners and pending timeouts. Call when the debugger
   * is fully closed to prevent stale callbacks.
   */
  destroy() {
    this.listeners = [];
    if (this.notifyTimeout) {
      clearTimeout(this.notifyTimeout);
      this.notifyTimeout = null;
    }
  }

  /**
   * init
   *
   * Placeholder for future initialization logic.
   */
  logNotification(data) {
    this.logs.unshift({
      id: Math.random().toString(36).substring(7),
      type: 'notification',
      timestamp: new Date().toISOString(),
      message: `[NOTIFICATION] ${data.title || 'No title'}`,
      requestData: data
    });
    this.notify();
  }
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
  logAction(data) {
    this.logs.unshift({
      id: Math.random().toString(36).substring(7),
      type: 'action',
      timestamp: new Date().toISOString(),
      message: data.actionType || `[${data.storeName}] State Change`,
      stateData: data
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
  static detectGraphQL(body, headers, url) {
    // Fast path: check for /graphql in URL
    if (url && url.includes('/graphql')) {
      // Check if body has GraphQL markers
      if (body && typeof body === 'object') {
        const query = body.query || body.operationName ? body : null;
        if (query) {
          const opType = query.query?.trim().startsWith('mutation') ? 'mutation' : query.query?.trim().startsWith('subscription') ? 'subscription' : 'query';
          return {
            operationType: query.operationName ? opType : 'query',
            operationName: query.operationName,
            query: query.query,
            variables: query.variables
          };
        }
      }
      // URL contains /graphql but no GraphQL body — still tag it
      return {
        operationType: 'unknown'
      };
    }

    // Check headers for GraphQL content type
    const contentType = headers?.['content-type'] || headers?.['Content-Type'] || '';
    if (contentType.includes('application/graphql')) {
      return {
        operationType: 'unknown',
        query: typeof body === 'string' ? body : undefined
      };
    }

    // Check JSON body for GraphQL query structure even without /graphql URL
    if (body && typeof body === 'object' && (body.query || body.operationName)) {
      const query = body;
      const opType = query.query?.trim().startsWith('mutation') ? 'mutation' : query.query?.trim().startsWith('subscription') ? 'subscription' : 'query';
      return {
        operationType: query.operationName ? opType : opType,
        operationName: query.operationName,
        query: query.query,
        variables: query.variables
      };
    }
    return null;
  }
}

/**
 * Shared logger instance used by the package.
 */
const Logger = exports.Logger = DebugLogger.getInstance();
var _default = exports.default = Logger;
//# sourceMappingURL=Logger.js.map