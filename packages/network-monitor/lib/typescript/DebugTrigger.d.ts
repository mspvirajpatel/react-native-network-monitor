import React, { ReactNode } from "react";
import { type ThemeColors } from "./DebugMonitorStyles";
import { type LanguageCode } from "./translations";
export interface DebugTriggerProps {
    children?: ReactNode;
    password?: string;
    passwordFrequency?: "all-time" | "per-install" | "app-active";
    passwordOptional?: boolean;
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
    enableTapGesture?: boolean;
    floatingButtonMargin?: number;
    checkAccess?: () => boolean | Promise<boolean>;
    language?: LanguageCode;
    theme?: "light" | "dark" | "auto";
    colors?: Partial<ThemeColors>;
    onOpen?: () => void;
    onClose?: () => void;
    floatingButtonContent?: ReactNode;
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
 * @param language - Language for the monitor UI (use 'auto' to detect from device)
 * @returns The wrapped children and the debug monitor when triggered
 */
export declare const DebugTrigger: ({ children, password, passwordFrequency, passwordOptional, enableShake, clicksNeeded, isDemo, onEnvChange, onBaseUrlChange, baseUrls, prodUrl, testUrl, enabled, enableTapGesture, floatingButtonMargin, checkAccess, language, theme, colors: customColors, onOpen, onClose: onCloseProp, floatingButtonContent, }: DebugTriggerProps) => React.JSX.Element;
//# sourceMappingURL=DebugTrigger.d.ts.map