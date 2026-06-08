"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _react = _interopRequireWildcard(require("react"));
var _reactNative = require("react-native");
var _DebugMonitorStyles = _interopRequireDefault(require("../DebugMonitorStyles"));
var _NavigationTracker = require("../NavigationTracker");
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
function _interopRequireWildcard(e, t) { if ("function" == typeof WeakMap) var r = new WeakMap(), n = new WeakMap(); return (_interopRequireWildcard = function (e, t) { if (!t && e && e.__esModule) return e; var o, i, f = { __proto__: null, default: e }; if (null === e || "object" != typeof e && "function" != typeof e) return f; if (o = t ? n : r) { if (o.has(e)) return o.get(e); o.set(e, f); } for (const t in e) "default" !== t && {}.hasOwnProperty.call(e, t) && ((i = (o = Object.defineProperty) && Object.getOwnPropertyDescriptor(e, t)) && (i.get || i.set) ? o(f, t, i) : f[t] = e[t]); return f; })(e, t); }
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
  const styles = (0, _DebugMonitorStyles.default)(C);
  const [events, setEvents] = (0, _react.useState)([]);
  const [flow, setFlow] = (0, _react.useState)({
    nodes: [],
    edges: []
  });
  const [stats, setStats] = (0, _react.useState)({
    totalScreens: 0,
    totalTransitions: 0,
    totalEvents: 0,
    totalTimeMs: 0
  });
  const [selectedNode, setSelectedNode] = (0, _react.useState)(null);
  (0, _react.useEffect)(() => {
    const unsub = (0, _NavigationTracker.subscribeToNavigation)(newEvents => {
      setEvents(newEvents);
      setFlow((0, _NavigationTracker.getNavigationFlow)());
      setStats((0, _NavigationTracker.getScreenStats)());
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
  return /*#__PURE__*/_react.default.createElement(_reactNative.ScrollView, {
    style: styles.perfContainer
  }, /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    style: {
      flexDirection: 'row',
      gap: 8,
      paddingHorizontal: 10,
      paddingVertical: 8
    }
  }, /*#__PURE__*/_react.default.createElement(_reactNative.TouchableOpacity, {
    accessibilityRole: "button",
    onPress: () => {
      const screens = ['Home', 'Profile', 'Settings', 'Detail', 'List'];
      const methods = ['push', 'pop', 'replace', 'navigate'];
      const randomScreen = screens[Math.floor(Math.random() * screens.length)];
      const randomMethod = methods[Math.floor(Math.random() * methods.length)];
      (0, _NavigationTracker.logNavigationEvent)({
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
  }, /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: {
      color: C.primary,
      fontSize: 11,
      fontWeight: '700',
      textAlign: 'center'
    }
  }, "Simulate Nav")), /*#__PURE__*/_react.default.createElement(_reactNative.TouchableOpacity, {
    accessibilityRole: "button",
    onPress: _NavigationTracker.clearNavigationEvents,
    style: {
      flex: 1,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 8,
      backgroundColor: C.error + '20',
      borderWidth: 1,
      borderColor: C.error + '40'
    }
  }, /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: {
      color: C.error,
      fontSize: 11,
      fontWeight: '700',
      textAlign: 'center'
    }
  }, "Clear All"))), /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    style: styles.perfCard
  }, /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    style: styles.perfRow
  }, /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: styles.perfLabel
  }, "Screens"), /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: styles.perfValue
  }, stats.totalScreens)), /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    style: styles.perfRow
  }, /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: styles.perfLabel
  }, "Transitions"), /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: styles.perfValue
  }, stats.totalTransitions)), /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    style: styles.perfRow
  }, /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: styles.perfLabel
  }, "Events"), /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: styles.perfValue
  }, stats.totalEvents)), stats.totalTimeMs > 0 ? /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    style: styles.perfRow
  }, /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: styles.perfLabel
  }, "Duration"), /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: styles.perfValue
  }, formatDuration(stats.totalTimeMs))) : null), flow.nodes.length > 0 ? /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    style: styles.perfCard
  }, /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: [styles.perfLabel, {
      marginBottom: 12
    }]
  }, "FLOW DIAGRAM"), /*#__PURE__*/_react.default.createElement(_reactNative.ScrollView, {
    horizontal: true,
    showsHorizontalScrollIndicator: false
  }, /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    style: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingBottom: 8
    }
  }, flow.nodes.map((node, idx) => /*#__PURE__*/_react.default.createElement(_react.default.Fragment, {
    key: node.screen
  }, /*#__PURE__*/_react.default.createElement(_reactNative.TouchableOpacity, {
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
  }, /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: {
      color: selectedNode === node.screen ? '#FFF' : getNodeColor(node.visits),
      fontSize: 11,
      fontWeight: '700'
    },
    numberOfLines: 1
  }, node.screen), /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: {
      color: selectedNode === node.screen ? '#FFF' : C.textDim,
      fontSize: 9,
      marginTop: 2
    }
  }, node.visits, "\xD7")), idx < flow.nodes.length - 1 ? /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    style: {
      alignItems: 'center',
      paddingHorizontal: 2
    }
  }, /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: {
      color: C.textDim,
      fontSize: 16
    }
  }, "\u2192")) : null))))) : null, flow.edges.length > 0 ? /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    style: styles.perfCard
  }, /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: [styles.perfLabel, {
      marginBottom: 8
    }]
  }, "TRANSITIONS"), flow.edges.map(edge => /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    key: `${edge.from}→${edge.to}`,
    style: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 6,
      borderBottomWidth: 1,
      borderBottomColor: C.border
    }
  }, /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: {
      color: C.text,
      fontSize: 11,
      fontWeight: '600'
    },
    numberOfLines: 1
  }, edge.from), /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: {
      color: C.textDim,
      fontSize: 11,
      marginHorizontal: 4
    }
  }, "\u2192"), /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: {
      color: C.text,
      fontSize: 11,
      fontWeight: '600'
    },
    numberOfLines: 1
  }, edge.to), /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    style: {
      flex: 1
    }
  }), /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    style: {
      flexDirection: 'row',
      gap: 4
    }
  }, edge.methods.map(method => /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    key: method,
    style: {
      paddingHorizontal: 4,
      paddingVertical: 1,
      borderRadius: 3,
      backgroundColor: (METHOD_COLORS[method] || C.textDim) + '20'
    }
  }, /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: {
      color: METHOD_COLORS[method] || C.textDim,
      fontSize: 8,
      fontWeight: '700'
    }
  }, method.toUpperCase())))), /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: {
      color: C.textDim,
      fontSize: 10,
      marginLeft: 6
    }
  }, edge.count, "\xD7")))) : null, events.length > 0 ? /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    style: styles.perfCard
  }, /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: [styles.perfLabel, {
      marginBottom: 8
    }]
  }, "TIMELINE"), events.slice(0, 50).map(event => /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    key: event.id,
    style: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      paddingVertical: 6,
      borderBottomWidth: 1,
      borderBottomColor: C.border
    }
  }, /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    style: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: METHOD_COLORS[event.method] || C.textDim,
      marginTop: 4,
      marginRight: 8
    }
  }), /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    style: {
      flex: 1
    }
  }, /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    style: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6
    }
  }, /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: {
      color: C.text,
      fontSize: 11,
      fontWeight: '600'
    },
    numberOfLines: 1
  }, event.screen), /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    style: {
      paddingHorizontal: 4,
      paddingVertical: 1,
      borderRadius: 3,
      backgroundColor: (METHOD_COLORS[event.method] || C.textDim) + '20'
    }
  }, /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: {
      color: METHOD_COLORS[event.method] || C.textDim,
      fontSize: 8,
      fontWeight: '700'
    }
  }, event.method.toUpperCase())), event.durationMs !== undefined ? /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: {
      color: C.textDim,
      fontSize: 9
    }
  }, formatDuration(event.durationMs)) : null), event.deepLink ? /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: {
      color: C.accent,
      fontSize: 9,
      marginTop: 2
    },
    numberOfLines: 1
  }, "\uD83D\uDD17 ", event.deepLink) : null), /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: {
      color: C.textDim,
      fontSize: 9,
      marginLeft: 8
    }
  }, formatTime(event.timestamp))))) : /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    style: styles.perfCard
  }, /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: [styles.perfLabel, {
      textAlign: 'center',
      marginVertical: 20
    }]
  }, t.empty || 'No navigation events yet'), /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: {
      color: C.textDim,
      fontSize: 10,
      textAlign: 'center'
    }
  }, "Navigation events will appear here.", '\n', "Use logNavigationEvent() to track manually.")), /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    style: {
      height: 60
    }
  }));
};
var _default = exports.default = NavigationFlowPanel;
//# sourceMappingURL=NavigationFlowPanel.js.map