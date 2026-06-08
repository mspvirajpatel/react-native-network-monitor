import React from 'react';
import { type ThemeColors } from '../DebugMonitorStyles';
import type { Translation } from '../translations';
import type { LogEntry } from '../Logger';
interface TimelinePanelProps {
    logs: LogEntry[];
    C: ThemeColors;
    t: Translation;
    enabled: boolean;
    onToggle: () => void;
}
/**
 * TimelinePanel
 *
 * Waterfall view of network request timing. Each request is rendered as a
 * horizontal bar whose start offset and width are proportional to the
 * request's timing within the visible time window.
 */
declare const TimelinePanel: React.FC<TimelinePanelProps>;
export default TimelinePanel;
//# sourceMappingURL=TimelinePanel.d.ts.map