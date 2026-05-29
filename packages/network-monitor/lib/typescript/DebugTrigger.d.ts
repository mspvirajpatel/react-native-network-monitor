import React, { ReactNode } from "react";
export interface DebugTriggerProps {
    children?: ReactNode;
    password?: string;
    passwordFrequency?: "all-time" | "per-install" | "app-active";
    enableShake?: boolean;
    clicksNeeded?: number;
    isDemo?: boolean;
    onEnvChange?: (newEnv: "demo" | "prod") => void;
    onBaseUrlChange?: (newUrl: string) => void;
    baseUrls?: string[] | {
        title: string;
        url: string;
    }[];
    prodUrl?: string;
    testUrl?: string;
    enabled?: boolean;
    checkAccess?: () => boolean | Promise<boolean>;
    language?: "az" | "en" | "ru" | "tr" | "auto";
    theme?: "light" | "dark" | "auto";
}
/**
 * DebugTrigger
 *
 * A component that wraps the app and provides a hidden trigger to open a debug monitor for network requests and logs.
 * It supports password protection, configurable trigger methods, and environment switching.
 *
 * @param children - The child components to wrap
 * @param password - Optional password to protect access to the debug monitor
 * @param passwordFrequency - How often the password should be required ('all-time', 'per-install', 'app-active')
 * @param enableShake - Whether shaking the device should also trigger the monitor
 * @param clicksNeeded - Number of clicks needed to trigger the monitor
 * @param isDemo - Whether the app is in demo mode (affects initial base URL)
 * @param onEnvChange - Callback when environment is changed in the monitor
 * @param onBaseUrlChange - Callback when base URL is changed in the monitor
 * @param baseUrls - List of base URLs for quick switching in the monitor
 * @param prodUrl - Production base URL
 * @param testUrl - Test base URL
 * @param enabled - Whether the trigger is enabled
 * @param checkAccess - Optional function to perform additional access checks before showing the monitor
 * @param language - Language for the monitor UI ('az', 'en', 'ru', 'tr', or 'auto' to detect from device)
 * @returns The wrapped children and the debug monitor when triggered
 */
export declare const DebugTrigger: ({ children, password, passwordFrequency, enableShake, clicksNeeded, isDemo, onEnvChange, onBaseUrlChange, baseUrls, prodUrl, testUrl, enabled, checkAccess, language, theme, }: DebugTriggerProps) => React.JSX.Element;
//# sourceMappingURL=DebugTrigger.d.ts.map