"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.stopPersistence = exports.startPersistence = exports.restoreLogs = exports.clearPersistedLogs = void 0;
var _Logger = require("./Logger");
var _storage = require("./storage");
const LOGS_STORAGE_KEY = 'networkMonitorSavedLogs';
const MAX_PERSISTED_LOGS = 200;
let saveInterval = null;
let isDirty = false;
const originalLogs = _Logger.Logger.getLogs.bind(_Logger.Logger);
const originalLogRequest = _Logger.Logger.logRequest.bind(_Logger.Logger);
const originalLogResponse = _Logger.Logger.logResponse.bind(_Logger.Logger);
const originalLogError = _Logger.Logger.logError.bind(_Logger.Logger);
const originalLogInfo = _Logger.Logger.logInfo.bind(_Logger.Logger);
const markDirty = () => {
  isDirty = true;
};
_Logger.Logger.logRequest = data => {
  const result = originalLogRequest(data);
  markDirty();
  return result;
};
_Logger.Logger.logResponse = data => {
  originalLogResponse(data);
  markDirty();
};
_Logger.Logger.logError = data => {
  originalLogError(data);
  markDirty();
};
_Logger.Logger.logInfo = (message, data) => {
  originalLogInfo(message, data);
  markDirty();
};
const startPersistence = (intervalMs = 10000) => {
  if (saveInterval) return;
  saveInterval = setInterval(async () => {
    if (!isDirty) return;
    isDirty = false;
    try {
      const logs = _Logger.Logger.getLogs();
      const toSave = logs.slice(0, MAX_PERSISTED_LOGS);
      await (0, _storage.getStorageAdapter)().set(LOGS_STORAGE_KEY, JSON.stringify(toSave));
    } catch (_) {}
  }, intervalMs);
};
exports.startPersistence = startPersistence;
const stopPersistence = () => {
  if (saveInterval) {
    clearInterval(saveInterval);
    saveInterval = null;
  }
};
exports.stopPersistence = stopPersistence;
const restoreLogs = async () => {
  try {
    const raw = await (0, _storage.getStorageAdapter)().get(LOGS_STORAGE_KEY, '[]');
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
  } catch (_) {}
  return [];
};
exports.restoreLogs = restoreLogs;
const clearPersistedLogs = async () => {
  try {
    await (0, _storage.getStorageAdapter)().set(LOGS_STORAGE_KEY, '[]');
  } catch (_) {}
};
exports.clearPersistedLogs = clearPersistedLogs;
//# sourceMappingURL=PersistenceManager.js.map