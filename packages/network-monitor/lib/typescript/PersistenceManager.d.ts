import { LogEntry } from './Logger';
export declare const startPersistence: (intervalMs?: number) => void;
export declare const stopPersistence: () => void;
export declare const restoreLogs: () => Promise<LogEntry[]>;
export declare const clearPersistedLogs: () => Promise<void>;
//# sourceMappingURL=PersistenceManager.d.ts.map