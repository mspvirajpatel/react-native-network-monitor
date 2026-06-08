export type NavigationMethod = 'push' | 'pop' | 'replace' | 'reset' | 'navigate' | 'dismiss' | 'modal' | 'link' | 'unknown';
export interface NavigationEvent {
    id: string;
    screen: string;
    previousScreen?: string;
    method: NavigationMethod;
    params?: Record<string, unknown>;
    deepLink?: string;
    timestamp: string;
    durationMs?: number;
}
export interface NavigationFlowNode {
    screen: string;
    visits: number;
    firstVisit: string;
    lastVisit: string;
}
export interface NavigationFlowEdge {
    from: string;
    to: string;
    count: number;
    methods: NavigationMethod[];
}
/**
 * logNavigationEvent
 *
 * Log a navigation event with flow tracking data.
 */
export declare const logNavigationEvent: (event: Omit<NavigationEvent, "id" | "timestamp">) => void;
/**
 * setupNavigationTracker
 *
 * Start tracking navigation events. Call this when your app's navigation
 * is initialized. Use logNavigationEvent() in your navigation listeners.
 */
export declare const setupNavigationTracker: () => void;
/**
 * destroyNavigationTracker
 *
 * Stop tracking and clean up.
 */
export declare const destroyNavigationTracker: () => void;
/**
 * getNavigationEvents
 */
export declare const getNavigationEvents: () => NavigationEvent[];
/**
 * clearNavigationEvents
 */
export declare const clearNavigationEvents: () => void;
/**
 * subscribeToNavigation
 */
export declare const subscribeToNavigation: (listener: (events: NavigationEvent[]) => void) => () => void;
/**
 * isNavigationTrackerActive
 */
export declare const isNavigationTrackerActive: () => boolean;
/**
 * getNavigationFlow
 *
 * Compute the flow graph (nodes + edges) from navigation events.
 */
export declare const getNavigationFlow: () => {
    nodes: NavigationFlowNode[];
    edges: NavigationFlowEdge[];
};
/**
 * getScreenStats
 *
 * Get statistics for each screen.
 */
export declare const getScreenStats: () => {
    totalScreens: number;
    totalTransitions: number;
    totalEvents: number;
    totalTimeMs: number;
    nodes: NavigationFlowNode[];
    edges: NavigationFlowEdge[];
};
//# sourceMappingURL=NavigationTracker.d.ts.map