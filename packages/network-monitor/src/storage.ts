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
 * InMemoryStorage
 *
 * Default fallback storage that keeps values in memory only.
 * Values are lost when the app is restarted. This is used when
 * no persistent storage adapter is configured.
 */
class InMemoryStorage implements StorageAdapter {
  private store: Record<string, any> = {};

  get<T = any>(key: string, defaultValue: T): T {
    if (key in this.store) {
      return this.store[key] as T;
    }
    return defaultValue;
  }

  set(key: string, value: any): void {
    this.store[key] = value;
  }
}

/**
 * Singleton storage instance used internally by the package.
 */
let storageInstance: StorageAdapter = new InMemoryStorage();

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
export const setStorageAdapter = (adapter: StorageAdapter): void => {
  storageInstance = adapter;
};

/**
 * getStorageAdapter
 *
 * Returns the current storage adapter instance.
 */
export const getStorageAdapter = (): StorageAdapter => {
  return storageInstance;
};

/**
 * getStorageValue
 *
 * Read a value from the current storage adapter.
 */
export const getStorageValue = async <T = any>(key: string, defaultValue: T): Promise<T> => {
  try {
    return await storageInstance.get(key, defaultValue);
  } catch {
    return defaultValue;
  }
};

/**
 * setStorageValue
 *
 * Write a value to the current storage adapter.
 */
export const setStorageValue = async (key: string, value: any): Promise<void> => {
  try {
    await storageInstance.set(key, value);
  } catch {
    // Silently fail — storage is non-critical
  }
};
