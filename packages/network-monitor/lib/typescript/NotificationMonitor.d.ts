export interface NotificationData {
    id: string;
    title?: string;
    body?: string;
    data?: Record<string, unknown>;
    badge?: number;
    sound?: string;
    category?: string;
    threadId?: string;
    timestamp: string;
    source: 'local' | 'remote' | 'unknown';
}
/**
 * logNotification
 *
 * Manually log a notification event. Call this from your notification handler
 * to capture push/local notifications in the debug monitor.
 */
export declare const logNotification: (notification: Omit<NotificationData, "id" | "timestamp">) => void;
/**
 * setupNotificationMonitor
 *
 * Patches the global notification handlers to intercept push/local notifications.
 * Requires react-native-push-notification or expo-notifications to be installed.
 * If neither is available, it provides a manual logging API via logNotification().
 */
export declare const setupNotificationMonitor: () => void;
/**
 * destroyNotificationMonitor
 *
 * Clean up notification listeners.
 */
export declare const destroyNotificationMonitor: () => void;
/**
 * getNotificationHistory
 *
 * Returns the current notification history.
 */
export declare const getNotificationHistory: () => NotificationData[];
/**
 * clearNotificationHistory
 *
 * Clear all stored notifications.
 */
export declare const clearNotificationHistory: () => void;
/**
 * subscribeToNotifications
 *
 * Subscribe to notification updates.
 */
export declare const subscribeToNotifications: (listener: (notifications: NotificationData[]) => void) => () => void;
/**
 * isNotificationMonitorPatched
 */
export declare const isNotificationMonitorPatched: () => boolean;
//# sourceMappingURL=NotificationMonitor.d.ts.map