// Core monitoring utilities
export { setupNetworkMonitor, getRedirectedUrl, isInternalUrl, setNetworkConfig, type NetworkConfig } from './NetworkMonitor';
export { setupConsoleMonitor } from './ConsoleMonitor';
export { setupWebSocketMonitor } from './WebSocketMonitor';

// Performance Monitor
export {
  startPerformanceMonitor,
  stopPerformanceMonitor,
  subscribeToFps,
  isPerformanceMonitorRunning,
  type FpsStats
} from './PerformanceMonitor';

// Error Handling
export { ErrorBoundary, setupGlobalErrorHandlers } from './ErrorBoundary';

// Device Info
export { getDeviceInfo, type DeviceInfoData } from './DeviceInfo';

// Export Report
export { generateExportReport, formatReportAsText, type ExportReport } from './ExportReport';

// File Exporter
export { saveReportToFile, saveReportToJson, saveReportToText } from './FileExporter';

// Persistence
export {
  startPersistence,
  stopPersistence,
  restoreLogs,
  clearPersistedLogs
} from './PersistenceManager';

// Logger (singleton)
export { Logger, type LogEntry, type LogType, type CustomUrlEntry, type StateActionData } from './Logger';

// UI Components
export { DebugMonitor, type TabType } from './DebugMonitor';
export { DebugTrigger, type DebugTriggerProps } from './DebugTrigger';

// Debug Context (programmatic open/close)
export { useDebugger, type DebugContextValue } from './DebugContext';

// Translations / i18n
export {
  type LanguageCode,
  type ResolvedLanguage,
  type Translation,
  SUPPORTED_LANGUAGES,
  RTL_LANGUAGES,
  TRANSLATIONS,
  resolveLanguage,
  getDeviceLanguage,
} from './translations';

// State/Store Monitor
export {
  subscribeToState,
  createReduxMiddleware,
  createZustandMonitor,
  type StateMonitorConfig,
} from './StateMonitor';

// Storage adapter system
export {
  setStorageAdapter,
  getStorageAdapter,
  type StorageAdapter
} from './storage';

// Theme
export { getColors, DARK_COLORS, LIGHT_COLORS, type ThemeColors } from './DebugMonitorStyles';
