"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _react = _interopRequireDefault(require("react"));
var _reactNative = require("react-native");
var _LogItemAnimated = _interopRequireDefault(require("../LogItemAnimated"));
var _DebugMonitorStyles = _interopRequireDefault(require("../DebugMonitorStyles"));
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
/**
 * StorePanel
 *
 * Displays state store action logs (Redux, Zustand, etc.)
 * with diff/snapshot information per entry.
 */
const StorePanel = ({
  logs,
  C,
  t,
  LOG_ITEM_HEIGHT,
  onSelectLog
}) => {
  const styles = (0, _DebugMonitorStyles.default)(C);
  const storeLogs = logs.filter(l => l.type === 'action');
  if (storeLogs.length === 0) {
    return /*#__PURE__*/_react.default.createElement(_reactNative.View, {
      style: styles.wsContainer
    }, /*#__PURE__*/_react.default.createElement(_reactNative.View, {
      style: [styles.perfCard, {
        alignItems: 'center',
        padding: 40
      }]
    }, /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
      style: {
        fontSize: 32,
        marginBottom: 12
      }
    }, "\uD83D\uDDC4\uFE0F"), /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
      style: [styles.perfLabel, {
        textAlign: 'center',
        marginBottom: 4
      }]
    }, t.noStoreActivity), /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
      style: [styles.perfLabel, {
        color: C.textSubtle,
        fontSize: 10,
        textAlign: 'center'
      }]
    }, t.storeSubtitle)));
  }
  return /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    style: styles.wsContainer
  }, /*#__PURE__*/_react.default.createElement(_reactNative.FlatList, {
    data: storeLogs,
    renderItem: ({
      item
    }) => {
      const sd = item.stateData;
      const hasDiff = sd?.diff && Object.keys(sd.diff).length > 0;
      const changedKeys = hasDiff ? Object.keys(sd.diff).join(', ') : null;
      return /*#__PURE__*/_react.default.createElement(_LogItemAnimated.default, null, /*#__PURE__*/_react.default.createElement(_reactNative.TouchableOpacity, {
        activeOpacity: 0.7,
        accessibilityRole: "button",
        accessibilityLabel: `Store action: ${sd?.actionType || 'state change'} from ${sd?.storeName || 'Store'}`,
        style: styles.logItem,
        onPress: () => onSelectLog(item)
      }, /*#__PURE__*/_react.default.createElement(_reactNative.View, {
        style: [styles.logIndicator, {
          backgroundColor: C.secondary
        }]
      }), /*#__PURE__*/_react.default.createElement(_reactNative.View, {
        style: styles.logBody
      }, /*#__PURE__*/_react.default.createElement(_reactNative.View, {
        style: styles.logRow
      }, /*#__PURE__*/_react.default.createElement(_reactNative.View, {
        style: [styles.logChip, {
          backgroundColor: C.secondary + '18'
        }]
      }, /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
        style: [styles.logChipText, {
          color: C.secondary
        }]
      }, sd?.actionType ? sd.actionType : t.action)), /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
        style: styles.logTime
      }, new Date(item.timestamp).toLocaleTimeString([], {
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      }))), /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
        style: styles.logUrl,
        numberOfLines: 2
      }, "[", sd?.storeName || 'Store', "] ", sd?.actionType || t.state), changedKeys ? /*#__PURE__*/_react.default.createElement(_reactNative.View, {
        style: styles.logMetaBox
      }, /*#__PURE__*/_react.default.createElement(_reactNative.View, {
        style: styles.metaBadge
      }, /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
        style: styles.logMeta
      }, t.changedKeys, ": ", changedKeys))) : sd?.snapshot ? /*#__PURE__*/_react.default.createElement(_reactNative.View, {
        style: styles.logMetaBox
      }, /*#__PURE__*/_react.default.createElement(_reactNative.View, {
        style: styles.metaBadge
      }, /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
        style: styles.logMeta
      }, t.snapshot))) : null)));
    },
    keyExtractor: item => item.id,
    getItemLayout: (_data, index) => ({
      length: LOG_ITEM_HEIGHT,
      offset: LOG_ITEM_HEIGHT * index,
      index
    }),
    contentContainerStyle: [styles.listContent, storeLogs.length === 0 && {
      flex: 1
    }],
    ListEmptyComponent: /*#__PURE__*/_react.default.createElement(_reactNative.View, {
      style: styles.emptyContainer
    }, /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
      style: styles.emptyIcon
    }, "\uD83D\uDDC4\uFE0F"), /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
      style: styles.emptyText
    }, t.noStoreActivity), /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
      style: styles.emptySubText
    }, t.storeSubtitle))
  }));
};
var _default = exports.default = StorePanel;
//# sourceMappingURL=StorePanel.js.map