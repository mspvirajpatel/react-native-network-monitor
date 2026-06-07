export interface FpsStats {
    fps: number;
    minFps: number;
    maxFps: number;
    averageFps: number;
    droppedFrames: number;
    history: number[];
}
export declare const startPerformanceMonitor: () => void;
export declare const stopPerformanceMonitor: () => void;
export declare const subscribeToFps: (cb: (stats: FpsStats) => void) => () => void;
export declare const isPerformanceMonitorRunning: () => boolean;
export declare const getFpsHistory: () => number[];
/**
 * destroyPerformanceMonitor
 *
 * Stop the monitor, clear all subscribers, and reset state.
 * Call when the debugger is fully closed to prevent stale callbacks.
 */
export declare const destroyPerformanceMonitor: () => void;
//# sourceMappingURL=PerformanceMonitor.d.ts.map