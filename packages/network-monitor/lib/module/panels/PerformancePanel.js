import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import styleSheet from '../DebugMonitorStyles';
import { startPerformanceMonitor, stopPerformanceMonitor } from '../PerformanceMonitor';
/**
 * PerformancePanel
 *
 * Displays real-time FPS metrics, history chart, and toggle control.
 */
const PerformancePanel = ({
  fpsStats,
  perfRunning,
  C,
  t,
  onTogglePerf
}) => {
  const styles = styleSheet(C);
  const fps = fpsStats;
  const fpsPercent = fps ? Math.min(fps.fps / 60 * 100, 100) : 0;
  const barColor = !fps ? C.textDim : fps.fps >= 55 ? C.success : fps.fps >= 30 ? C.warning : C.error;
  const fpsLabel = !fps ? '--' : `${fps.fps}`;
  return /*#__PURE__*/React.createElement(ScrollView, {
    style: styles.perfContainer
  }, /*#__PURE__*/React.createElement(View, {
    style: styles.perfToggle
  }, /*#__PURE__*/React.createElement(Text, {
    style: styles.perfToggleText
  }, perfRunning ? t.fpsMonitorActive : t.fpsMonitorOff), /*#__PURE__*/React.createElement(TouchableOpacity, {
    style: [styles.toggleTrack, perfRunning ? styles.toggleTrackActive : styles.toggleTrackInactive],
    onPress: () => {
      if (perfRunning) {
        stopPerformanceMonitor();
        onTogglePerf(false);
      } else {
        startPerformanceMonitor();
        onTogglePerf(true);
      }
    }
  }, /*#__PURE__*/React.createElement(View, {
    style: [styles.toggleThumb, {
      alignSelf: perfRunning ? 'flex-end' : 'flex-start'
    }]
  }))), /*#__PURE__*/React.createElement(View, {
    style: styles.perfCard
  }, /*#__PURE__*/React.createElement(View, {
    style: styles.perfRow
  }, /*#__PURE__*/React.createElement(Text, {
    style: styles.perfLabel
  }, t.currentFps), /*#__PURE__*/React.createElement(Text, {
    style: [styles.perfValue, !fps ? {} : fps.fps >= 55 ? styles.perfValueGood : fps.fps >= 30 ? styles.perfValueWarning : styles.perfValueError]
  }, fpsLabel)), /*#__PURE__*/React.createElement(View, {
    style: styles.fpsBar
  }, /*#__PURE__*/React.createElement(View, {
    style: [styles.fpsBarFill, {
      width: `${fpsPercent}%`,
      backgroundColor: barColor
    }]
  }))), fps && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(View, {
    style: styles.perfCard
  }, /*#__PURE__*/React.createElement(View, {
    style: styles.perfRow
  }, /*#__PURE__*/React.createElement(Text, {
    style: styles.perfLabel
  }, t.averageFps), /*#__PURE__*/React.createElement(Text, {
    style: styles.perfValue
  }, fps.averageFps)), /*#__PURE__*/React.createElement(View, {
    style: styles.perfRow
  }, /*#__PURE__*/React.createElement(Text, {
    style: styles.perfLabel
  }, t.minFps), /*#__PURE__*/React.createElement(Text, {
    style: [styles.perfValue, fps.minFps < 30 ? styles.perfValueError : styles.perfValueGood]
  }, fps.minFps)), /*#__PURE__*/React.createElement(View, {
    style: styles.perfRow
  }, /*#__PURE__*/React.createElement(Text, {
    style: styles.perfLabel
  }, t.maxFps), /*#__PURE__*/React.createElement(Text, {
    style: styles.perfValue
  }, fps.maxFps)), /*#__PURE__*/React.createElement(View, {
    style: styles.perfRow
  }, /*#__PURE__*/React.createElement(Text, {
    style: styles.perfLabel
  }, t.droppedFrames), /*#__PURE__*/React.createElement(Text, {
    style: [styles.perfValue, fps.droppedFrames > 10 ? styles.perfValueWarning : styles.perfValueGood]
  }, fps.droppedFrames))), /*#__PURE__*/React.createElement(View, {
    style: styles.perfCard
  }, /*#__PURE__*/React.createElement(Text, {
    style: styles.perfLabel
  }, t.fpsHistory), /*#__PURE__*/React.createElement(View, {
    style: {
      height: 80,
      flexDirection: 'row',
      alignItems: 'flex-end',
      gap: 1,
      marginTop: 12
    }
  }, fps.history.length > 0 ? fps.history.map((value, i) => {
    const barHeight = Math.max(4, value / 60 * 80);
    return /*#__PURE__*/React.createElement(View, {
      key: i,
      style: {
        flex: 1,
        height: barHeight,
        backgroundColor: value >= 55 ? C.success : value >= 30 ? C.warning : C.error,
        borderRadius: 1,
        opacity: 0.5 + i / fps.history.length * 0.5
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
  }, "Collecting data..."))))), !fps && /*#__PURE__*/React.createElement(View, {
    style: styles.perfCard
  }, /*#__PURE__*/React.createElement(Text, {
    style: [styles.perfLabel, {
      textAlign: 'center',
      marginVertical: 20
    }]
  }, t.fpsEmpty)), /*#__PURE__*/React.createElement(View, {
    style: {
      height: 60
    }
  }));
};
export default PerformancePanel;
//# sourceMappingURL=PerformancePanel.js.map