export interface FpsStats {
    fps: number;
    minFps: number;
    maxFps: number;
    averageFps: number;
    droppedFrames: number;
}
export declare const startPerformanceMonitor: () => void;
export declare const stopPerformanceMonitor: () => void;
export declare const subscribeToFps: (cb: (stats: FpsStats) => void) => () => void;
export declare const isPerformanceMonitorRunning: () => boolean;
//# sourceMappingURL=PerformanceMonitor.d.ts.map