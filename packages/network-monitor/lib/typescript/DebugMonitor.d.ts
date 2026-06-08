import React from 'react';
import { type ThemeColors } from './DebugMonitorStyles';
import { LogEntry } from './Logger';
import { type LanguageCode } from './translations';
interface DebugMonitorProps {
    onClose: () => void;
    envConfig?: {
        currentEnv: string;
        onEnvChange: (newEnv: 'demo' | 'prod') => void;
    };
    onBaseUrlChange?: (newUrl: string) => void;
    baseUrls?: string[] | {
        title: string;
        url: string;
    }[];
    prodUrl?: string;
    testUrl?: string;
    onExitDebugMode?: () => void;
    language?: LanguageCode;
    theme?: 'light' | 'dark' | 'auto';
    colors?: Partial<ThemeColors>;
    features?: {
        network?: boolean;
        console?: boolean;
        websocket?: boolean;
        performance?: boolean;
        memory?: boolean;
        notifications?: boolean;
        navigationFlow?: boolean;
    };
    headerTitle?: string;
    searchPlaceholder?: string;
    maxLogs?: number;
    customActions?: {
        label: string;
        onPress: (log: LogEntry) => void;
    }[];
}
export type TabType = 'ALL' | 'NETWORK' | 'LOGS' | 'WEBSOCKET' | 'PERFORMANCE' | 'MEMORY' | 'STORE' | 'SETTINGS' | 'NOTIFICATIONS' | 'NAVFLOW';
export type DetailTab = 'REQUEST' | 'RESPONSE';
/**
 * DebugMonitor
 *
 * Full-screen debug UI for viewing logs, network requests, and app events.
 * Provides searching, filtering, export and environment/source controls.
 *
 * @param props - Props for DebugMonitor (see `DebugMonitorProps`)
 * @returns JSX.Element
 */
export declare const DebugMonitor: ({ onClose, envConfig, onBaseUrlChange, baseUrls, prodUrl, testUrl, language, theme, colors: customColors, features: featuresProp, headerTitle, searchPlaceholder, maxLogs, customActions }: DebugMonitorProps) => React.JSX.Element;
export {};
//# sourceMappingURL=DebugMonitor.d.ts.map