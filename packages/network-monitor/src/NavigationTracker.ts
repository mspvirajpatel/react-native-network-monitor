/* eslint-disable no-unused-vars */
import { Logger } from './Logger';

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

let _isTracking = false;
let _events: NavigationEvent[] = [];
let _listeners: ((events: NavigationEvent[]) => void)[] = [];
let _notifyTimeout: ReturnType<typeof setTimeout> | null = null;
let _lastScreen: string | undefined;
let _lastTimestamp: number = 0;

const notify = () => {
  if (_notifyTimeout) clearTimeout(_notifyTimeout);
  _notifyTimeout = setTimeout(() => {
    _listeners.forEach((l) => l([..._events]));
    _notifyTimeout = null;
  }, 100);
};

/**
 * logNavigationEvent
 *
 * Log a navigation event with flow tracking data.
 */
export const logNavigationEvent = (event: Omit<NavigationEvent, 'id' | 'timestamp'>) => {
  const now = Date.now();
  const entry: NavigationEvent = {
    ...event,
    id: Math.random().toString(36).substring(7),
    timestamp: new Date().toISOString(),
    durationMs: _lastTimestamp > 0 ? now - _lastTimestamp : undefined,
    previousScreen: event.previousScreen || _lastScreen,
  };

  _events.unshift(entry);
  if (_events.length > 500) _events.pop();

  _lastScreen = event.screen;
  _lastTimestamp = now;

  Logger.logNavigation(event.screen, {
    navigation: entry,
  });

  notify();
};

/**
 * setupNavigationTracker
 *
 * Start tracking navigation events. Call this when your app's navigation
 * is initialized. Use logNavigationEvent() in your navigation listeners.
 */
export const setupNavigationTracker = () => {
  if (_isTracking) return;
  _isTracking = true;
};

/**
 * destroyNavigationTracker
 *
 * Stop tracking and clean up.
 */
export const destroyNavigationTracker = () => {
  _isTracking = false;
  _events = [];
  _listeners = [];
  _lastScreen = undefined;
  _lastTimestamp = 0;
};

/**
 * getNavigationEvents
 */
export const getNavigationEvents = (): NavigationEvent[] => [..._events];

/**
 * clearNavigationEvents
 */
export const clearNavigationEvents = () => {
  _events = [];
  _lastScreen = undefined;
  _lastTimestamp = 0;
  notify();
};

/**
 * subscribeToNavigation
 */
export const subscribeToNavigation = (listener: (events: NavigationEvent[]) => void) => {
  _listeners.push(listener);
  return () => {
    _listeners = _listeners.filter((l) => l !== listener);
  };
};

/**
 * isNavigationTrackerActive
 */
export const isNavigationTrackerActive = () => _isTracking;

/**
 * getNavigationFlow
 *
 * Compute the flow graph (nodes + edges) from navigation events.
 */
export const getNavigationFlow = (): { nodes: NavigationFlowNode[]; edges: NavigationFlowEdge[] } => {
  const nodeMap = new Map<string, NavigationFlowNode>();
  const edgeMap = new Map<string, NavigationFlowEdge>();

  // Process events in chronological order (oldest first)
  const sorted = [..._events].reverse();

  for (const event of sorted) {
    // Update node
    const existing = nodeMap.get(event.screen);
    if (existing) {
      existing.visits++;
      existing.lastVisit = event.timestamp;
    } else {
      nodeMap.set(event.screen, {
        screen: event.screen,
        visits: 1,
        firstVisit: event.timestamp,
        lastVisit: event.timestamp,
      });
    }

    // Update edge
    if (event.previousScreen && event.previousScreen !== event.screen) {
      const key = `${event.previousScreen}→${event.screen}`;
      const edge = edgeMap.get(key);
      if (edge) {
        edge.count++;
        if (!edge.methods.includes(event.method)) {
          edge.methods.push(event.method);
        }
      } else {
        edgeMap.set(key, {
          from: event.previousScreen,
          to: event.screen,
          count: 1,
          methods: [event.method],
        });
      }
    }
  }

  return {
    nodes: Array.from(nodeMap.values()),
    edges: Array.from(edgeMap.values()),
  };
};

/**
 * getScreenStats
 *
 * Get statistics for each screen.
 */
export const getScreenStats = () => {
  const flow = getNavigationFlow();
  const totalTime = _events.length > 1
    ? new Date(_events[0]!.timestamp).getTime() - new Date(_events[_events.length - 1]!.timestamp).getTime()
    : 0;

  return {
    totalScreens: flow.nodes.length,
    totalTransitions: flow.edges.length,
    totalEvents: _events.length,
    totalTimeMs: totalTime,
    nodes: flow.nodes,
    edges: flow.edges,
  };
};
