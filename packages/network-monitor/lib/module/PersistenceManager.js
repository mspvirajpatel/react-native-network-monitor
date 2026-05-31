import { Logger } from './Logger';
import { getStorageAdapter } from './storage';
const LOGS_STORAGE_KEY = 'networkMonitorSavedLogs';
const MAX_PERSISTED_LOGS = 200;
let saveInterval = null;
let isDirty = false;
const originalLogs = Logger.getLogs.bind(Logger);
const originalLogRequest = Logger.logRequest.bind(Logger);
const originalLogResponse = Logger.logResponse.bind(Logger);
const originalLogError = Logger.logError.bind(Logger);
const originalLogInfo = Logger.logInfo.bind(Logger);
const markDirty = () => {
  isDirty = true;
};
Logger.logRequest = data => {
  const result = originalLogRequest(data);
  markDirty();
  return result;
};
Logger.logResponse = data => {
  originalLogResponse(data);
  markDirty();
};
Logger.logError = data => {
  originalLogError(data);
  markDirty();
};
Logger.logInfo = (message, data) => {
  originalLogInfo(message, data);
  markDirty();
};
export const startPersistence = (intervalMs = 10000) => {
  if (saveInterval) return;
  saveInterval = setInterval(async () => {
    if (!isDirty) return;
    isDirty = false;
    try {
      const logs = Logger.getLogs();
      const toSave = logs.slice(0, MAX_PERSISTED_LOGS);
      await getStorageAdapter().set(LOGS_STORAGE_KEY, JSON.stringify(toSave));
    } catch (_) {}
  }, intervalMs);
};
export const stopPersistence = () => {
  if (saveInterval) {
    clearInterval(saveInterval);
    saveInterval = null;
  }
};
export const restoreLogs = async () => {
  try {
    const raw = await getStorageAdapter().get(LOGS_STORAGE_KEY, '[]');
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
  } catch (_) {}
  return [];
};
export const clearPersistedLogs = async () => {
  try {
    await getStorageAdapter().set(LOGS_STORAGE_KEY, '[]');
  } catch (_) {}
};
//# sourceMappingURL=PersistenceManager.js.map