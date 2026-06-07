import React from 'react';
import { View, Text, TouchableOpacity, FlatList } from 'react-native';
import LogItemAnimated from '../LogItemAnimated';
import styleSheet, { type ThemeColors } from '../DebugMonitorStyles';
import type { Translation } from '../translations';
import type { LogEntry } from '../Logger';

interface StorePanelProps {
  logs: LogEntry[];
  C: ThemeColors;
  t: Translation;
  LOG_ITEM_HEIGHT: number;
  onSelectLog: (log: LogEntry) => void;
}

/**
 * StorePanel
 *
 * Displays state store action logs (Redux, Zustand, etc.)
 * with diff/snapshot information per entry.
 */
const StorePanel: React.FC<StorePanelProps> = ({
  logs,
  C,
  t,
  LOG_ITEM_HEIGHT,
  onSelectLog,
}) => {
  const styles = styleSheet(C);
  const storeLogs = logs.filter((l: LogEntry) => l.type === 'action');

  if (storeLogs.length === 0) {
    return (
      <View style={styles.wsContainer}>
        <View style={[styles.perfCard, { alignItems: 'center', padding: 40 }]}>
          <Text style={{ fontSize: 32, marginBottom: 12 }}>🗄️</Text>
          <Text style={[styles.perfLabel, { textAlign: 'center', marginBottom: 4 }]}>{t.noStoreActivity}</Text>
          <Text style={[styles.perfLabel, { color: C.textSubtle, fontSize: 10, textAlign: 'center' }]}>
            {t.storeSubtitle}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.wsContainer}>
      <FlatList
        data={storeLogs}
        renderItem={({ item }: { item: LogEntry }) => {
          const sd = item.stateData;
          const hasDiff = sd?.diff && Object.keys(sd.diff).length > 0;
          const changedKeys = hasDiff ? Object.keys(sd!.diff!).join(', ') : null;
          return (
            <LogItemAnimated>
              <TouchableOpacity
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel={`Store action: ${sd?.actionType || 'state change'} from ${sd?.storeName || 'Store'}`}
                style={styles.logItem}
                onPress={() => onSelectLog(item)}
              >
                <View style={[styles.logIndicator, { backgroundColor: C.secondary }]} />
                <View style={styles.logBody}>
                  <View style={styles.logRow}>
                    <View style={[styles.logChip, { backgroundColor: C.secondary + '18' }]}>
                      <Text style={[styles.logChipText, { color: C.secondary }]}>
                        {sd?.actionType ? sd.actionType : t.action}
                      </Text>
                    </View>
                    <Text style={styles.logTime}>
                      {new Date(item.timestamp).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </Text>
                  </View>
                  <Text style={styles.logUrl} numberOfLines={2}>
                    [{sd?.storeName || 'Store'}] {sd?.actionType || t.state}
                  </Text>
                  {changedKeys ? (
                    <View style={styles.logMetaBox}>
                      <View style={styles.metaBadge}>
                        <Text style={styles.logMeta}>{t.changedKeys}: {changedKeys}</Text>
                      </View>
                    </View>
                  ) : sd?.snapshot ? (
                    <View style={styles.logMetaBox}>
                      <View style={styles.metaBadge}>
                        <Text style={styles.logMeta}>{t.snapshot}</Text>
                      </View>
                    </View>
                  ) : null}
                </View>
              </TouchableOpacity>
            </LogItemAnimated>
          );
        }}
        keyExtractor={(item: LogEntry) => item.id}
        getItemLayout={(_data, index) => ({
          length: LOG_ITEM_HEIGHT,
          offset: LOG_ITEM_HEIGHT * index,
          index,
        })}
        contentContainerStyle={[styles.listContent, storeLogs.length === 0 && { flex: 1 }]}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>🗄️</Text>
            <Text style={styles.emptyText}>{t.noStoreActivity}</Text>
            <Text style={styles.emptySubText}>{t.storeSubtitle}</Text>
          </View>
        }
      />
    </View>
  );
};

export default StorePanel;
