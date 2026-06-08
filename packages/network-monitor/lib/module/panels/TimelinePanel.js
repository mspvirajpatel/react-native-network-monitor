import React, { useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import styleSheet from '../DebugMonitorStyles';
/**
 * TimelinePanel
 *
 * Waterfall view of network request timing. Each request is rendered as a
 * horizontal bar whose start offset and width are proportional to the
 * request's timing within the visible time window.
 */
const TimelinePanel = ({
  logs,
  C,
  t,
  enabled,
  onToggle
}) => {
  const styles = styleSheet(C);

  // Sort chronologically (oldest first for waterfall)
  const timelineData = useMemo(() => {
    const withDuration = logs.filter(l => l.durationMs !== undefined && l.timestamp);
    return withDuration.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  }, [logs]);
  const {
    earliest,
    latest,
    totalSpan
  } = useMemo(() => {
    if (timelineData.length === 0) return {
      earliest: 0,
      latest: 0,
      totalSpan: 0
    };
    const times = timelineData.map(l => new Date(l.timestamp).getTime());
    const e = Math.min(...times);
    const l = Math.max(...times);
    return {
      earliest: e,
      latest: l,
      totalSpan: Math.max(l - e, 1)
    };
  }, [timelineData]);

  /** Convert a timestamp to a percentage position across the waterfall */
  const getStartPct = ts => {
    const t = new Date(ts).getTime();
    return (t - earliest) / totalSpan * 100;
  };

  /** Get a color for the status */
  const getStatusColor = status => {
    if (!status) return C.textDim;
    if (status >= 200 && status < 300) return C.success;
    if (status >= 300 && status < 400) return C.warning;
    if (status >= 400) return C.error;
    return C.textDim;
  };
  if (timelineData.length === 0) {
    return /*#__PURE__*/React.createElement(View, {
      style: styles.perfCard
    }, /*#__PURE__*/React.createElement(View, {
      style: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12
      }
    }, /*#__PURE__*/React.createElement(Text, {
      style: styles.perfLabel
    }, t.waterfall), /*#__PURE__*/React.createElement(TouchableOpacity, {
      accessibilityRole: "button",
      accessibilityLabel: "Toggle timeline",
      style: [styles.optionChip, {
        flex: 0,
        paddingHorizontal: 16,
        borderColor: C.border
      }],
      onPress: onToggle
    }, /*#__PURE__*/React.createElement(Text, {
      style: {
        color: C.primary,
        fontSize: 11,
        fontWeight: '700'
      }
    }, t.list))), /*#__PURE__*/React.createElement(Text, {
      style: [styles.perfLabel, {
        textAlign: 'center',
        marginVertical: 20
      }]
    }, t.noTimelineData));
  }
  return /*#__PURE__*/React.createElement(ScrollView, {
    style: {
      flex: 1,
      padding: 12
    }
  }, /*#__PURE__*/React.createElement(View, {
    style: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12
    }
  }, /*#__PURE__*/React.createElement(Text, {
    style: {
      color: C.textDim,
      fontSize: 10,
      fontWeight: '800',
      letterSpacing: 1
    }
  }, t.waterfall), /*#__PURE__*/React.createElement(TouchableOpacity, {
    accessibilityRole: "button",
    accessibilityLabel: "Switch to list view",
    style: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 8,
      backgroundColor: C.primaryDim
    },
    onPress: onToggle
  }, /*#__PURE__*/React.createElement(Text, {
    style: {
      color: C.primary,
      fontSize: 11,
      fontWeight: '700'
    }
  }, t.list))), /*#__PURE__*/React.createElement(View, {
    style: {
      backgroundColor: C.surface,
      borderRadius: 12,
      overflow: 'hidden',
      padding: 12
    }
  }, timelineData.map(log => {
    const startPct = getStartPct(log.timestamp);
    const durationMs = log.durationMs ?? 0;
    const relativeDuration = latest - earliest + durationMs;
    const widthPct = totalSpan > 0 ? durationMs / (totalSpan + durationMs) * 100 : 100;
    const statusColor = getStatusColor(log.status);
    return /*#__PURE__*/React.createElement(View, {
      key: log.id,
      style: {
        marginBottom: 10
      }
    }, /*#__PURE__*/React.createElement(View, {
      style: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
        gap: 6
      }
    }, /*#__PURE__*/React.createElement(View, {
      style: {
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
        backgroundColor: C.primaryDim
      }
    }, /*#__PURE__*/React.createElement(Text, {
      style: {
        color: C.primary,
        fontSize: 8,
        fontWeight: '900'
      }
    }, log.method || 'GET')), /*#__PURE__*/React.createElement(Text, {
      style: {
        color: C.text,
        fontSize: 10,
        fontWeight: '600',
        flex: 1
      },
      numberOfLines: 1
    }, log.url || ''), /*#__PURE__*/React.createElement(Text, {
      style: {
        color: statusColor,
        fontSize: 9,
        fontWeight: '700'
      }
    }, log.status ?? '—'), /*#__PURE__*/React.createElement(Text, {
      style: {
        color: C.textDim,
        fontSize: 9,
        fontWeight: '600'
      }
    }, durationMs, t.ms)), /*#__PURE__*/React.createElement(View, {
      style: {
        height: 8,
        backgroundColor: C.surfaceLight,
        borderRadius: 4,
        overflow: 'hidden'
      }
    }, /*#__PURE__*/React.createElement(View, {
      style: {
        height: '100%',
        width: `${Math.min(widthPct * 2, 100)}%`,
        backgroundColor: statusColor,
        borderRadius: 4,
        opacity: 0.85
      }
    })));
  })), /*#__PURE__*/React.createElement(View, {
    style: {
      height: 60
    }
  }));
};
export default TimelinePanel;
//# sourceMappingURL=TimelinePanel.js.map