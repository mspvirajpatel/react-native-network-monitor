import { Logger, LogEntry } from './Logger';
import { getStorageAdapter } from './storage';

const LOGS_STORAGE_KEY = 'networkMonitorSavedLogs';
const MAX_PERSISTED_LOGS = 200;

let saveInterval: ReturnType<typeof setInterval> | null = null;
let isDirty = false;

const originalLogs = Logger.getLogs.bind(Logger);

const originalLogRequest = Logger.logRequest.bind(Logger);
const originalLogResponse = Logger.logResponse.bind(Logger);
const originalLogError = Logger.logError.bind(Logger);
const originalLogInfo = Logger.logInfo.bind(Logger);

const markDirty = () => {
  isDirty = true;
};

Logger.logRequest = ((data: any) => {
  const result = originalLogRequest(data);
  markDirty();
  return result;
}) as typeof Logger.logRequest;

Logger.logResponse = ((data: any) => {
  originalLogResponse(data);
  markDirty();
}) as typeof Logger.logResponse;

Logger.logError = ((data: any) => {
  originalLogError(data);
  markDirty();
}) as typeof Logger.logError;

Logger.logInfo = ((message: string, data?: any) => {
  originalLogInfo(message, data);
  markDirty();
}) as typeof Logger.logInfo;

export const startPersistence = (intervalMs: number = 10000) => {
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

export const restoreLogs = async (): Promise<LogEntry[]> => {
  try {
    const raw = await getStorageAdapter().get<string>(LOGS_STORAGE_KEY, '[]');
    const parsed: LogEntry[] = JSON.parse(raw);
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
