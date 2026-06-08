"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.subscribeToMemory = exports.stopMemoryMonitor = exports.startMemoryMonitor = exports.isMemoryMonitorRunning = exports.isMemoryApiSupported = exports.destroyMemoryMonitor = void 0;
var _Logger = require("./Logger");
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
    _Logger.Logger.logPerformance({
      fps: 60,
      jsHeapSize: usedJSHeapSize,
      jsHeapLimit: jsHeapSizeLimit
    });
  }
};
const startMemoryMonitor = () => {
  if (isRunning) return;
  isRunning = true;
  supported = isMemoryApiAvailable();
  memHistory = [];
  minUsage = Infinity;
  maxUsage = 0;
  totalSamples = 0;
  intervalId = setInterval(poll, 1000);
};
exports.startMemoryMonitor = startMemoryMonitor;
const stopMemoryMonitor = () => {
  isRunning = false;
  if (intervalId !== null) {
    clearInterval(intervalId);
    intervalId = null;
  }
};
exports.stopMemoryMonitor = stopMemoryMonitor;
const subscribeToMemory = cb => {
  subscribers.push(cb);
  return () => {
    subscribers = subscribers.filter(s => s !== cb);
  };
};
exports.subscribeToMemory = subscribeToMemory;
const isMemoryMonitorRunning = () => isRunning;
exports.isMemoryMonitorRunning = isMemoryMonitorRunning;
const isMemoryApiSupported = () => supported;

/**
 * destroyMemoryMonitor
 *
 * Stop the monitor, clear all subscribers, and reset state.
 */
exports.isMemoryApiSupported = isMemoryApiSupported;
const destroyMemoryMonitor = () => {
  stopMemoryMonitor();
  subscribers = [];
  memHistory = [];
  minUsage = Infinity;
  maxUsage = 0;
  totalSamples = 0;
};
exports.destroyMemoryMonitor = destroyMemoryMonitor;
//# sourceMappingURL=MemoryMonitor.js.map