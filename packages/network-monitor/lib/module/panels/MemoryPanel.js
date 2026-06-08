import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import styleSheet from '../DebugMonitorStyles';
import { startMemoryMonitor, stopMemoryMonitor } from '../MemoryMonitor';
/**
 * MemoryPanel
 *
 * Displays heap memory metrics, usage history bar chart, and toggle control.
 */
const MemoryPanel = ({
  memStats,
  memRunning,
  C,
  t,
  onToggleMem
}) => {
  const styles = styleSheet(C);
  const stats = memStats;
  const usagePercent = stats ? Math.min(stats.usagePercent, 100) : 0;
  const barColor = !stats ? C.textDim : usagePercent > 80 ? C.error : usagePercent > 50 ? C.warning : C.success;
  const formatMB = bytes => {
    const mb = bytes / (1024 * 1024);
    return mb >= 10 ? mb.toFixed(1) : mb.toFixed(2);
  };
  const formatPercent = pct => {
    return `${pct.toFixed(1)}%`;
  };
  return /*#__PURE__*/React.createElement(ScrollView, {
    style: styles.perfContainer
  }, /*#__PURE__*/React.createElement(View, {
    style: styles.perfToggle
  }, /*#__PURE__*/React.createElement(Text, {
    style: styles.perfToggleText
  }, memRunning ? t.memoryMonitorActive : t.memoryMonitorOff), /*#__PURE__*/React.createElement(TouchableOpacity, {
    accessibilityRole: "switch",
    accessibilityState: {
      checked: memRunning
    },
    accessibilityLabel: "Toggle memory monitor",
    style: [styles.toggleTrack, memRunning ? styles.toggleTrackActive : styles.toggleTrackInactive],
    onPress: () => {
      if (memRunning) {
        stopMemoryMonitor();
        onToggleMem(false);
      } else {
        startMemoryMonitor();
        onToggleMem(true);
      }
    }
  }, /*#__PURE__*/React.createElement(View, {
    style: [styles.toggleThumb, {
      alignSelf: memRunning ? 'flex-end' : 'flex-start'
    }]
  }))), /*#__PURE__*/React.createElement(View, {
    style: styles.perfCard
  }, /*#__PURE__*/React.createElement(View, {
    style: styles.perfRow
  }, /*#__PURE__*/React.createElement(Text, {
    style: styles.perfLabel
  }, t.currentMemory), /*#__PURE__*/React.createElement(Text, {
    style: [styles.perfValue, !stats ? {} : usagePercent > 80 ? styles.perfValueError : usagePercent > 50 ? styles.perfValueWarning : styles.perfValueGood]
  }, stats ? `${formatMB(stats.usedJSHeapSize)} MB` : '--')), stats && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(View, {
    style: styles.perfRow
  }, /*#__PURE__*/React.createElement(Text, {
    style: styles.perfLabel
  }, "Total"), /*#__PURE__*/React.createElement(Text, {
    style: styles.perfValue
  }, formatMB(stats.totalJSHeapSize), " MB")), /*#__PURE__*/React.createElement(View, {
    style: styles.perfRow
  }, /*#__PURE__*/React.createElement(Text, {
    style: styles.perfLabel
  }, "Usage"), /*#__PURE__*/React.createElement(Text, {
    style: [styles.perfValue, usagePercent > 80 ? styles.perfValueError : usagePercent > 50 ? styles.perfValueWarning : styles.perfValueGood]
  }, formatPercent(usagePercent)))), /*#__PURE__*/React.createElement(View, {
    style: [styles.fpsBar, {
      marginTop: 8
    }]
  }, /*#__PURE__*/React.createElement(View, {
    style: [styles.fpsBarFill, {
      width: `${usagePercent}%`,
      backgroundColor: barColor
    }]
  }))), stats && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(View, {
    style: styles.perfCard
  }, /*#__PURE__*/React.createElement(View, {
    style: styles.perfRow
  }, /*#__PURE__*/React.createElement(Text, {
    style: styles.perfLabel
  }, t.averageMemory), /*#__PURE__*/React.createElement(Text, {
    style: styles.perfValue
  }, formatMB(stats.history.reduce((a, b) => a + b, 0) / Math.max(stats.history.length, 1)), ' ', "MB")), /*#__PURE__*/React.createElement(View, {
    style: styles.perfRow
  }, /*#__PURE__*/React.createElement(Text, {
    style: styles.perfLabel
  }, t.minMemory), /*#__PURE__*/React.createElement(Text, {
    style: styles.perfValue
  }, stats.minUsage.toFixed(1), " MB")), /*#__PURE__*/React.createElement(View, {
    style: styles.perfRow
  }, /*#__PURE__*/React.createElement(Text, {
    style: styles.perfLabel
  }, t.maxMemory), /*#__PURE__*/React.createElement(Text, {
    style: [styles.perfValue, stats.maxUsage > 200 ? styles.perfValueWarning : styles.perfValueGood]
  }, stats.maxUsage.toFixed(1), " MB"))), /*#__PURE__*/React.createElement(View, {
    style: styles.perfCard
  }, /*#__PURE__*/React.createElement(Text, {
    style: styles.perfLabel
  }, t.memoryHistory), /*#__PURE__*/React.createElement(View, {
    style: {
      height: 80,
      flexDirection: 'row',
      alignItems: 'flex-end',
      gap: 1,
      marginTop: 12
    }
  }, stats.history.length > 0 ? stats.history.map((value, i) => {
    const maxVal = Math.max(...stats.history, 1);
    const barHeight = Math.max(4, value / maxVal * 80);
    const usagePct = maxVal > 0 ? value / maxVal * 100 : 0;
    return /*#__PURE__*/React.createElement(View, {
      key: i,
      style: {
        flex: 1,
        height: barHeight,
        backgroundColor: usagePct > 80 ? C.error : usagePct > 50 ? C.warning : C.success,
        borderRadius: 1,
        opacity: 0.5 + i / stats.history.length * 0.5
      }
    });
  }) : /*#__PURE__*/React.createElement(View, {
    style: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center'
    }
  }, /*#__PURE__*/React.createElement(Text, {
    style: {
      color: C.textDim,
      fontSize: 10
    }
  }, "Collecting data..."))))), !stats && /*#__PURE__*/React.createElement(View, {
    style: styles.perfCard
  }, /*#__PURE__*/React.createElement(Text, {
    style: [styles.perfLabel, {
      textAlign: 'center',
      marginVertical: 20
    }]
  }, t.memoryEmpty)), stats && !stats.supported && /*#__PURE__*/React.createElement(View, {
    style: styles.perfCard
  }, /*#__PURE__*/React.createElement(Text, {
    style: [styles.perfLabel, {
      textAlign: 'center',
      marginVertical: 20,
      color: C.warning
    }]
  }, t.memoryNotSupported)), /*#__PURE__*/React.createElement(View, {
    style: {
      height: 60
    }
  }));
};
export default MemoryPanel;
//# sourceMappingURL=MemoryPanel.js.map