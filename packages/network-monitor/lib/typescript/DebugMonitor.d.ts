import React from 'react';
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
    language?: 'az' | 'en' | 'ru' | 'tr' | 'auto';
    theme?: 'light' | 'dark' | 'auto';
}
export type TabType = 'ALL' | 'NETWORK' | 'LOGS' | 'SETTINGS';
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
export declare const DebugMonitor: ({ onClose, envConfig, onBaseUrlChange, baseUrls, prodUrl, testUrl, language, theme }: DebugMonitorProps) => React.JSX.Element;
export {};
//# sourceMappingURL=DebugMonitor.d.ts.map