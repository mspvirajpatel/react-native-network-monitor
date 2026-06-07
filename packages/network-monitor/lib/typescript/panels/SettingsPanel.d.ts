import React from 'react';
import { type ThemeColors } from '../DebugMonitorStyles';
import type { Translation } from '../translations';
import type { LogEntry } from '../Logger';
import type { DeviceInfoData } from '../DeviceInfo';
interface SettingsPanelProps {
    baseUrls?: string[] | {
        title: string;
        url: string;
    }[];
    prodUrl?: string;
    testUrl?: string;
    envConfig?: {
        currentEnv: string;
        onEnvChange: (newEnv: 'demo' | 'prod') => void;
    };
    onBaseUrlChange?: (newUrl: string) => void;
    C: ThemeColors;
    t: Translation;
    baseUrl: string;
    manualUrl: string;
    selectedTheme: 'light' | 'dark' | 'auto';
    logs: LogEntry[];
    deviceInfo: DeviceInfoData;
    onSetBaseUrl: (url: string) => void;
    onSetManualUrl: (url: string) => void;
    onSetSelectedTheme: (theme: 'light' | 'dark' | 'auto') => void;
    showError: (msg: string) => void;
    showSuccess: (msg: string) => void;
}
/**
 * SettingsPanel
 *
 * Environment selection, custom URL management, theme toggles,
 * device info, and advanced tools (export, wipe).
 */
declare const SettingsPanel: React.FC<SettingsPanelProps>;
export default SettingsPanel;
//# sourceMappingURL=SettingsPanel.d.ts.map