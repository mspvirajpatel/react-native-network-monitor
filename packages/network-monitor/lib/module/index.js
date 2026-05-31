// Core monitoring utilities
export { setupNetworkMonitor, getRedirectedUrl, isInternalUrl } from './NetworkMonitor';
export { setupConsoleMonitor } from './ConsoleMonitor';
export { setupWebSocketMonitor } from './WebSocketMonitor';

// Performance Monitor
export { startPerformanceMonitor, stopPerformanceMonitor, subscribeToFps, isPerformanceMonitorRunning } from './PerformanceMonitor';

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

// Storage adapter system
export { setStorageAdapter, getStorageAdapter } from './storage';

// Theme
export { getColors, DARK_COLORS, LIGHT_COLORS } from './DebugMonitorStyles';
//# sourceMappingURL=index.js.map