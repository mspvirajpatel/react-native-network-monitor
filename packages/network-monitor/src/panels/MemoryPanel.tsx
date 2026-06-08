import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import styleSheet, { type ThemeColors } from '../DebugMonitorStyles';
import type { Translation } from '../translations';
import type { MemStats } from '../MemoryMonitor';
import { startMemoryMonitor, stopMemoryMonitor } from '../MemoryMonitor';

interface MemoryPanelProps {
  memStats: MemStats | null;
  memRunning: boolean;
  C: ThemeColors;
  t: Translation;
  onToggleMem: (running: boolean) => void;
}

/**
 * MemoryPanel
 *
 * Displays heap memory metrics, usage history bar chart, and toggle control.
 */
const MemoryPanel: React.FC<MemoryPanelProps> = ({
  memStats,
  memRunning,
  C,
  t,
  onToggleMem,
}) => {
  const styles = styleSheet(C);
  const stats = memStats;
  const usagePercent = stats ? Math.min(stats.usagePercent, 100) : 0;
  const barColor = !stats
    ? C.textDim
    : usagePercent > 80
      ? C.error
      : usagePercent > 50
        ? C.warning
        : C.success;

  const formatMB = (bytes: number): string => {
    const mb = bytes / (1024 * 1024);
    return mb >= 10 ? mb.toFixed(1) : mb.toFixed(2);
  };

  const formatPercent = (pct: number): string => {
    return `${pct.toFixed(1)}%`;
  };

  return (
    <ScrollView style={styles.perfContainer}>
      <View style={styles.perfToggle}>
        <Text style={styles.perfToggleText}>
          {memRunning ? t.memoryMonitorActive : t.memoryMonitorOff}
        </Text>
        <TouchableOpacity
          accessibilityRole="switch"
          accessibilityState={{ checked: memRunning }}
          accessibilityLabel="Toggle memory monitor"
          style={[
            styles.toggleTrack,
            memRunning ? styles.toggleTrackActive : styles.toggleTrackInactive,
          ]}
          onPress={() => {
            if (memRunning) {
              stopMemoryMonitor();
              onToggleMem(false);
            } else {
              startMemoryMonitor();
              onToggleMem(true);
            }
          }}
        >
          <View
            style={[
              styles.toggleThumb,
              { alignSelf: memRunning ? 'flex-end' : 'flex-start' },
            ]}
          />
        </TouchableOpacity>
      </View>

      <View style={styles.perfCard}>
        <View style={styles.perfRow}>
          <Text style={styles.perfLabel}>{t.currentMemory}</Text>
          <Text
            style={[
              styles.perfValue,
              !stats
                ? {}
                : usagePercent > 80
                  ? styles.perfValueError
                  : usagePercent > 50
                    ? styles.perfValueWarning
                    : styles.perfValueGood,
            ]}
          >
            {stats
              ? `${formatMB(stats.usedJSHeapSize)} MB`
              : '--'}
          </Text>
        </View>
        {stats && (
          <>
            <View style={styles.perfRow}>
              <Text style={styles.perfLabel}>Total</Text>
              <Text style={styles.perfValue}>
                {formatMB(stats.totalJSHeapSize)} MB
              </Text>
            </View>
            <View style={styles.perfRow}>
              <Text style={styles.perfLabel}>Usage</Text>
              <Text
                style={[
                  styles.perfValue,
                  usagePercent > 80
                    ? styles.perfValueError
                    : usagePercent > 50
                      ? styles.perfValueWarning
                      : styles.perfValueGood,
                ]}
              >
                {formatPercent(usagePercent)}
              </Text>
            </View>
          </>
        )}
        <View style={[styles.fpsBar, { marginTop: 8 }]}>
          <View
            style={[
              styles.fpsBarFill,
              { width: `${usagePercent}%`, backgroundColor: barColor },
            ]}
          />
        </View>
      </View>

      {stats && (
        <>
          <View style={styles.perfCard}>
            <View style={styles.perfRow}>
              <Text style={styles.perfLabel}>{t.averageMemory}</Text>
              <Text style={styles.perfValue}>
                {formatMB(
                  stats.history.reduce((a, b) => a + b, 0) /
                    Math.max(stats.history.length, 1)
                )}{' '}
                MB
              </Text>
            </View>
            <View style={styles.perfRow}>
              <Text style={styles.perfLabel}>{t.minMemory}</Text>
              <Text style={styles.perfValue}>{stats.minUsage.toFixed(1)} MB</Text>
            </View>
            <View style={styles.perfRow}>
              <Text style={styles.perfLabel}>{t.maxMemory}</Text>
              <Text style={[styles.perfValue, stats.maxUsage > 200 ? styles.perfValueWarning : styles.perfValueGood]}>
                {stats.maxUsage.toFixed(1)} MB
              </Text>
            </View>
          </View>

          <View style={styles.perfCard}>
            <Text style={styles.perfLabel}>{t.memoryHistory}</Text>
            <View
              style={{
                height: 80,
                flexDirection: 'row',
                alignItems: 'flex-end',
                gap: 1,
                marginTop: 12,
              }}
            >
              {stats.history.length > 0 ? (
                stats.history.map((value: number, i: number) => {
                  const maxVal = Math.max(...stats.history, 1);
                  const barHeight = Math.max(4, (value / maxVal) * 80);
                  const usagePct = maxVal > 0 ? (value / maxVal) * 100 : 0;
                  return (
                    <View
                      key={i}
                      style={{
                        flex: 1,
                        height: barHeight,
                        backgroundColor:
                          usagePct > 80
                            ? C.error
                            : usagePct > 50
                              ? C.warning
                              : C.success,
                        borderRadius: 1,
                        opacity: 0.5 + (i / stats.history.length) * 0.5,
                      }}
                    />
                  );
                })
              ) : (
                <View
                  style={{
                    flex: 1,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Text style={{ color: C.textDim, fontSize: 10 }}>
                    Collecting data...
                  </Text>
                </View>
              )}
            </View>
          </View>
        </>
      )}

      {!stats && (
        <View style={styles.perfCard}>
          <Text
            style={[
              styles.perfLabel,
              { textAlign: 'center', marginVertical: 20 },
            ]}
          >
            {t.memoryEmpty}
          </Text>
        </View>
      )}

      {stats && !stats.supported && (
        <View style={styles.perfCard}>
          <Text
            style={[
              styles.perfLabel,
              { textAlign: 'center', marginVertical: 20, color: C.warning },
            ]}
          >
            {t.memoryNotSupported}
          </Text>
        </View>
      )}

      <View style={{ height: 60 }} />
    </ScrollView>
  );
};

export default MemoryPanel;
