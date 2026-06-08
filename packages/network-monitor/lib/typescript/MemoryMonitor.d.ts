export interface MemStats {
    usedJSHeapSize: number;
    totalJSHeapSize: number;
    jsHeapSizeLimit: number;
    usagePercent: number;
    minUsage: number;
    maxUsage: number;
    averageUsage: number;
    history: number[];
    supported: boolean;
}
export declare const startMemoryMonitor: () => void;
export declare const stopMemoryMonitor: () => void;
export declare const subscribeToMemory: (cb: (stats: MemStats) => void) => () => void;
export declare const isMemoryMonitorRunning: () => boolean;
export declare const isMemoryApiSupported: () => boolean;
/**
 * destroyMemoryMonitor
 *
 * Stop the monitor, clear all subscribers, and reset state.
 */
export declare const destroyMemoryMonitor: () => void;
//# sourceMappingURL=MemoryMonitor.d.ts.map