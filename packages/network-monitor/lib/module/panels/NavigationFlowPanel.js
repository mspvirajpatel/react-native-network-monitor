import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import styleSheet from '../DebugMonitorStyles';
import { subscribeToNavigation, getNavigationFlow, clearNavigationEvents, logNavigationEvent, getScreenStats } from '../NavigationTracker';
const METHOD_COLORS = {
  push: '#38BDF8',
  pop: '#F97316',
  replace: '#A855F7',
  reset: '#EF4444',
  navigate: '#22C55E',
  dismiss: '#EAB308',
  modal: '#EC4899',
  link: '#06B6D4',
  unknown: '#6B7280'
};
const NavigationFlowPanel = ({
  C,
  t
}) => {
  const styles = styleSheet(C);
  const [events, setEvents] = useState([]);
  const [flow, setFlow] = useState({
    nodes: [],
    edges: []
  });
  const [stats, setStats] = useState({
    totalScreens: 0,
    totalTransitions: 0,
    totalEvents: 0,
    totalTimeMs: 0
  });
  const [selectedNode, setSelectedNode] = useState(null);
  useEffect(() => {
    const unsub = subscribeToNavigation(newEvents => {
      setEvents(newEvents);
      setFlow(getNavigationFlow());
      setStats(getScreenStats());
    });
    return unsub;
  }, []);
  const formatTime = ts => {
    return new Date(ts).toLocaleTimeString([], {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };
  const formatDuration = ms => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };
  const getNodeColor = visits => {
    if (visits > 10) return C.error;
    if (visits > 5) return C.warning;
    return C.primary;
  };
  return /*#__PURE__*/React.createElement(ScrollView, {
    style: styles.perfContainer
  }, /*#__PURE__*/React.createElement(View, {
    style: {
      flexDirection: 'row',
      gap: 8,
      paddingHorizontal: 10,
      paddingVertical: 8
    }
  }, /*#__PURE__*/React.createElement(TouchableOpacity, {
    accessibilityRole: "button",
    onPress: () => {
      const screens = ['Home', 'Profile', 'Settings', 'Detail', 'List'];
      const methods = ['push', 'pop', 'replace', 'navigate'];
      const randomScreen = screens[Math.floor(Math.random() * screens.length)];
      const randomMethod = methods[Math.floor(Math.random() * methods.length)];
      logNavigationEvent({
        screen: randomScreen,
        method: randomMethod,
        params: {
          id: Math.floor(Math.random() * 100)
        }
      });
    },
    style: {
      flex: 1,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 8,
      backgroundColor: C.primary + '20',
      borderWidth: 1,
      borderColor: C.primary + '40'
    }
  }, /*#__PURE__*/React.createElement(Text, {
    style: {
      color: C.primary,
      fontSize: 11,
      fontWeight: '700',
      textAlign: 'center'
    }
  }, "Simulate Nav")), /*#__PURE__*/React.createElement(TouchableOpacity, {
    accessibilityRole: "button",
    onPress: clearNavigationEvents,
    style: {
      flex: 1,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 8,
      backgroundColor: C.error + '20',
      borderWidth: 1,
      borderColor: C.error + '40'
    }
  }, /*#__PURE__*/React.createElement(Text, {
    style: {
      color: C.error,
      fontSize: 11,
      fontWeight: '700',
      textAlign: 'center'
    }
  }, "Clear All"))), /*#__PURE__*/React.createElement(View, {
    style: styles.perfCard
  }, /*#__PURE__*/React.createElement(View, {
    style: styles.perfRow
  }, /*#__PURE__*/React.createElement(Text, {
    style: styles.perfLabel
  }, "Screens"), /*#__PURE__*/React.createElement(Text, {
    style: styles.perfValue
  }, stats.totalScreens)), /*#__PURE__*/React.createElement(View, {
    style: styles.perfRow
  }, /*#__PURE__*/React.createElement(Text, {
    style: styles.perfLabel
  }, "Transitions"), /*#__PURE__*/React.createElement(Text, {
    style: styles.perfValue
  }, stats.totalTransitions)), /*#__PURE__*/React.createElement(View, {
    style: styles.perfRow
  }, /*#__PURE__*/React.createElement(Text, {
    style: styles.perfLabel
  }, "Events"), /*#__PURE__*/React.createElement(Text, {
    style: styles.perfValue
  }, stats.totalEvents)), stats.totalTimeMs > 0 ? /*#__PURE__*/React.createElement(View, {
    style: styles.perfRow
  }, /*#__PURE__*/React.createElement(Text, {
    style: styles.perfLabel
  }, "Duration"), /*#__PURE__*/React.createElement(Text, {
    style: styles.perfValue
  }, formatDuration(stats.totalTimeMs))) : null), flow.nodes.length > 0 ? /*#__PURE__*/React.createElement(View, {
    style: styles.perfCard
  }, /*#__PURE__*/React.createElement(Text, {
    style: [styles.perfLabel, {
      marginBottom: 12
    }]
  }, "FLOW DIAGRAM"), /*#__PURE__*/React.createElement(ScrollView, {
    horizontal: true,
    showsHorizontalScrollIndicator: false
  }, /*#__PURE__*/React.createElement(View, {
    style: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingBottom: 8
    }
  }, flow.nodes.map((node, idx) => /*#__PURE__*/React.createElement(React.Fragment, {
    key: node.screen
  }, /*#__PURE__*/React.createElement(TouchableOpacity, {
    onPress: () => setSelectedNode(selectedNode === node.screen ? null : node.screen),
    style: {
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 8,
      backgroundColor: selectedNode === node.screen ? getNodeColor(node.visits) : getNodeColor(node.visits) + '20',
      borderWidth: 2,
      borderColor: getNodeColor(node.visits),
      minWidth: 80,
      alignItems: 'center'
    }
  }, /*#__PURE__*/React.createElement(Text, {
    style: {
      color: selectedNode === node.screen ? '#FFF' : getNodeColor(node.visits),
      fontSize: 11,
      fontWeight: '700'
    },
    numberOfLines: 1
  }, node.screen), /*#__PURE__*/React.createElement(Text, {
    style: {
      color: selectedNode === node.screen ? '#FFF' : C.textDim,
      fontSize: 9,
      marginTop: 2
    }
  }, node.visits, "\xD7")), idx < flow.nodes.length - 1 ? /*#__PURE__*/React.createElement(View, {
    style: {
      alignItems: 'center',
      paddingHorizontal: 2
    }
  }, /*#__PURE__*/React.createElement(Text, {
    style: {
      color: C.textDim,
      fontSize: 16
    }
  }, "\u2192")) : null))))) : null, flow.edges.length > 0 ? /*#__PURE__*/React.createElement(View, {
    style: styles.perfCard
  }, /*#__PURE__*/React.createElement(Text, {
    style: [styles.perfLabel, {
      marginBottom: 8
    }]
  }, "TRANSITIONS"), flow.edges.map(edge => /*#__PURE__*/React.createElement(View, {
    key: `${edge.from}→${edge.to}`,
    style: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 6,
      borderBottomWidth: 1,
      borderBottomColor: C.border
    }
  }, /*#__PURE__*/React.createElement(Text, {
    style: {
      color: C.text,
      fontSize: 11,
      fontWeight: '600'
    },
    numberOfLines: 1
  }, edge.from), /*#__PURE__*/React.createElement(Text, {
    style: {
      color: C.textDim,
      fontSize: 11,
      marginHorizontal: 4
    }
  }, "\u2192"), /*#__PURE__*/React.createElement(Text, {
    style: {
      color: C.text,
      fontSize: 11,
      fontWeight: '600'
    },
    numberOfLines: 1
  }, edge.to), /*#__PURE__*/React.createElement(View, {
    style: {
      flex: 1
    }
  }), /*#__PURE__*/React.createElement(View, {
    style: {
      flexDirection: 'row',
      gap: 4
    }
  }, edge.methods.map(method => /*#__PURE__*/React.createElement(View, {
    key: method,
    style: {
      paddingHorizontal: 4,
      paddingVertical: 1,
      borderRadius: 3,
      backgroundColor: (METHOD_COLORS[method] || C.textDim) + '20'
    }
  }, /*#__PURE__*/React.createElement(Text, {
    style: {
      color: METHOD_COLORS[method] || C.textDim,
      fontSize: 8,
      fontWeight: '700'
    }
  }, method.toUpperCase())))), /*#__PURE__*/React.createElement(Text, {
    style: {
      color: C.textDim,
      fontSize: 10,
      marginLeft: 6
    }
  }, edge.count, "\xD7")))) : null, events.length > 0 ? /*#__PURE__*/React.createElement(View, {
    style: styles.perfCard
  }, /*#__PURE__*/React.createElement(Text, {
    style: [styles.perfLabel, {
      marginBottom: 8
    }]
  }, "TIMELINE"), events.slice(0, 50).map(event => /*#__PURE__*/React.createElement(View, {
    key: event.id,
    style: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      paddingVertical: 6,
      borderBottomWidth: 1,
      borderBottomColor: C.border
    }
  }, /*#__PURE__*/React.createElement(View, {
    style: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: METHOD_COLORS[event.method] || C.textDim,
      marginTop: 4,
      marginRight: 8
    }
  }), /*#__PURE__*/React.createElement(View, {
    style: {
      flex: 1
    }
  }, /*#__PURE__*/React.createElement(View, {
    style: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6
    }
  }, /*#__PURE__*/React.createElement(Text, {
    style: {
      color: C.text,
      fontSize: 11,
      fontWeight: '600'
    },
    numberOfLines: 1
  }, event.screen), /*#__PURE__*/React.createElement(View, {
    style: {
      paddingHorizontal: 4,
      paddingVertical: 1,
      borderRadius: 3,
      backgroundColor: (METHOD_COLORS[event.method] || C.textDim) + '20'
    }
  }, /*#__PURE__*/React.createElement(Text, {
    style: {
      color: METHOD_COLORS[event.method] || C.textDim,
      fontSize: 8,
      fontWeight: '700'
    }
  }, event.method.toUpperCase())), event.durationMs !== undefined ? /*#__PURE__*/React.createElement(Text, {
    style: {
      color: C.textDim,
      fontSize: 9
    }
  }, formatDuration(event.durationMs)) : null), event.deepLink ? /*#__PURE__*/React.createElement(Text, {
    style: {
      color: C.accent,
      fontSize: 9,
      marginTop: 2
    },
    numberOfLines: 1
  }, "\uD83D\uDD17 ", event.deepLink) : null), /*#__PURE__*/React.createElement(Text, {
    style: {
      color: C.textDim,
      fontSize: 9,
      marginLeft: 8
    }
  }, formatTime(event.timestamp))))) : /*#__PURE__*/React.createElement(View, {
    style: styles.perfCard
  }, /*#__PURE__*/React.createElement(Text, {
    style: [styles.perfLabel, {
      textAlign: 'center',
      marginVertical: 20
    }]
  }, t.empty || 'No navigation events yet'), /*#__PURE__*/React.createElement(Text, {
    style: {
      color: C.textDim,
      fontSize: 10,
      textAlign: 'center'
    }
  }, "Navigation events will appear here.", '\n', "Use logNavigationEvent() to track manually.")), /*#__PURE__*/React.createElement(View, {
    style: {
      height: 60
    }
  }));
};
export default NavigationFlowPanel;
//# sourceMappingURL=NavigationFlowPanel.js.map