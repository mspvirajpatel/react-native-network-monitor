import React from 'react';
import { type ThemeColors } from '../DebugMonitorStyles';
import type { Translation } from '../translations';
import type { LogEntry } from '../Logger';
interface StorePanelProps {
    logs: LogEntry[];
    C: ThemeColors;
    t: Translation;
    LOG_ITEM_HEIGHT: number;
    onSelectLog: (log: LogEntry) => void;
}
/**
 * StorePanel
 *
 * Displays state store action logs (Redux, Zustand, etc.)
 * with diff/snapshot information per entry.
 */
declare const StorePanel: React.FC<StorePanelProps>;
export default StorePanel;
//# sourceMappingURL=StorePanel.d.ts.map