import React from 'react';
import { type ThemeColors } from '../DebugMonitorStyles';
import type { Translation } from '../translations';
import type { FpsStats } from '../PerformanceMonitor';
interface PerformancePanelProps {
    fpsStats: FpsStats | null;
    perfRunning: boolean;
    C: ThemeColors;
    t: Translation;
    onTogglePerf: (running: boolean) => void;
}
/**
 * PerformancePanel
 *
 * Displays real-time FPS metrics, history chart, and toggle control.
 */
declare const PerformancePanel: React.FC<PerformancePanelProps>;
export default PerformancePanel;
//# sourceMappingURL=PerformancePanel.d.ts.map