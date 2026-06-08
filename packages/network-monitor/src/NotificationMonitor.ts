/* eslint-disable no-unused-vars */
import { Logger } from './Logger';

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

let _isPatched = false;
let _notificationListeners: (() => void)[] = [];
let _notificationHistory: NotificationData[] = [];
let _listeners: ((notifications: NotificationData[]) => void)[] = [];
let _notifyTimeout: ReturnType<typeof setTimeout> | null = null;

const notify = () => {
  if (_notifyTimeout) clearTimeout(_notifyTimeout);
  _notifyTimeout = setTimeout(() => {
    _listeners.forEach((l) => l([..._notificationHistory]));
    _notifyTimeout = null;
  }, 100);
};

/**
 * logNotification
 *
 * Manually log a notification event. Call this from your notification handler
 * to capture push/local notifications in the debug monitor.
 */
export const logNotification = (notification: Omit<NotificationData, 'id' | 'timestamp'>) => {
  const entry: NotificationData = {
    ...notification,
    id: Math.random().toString(36).substring(7),
    timestamp: new Date().toISOString(),
  };
  _notificationHistory.unshift(entry);
  if (_notificationHistory.length > 200) _notificationHistory.pop();

  Logger.logInfo(`[NOTIFICATION] ${notification.title || 'No title'}`, {
    notification: entry,
  });

  notify();
};

/**
 * setupNotificationMonitor
 *
 * Patches the global notification handlers to intercept push/local notifications.
 * Requires react-native-push-notification or expo-notifications to be installed.
 * If neither is available, it provides a manual logging API via logNotification().
 */
export const setupNotificationMonitor = () => {
  if (_isPatched) return;
  _isPatched = true;

  // Try to intercept expo-notifications if available
  try {
    const Notifications = require('expo-notifications');
    if (Notifications?.addNotificationReceivedListener) {
      const sub = Notifications.addNotificationReceivedListener((notification: any) => {
        const content = notification?.request?.content || {};
        logNotification({
          title: content.title,
          body: content.body,
          data: content.data,
          badge: content.badge,
          sound: content.sound,
          category: content.categoryIdentifier,
          threadId: content.threadIdentifier,
          source: 'remote',
        });
      });
      _notificationListeners.push(() => sub?.remove?.());
    }
  } catch {
    // expo-notifications not available
  }

  // Try to intercept react-native-push-notification if available
  try {
    const PushNotification = require('react-native-push-notification');
    if (PushNotification?.configure) {
      PushNotification.configure({
        onNotification: (notification: any) => {
          logNotification({
            title: notification.title,
            body: notification.message,
            data: notification.data,
            badge: notification.badge,
            sound: notification.sound,
            category: notification.category,
            threadId: notification.threadId,
            source: 'remote',
          });
        },
        popInitialNotification: false,
        requestPermissions: false,
      });
    }
  } catch {
    // react-native-push-notification not available
  }
};

/**
 * destroyNotificationMonitor
 *
 * Clean up notification listeners.
 */
export const destroyNotificationMonitor = () => {
  _notificationListeners.forEach((unsub) => unsub());
  _notificationListeners = [];
  _isPatched = false;
};

/**
 * getNotificationHistory
 *
 * Returns the current notification history.
 */
export const getNotificationHistory = (): NotificationData[] => [..._notificationHistory];

/**
 * clearNotificationHistory
 *
 * Clear all stored notifications.
 */
export const clearNotificationHistory = () => {
  _notificationHistory = [];
  notify();
};

/**
 * subscribeToNotifications
 *
 * Subscribe to notification updates.
 */
export const subscribeToNotifications = (listener: (notifications: NotificationData[]) => void) => {
  _listeners.push(listener);
  return () => {
    _listeners = _listeners.filter((l) => l !== listener);
  };
};

/**
 * isNotificationMonitorPatched
 */
export const isNotificationMonitorPatched = () => _isPatched;
