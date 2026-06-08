import { Logger } from './Logger';
let intervalId = null;
let isRunning = false;
let subscribers = [];
let memHistory = [];
let minUsage = Infinity;
let maxUsage = 0;
let totalSamples = 0;
let supported = true;

/** Check whether performance.memory is available in this runtime. */
const isMemoryApiAvailable = () => {
  try {
    const m = performance.memory;
    return !!(m && typeof m.usedJSHeapSize === 'number');
  } catch {
    return false;
  }
};

/** Poll memory stats and notify subscribers. */
const poll = () => {
  if (!isRunning) return;
  let usedJSHeapSize = 0;
  let totalJSHeapSize = 0;
  let jsHeapSizeLimit = 0;
  let canMeasure = supported;
  if (canMeasure) {
    try {
      const m = performance.memory;
      if (m && typeof m.usedJSHeapSize === 'number') {
        usedJSHeapSize = m.usedJSHeapSize;
        totalJSHeapSize = m.totalJSHeapSize || 0;
        jsHeapSizeLimit = m.jsHeapSizeLimit || 0;
      } else {
        canMeasure = false;
      }
    } catch {
      canMeasure = false;
    }
  }
  if (!canMeasure) {
    supported = false;
    // Fallback: estimate based on approximate allocation tracking
    usedJSHeapSize = 0;
    totalJSHeapSize = 0;
  }
  const usageMB = usedJSHeapSize / (1024 * 1024);
  const totalMB = totalJSHeapSize / (1024 * 1024);
  const usagePercent = totalJSHeapSize > 0 ? usedJSHeapSize / totalJSHeapSize * 100 : 0;
  if (usedJSHeapSize > 0) {
    memHistory.push(usageMB);
    if (memHistory.length > 60) memHistory.shift();
    if (usageMB < minUsage) minUsage = usageMB;
    if (usageMB > maxUsage) maxUsage = usageMB;
    totalSamples++;
  }
  const averageUsage = totalSamples > 0 ? memHistory.reduce((a, b) => a + b, 0) / memHistory.length : 0;
  const stats = {
    usedJSHeapSize,
    totalJSHeapSize,
    jsHeapSizeLimit,
    usagePercent,
    minUsage: minUsage === Infinity ? 0 : minUsage,
    maxUsage,
    averageUsage,
    history: [...memHistory],
    supported
  };
  subscribers.forEach(s => s(stats));

  // Log to Logger when usage spikes over 80%
  if (usedJSHeapSize > 0 && totalJSHeapSize > 0 && usagePercent > 80) {
    Logger.logPerformance({
      fps: 60,
      jsHeapSize: usedJSHeapSize,
      jsHeapLimit: jsHeapSizeLimit
    });
  }
};
export const startMemoryMonitor = () => {
  if (isRunning) return;
  isRunning = true;
  supported = isMemoryApiAvailable();
  memHistory = [];
  minUsage = Infinity;
  maxUsage = 0;
  totalSamples = 0;
  intervalId = setInterval(poll, 1000);
};
export const stopMemoryMonitor = () => {
  isRunning = false;
  if (intervalId !== null) {
    clearInterval(intervalId);
    intervalId = null;
  }
};
export const subscribeToMemory = cb => {
  subscribers.push(cb);
  return () => {
    subscribers = subscribers.filter(s => s !== cb);
  };
};
export const isMemoryMonitorRunning = () => isRunning;
export const isMemoryApiSupported = () => supported;

/**
 * destroyMemoryMonitor
 *
 * Stop the monitor, clear all subscribers, and reset state.
 */
export const destroyMemoryMonitor = () => {
  stopMemoryMonitor();
  subscribers = [];
  memHistory = [];
  minUsage = Infinity;
  maxUsage = 0;
  totalSamples = 0;
};
//# sourceMappingURL=MemoryMonitor.js.map