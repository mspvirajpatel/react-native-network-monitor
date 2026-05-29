/**
 * StorageAdapter
 *
 * Interface for persistent key-value storage used by the debug monitor.
 * Consumers can provide their own implementation (e.g., MMKV, AsyncStorage)
 * via the `storageAdapter` prop on `DebugTrigger`, or by calling `setStorageAdapter()`.
 */
export interface StorageAdapter {
    get<T = any>(key: string, defaultValue: T): T | Promise<T>;
    set(key: string, value: any): void | Promise<void>;
}
/**
 * setStorageAdapter
 *
 * Replace the default in-memory storage with a custom adapter.
 * Call this early in your app lifecycle before rendering `DebugTrigger`.
 *
 * @example
 * ```ts
 * import { setStorageAdapter } from 'react-native-network-monitor';
 * import { MMKV } from 'react-native-mmkv';
 *
 * const mmkv = new MMKV();
 *
 * setStorageAdapter({
 *   get: (key, defaultValue) => {
 *     const val = mmkv.getString(key);
 *     return val !== undefined ? JSON.parse(val) : defaultValue;
 *   },
 *   set: (key, value) => {
 *     mmkv.set(key, JSON.stringify(value));
 *   },
 * });
 * ```
 */
export declare const setStorageAdapter: (adapter: StorageAdapter) => void;
/**
 * getStorageAdapter
 *
 * Returns the current storage adapter instance.
 */
export declare const getStorageAdapter: () => StorageAdapter;
/**
 * getStorageValue
 *
 * Read a value from the current storage adapter.
 */
export declare const getStorageValue: <T = any>(key: string, defaultValue: T) => Promise<T>;
/**
 * setStorageValue
 *
 * Write a value to the current storage adapter.
 */
export declare const setStorageValue: (key: string, value: any) => Promise<void>;
//# sourceMappingURL=storage.d.ts.map