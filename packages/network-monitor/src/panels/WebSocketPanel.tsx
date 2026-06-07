import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import LogItemAnimated from '../LogItemAnimated';
import styleSheet, { type ThemeColors } from '../DebugMonitorStyles';
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
const WebSocketPanel: React.FC<WebSocketPanelProps> = ({ logs, C, t }) => {
  const styles = styleSheet(C);
  const wsLogs = logs.filter((l: LogEntry) => l.type === 'websocket');

  if (wsLogs.length === 0) {
    return (
      <View style={styles.wsContainer}>
        <View style={[styles.perfCard, { alignItems: 'center', padding: 40 }]}>
          <Text style={{ fontSize: 32, marginBottom: 12 }}>🔌</Text>
          <Text style={[styles.perfLabel, { textAlign: 'center', marginBottom: 4 }]}>{t.noWebSocketActivity}</Text>
          <Text style={[styles.perfLabel, { color: C.textSubtle, fontSize: 10, textAlign: 'center' }]}>
            {t.wsSubtitle}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <ScrollView style={styles.wsContainer}>
      {wsLogs.map((log) => {
        const isOpen = log.message?.includes('OPEN');
        const isClose = log.message?.includes('CLOSE');
        const isError = log.message?.includes('ERROR');
        const badgeColor = isOpen ? C.success : isClose ? C.textDim : isError ? C.error : C.secondary;

        return (
          <LogItemAnimated key={log.id}>
            <View
              style={styles.wsItem}
              accessibilityRole="summary"
              accessibilityLabel={`WebSocket ${isOpen ? 'open' : isClose ? 'close' : isError ? 'error' : 'message'}: ${log.url || ''}`}
            >
              <View style={styles.wsHeader}>
                <View style={[styles.wsBadge, { backgroundColor: badgeColor + '20' }]}>
                  <Text style={[styles.wsBadgeText, { color: badgeColor }]}>
                    {isOpen ? t.wsOpen : isClose ? t.wsClose : isError ? t.wsError : t.wsMsg}
                  </Text>
                </View>
                <Text style={styles.wsUrl} numberOfLines={1}>{log.url}</Text>
                <Text style={styles.wsTime}>
                  {new Date(log.timestamp).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </Text>
              </View>
              {log.message && (
                <Text style={styles.wsMessage} numberOfLines={3}>{log.message}</Text>
              )}
              {log.requestData && (
                <View style={[styles.jsonBox, { marginTop: 8, padding: 10 }]}>
                  <Text style={styles.jsonText} numberOfLines={5}>
                    {typeof log.requestData === 'string' ? log.requestData : JSON.stringify(log.requestData, null, 2)}
                  </Text>
                </View>
              )}
            </View>
          </LogItemAnimated>
        );
      })}
      <View style={{ height: 40 }} />
    </ScrollView>
  );
};

export default WebSocketPanel;
