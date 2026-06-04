export { setupNetworkMonitor, getRedirectedUrl, isInternalUrl, setNetworkConfig, type NetworkConfig } from './NetworkMonitor';
export { setupConsoleMonitor } from './ConsoleMonitor';
export { setupWebSocketMonitor } from './WebSocketMonitor';
export { startPerformanceMonitor, stopPerformanceMonitor, subscribeToFps, isPerformanceMonitorRunning, type FpsStats } from './PerformanceMonitor';
export { ErrorBoundary, setupGlobalErrorHandlers } from './ErrorBoundary';
export { getDeviceInfo, type DeviceInfoData } from './DeviceInfo';
export { generateExportReport, formatReportAsText, type ExportReport } from './ExportReport';
export { saveReportToFile, saveReportToJson, saveReportToText } from './FileExporter';
export { startPersistence, stopPersistence, restoreLogs, clearPersistedLogs } from './PersistenceManager';
export { Logger, type LogEntry, type LogType, type CustomUrlEntry, type StateActionData } from './Logger';
export { DebugMonitor, type TabType } from './DebugMonitor';
export { DebugTrigger, type DebugTriggerProps } from './DebugTrigger';
export { useDebugger, type DebugContextValue } from './DebugContext';
export { type LanguageCode, type ResolvedLanguage, type Translation, SUPPORTED_LANGUAGES, RTL_LANGUAGES, TRANSLATIONS, resolveLanguage, getDeviceLanguage, } from './translations';
export { subscribeToState, createReduxMiddleware, createZustandMonitor, type StateMonitorConfig, } from './StateMonitor';
export { setStorageAdapter, getStorageAdapter, type StorageAdapter } from './storage';
export { getColors, DARK_COLORS, LIGHT_COLORS, type ThemeColors } from './DebugMonitorStyles';
//# sourceMappingURL=index.d.ts.map