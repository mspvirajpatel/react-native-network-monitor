"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
Object.defineProperty(exports, "DARK_COLORS", {
  enumerable: true,
  get: function () {
    return _DebugMonitorStyles.DARK_COLORS;
  }
});
Object.defineProperty(exports, "DebugMonitor", {
  enumerable: true,
  get: function () {
    return _DebugMonitor.DebugMonitor;
  }
});
Object.defineProperty(exports, "DebugTrigger", {
  enumerable: true,
  get: function () {
    return _DebugTrigger.DebugTrigger;
  }
});
Object.defineProperty(exports, "ErrorBoundary", {
  enumerable: true,
  get: function () {
    return _ErrorBoundary.ErrorBoundary;
  }
});
Object.defineProperty(exports, "LIGHT_COLORS", {
  enumerable: true,
  get: function () {
    return _DebugMonitorStyles.LIGHT_COLORS;
  }
});
Object.defineProperty(exports, "Logger", {
  enumerable: true,
  get: function () {
    return _Logger.Logger;
  }
});
Object.defineProperty(exports, "RTL_LANGUAGES", {
  enumerable: true,
  get: function () {
    return _translations.RTL_LANGUAGES;
  }
});
Object.defineProperty(exports, "SUPPORTED_LANGUAGES", {
  enumerable: true,
  get: function () {
    return _translations.SUPPORTED_LANGUAGES;
  }
});
Object.defineProperty(exports, "TRANSLATIONS", {
  enumerable: true,
  get: function () {
    return _translations.TRANSLATIONS;
  }
});
Object.defineProperty(exports, "clearPersistedLogs", {
  enumerable: true,
  get: function () {
    return _PersistenceManager.clearPersistedLogs;
  }
});
Object.defineProperty(exports, "createReduxMiddleware", {
  enumerable: true,
  get: function () {
    return _StateMonitor.createReduxMiddleware;
  }
});
Object.defineProperty(exports, "createZustandMonitor", {
  enumerable: true,
  get: function () {
    return _StateMonitor.createZustandMonitor;
  }
});
Object.defineProperty(exports, "formatReportAsText", {
  enumerable: true,
  get: function () {
    return _ExportReport.formatReportAsText;
  }
});
Object.defineProperty(exports, "generateExportReport", {
  enumerable: true,
  get: function () {
    return _ExportReport.generateExportReport;
  }
});
Object.defineProperty(exports, "getColors", {
  enumerable: true,
  get: function () {
    return _DebugMonitorStyles.getColors;
  }
});
Object.defineProperty(exports, "getDeviceInfo", {
  enumerable: true,
  get: function () {
    return _DeviceInfo.getDeviceInfo;
  }
});
Object.defineProperty(exports, "getDeviceLanguage", {
  enumerable: true,
  get: function () {
    return _translations.getDeviceLanguage;
  }
});
Object.defineProperty(exports, "getRedirectedUrl", {
  enumerable: true,
  get: function () {
    return _NetworkMonitor.getRedirectedUrl;
  }
});
Object.defineProperty(exports, "getStorageAdapter", {
  enumerable: true,
  get: function () {
    return _storage.getStorageAdapter;
  }
});
Object.defineProperty(exports, "isInternalUrl", {
  enumerable: true,
  get: function () {
    return _NetworkMonitor.isInternalUrl;
  }
});
Object.defineProperty(exports, "isPerformanceMonitorRunning", {
  enumerable: true,
  get: function () {
    return _PerformanceMonitor.isPerformanceMonitorRunning;
  }
});
Object.defineProperty(exports, "resolveLanguage", {
  enumerable: true,
  get: function () {
    return _translations.resolveLanguage;
  }
});
Object.defineProperty(exports, "restoreLogs", {
  enumerable: true,
  get: function () {
    return _PersistenceManager.restoreLogs;
  }
});
Object.defineProperty(exports, "saveReportToFile", {
  enumerable: true,
  get: function () {
    return _FileExporter.saveReportToFile;
  }
});
Object.defineProperty(exports, "saveReportToJson", {
  enumerable: true,
  get: function () {
    return _FileExporter.saveReportToJson;
  }
});
Object.defineProperty(exports, "saveReportToText", {
  enumerable: true,
  get: function () {
    return _FileExporter.saveReportToText;
  }
});
Object.defineProperty(exports, "setNetworkConfig", {
  enumerable: true,
  get: function () {
    return _NetworkMonitor.setNetworkConfig;
  }
});
Object.defineProperty(exports, "setStorageAdapter", {
  enumerable: true,
  get: function () {
    return _storage.setStorageAdapter;
  }
});
Object.defineProperty(exports, "setupConsoleMonitor", {
  enumerable: true,
  get: function () {
    return _ConsoleMonitor.setupConsoleMonitor;
  }
});
Object.defineProperty(exports, "setupGlobalErrorHandlers", {
  enumerable: true,
  get: function () {
    return _ErrorBoundary.setupGlobalErrorHandlers;
  }
});
Object.defineProperty(exports, "setupNetworkMonitor", {
  enumerable: true,
  get: function () {
    return _NetworkMonitor.setupNetworkMonitor;
  }
});
Object.defineProperty(exports, "setupWebSocketMonitor", {
  enumerable: true,
  get: function () {
    return _WebSocketMonitor.setupWebSocketMonitor;
  }
});
Object.defineProperty(exports, "startPerformanceMonitor", {
  enumerable: true,
  get: function () {
    return _PerformanceMonitor.startPerformanceMonitor;
  }
});
Object.defineProperty(exports, "startPersistence", {
  enumerable: true,
  get: function () {
    return _PersistenceManager.startPersistence;
  }
});
Object.defineProperty(exports, "stopPerformanceMonitor", {
  enumerable: true,
  get: function () {
    return _PerformanceMonitor.stopPerformanceMonitor;
  }
});
Object.defineProperty(exports, "stopPersistence", {
  enumerable: true,
  get: function () {
    return _PersistenceManager.stopPersistence;
  }
});
Object.defineProperty(exports, "subscribeToFps", {
  enumerable: true,
  get: function () {
    return _PerformanceMonitor.subscribeToFps;
  }
});
Object.defineProperty(exports, "subscribeToState", {
  enumerable: true,
  get: function () {
    return _StateMonitor.subscribeToState;
  }
});
Object.defineProperty(exports, "useDebugger", {
  enumerable: true,
  get: function () {
    return _DebugContext.useDebugger;
  }
});
var _NetworkMonitor = require("./NetworkMonitor");
var _ConsoleMonitor = require("./ConsoleMonitor");
var _WebSocketMonitor = require("./WebSocketMonitor");
var _PerformanceMonitor = require("./PerformanceMonitor");
var _ErrorBoundary = require("./ErrorBoundary");
var _DeviceInfo = require("./DeviceInfo");
var _ExportReport = require("./ExportReport");
var _FileExporter = require("./FileExporter");
var _PersistenceManager = require("./PersistenceManager");
var _Logger = require("./Logger");
var _DebugMonitor = require("./DebugMonitor");
var _DebugTrigger = require("./DebugTrigger");
var _DebugContext = require("./DebugContext");
var _translations = require("./translations");
var _StateMonitor = require("./StateMonitor");
var _storage = require("./storage");
var _DebugMonitorStyles = require("./DebugMonitorStyles");
//# sourceMappingURL=index.js.map