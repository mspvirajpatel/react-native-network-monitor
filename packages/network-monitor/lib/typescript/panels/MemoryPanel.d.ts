import React from 'react';
import { type ThemeColors } from '../DebugMonitorStyles';
import type { Translation } from '../translations';
import type { MemStats } from '../MemoryMonitor';
interface MemoryPanelProps {
    memStats: MemStats | null;
    memRunning: boolean;
    C: ThemeColors;
    t: Translation;
    onToggleMem: (running: boolean) => void;
}
/**
 * MemoryPanel
 *
 * Displays heap memory metrics, usage history bar chart, and toggle control.
 */
declare const MemoryPanel: React.FC<MemoryPanelProps>;
export default MemoryPanel;
//# sourceMappingURL=MemoryPanel.d.ts.map