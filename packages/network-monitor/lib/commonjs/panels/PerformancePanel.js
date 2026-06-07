"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _react = _interopRequireDefault(require("react"));
var _reactNative = require("react-native");
var _DebugMonitorStyles = _interopRequireDefault(require("../DebugMonitorStyles"));
var _PerformanceMonitor = require("../PerformanceMonitor");
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
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
  const styles = (0, _DebugMonitorStyles.default)(C);
  const fps = fpsStats;
  const fpsPercent = fps ? Math.min(fps.fps / 60 * 100, 100) : 0;
  const barColor = !fps ? C.textDim : fps.fps >= 55 ? C.success : fps.fps >= 30 ? C.warning : C.error;
  const fpsLabel = !fps ? '--' : `${fps.fps}`;
  return /*#__PURE__*/_react.default.createElement(_reactNative.ScrollView, {
    style: styles.perfContainer
  }, /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    style: styles.perfToggle
  }, /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: styles.perfToggleText
  }, perfRunning ? t.fpsMonitorActive : t.fpsMonitorOff), /*#__PURE__*/_react.default.createElement(_reactNative.TouchableOpacity, {
    style: [styles.toggleTrack, perfRunning ? styles.toggleTrackActive : styles.toggleTrackInactive],
    onPress: () => {
      if (perfRunning) {
        (0, _PerformanceMonitor.stopPerformanceMonitor)();
        onTogglePerf(false);
      } else {
        (0, _PerformanceMonitor.startPerformanceMonitor)();
        onTogglePerf(true);
      }
    }
  }, /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    style: [styles.toggleThumb, {
      alignSelf: perfRunning ? 'flex-end' : 'flex-start'
    }]
  }))), /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    style: styles.perfCard
  }, /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    style: styles.perfRow
  }, /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: styles.perfLabel
  }, t.currentFps), /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: [styles.perfValue, !fps ? {} : fps.fps >= 55 ? styles.perfValueGood : fps.fps >= 30 ? styles.perfValueWarning : styles.perfValueError]
  }, fpsLabel)), /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    style: styles.fpsBar
  }, /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    style: [styles.fpsBarFill, {
      width: `${fpsPercent}%`,
      backgroundColor: barColor
    }]
  }))), fps && /*#__PURE__*/_react.default.createElement(_react.default.Fragment, null, /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    style: styles.perfCard
  }, /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    style: styles.perfRow
  }, /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: styles.perfLabel
  }, t.averageFps), /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: styles.perfValue
  }, fps.averageFps)), /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    style: styles.perfRow
  }, /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: styles.perfLabel
  }, t.minFps), /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: [styles.perfValue, fps.minFps < 30 ? styles.perfValueError : styles.perfValueGood]
  }, fps.minFps)), /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    style: styles.perfRow
  }, /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: styles.perfLabel
  }, t.maxFps), /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: styles.perfValue
  }, fps.maxFps)), /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    style: styles.perfRow
  }, /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: styles.perfLabel
  }, t.droppedFrames), /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: [styles.perfValue, fps.droppedFrames > 10 ? styles.perfValueWarning : styles.perfValueGood]
  }, fps.droppedFrames))), /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    style: styles.perfCard
  }, /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: styles.perfLabel
  }, t.fpsHistory), /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    style: {
      height: 80,
      flexDirection: 'row',
      alignItems: 'flex-end',
      gap: 1,
      marginTop: 12
    }
  }, fps.history.length > 0 ? fps.history.map((value, i) => {
    const barHeight = Math.max(4, value / 60 * 80);
    return /*#__PURE__*/_react.default.createElement(_reactNative.View, {
      key: i,
      style: {
        flex: 1,
        height: barHeight,
        backgroundColor: value >= 55 ? C.success : value >= 30 ? C.warning : C.error,
        borderRadius: 1,
        opacity: 0.5 + i / fps.history.length * 0.5
      }
    });
  }) : /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    style: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center'
    }
  }, /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: {
      color: C.textDim,
      fontSize: 10
    }
  }, "Collecting data..."))))), !fps && /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    style: styles.perfCard
  }, /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: [styles.perfLabel, {
      textAlign: 'center',
      marginVertical: 20
    }]
  }, t.fpsEmpty)), /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    style: {
      height: 60
    }
  }));
};
var _default = exports.default = PerformancePanel;
//# sourceMappingURL=PerformancePanel.js.map