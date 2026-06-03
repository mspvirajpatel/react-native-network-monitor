export interface StateMonitorConfig {
    name: string;
    mode?: 'diff' | 'snapshot';
    throttleMs?: number;
    maxDepth?: number;
    ignoreActions?: string[];
    includeActions?: string[];
    ignoreStateKeys?: string[];
    includeStateKeys?: string[];
}
export declare function subscribeToState(config: {
    name: string;
    getState: () => any;
    subscribe: (listener: () => void) => () => void;
    mode?: 'diff' | 'snapshot';
    throttleMs?: number;
    maxDepth?: number;
    ignoreStateKeys?: string[];
    includeStateKeys?: string[];
}): () => void;
export declare function createReduxMiddleware(options?: {
    name?: string;
    mode?: 'diff' | 'snapshot';
    throttleMs?: number;
    maxDepth?: number;
    ignoreActions?: string[];
    includeActions?: string[];
    ignoreStateKeys?: string[];
    includeStateKeys?: string[];
}): any;
export declare function createZustandMonitor(storeOrApi: any, options?: {
    name?: string;
    mode?: 'diff' | 'snapshot';
    throttleMs?: number;
    maxDepth?: number;
    ignoreStateKeys?: string[];
    includeStateKeys?: string[];
}): () => void;
//# sourceMappingURL=StateMonitor.d.ts.map