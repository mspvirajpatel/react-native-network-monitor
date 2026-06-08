import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, FlatList } from 'react-native';
import styleSheet, { type ThemeColors } from '../DebugMonitorStyles';
import type { Translation } from '../translations';
import {
  type NotificationData,
  subscribeToNotifications,
  clearNotificationHistory,
  logNotification,
} from '../NotificationMonitor';

interface NotificationPanelProps {
  C: ThemeColors;
  t: Translation;
}

const NotificationPanel: React.FC<NotificationPanelProps> = ({ C, t }) => {
  const styles = styleSheet(C);
  const [notifications, setNotifications] = useState<NotificationData[]>([]);

  useEffect(() => {
    const unsub = subscribeToNotifications(setNotifications);
    return unsub;
  }, []);

  const getSourceColor = (source: string) => {
    switch (source) {
      case 'remote': return C.primary;
      case 'local': return C.secondary;
      default: return C.textDim;
    }
  };

  const formatTime = (ts: string) => {
    return new Date(ts).toLocaleTimeString([], {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  return (
    <ScrollView style={styles.perfContainer}>
      {/* Action buttons */}
      <View style={{ flexDirection: 'row', gap: 8, paddingHorizontal: 10, paddingVertical: 8 }}>
        <TouchableOpacity
          accessibilityRole="button"
          onPress={() => {
            logNotification({
              title: 'Test Notification',
              body: 'This is a test push notification',
              data: { screen: 'Home', action: 'test' },
              source: 'local',
            });
          }}
          style={{
            flex: 1,
            paddingHorizontal: 12,
            paddingVertical: 8,
            borderRadius: 8,
            backgroundColor: C.primary + '20',
            borderWidth: 1,
            borderColor: C.primary + '40',
          }}
        >
          <Text style={{ color: C.primary, fontSize: 11, fontWeight: '700', textAlign: 'center' }}>
            Send Test
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          accessibilityRole="button"
          onPress={clearNotificationHistory}
          style={{
            flex: 1,
            paddingHorizontal: 12,
            paddingVertical: 8,
            borderRadius: 8,
            backgroundColor: C.errorDim || C.error + '20',
            borderWidth: 1,
            borderColor: C.error + '40',
          }}
        >
          <Text style={{ color: C.error, fontSize: 11, fontWeight: '700', textAlign: 'center' }}>
            Clear All
          </Text>
        </TouchableOpacity>
      </View>

      {/* Notification list */}
      {notifications.length === 0 ? (
        <View style={styles.perfCard}>
          <Text style={[styles.perfLabel, { textAlign: 'center', marginVertical: 20 }]}>
            {t.empty || 'No notifications yet'}
          </Text>
          <Text style={{ color: C.textDim, fontSize: 10, textAlign: 'center' }}>
            Notifications will appear here automatically.
            {'\n'}Use logNotification() to add manually.
          </Text>
        </View>
      ) : (
        <View style={{ paddingHorizontal: 10 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <Text style={{ color: C.textDim, fontSize: 10, fontWeight: '700', letterSpacing: 0.5 }}>
              {notifications.length} NOTIFICATION{notifications.length !== 1 ? 'S' : ''}
            </Text>
          </View>
          {notifications.map((notif) => (
            <View
              key={notif.id}
              style={{
                backgroundColor: C.surface,
                borderRadius: 10,
                borderWidth: 1,
                borderColor: C.border,
                padding: 12,
                marginBottom: 8,
              }}
            >
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                    <View style={{ paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, backgroundColor: getSourceColor(notif.source) + '20' }}>
                      <Text style={{ color: getSourceColor(notif.source), fontSize: 9, fontWeight: '700', textTransform: 'uppercase' }}>
                        {notif.source}
                      </Text>
                    </View>
                    <Text style={{ color: C.text, fontSize: 13, fontWeight: '700' }} numberOfLines={1}>
                      {notif.title || 'No Title'}
                    </Text>
                  </View>
                  {notif.body ? (
                    <Text style={{ color: C.textDim, fontSize: 11, marginTop: 2 }} numberOfLines={3}>
                      {notif.body}
                    </Text>
                  ) : null}
                </View>
                <Text style={{ color: C.textDim, fontSize: 9, marginLeft: 8 }}>
                  {formatTime(notif.timestamp)}
                </Text>
              </View>

              {/* Metadata */}
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 4 }}>
                {notif.category ? (
                  <View style={{ paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, backgroundColor: C.accent + '20' }}>
                    <Text style={{ color: C.accent, fontSize: 9, fontWeight: '600' }}>
                      {notif.category}
                    </Text>
                  </View>
                ) : null}
                {notif.badge !== undefined ? (
                  <View style={{ paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, backgroundColor: C.warning + '20' }}>
                    <Text style={{ color: C.warning, fontSize: 9, fontWeight: '600' }}>
                      Badge: {notif.badge}
                    </Text>
                  </View>
                ) : null}
                {notif.sound ? (
                  <View style={{ paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, backgroundColor: C.success + '20' }}>
                    <Text style={{ color: C.success, fontSize: 9, fontWeight: '600' }}>
                      Sound: {notif.sound}
                    </Text>
                  </View>
                ) : null}
              </View>

              {/* Data payload */}
              {notif.data && Object.keys(notif.data).length > 0 ? (
                <View style={{ marginTop: 8, backgroundColor: C.background, borderRadius: 6, padding: 8 }}>
                  <Text style={{ color: C.textDim, fontSize: 9, fontWeight: '700', marginBottom: 4 }}>DATA</Text>
                  <Text selectable style={{ color: C.success, fontSize: 10, fontFamily: 'Courier' }}>
                    {JSON.stringify(notif.data, null, 2)}
                  </Text>
                </View>
              ) : null}
            </View>
          ))}
        </View>
      )}

      <View style={{ height: 60 }} />
    </ScrollView>
  );
};

export default NotificationPanel;
