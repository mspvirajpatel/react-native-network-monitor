"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _react = _interopRequireWildcard(require("react"));
var _reactNative = require("react-native");
var _DebugMonitorStyles = _interopRequireDefault(require("../DebugMonitorStyles"));
var _NotificationMonitor = require("../NotificationMonitor");
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
function _interopRequireWildcard(e, t) { if ("function" == typeof WeakMap) var r = new WeakMap(), n = new WeakMap(); return (_interopRequireWildcard = function (e, t) { if (!t && e && e.__esModule) return e; var o, i, f = { __proto__: null, default: e }; if (null === e || "object" != typeof e && "function" != typeof e) return f; if (o = t ? n : r) { if (o.has(e)) return o.get(e); o.set(e, f); } for (const t in e) "default" !== t && {}.hasOwnProperty.call(e, t) && ((i = (o = Object.defineProperty) && Object.getOwnPropertyDescriptor(e, t)) && (i.get || i.set) ? o(f, t, i) : f[t] = e[t]); return f; })(e, t); }
const NotificationPanel = ({
  C,
  t
}) => {
  const styles = (0, _DebugMonitorStyles.default)(C);
  const [notifications, setNotifications] = (0, _react.useState)([]);
  (0, _react.useEffect)(() => {
    const unsub = (0, _NotificationMonitor.subscribeToNotifications)(setNotifications);
    return unsub;
  }, []);
  const getSourceColor = source => {
    switch (source) {
      case 'remote':
        return C.primary;
      case 'local':
        return C.secondary;
      default:
        return C.textDim;
    }
  };
  const formatTime = ts => {
    return new Date(ts).toLocaleTimeString([], {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
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
      (0, _NotificationMonitor.logNotification)({
        title: 'Test Notification',
        body: 'This is a test push notification',
        data: {
          screen: 'Home',
          action: 'test'
        },
        source: 'local'
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
  }, "Send Test")), /*#__PURE__*/_react.default.createElement(_reactNative.TouchableOpacity, {
    accessibilityRole: "button",
    onPress: _NotificationMonitor.clearNotificationHistory,
    style: {
      flex: 1,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 8,
      backgroundColor: C.errorDim || C.error + '20',
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
  }, "Clear All"))), notifications.length === 0 ? /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    style: styles.perfCard
  }, /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: [styles.perfLabel, {
      textAlign: 'center',
      marginVertical: 20
    }]
  }, t.empty || 'No notifications yet'), /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: {
      color: C.textDim,
      fontSize: 10,
      textAlign: 'center'
    }
  }, "Notifications will appear here automatically.", '\n', "Use logNotification() to add manually.")) : /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    style: {
      paddingHorizontal: 10
    }
  }, /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    style: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 8
    }
  }, /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: {
      color: C.textDim,
      fontSize: 10,
      fontWeight: '700',
      letterSpacing: 0.5
    }
  }, notifications.length, " NOTIFICATION", notifications.length !== 1 ? 'S' : '')), notifications.map(notif => /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    key: notif.id,
    style: {
      backgroundColor: C.surface,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: C.border,
      padding: 12,
      marginBottom: 8
    }
  }, /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    style: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 6
    }
  }, /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    style: {
      flex: 1
    }
  }, /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    style: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginBottom: 2
    }
  }, /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    style: {
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 4,
      backgroundColor: getSourceColor(notif.source) + '20'
    }
  }, /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: {
      color: getSourceColor(notif.source),
      fontSize: 9,
      fontWeight: '700',
      textTransform: 'uppercase'
    }
  }, notif.source)), /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: {
      color: C.text,
      fontSize: 13,
      fontWeight: '700'
    },
    numberOfLines: 1
  }, notif.title || 'No Title')), notif.body ? /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: {
      color: C.textDim,
      fontSize: 11,
      marginTop: 2
    },
    numberOfLines: 3
  }, notif.body) : null), /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: {
      color: C.textDim,
      fontSize: 9,
      marginLeft: 8
    }
  }, formatTime(notif.timestamp))), /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    style: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 4,
      marginTop: 4
    }
  }, notif.category ? /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    style: {
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 4,
      backgroundColor: C.accent + '20'
    }
  }, /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: {
      color: C.accent,
      fontSize: 9,
      fontWeight: '600'
    }
  }, notif.category)) : null, notif.badge !== undefined ? /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    style: {
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 4,
      backgroundColor: C.warning + '20'
    }
  }, /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: {
      color: C.warning,
      fontSize: 9,
      fontWeight: '600'
    }
  }, "Badge: ", notif.badge)) : null, notif.sound ? /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    style: {
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 4,
      backgroundColor: C.success + '20'
    }
  }, /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: {
      color: C.success,
      fontSize: 9,
      fontWeight: '600'
    }
  }, "Sound: ", notif.sound)) : null), notif.data && Object.keys(notif.data).length > 0 ? /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    style: {
      marginTop: 8,
      backgroundColor: C.background,
      borderRadius: 6,
      padding: 8
    }
  }, /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: {
      color: C.textDim,
      fontSize: 9,
      fontWeight: '700',
      marginBottom: 4
    }
  }, "DATA"), /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    selectable: true,
    style: {
      color: C.success,
      fontSize: 10,
      fontFamily: 'Courier'
    }
  }, JSON.stringify(notif.data, null, 2))) : null))), /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    style: {
      height: 60
    }
  }));
};
var _default = exports.default = NotificationPanel;
//# sourceMappingURL=NotificationPanel.js.map