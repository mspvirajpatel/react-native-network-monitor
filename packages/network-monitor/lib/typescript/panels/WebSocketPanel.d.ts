import React from 'react';
import { type ThemeColors } from '../DebugMonitorStyles';
import type { Translation } from '../translations';
import type { LogEntry } from '../Logger';
interface WebSocketPanelProps {
    logs: LogEntry[];
    C: ThemeColors;
    t: Translation;
}
/**
 * WebSocketPanel
 *
 * Displays WebSocket connection events (open, close, message, error)
 * in a scrollable list with color-coded badges.
 */
declare const WebSocketPanel: React.FC<WebSocketPanelProps>;
export default WebSocketPanel;
//# sourceMappingURL=WebSocketPanel.d.ts.map