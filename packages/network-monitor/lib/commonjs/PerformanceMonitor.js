"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.subscribeToFps = exports.stopPerformanceMonitor = exports.startPerformanceMonitor = exports.isPerformanceMonitorRunning = exports.getFpsHistory = exports.destroyPerformanceMonitor = void 0;
var _Logger = require("./Logger");
let animationFrameId = null;
let frameCount = 0;
let lastFpsTime = 0;
let isRunning = false;
let subscribers = [];
let fpsHistory = [];
let minFps = 60;
let maxFps = 0;
let totalFrames = 0;
const tick = timestamp => {
  if (!isRunning) return;
  frameCount++;
  totalFrames++;
  if (lastFpsTime === 0) {
    lastFpsTime = timestamp;
  }
  const elapsed = timestamp - lastFpsTime;
  if (elapsed >= 1000) {
    const fps = Math.round(frameCount * 1000 / elapsed);
    const clamped = Math.min(fps, 60);
    fpsHistory.push(clamped);
    if (fpsHistory.length > 60) fpsHistory.shift();
    if (clamped < minFps) minFps = clamped;
    if (clamped > maxFps) maxFps = clamped;
    const averageFps = Math.round(fpsHistory.reduce((a, b) => a + b, 0) / fpsHistory.length);
    const droppedFrames = frameCount - Math.round(elapsed / 16.67);
    const stats = {
      fps: clamped,
      minFps,
      maxFps,
      averageFps,
      droppedFrames: Math.max(0, droppedFrames),
      history: [...fpsHistory]
    };
    subscribers.forEach(s => s(stats));
    if (clamped < 30) {
      _Logger.Logger.logPerformance({
        fps: clamped,
        droppedFrames: Math.max(0, droppedFrames)
      });
    }
    frameCount = 0;
    lastFpsTime = timestamp;
  }
  animationFrameId = requestAnimationFrame(tick);
};
const startPerformanceMonitor = () => {
  if (isRunning) return;
  isRunning = true;
  frameCount = 0;
  lastFpsTime = 0;
  fpsHistory = [];
  minFps = 60;
  maxFps = 0;
  animationFrameId = requestAnimationFrame(tick);
};
exports.startPerformanceMonitor = startPerformanceMonitor;
const stopPerformanceMonitor = () => {
  isRunning = false;
  if (animationFrameId !== null) {
    cancelAnimationFrame(animationFrameId);
    animationFrameId = null;
  }
};
exports.stopPerformanceMonitor = stopPerformanceMonitor;
const subscribeToFps = cb => {
  subscribers.push(cb);
  return () => {
    subscribers = subscribers.filter(s => s !== cb);
  };
};
exports.subscribeToFps = subscribeToFps;
const isPerformanceMonitorRunning = () => isRunning;
exports.isPerformanceMonitorRunning = isPerformanceMonitorRunning;
const getFpsHistory = () => [...fpsHistory];

/**
 * destroyPerformanceMonitor
 *
 * Stop the monitor, clear all subscribers, and reset state.
 * Call when the debugger is fully closed to prevent stale callbacks.
 */
exports.getFpsHistory = getFpsHistory;
const destroyPerformanceMonitor = () => {
  stopPerformanceMonitor();
  subscribers = [];
  fpsHistory = [];
  minFps = 60;
  maxFps = 0;
  totalFrames = 0;
};
exports.destroyPerformanceMonitor = destroyPerformanceMonitor;
//# sourceMappingURL=PerformanceMonitor.js.map