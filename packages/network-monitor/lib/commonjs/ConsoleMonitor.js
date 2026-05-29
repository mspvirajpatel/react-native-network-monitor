"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.setupConsoleMonitor = void 0;
var _Logger = require("./Logger");
/**
 * safeStringify
 *
 * Safely serialize an arbitrary value to string for logging and display.
 * Handles circular references and truncates very large outputs to avoid
 * performance problems when capturing console payloads.
 *
 * @param obj - Value to stringify
 * @returns String representation suitable for inclusion in logs
 */
const safeStringify = obj => {
  try {
    if (typeof obj === 'string') return obj;
    if (typeof obj === 'undefined') return 'undefined';
    if (obj === null) return 'null';
    const cache = new Set();
    const str = JSON.stringify(obj, (_, value) => {
      if (typeof value === 'object' && value !== null) {
        if (cache.has(value)) {
          return '[Circular]';
        }
        cache.add(value);
      }
      return value;
    }, 2);
    if (str.length > 20000) {
      return str.substring(0, 20000) + '\n... [Content truncated for performance]';
    }
    return str;
  } catch (e) {
    return `[Unserializable Content: ${e.message}]`;
  }
};

/**
 * setupConsoleMonitor
 *
 * Patches the global `console` methods (`log`, `info`, `warn`, `error`) so
 * that messages are forwarded to the debug `Logger` while preserving original
 * behavior.
 */
const setupConsoleMonitor = () => {
  if (console._isPatchedByDebugLogger) return;
  console._isPatchedByDebugLogger = true;
  const originalLog = console.log;
  const originalInfo = console.info;
  const originalWarn = console.warn;
  const originalError = console.error;
  console.log = (...args) => {
    originalLog(...args);
    _Logger.Logger.logInfo(args.map(a => safeStringify(a)).join(' '));
  };
  console.info = (...args) => {
    originalInfo(...args);
    _Logger.Logger.logInfo(args.map(a => safeStringify(a)).join(' '));
  };
  console.warn = (...args) => {
    originalWarn(...args);
    _Logger.Logger.logInfo(`[WARN] ${args.map(a => safeStringify(a)).join(' ')}`);
  };
  console.error = (...args) => {
    originalError(...args);
    _Logger.Logger.logInfo(`[ERROR] ${args.map(a => safeStringify(a)).join(' ')}`);
  };
};
exports.setupConsoleMonitor = setupConsoleMonitor;
//# sourceMappingURL=ConsoleMonitor.js.map