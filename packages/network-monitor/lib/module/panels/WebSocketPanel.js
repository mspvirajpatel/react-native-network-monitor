import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import LogItemAnimated from '../LogItemAnimated';
import styleSheet from '../DebugMonitorStyles';
/**
 * WebSocketPanel
 *
 * Displays WebSocket connection events (open, close, message, error)
 * in a scrollable list with color-coded badges.
 */
const WebSocketPanel = ({
  logs,
  C,
  t
}) => {
  const styles = styleSheet(C);
  const wsLogs = logs.filter(l => l.type === 'websocket');
  if (wsLogs.length === 0) {
    return /*#__PURE__*/React.createElement(View, {
      style: styles.wsContainer
    }, /*#__PURE__*/React.createElement(View, {
      style: [styles.perfCard, {
        alignItems: 'center',
        padding: 40
      }]
    }, /*#__PURE__*/React.createElement(Text, {
      style: {
        fontSize: 32,
        marginBottom: 12
      }
    }, "\uD83D\uDD0C"), /*#__PURE__*/React.createElement(Text, {
      style: [styles.perfLabel, {
        textAlign: 'center',
        marginBottom: 4
      }]
    }, t.noWebSocketActivity), /*#__PURE__*/React.createElement(Text, {
      style: [styles.perfLabel, {
        color: C.textSubtle,
        fontSize: 10,
        textAlign: 'center'
      }]
    }, t.wsSubtitle)));
  }
  return /*#__PURE__*/React.createElement(ScrollView, {
    style: styles.wsContainer
  }, wsLogs.map(log => {
    const isOpen = log.message?.includes('OPEN');
    const isClose = log.message?.includes('CLOSE');
    const isError = log.message?.includes('ERROR');
    const badgeColor = isOpen ? C.success : isClose ? C.textDim : isError ? C.error : C.secondary;
    return /*#__PURE__*/React.createElement(LogItemAnimated, {
      key: log.id
    }, /*#__PURE__*/React.createElement(View, {
      style: styles.wsItem
    }, /*#__PURE__*/React.createElement(View, {
      style: styles.wsHeader
    }, /*#__PURE__*/React.createElement(View, {
      style: [styles.wsBadge, {
        backgroundColor: badgeColor + '20'
      }]
    }, /*#__PURE__*/React.createElement(Text, {
      style: [styles.wsBadgeText, {
        color: badgeColor
      }]
    }, isOpen ? t.wsOpen : isClose ? t.wsClose : isError ? t.wsError : t.wsMsg)), /*#__PURE__*/React.createElement(Text, {
      style: styles.wsUrl,
      numberOfLines: 1
    }, log.url), /*#__PURE__*/React.createElement(Text, {
      style: styles.wsTime
    }, new Date(log.timestamp).toLocaleTimeString([], {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }))), log.message && /*#__PURE__*/React.createElement(Text, {
      style: styles.wsMessage,
      numberOfLines: 3
    }, log.message), log.requestData && /*#__PURE__*/React.createElement(View, {
      style: [styles.jsonBox, {
        marginTop: 8,
        padding: 10
      }]
    }, /*#__PURE__*/React.createElement(Text, {
      style: styles.jsonText,
      numberOfLines: 5
    }, typeof log.requestData === 'string' ? log.requestData : JSON.stringify(log.requestData, null, 2)))));
  }), /*#__PURE__*/React.createElement(View, {
    style: {
      height: 40
    }
  }));
};
export default WebSocketPanel;
//# sourceMappingURL=WebSocketPanel.js.map