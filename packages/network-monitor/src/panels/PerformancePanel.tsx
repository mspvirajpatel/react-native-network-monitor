import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import styleSheet, { type ThemeColors } from '../DebugMonitorStyles';
import type { Translation } from '../translations';
import type { FpsStats } from '../PerformanceMonitor';
import { startPerformanceMonitor, stopPerformanceMonitor } from '../PerformanceMonitor';

interface PerformancePanelProps {
  fpsStats: FpsStats | null;
  perfRunning: boolean;
  C: ThemeColors;
  t: Translation;
  onTogglePerf: (running: boolean) => void;
}

/**
 * PerformancePanel
 *
 * Displays real-time FPS metrics, history chart, and toggle control.
 */
const PerformancePanel: React.FC<PerformancePanelProps> = ({
  fpsStats,
  perfRunning,
  C,
  t,
  onTogglePerf,
}) => {
  const styles = styleSheet(C);
  const fps = fpsStats;
  const fpsPercent = fps ? Math.min((fps.fps / 60) * 100, 100) : 0;
  const barColor = !fps ? C.textDim : fps.fps >= 55 ? C.success : fps.fps >= 30 ? C.warning : C.error;
  const fpsLabel = !fps ? '--' : `${fps.fps}`;

  return (
    <ScrollView style={styles.perfContainer}>
      <View style={styles.perfToggle}>
        <Text style={styles.perfToggleText}>
          {perfRunning ? t.fpsMonitorActive : t.fpsMonitorOff}
        </Text>
        <TouchableOpacity
          accessibilityRole="switch"
          accessibilityState={{ checked: perfRunning }}
          accessibilityLabel="Toggle FPS monitor"
          style={[
            styles.toggleTrack,
            perfRunning ? styles.toggleTrackActive : styles.toggleTrackInactive
          ]}
          onPress={() => {
            if (perfRunning) {
              stopPerformanceMonitor();
              onTogglePerf(false);
            } else {
              startPerformanceMonitor();
              onTogglePerf(true);
            }
          }}
        >
          <View style={[styles.toggleThumb, { alignSelf: perfRunning ? 'flex-end' : 'flex-start' }]} />
        </TouchableOpacity>
      </View>

      <View style={styles.perfCard}>
        <View style={styles.perfRow}>
          <Text style={styles.perfLabel}>{t.currentFps}</Text>
          <Text style={[styles.perfValue, !fps ? {} : fps.fps >= 55 ? styles.perfValueGood : fps.fps >= 30 ? styles.perfValueWarning : styles.perfValueError]}>
            {fpsLabel}
          </Text>
        </View>
        <View style={styles.fpsBar}>
          <View style={[styles.fpsBarFill, { width: `${fpsPercent}%`, backgroundColor: barColor }]} />
        </View>
      </View>

      {fps && (
        <>
          <View style={styles.perfCard}>
            <View style={styles.perfRow}>
              <Text style={styles.perfLabel}>{t.averageFps}</Text>
              <Text style={styles.perfValue}>{fps.averageFps}</Text>
            </View>
            <View style={styles.perfRow}>
              <Text style={styles.perfLabel}>{t.minFps}</Text>
              <Text style={[styles.perfValue, fps.minFps < 30 ? styles.perfValueError : styles.perfValueGood]}>{fps.minFps}</Text>
            </View>
            <View style={styles.perfRow}>
              <Text style={styles.perfLabel}>{t.maxFps}</Text>
              <Text style={styles.perfValue}>{fps.maxFps}</Text>
            </View>
            <View style={styles.perfRow}>
              <Text style={styles.perfLabel}>{t.droppedFrames}</Text>
              <Text style={[styles.perfValue, fps.droppedFrames > 10 ? styles.perfValueWarning : styles.perfValueGood]}>{fps.droppedFrames}</Text>
            </View>
          </View>

          <View style={styles.perfCard}>
            <Text style={styles.perfLabel}>{t.fpsHistory}</Text>
            <View style={{ height: 80, flexDirection: 'row', alignItems: 'flex-end', gap: 1, marginTop: 12 }}>
              {fps.history.length > 0 ? fps.history.map((value: number, i: number) => {
                const barHeight = Math.max(4, (value / 60) * 80);
                return (
                  <View
                    key={i}
                    style={{
                      flex: 1,
                      height: barHeight,
                      backgroundColor: value >= 55 ? C.success : value >= 30 ? C.warning : C.error,
                      borderRadius: 1,
                      opacity: 0.5 + (i / fps.history.length) * 0.5
                    }}
                  />
                );
              }) : (
                <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ color: C.textDim, fontSize: 10 }}>Collecting data...</Text>
                </View>
              )}
            </View>
          </View>
        </>
      )}

      {!fps && (
        <View style={styles.perfCard}>
          <Text style={[styles.perfLabel, { textAlign: 'center', marginVertical: 20 }]}>
            {t.fpsEmpty}
          </Text>
        </View>
      )}

      <View style={{ height: 60 }} />
    </ScrollView>
  );
};

export default PerformancePanel;
