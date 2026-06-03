import { Logger } from './Logger';
const DEFAULT_CONFIG = {
  throttleMs: 200,
  maxDepth: 3,
  ignoreActions: ['@@redux/INIT', '@@INIT', '@@register', 'persist/REHYDRATE', 'persist/PERSIST', 'persist/REGISTER', 'persist/FLUSH', 'persist/PAUSE', 'persist/PURGE']
};
function truncateArray(arr, max) {
  return arr.slice(0, max).map(item => truncateValue(item, max));
}
function truncateValue(value, maxItems, depth = 0, maxDepth = 3) {
  if (depth > maxDepth) return '[Max Depth]';
  if (value === null || value === undefined) return value;
  if (typeof value !== 'object') return value;
  if (value instanceof Date) return value.toISOString();
  if (Array.isArray(value)) return truncateArray(value, maxItems);
  const obj = {};
  const keys = Object.keys(value).slice(0, maxItems);
  for (const key of keys) {
    obj[key] = truncateValue(value[key], maxItems, depth + 1, maxDepth);
  }
  return obj;
}
function computeDiff(prev, next, ignoreKeys = []) {
  const diff = {};
  const prevObj = prev || {};
  const nextObj = next || {};
  const allKeys = new Set([...Object.keys(prevObj), ...Object.keys(nextObj)]);
  for (const key of allKeys) {
    if (ignoreKeys.includes(key)) continue;
    if (prevObj[key] !== nextObj[key]) {
      diff[key] = {
        prev: prevObj[key],
        next: nextObj[key]
      };
    }
  }
  return diff;
}
export function subscribeToState(config) {
  const mode = config.mode || 'snapshot';
  const throttleMs = config.throttleMs ?? 200;
  const maxDepth = config.maxDepth ?? 3;
  const ignoreStateKeys = config.ignoreStateKeys || [];
  const includeStateKeys = config.includeStateKeys || [];
  let prevState = truncateValue(config.getState(), 50, 0, maxDepth);
  let lastLogTime = 0;
  let throttleTimer = null;
  let pendingState = null;
  const flush = () => {
    throttleTimer = null;
    const current = pendingState;
    pendingState = null;
    if (current === null || current === undefined) return;
    lastLogTime = Date.now();
    if (mode === 'diff') {
      const diff = computeDiff(prevState, current, ignoreStateKeys);
      let keys = Object.keys(diff);
      if (includeStateKeys.length > 0) {
        keys = keys.filter(k => includeStateKeys.includes(k));
      }
      if (keys.length > 0) {
        const filtered = {};
        for (const key of keys) {
          const val = diff[key];
          if (val) filtered[key] = val;
        }
        prevState = current;
        Logger.logAction({
          storeName: config.name,
          diff: filtered
        });
      }
    } else {
      prevState = current;
      Logger.logAction({
        storeName: config.name,
        snapshot: current
      });
    }
  };
  const listener = () => {
    const state = truncateValue(config.getState(), 50, 0, maxDepth);
    pendingState = state;
    const now = Date.now();
    if (now - lastLogTime >= throttleMs) {
      if (throttleTimer) {
        clearTimeout(throttleTimer);
        throttleTimer = null;
      }
      flush();
    } else if (!throttleTimer) {
      throttleTimer = setTimeout(flush, throttleMs);
    }
  };
  const unsubscribe = config.subscribe(listener);
  return () => {
    unsubscribe();
    if (throttleTimer) clearTimeout(throttleTimer);
  };
}
export function createReduxMiddleware(options) {
  const config = {
    ...DEFAULT_CONFIG,
    ...options
  };
  const name = options?.name || 'Redux';
  return store => next => action => {
    const shouldIgnore = (config.ignoreActions || []).some(pattern => {
      if (pattern.endsWith('*')) {
        return action.type?.startsWith(pattern.slice(0, -1));
      }
      return action.type === pattern;
    });
    if (shouldIgnore) return next(action);
    if (config.includeActions && config.includeActions.length > 0 && !config.includeActions.includes(action.type)) {
      return next(action);
    }
    const prevState = store.getState();
    const result = next(action);
    const nextState = store.getState();
    const maxDepth = config.maxDepth ?? 3;
    const snapshotMode = config.mode === 'snapshot';
    if (snapshotMode) {
      Logger.logAction({
        storeName: name,
        actionType: action.type,
        actionPayload: action.payload,
        snapshot: truncateValue(nextState, 50, 0, maxDepth)
      });
    } else {
      const diff = computeDiff(prevState, nextState, config.ignoreStateKeys);
      if (Object.keys(diff).length > 0) {
        const snapshotSize = JSON.stringify({
          prevState,
          nextState
        })?.length || 0;
        const useDiff = snapshotSize > 100 * 1024;
        Logger.logAction({
          storeName: name,
          actionType: action.type,
          actionPayload: action.payload,
          diff: useDiff ? undefined : diff,
          snapshot: useDiff ? truncateValue(nextState, 50, 0, maxDepth) : undefined
        });
      }
    }
    return result;
  };
}
export function createZustandMonitor(storeOrApi, options) {
  const config = {
    ...DEFAULT_CONFIG,
    ...options
  };
  const name = options?.name || 'Zustand';
  const getState = () => {
    if (typeof storeOrApi === 'function' && storeOrApi.getState) {
      return storeOrApi.getState();
    }
    if (storeOrApi.getState) return storeOrApi.getState();
    return {};
  };
  const subscribe = fn => {
    if (typeof storeOrApi === 'function' && storeOrApi.subscribe) {
      return storeOrApi.subscribe(fn);
    }
    if (storeOrApi.subscribe) return storeOrApi.subscribe(fn);
    return () => {};
  };
  return subscribeToState({
    name,
    getState,
    subscribe,
    mode: config.mode,
    throttleMs: config.throttleMs,
    maxDepth: config.maxDepth,
    ignoreStateKeys: config.ignoreStateKeys,
    includeStateKeys: config.includeStateKeys
  });
}
//# sourceMappingURL=StateMonitor.js.map