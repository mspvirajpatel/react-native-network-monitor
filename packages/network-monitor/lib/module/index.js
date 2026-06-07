// Core monitoring utilities
export { setupNetworkMonitor, getRedirectedUrl, isInternalUrl, setNetworkConfig } from './NetworkMonitor';
export { setupConsoleMonitor } from './ConsoleMonitor';
export { setupWebSocketMonitor } from './WebSocketMonitor';

// Performance Monitor
export { startPerformanceMonitor, stopPerformanceMonitor, subscribeToFps, isPerformanceMonitorRunning, getFpsHistory, destroyPerformanceMonitor } from './PerformanceMonitor';

// Error Handling
export { ErrorBoundary, setupGlobalErrorHandlers } from './ErrorBoundary';

// Device Info
export { getDeviceInfo } from './DeviceInfo';

// Export Report
export { generateExportReport, formatReportAsText } from './ExportReport';

// File Exporter
export { saveReportToFile, saveReportToJson, saveReportToText } from './FileExporter';

// Persistence
export { startPersistence, stopPersistence, restoreLogs, clearPersistedLogs } from './PersistenceManager';

// Logger (singleton)
export { Logger } from './Logger';

// UI Components
export { DebugMonitor } from './DebugMonitor';
export { DebugTrigger } from './DebugTrigger';

// Debug Context (programmatic open/close)
export { useDebugger } from './DebugContext';

// Translations / i18n
export { SUPPORTED_LANGUAGES, RTL_LANGUAGES, TRANSLATIONS, resolveLanguage, getDeviceLanguage } from './translations';

// State/Store Monitor
export { subscribeToState, createReduxMiddleware, createZustandMonitor } from './StateMonitor';

// Storage adapter system
export { setStorageAdapter, getStorageAdapter } from './storage';

// Theme
export { getColors, DARK_COLORS, LIGHT_COLORS } from './DebugMonitorStyles';
//# sourceMappingURL=index.js.map