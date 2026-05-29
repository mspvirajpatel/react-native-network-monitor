// Core monitoring utilities
export { setupNetworkMonitor, getRedirectedUrl } from './NetworkMonitor';
export { setupConsoleMonitor } from './ConsoleMonitor';

// Logger (singleton)
export { Logger, type LogEntry, type LogType, type CustomUrlEntry } from './Logger';

// UI Components
export { DebugMonitor } from './DebugMonitor';
export { DebugTrigger, type DebugTriggerProps } from './DebugTrigger';

// Storage adapter system
export {
  setStorageAdapter,
  getStorageAdapter,
  type StorageAdapter
} from './storage';

// Theme
export { getColors, DARK_COLORS, LIGHT_COLORS, type ThemeColors } from './DebugMonitorStyles';
