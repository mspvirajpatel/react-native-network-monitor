"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.DebugMonitor = void 0;
var _react = _interopRequireWildcard(require("react"));
var _reactNative = require("react-native");
var _reactNativeSafeAreaContext = require("react-native-safe-area-context");
var _DebugMonitorStyles = _interopRequireWildcard(require("./DebugMonitorStyles"));
var _Logger = require("./Logger");
var _PerformanceMonitor = require("./PerformanceMonitor");
var _DeviceInfo = require("./DeviceInfo");
var _NetworkMonitor = require("./NetworkMonitor");
var _DebugContext = require("./DebugContext");
var _Toast = require("./Toast");
var _LogItemAnimated = _interopRequireDefault(require("./LogItemAnimated"));
var _SettingsPanel = _interopRequireDefault(require("./panels/SettingsPanel"));
var _StorePanel = _interopRequireDefault(require("./panels/StorePanel"));
var _PerformancePanel = _interopRequireDefault(require("./panels/PerformancePanel"));
var _WebSocketPanel = _interopRequireDefault(require("./panels/WebSocketPanel"));
var _translations = require("./translations");
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
function _interopRequireWildcard(e, t) { if ("function" == typeof WeakMap) var r = new WeakMap(), n = new WeakMap(); return (_interopRequireWildcard = function (e, t) { if (!t && e && e.__esModule) return e; var o, i, f = { __proto__: null, default: e }; if (null === e || "object" != typeof e && "function" != typeof e) return f; if (o = t ? n : r) { if (o.has(e)) return o.get(e); o.set(e, f); } for (const t in e) "default" !== t && {}.hasOwnProperty.call(e, t) && ((i = (o = Object.defineProperty) && Object.getOwnPropertyDescriptor(e, t)) && (i.get || i.set) ? o(f, t, i) : f[t] = e[t]); return f; })(e, t); }
/* eslint-disable no-unused-vars */
/* eslint-disable react-native/no-inline-styles */
/* eslint-disable @typescript-eslint/no-unused-vars */

/**
 * Section
 *
 * Small presentational helper that renders a labeled section used in the
 * details view inside the debug monitor.
 *
 * @param props - { label, value, json, color, selectable }
 * @returns JSX.Element | null
 */
const tryParseJson = data => {
  if (typeof data === 'string') {
    try {
      return JSON.parse(data);
    } catch (_) {
      return data;
    }
  }
  return data;
};
const Section = ({
  label,
  value,
  json,
  color,
  selectable,
  themeColors,
  onCopy
}) => {
  const styles = (0, _DebugMonitorStyles.default)(themeColors);
  const resolvedJson = json !== undefined && json !== null ? tryParseJson(json) : json;
  const isEmpty = val => {
    if (val === null || val === undefined) return true;
    if (typeof val === 'string') return val.length === 0;
    if (typeof val === 'object') return Object.keys(val).length === 0;
    return false;
  };
  if (!value && isEmpty(resolvedJson)) return null;
  const isJsonObject = resolvedJson !== null && typeof resolvedJson === 'object';
  const copyValue = value || (isJsonObject ? JSON.stringify(resolvedJson, null, 2) : String(resolvedJson ?? ''));
  return /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    style: styles.sectionBox
  }, /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    style: styles.sectionLabelRow
  }, /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: styles.sectionLabel
  }, label), onCopy && copyValue ? /*#__PURE__*/_react.default.createElement(_reactNative.TouchableOpacity, {
    hitSlop: {
      top: 8,
      bottom: 8,
      left: 8,
      right: 8
    },
    onPress: () => onCopy(copyValue)
  }, /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: [styles.copyIconText, {
      color: themeColors?.primary || '#7C5CFC'
    }]
  }, "\uD83D\uDCCB")) : null), value ? /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    selectable: selectable,
    style: [styles.sectionValue, color ? {
      color
    } : undefined]
  }, value) : isJsonObject ? /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    style: styles.jsonBox
  }, /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    selectable: true,
    style: styles.jsonText
  }, JSON.stringify(resolvedJson, null, 2))) : /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    selectable: true,
    style: styles.sectionValue
  }, String(resolvedJson)));
};

/**
 * DebugMonitor
 *
 * Full-screen debug UI for viewing logs, network requests, and app events.
 * Provides searching, filtering, export and environment/source controls.
 *
 * @param props - Props for DebugMonitor (see `DebugMonitorProps`)
 * @returns JSX.Element
 */
const DebugMonitor = ({
  onClose,
  envConfig,
  onBaseUrlChange,
  baseUrls,
  prodUrl,
  testUrl,
  language = 'auto',
  theme = 'auto',
  colors: customColors,
  features: featuresProp,
  headerTitle,
  searchPlaceholder,
  maxLogs,
  customActions
}) => {
  const systemScheme = (0, _reactNative.useColorScheme)();
  const [selectedTheme, setSelectedTheme] = (0, _react.useState)(theme);
  const effectiveTheme = selectedTheme === 'auto' ? systemScheme === 'light' ? 'light' : 'dark' : selectedTheme;
  const C = (0, _DebugMonitorStyles.getColors)(effectiveTheme, customColors);
  const styles = (0, _DebugMonitorStyles.default)(C);

  // Estimated fixed row height for FlatList getItemLayout performance optimization.
  // Items may vary slightly in actual rendered height, but this constant keeps
  // scroll offset calculation O(1) instead of measuring every row on mount.
  const LOG_ITEM_HEIGHT = 112;
  const [logs, setLogs] = (0, _react.useState)(_Logger.Logger.getLogs());
  const [selectedLog, setSelectedLog] = (0, _react.useState)(null);
  const [activeTab, setActiveTab] = (0, _react.useState)('ALL');
  const [detailTab, setDetailTab] = (0, _react.useState)('RESPONSE');
  const [showMenu, setShowMenu] = (0, _react.useState)(false);
  const [searchQuery, setSearchQuery] = (0, _react.useState)('');
  const [filterStatus, setFilterStatus] = (0, _react.useState)('ALL');
  const [baseUrl, setBaseUrl] = (0, _react.useState)(_Logger.Logger.getBaseUrl());
  const [manualUrl, setManualUrl] = (0, _react.useState)('');
  const [filterMethod] = (0, _react.useState)('ALL');
  const [fpsStats, setFpsStats] = (0, _react.useState)(null);
  const [refreshing, setRefreshing] = (0, _react.useState)(false);
  const [showScrollTop, setShowScrollTop] = (0, _react.useState)(false);
  const flatListRef = (0, _react.useRef)(null);
  const [perfRunning, setPerfRunning] = (0, _react.useState)((0, _PerformanceMonitor.isPerformanceMonitorRunning)());
  const [deviceInfo] = (0, _react.useState)((0, _DeviceInfo.getDeviceInfo)());
  const allTabs = ['ALL', 'NETWORK', 'LOGS', 'WEBSOCKET', 'PERFORMANCE', 'STORE', 'SETTINGS'];
  const features = {
    network: true,
    console: true,
    websocket: true,
    performance: true,
    ...featuresProp
  };
  const tabFeatureMap = {
    NETWORK: 'network',
    LOGS: 'console',
    WEBSOCKET: 'websocket',
    PERFORMANCE: 'performance'
  };
  const availableTabs = allTabs.filter(tab => tabFeatureMap[tab] === undefined || features[tabFeatureMap[tab]]);
  (0, _react.useEffect)(() => {
    if (!availableTabs.includes(activeTab)) {
      setActiveTab(availableTabs[0] || 'ALL');
    }
  }, [availableTabs, activeTab]);

  // Sync the maxLogs prop to the Logger so the cap is enforced at the source
  (0, _react.useEffect)(() => {
    if (maxLogs && maxLogs > 0) {
      _Logger.Logger.setMaxLogs(maxLogs);
    }
  }, [maxLogs]);
  (0, _react.useEffect)(() => {
    const unsubscribe = _Logger.Logger.subscribe(newLogs => {
      setLogs(newLogs);
    });
    return unsubscribe;
  }, []);
  (0, _react.useEffect)(() => {
    const unsubFps = (0, _PerformanceMonitor.subscribeToFps)(stats => {
      setFpsStats(stats);
    });
    return unsubFps;
  }, []);

  // Register cleanup callbacks that run when the debugger closes
  const {
    addCloseCleanup
  } = (0, _DebugContext.useDebugger)();
  (0, _react.useEffect)(() => {
    const unsub1 = addCloseCleanup(() => {
      (0, _PerformanceMonitor.destroyPerformanceMonitor)();
    });
    return unsub1;
  }, [addCloseCleanup]);

  // Toast system for in-app notifications
  const {
    showToast,
    Toasts
  } = (0, _Toast.useToast)();
  const showError = (0, _react.useCallback)(msg => showToast(msg, 'error'), [showToast]);
  const showSuccess = (0, _react.useCallback)(msg => showToast(msg, 'success'), [showToast]);

  /** Share/copy a text value via the system share sheet */
  const handleCopy = (0, _react.useCallback)(text => {
    _reactNative.Share.share({
      message: text
    }).catch(() => {});
  }, []);

  /** Pull-to-refresh: re-read logs from the Logger singleton */
  const onRefresh = (0, _react.useCallback)(() => {
    setRefreshing(true);
    setLogs(_Logger.Logger.getLogs());
    setRefreshing(false);
  }, []);

  /** Track scroll offset to toggle scroll-to-top button visibility */
  const handleScroll = (0, _react.useCallback)(event => {
    const offsetY = event.nativeEvent.contentOffset.y;
    setShowScrollTop(offsetY > 400);
  }, []);

  /** Scroll the main list back to the top */
  const scrollToTop = (0, _react.useCallback)(() => {
    flatListRef.current?.scrollToOffset({
      offset: 0,
      animated: true
    });
  }, []);

  /** Map an HTTP method to a distinct badge color */
  const getMethodColor = (0, _react.useCallback)(method => {
    switch ((method || '').toUpperCase()) {
      case 'GET':
        return C.success;
      case 'POST':
        return C.primary;
      case 'PUT':
        return C.warning;
      case 'PATCH':
        return C.accent;
      case 'DELETE':
        return C.error;
      default:
        return C.textDim;
    }
  }, [C]);

  /** Map a numeric HTTP status to a range-based color */
  const getStatusColor = (0, _react.useCallback)(status => {
    if (!status) return C.textDim;
    if (status >= 200 && status < 300) return C.success;
    if (status >= 300 && status < 400) return C.warning;
    if (status >= 400 && status < 500) return C.warning; /* 4xx = amber */
    if (status >= 500) return C.error;
    return C.textDim;
  }, [C]);

  /** Map a LogType to a consistent accent color for the indicator strip */
  const getTypeColor = (0, _react.useCallback)(item => {
    if (item.type === 'error' || item.status && item.status >= 400) return C.error;
    if (item.type === 'websocket') return C.accent;
    if (item.type === 'performance') return C.warning;
    if (item.type === 'action') return C.secondary;
    if (item.type === 'database') return C.accent;
    if (item.type === 'navigation') return C.warning;
    if (item.type === 'info' && item.message?.startsWith('[ERROR]')) return C.error;
    if (item.status) {
      if (item.status >= 200 && item.status < 300) return C.success;
      if (item.status >= 300 && item.status < 400) return C.warning;
      if (item.status >= 400) return C.error;
    }
    return C.primary;
  }, [C]);
  const t = (0, _react.useMemo)(() => {
    const lang = (0, _translations.resolveLanguage)(language);
    return _translations.TRANSLATIONS[lang] || _translations.TRANSLATIONS.en;
  }, [language]);
  const tabCounts = (0, _react.useMemo)(() => {
    return {
      ALL: logs.length,
      NETWORK: logs.filter(l => ['request', 'response'].includes(l.type) || l.type === 'error' && !!l.url).length,
      LOGS: logs.filter(l => l.type === 'info' || l.type === 'error' && !l.url).length,
      WEBSOCKET: logs.filter(l => l.type === 'websocket').length,
      PERFORMANCE: logs.filter(l => l.type === 'performance').length,
      STORE: logs.filter(l => l.type === 'action').length,
      SETTINGS: 0
    };
  }, [logs]);
  const filteredLogs = (0, _react.useMemo)(() => {
    const result = logs.filter(log => {
      const typeMatch = activeTab === 'ALL' ? true : activeTab === 'NETWORK' ? ['request', 'response'].includes(log.type) || log.type === 'error' && !!log.url : activeTab === 'LOGS' ? log.type === 'info' || log.type === 'error' && !log.url : activeTab === 'WEBSOCKET' ? log.type === 'websocket' : activeTab === 'PERFORMANCE' ? log.type === 'performance' : activeTab === 'STORE' ? log.type === 'action' : false;
      if (!typeMatch && activeTab !== 'SETTINGS') return false;
      const matchesSearch = searchQuery === '' || log.url?.toLowerCase().includes(searchQuery.toLowerCase()) || log.message?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesMethod = filterMethod === 'ALL' || log.method === filterMethod;
      const matchesStatus = filterStatus === 'ALL' ? true : filterStatus === 'ERR' ? !!log.status && log.status >= 400 : !!log.status && log.status < 400;
      return matchesSearch && matchesMethod && matchesStatus;
    });
    if (maxLogs && maxLogs > 0) {
      return result.slice(0, maxLogs);
    }
    return result;
  }, [logs, activeTab, searchQuery, filterMethod, filterStatus, maxLogs]);
  const handleClearLogs = () => {
    _reactNative.Alert.alert(t.wipeAllRecords, 'Are you sure you want to delete all captured logs? This cannot be undone.', [{
      text: t.cancel,
      style: 'cancel'
    }, {
      text: 'Clear',
      style: 'destructive',
      onPress: () => _Logger.Logger.clearLogs()
    }]);
  };
  const handleShareLog = async log => {
    try {
      const parts = [];
      parts.push(`Type: ${log.type}`, `Time: ${log.timestamp}`);
      if (log.type === 'action' && log.stateData) {
        const sd = log.stateData;
        parts.push(`Store: ${sd.storeName}`);
        if (sd.actionType) parts.push(`Action: ${sd.actionType}`);
        if (sd.actionPayload) parts.push(`Payload: ${JSON.stringify(sd.actionPayload, null, 2)}`);
        if (sd.diff) parts.push(`Diff: ${JSON.stringify(sd.diff, null, 2)}`);
        if (sd.snapshot) parts.push(`Snapshot: ${JSON.stringify(sd.snapshot, null, 2)}`);
      } else {
        if (log.method) parts.push(`Method: ${log.method}`);
        if (log.url) parts.push(`URL: ${log.url}`);
        if (log.status) parts.push(`Status: ${log.status}`);
        if (log.message) parts.push(`Message: ${log.message}`);
        if (log.durationMs !== undefined) parts.push(`Duration: ${log.durationMs}${t.ms}`);
        if (log.size) parts.push(`Size: ${log.size}`);
      }
      await _reactNative.Share.share({
        message: parts.join('\n'),
        title: t.logShareTitle
      });
    } catch (e) {
      showError(t.couldNotShareLog);
    }
  };
  const escapeShell = str => {
    return str.replace(/'/g, "'\\''");
  };
  const formatCurlBody = data => {
    if (data === null || data === undefined) return '';
    if (typeof data === 'string') return data;
    return JSON.stringify(data);
  };
  const generateCurl = log => {
    if (!log.url) return '';
    if (!log.url || (0, _NetworkMonitor.isInternalUrl)(log.url)) return '';
    let curl = `curl -X ${log.method || 'GET'} '${escapeShell(log.url)}'`;
    if (log.requestHeaders) {
      Object.keys(log.requestHeaders).forEach(key => {
        const val = String(log.requestHeaders[key]);
        curl += ` -H '${escapeShell(key)}: ${escapeShell(val)}'`;
      });
    }
    if (log.requestData) {
      const body = formatCurlBody(log.requestData);
      if (body) {
        curl += ` -d '${escapeShell(body)}'`;
      }
    }
    return curl;
  };

  /**
   * renderLogItem
   *
   * Render function for a single log row in the FlatList.
   *
   * @param param0 - Destructured FlatList item wrapper
   * @returns JSX.Element
   */
  const renderLogItem = ({
    item,
    index
  }) => {
    const isConsoleError = item.type === 'info' && item.message?.startsWith('[ERROR]');
    const typeColor = getTypeColor(item);
    const methodColor = getMethodColor(item.method);
    const statusColor = getStatusColor(item.status);
    const row = /*#__PURE__*/_react.default.createElement(_reactNative.TouchableOpacity, {
      activeOpacity: 0.7,
      accessibilityRole: "button",
      accessibilityLabel: `${item.method || item.type || 'log'}: ${item.url || item.message || ''}`,
      style: styles.logItem,
      onPress: () => {
        setSelectedLog(item);
        setDetailTab('RESPONSE');
      }
    }, /*#__PURE__*/_react.default.createElement(_reactNative.View, {
      style: [styles.logIndicator, {
        backgroundColor: typeColor
      }]
    }), /*#__PURE__*/_react.default.createElement(_reactNative.View, {
      style: styles.logBody
    }, /*#__PURE__*/_react.default.createElement(_reactNative.View, {
      style: styles.logRow
    }, /*#__PURE__*/_react.default.createElement(_reactNative.View, {
      style: [styles.logChip, {
        backgroundColor: methodColor + '18'
      }]
    }, /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
      style: [styles.logChipText, {
        color: methodColor
      }]
    }, item.method || (isConsoleError ? t.logChipError : (item.type || '').toUpperCase()))), item.status ? /*#__PURE__*/_react.default.createElement(_reactNative.View, {
      style: [styles.logStatusChip, {
        backgroundColor: statusColor + '18'
      }]
    }, /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
      style: [styles.logStatusText, {
        color: statusColor
      }]
    }, item.status)) : null, /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
      style: styles.logTime
    }, new Date(item.timestamp).toLocaleTimeString([], {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }))), /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
      style: styles.logUrl,
      numberOfLines: 2
    }, item.isRedirected ? `${item.originalUrl} ➔ ${item.url}` : item.url || item.message), item.durationMs !== undefined ? /*#__PURE__*/_react.default.createElement(_reactNative.View, {
      style: styles.logMetaBox
    }, /*#__PURE__*/_react.default.createElement(_reactNative.View, {
      style: styles.metaBadge
    }, /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
      style: styles.logMeta
    }, "\u23F1 ", item.durationMs ?? 0, t.ms)), /*#__PURE__*/_react.default.createElement(_reactNative.View, {
      style: styles.metaBadge
    }, /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
      style: styles.logMeta
    }, "\uD83D\uDCE6 ", item.size || `0.00${t.kb}`))) : null));
    return /*#__PURE__*/_react.default.createElement(_LogItemAnimated.default, {
      index: index
    }, row);
  };
  const {
    top,
    bottom
  } = (0, _reactNativeSafeAreaContext.useSafeAreaInsets)();
  return /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    style: styles.container
  }, /*#__PURE__*/_react.default.createElement(_reactNative.StatusBar, {
    barStyle: effectiveTheme === 'light' ? 'dark-content' : 'light-content',
    backgroundColor: C.background
  }), /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    style: {
      flex: 1,
      paddingTop: top,
      paddingBottom: bottom
    }
  }, /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    style: styles.header
  }, /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    style: styles.headerTop
  }, /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    style: styles.headerLeft
  }, /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    style: styles.headerLogo
  }, /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: styles.headerLogoText
  }, "N")), /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: styles.headerTitle
  }, headerTitle || t.monitor), /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    style: styles.headerCount
  }, /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: {
      color: C.textDim,
      fontSize: 10,
      fontWeight: '700'
    }
  }, logs.length))), /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    style: styles.headerActions
  }, /*#__PURE__*/_react.default.createElement(_reactNative.TouchableOpacity, {
    accessibilityLabel: t.wipeAllRecords || 'Clear logs',
    accessibilityRole: "button",
    style: [styles.headerBtn, {
      backgroundColor: C.errorDim
    }],
    onPress: handleClearLogs
  }, /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: [styles.headerBtnText, {
      color: C.error,
      fontSize: 11,
      fontWeight: '800'
    }]
  }, "\u2715")), /*#__PURE__*/_react.default.createElement(_reactNative.TouchableOpacity, {
    accessibilityLabel: "Close",
    accessibilityRole: "button",
    style: styles.headerBtn,
    onPress: onClose
  }, /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: [styles.headerBtnText, {
      fontSize: 13
    }]
  }, "\u2304"))))), /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    style: styles.tabBar
  }, /*#__PURE__*/_react.default.createElement(_reactNative.ScrollView, {
    horizontal: true,
    showsHorizontalScrollIndicator: false,
    contentContainerStyle: styles.tabScroll
  }, availableTabs.map(tab => {
    const tabLabel = tab === 'ALL' ? t.all : tab === 'NETWORK' ? t.network : tab === 'LOGS' ? t.logs : tab === 'WEBSOCKET' ? t.ws : tab === 'PERFORMANCE' ? t.fps : tab === 'STORE' ? t.store : t.settings;
    return /*#__PURE__*/_react.default.createElement(_reactNative.TouchableOpacity, {
      key: tab,
      accessibilityRole: "tab",
      accessibilityState: {
        selected: activeTab === tab
      },
      accessibilityLabel: `${tabLabel}${tab !== 'SETTINGS' ? `, ${tabCounts[tab]} items` : ''}`,
      style: styles.tabItem,
      onPress: () => setActiveTab(tab)
    }, /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
      style: [styles.tabText, activeTab === tab ? styles.tabTextActive : styles.tabTextInactive]
    }, tabLabel, /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
      style: styles.tabBadge
    }, tab !== 'SETTINGS' ? ` ${tabCounts[tab]}` : '')), activeTab === tab ? /*#__PURE__*/_react.default.createElement(_reactNative.View, {
      style: styles.tabActiveLine
    }) : null);
  }))), activeTab !== 'SETTINGS' ? /*#__PURE__*/_react.default.createElement(_reactNative.View, null, /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    style: styles.searchRow
  }, /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    style: styles.searchBox
  }, /*#__PURE__*/_react.default.createElement(_reactNative.TextInput, {
    accessibilityLabel: searchPlaceholder || t.search,
    style: styles.searchInput,
    placeholder: searchPlaceholder || t.search,
    placeholderTextColor: C.textDim,
    value: searchQuery,
    onChangeText: setSearchQuery
  }), searchQuery.length > 0 ? /*#__PURE__*/_react.default.createElement(_reactNative.TouchableOpacity, {
    accessibilityRole: "button",
    accessibilityLabel: "Clear search",
    onPress: () => setSearchQuery('')
  }, /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: styles.clearSearch
  }, "\u2715")) : null)), activeTab === 'NETWORK' ? /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    style: styles.filterRow
  }, ['ALL', 'OK', 'ERR'].map(s => {
    const pillLabel = s === 'ALL' ? t.allFilter : s === 'OK' ? t.success2xx3xx : t.error4xx5xx;
    return /*#__PURE__*/_react.default.createElement(_reactNative.TouchableOpacity, {
      key: s,
      accessibilityRole: "radio",
      accessibilityState: {
        checked: filterStatus === s
      },
      accessibilityLabel: pillLabel,
      style: [styles.filterPill, filterStatus === s && styles.filterPillActive],
      onPress: () => setFilterStatus(s)
    }, /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
      style: [styles.filterPillText, filterStatus === s ? styles.filterPillTextActive : styles.filterPillTextInactive]
    }, pillLabel));
  })) : null) : null, activeTab === 'SETTINGS' ? /*#__PURE__*/_react.default.createElement(_SettingsPanel.default, {
    baseUrls: baseUrls,
    prodUrl: prodUrl,
    testUrl: testUrl,
    envConfig: envConfig,
    onBaseUrlChange: onBaseUrlChange,
    C: C,
    t: t,
    baseUrl: baseUrl,
    manualUrl: manualUrl,
    selectedTheme: selectedTheme,
    logs: logs,
    deviceInfo: deviceInfo,
    onSetBaseUrl: setBaseUrl,
    onSetManualUrl: setManualUrl,
    onSetSelectedTheme: setSelectedTheme,
    showError: showError,
    showSuccess: showSuccess
  }) : activeTab === 'PERFORMANCE' ? /*#__PURE__*/_react.default.createElement(_PerformancePanel.default, {
    fpsStats: fpsStats,
    perfRunning: perfRunning,
    C: C,
    t: t,
    onTogglePerf: setPerfRunning
  }) : activeTab === 'WEBSOCKET' ? /*#__PURE__*/_react.default.createElement(_WebSocketPanel.default, {
    logs: logs,
    C: C,
    t: t
  }) : activeTab === 'STORE' ? /*#__PURE__*/_react.default.createElement(_StorePanel.default, {
    logs: logs,
    C: C,
    t: t,
    LOG_ITEM_HEIGHT: LOG_ITEM_HEIGHT,
    onSelectLog: log => {
      setSelectedLog(log);
      setDetailTab('RESPONSE');
    }
  }) : /*#__PURE__*/_react.default.createElement(_reactNative.FlatList, {
    ref: flatListRef,
    data: filteredLogs,
    renderItem: renderLogItem,
    keyExtractor: item => item.id,
    getItemLayout: (_data, index) => ({
      length: LOG_ITEM_HEIGHT,
      offset: LOG_ITEM_HEIGHT * index,
      index
    }),
    contentContainerStyle: [styles.listContent, filteredLogs.length === 0 && {
      flex: 1
    }],
    refreshing: refreshing,
    onRefresh: onRefresh,
    onScroll: handleScroll,
    scrollEventThrottle: 16,
    ListEmptyComponent: /*#__PURE__*/_react.default.createElement(_reactNative.View, {
      style: styles.emptyContainer
    }, /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
      style: styles.emptyIcon
    }, "\uD83D\uDCAC"), /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
      style: styles.emptyText
    }, t.empty), /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
      style: styles.emptySubText
    }, t.emptySubtitle))
  }), showScrollTop && /*#__PURE__*/_react.default.createElement(_reactNative.TouchableOpacity, {
    activeOpacity: 0.8,
    accessibilityRole: "button",
    accessibilityLabel: "Scroll to top",
    onPress: scrollToTop,
    style: [styles.scrollTopBtn, {
      backgroundColor: C.primary,
      shadowColor: C.shadow
    }]
  }, /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: styles.scrollTopBtnText
  }, "\u2191")), /*#__PURE__*/_react.default.createElement(_reactNative.Modal, {
    transparent: true,
    visible: !!selectedLog,
    animationType: "slide",
    supportedOrientations: ['landscape', 'landscape-left', 'landscape-right'],
    onRequestClose: () => {
      setSelectedLog(null);
      setShowMenu(false);
    }
  }, (() => {
    const isSelectedConsoleError = selectedLog?.type === 'info' && selectedLog?.message?.startsWith('[ERROR]');
    return /*#__PURE__*/_react.default.createElement(_reactNative.View, {
      style: [styles.detailOverlay, {
        paddingTop: top,
        paddingBottom: bottom
      }]
    }, /*#__PURE__*/_react.default.createElement(_reactNative.View, {
      style: styles.detailSheet
    }, /*#__PURE__*/_react.default.createElement(_reactNative.View, {
      style: styles.detailHandle
    }), /*#__PURE__*/_react.default.createElement(_reactNative.View, {
      style: styles.detailHeader
    }, /*#__PURE__*/_react.default.createElement(_reactNative.TouchableOpacity, {
      accessibilityRole: "button",
      accessibilityLabel: "Back",
      style: styles.detailBack,
      onPress: () => {
        setSelectedLog(null);
        setShowMenu(false);
      }
    }, /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
      style: styles.detailBackText
    }, "\u2190")), /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
      style: [styles.detailTitle, isSelectedConsoleError && {
        color: C.error
      }]
    }, selectedLog?.type === 'action' ? `[${selectedLog?.stateData?.storeName || t.store}] ${selectedLog?.stateData?.actionType || t.action}` : selectedLog?.type === 'info' ? isSelectedConsoleError ? t.consoleError : (t.logs || '').toUpperCase() : `${selectedLog?.durationMs ?? 0}${t.ms}, ${selectedLog?.size || `0.00${t.kb}`}`), /*#__PURE__*/_react.default.createElement(_reactNative.TouchableOpacity, {
      accessibilityRole: "button",
      accessibilityLabel: "Menu",
      style: styles.detailMenu,
      onPress: () => setShowMenu(!showMenu)
    }, /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
      style: styles.detailMenuText
    }, "\u22EE"))), showMenu ? /*#__PURE__*/_react.default.createElement(_reactNative.View, {
      style: styles.detailDropdown,
      accessibilityRole: "menu"
    }, /*#__PURE__*/_react.default.createElement(_reactNative.TouchableOpacity, {
      accessibilityRole: "menuitem",
      style: styles.detailDropdownItem,
      onPress: () => {
        handleShareLog(selectedLog);
        setShowMenu(false);
      }
    }, /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
      style: styles.detailDropdownText
    }, t.shareEntry)), /*#__PURE__*/_react.default.createElement(_reactNative.TouchableOpacity, {
      accessibilityRole: "menuitem",
      style: styles.detailDropdownItem,
      onPress: () => {
        if (selectedLog) {
          const curl = generateCurl(selectedLog);
          _reactNative.Share.share({
            message: curl || JSON.stringify(selectedLog, null, 2),
            title: t.curlCommand
          });
        }
        setShowMenu(false);
      }
    }, /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
      style: styles.detailDropdownText
    }, t.shareCurl)), customActions?.map((action, i) => /*#__PURE__*/_react.default.createElement(_reactNative.TouchableOpacity, {
      key: `ca-${i}`,
      accessibilityRole: "menuitem",
      style: styles.detailDropdownItem,
      onPress: () => {
        if (selectedLog) action.onPress(selectedLog);
        setShowMenu(false);
      }
    }, /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
      style: styles.detailDropdownText
    }, action.label))), /*#__PURE__*/_react.default.createElement(_reactNative.TouchableOpacity, {
      accessibilityRole: "menuitem",
      style: [styles.detailDropdownItem, {
        borderBottomWidth: 0
      }],
      onPress: () => setShowMenu(false)
    }, /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
      style: styles.detailDropdownText
    }, t.closeMenu))) : null, selectedLog?.type !== 'info' && selectedLog?.type !== 'websocket' && selectedLog?.type !== 'performance' && selectedLog?.type !== 'action' ? /*#__PURE__*/_react.default.createElement(_reactNative.View, {
      style: styles.detailTabs,
      accessibilityRole: "tablist"
    }, /*#__PURE__*/_react.default.createElement(_reactNative.TouchableOpacity, {
      accessibilityRole: "tab",
      accessibilityState: {
        selected: detailTab === 'REQUEST'
      },
      style: [styles.detailTab, detailTab === 'REQUEST' && styles.detailTabActive],
      onPress: () => setDetailTab('REQUEST')
    }, /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
      style: [styles.detailTabText, detailTab === 'REQUEST' ? styles.detailTabTextActive : styles.detailTabTextInactive]
    }, (t.request || '').toUpperCase())), /*#__PURE__*/_react.default.createElement(_reactNative.TouchableOpacity, {
      accessibilityRole: "tab",
      accessibilityState: {
        selected: detailTab === 'RESPONSE'
      },
      style: [styles.detailTab, detailTab === 'RESPONSE' && styles.detailTabActive],
      onPress: () => setDetailTab('RESPONSE')
    }, /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
      style: [styles.detailTabText, detailTab === 'RESPONSE' ? styles.detailTabTextActive : styles.detailTabTextInactive]
    }, (t.response || '').toUpperCase()))) : null, /*#__PURE__*/_react.default.createElement(_reactNative.ScrollView, {
      style: styles.detailContent,
      showsVerticalScrollIndicator: false
    }, selectedLog?.type === 'info' || selectedLog?.type === 'websocket' || selectedLog?.type === 'performance' || selectedLog?.type === 'action' ? /*#__PURE__*/_react.default.createElement(_react.default.Fragment, null, selectedLog?.type === 'action' && selectedLog?.stateData ? /*#__PURE__*/_react.default.createElement(_react.default.Fragment, null, /*#__PURE__*/_react.default.createElement(Section, {
      themeColors: C,
      label: t.actionType,
      value: selectedLog.stateData.actionType || '-',
      onCopy: handleCopy
    }), /*#__PURE__*/_react.default.createElement(Section, {
      themeColors: C,
      label: t.actionPayload,
      json: selectedLog.stateData.actionPayload,
      onCopy: handleCopy
    }), selectedLog.stateData.diff ? Object.keys(selectedLog.stateData.diff).length > 0 ? /*#__PURE__*/_react.default.createElement(_react.default.Fragment, null, /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
      style: [styles.sectionLabel, {
        marginTop: 16,
        marginBottom: 8
      }]
    }, t.changedKeys), Object.entries(selectedLog.stateData.diff).map(([key, val]) => /*#__PURE__*/_react.default.createElement(_reactNative.View, {
      key: key,
      style: styles.sectionBox
    }, /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
      style: styles.sectionLabel
    }, key), val.prev !== undefined ? /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
      style: [styles.sectionLabel, {
        color: C.textDim,
        fontSize: 10
      }]
    }, t.prevState) : null, val.prev !== undefined ? /*#__PURE__*/_react.default.createElement(_reactNative.View, {
      style: styles.jsonBox
    }, /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
      selectable: true,
      style: styles.jsonText
    }, JSON.stringify(val.prev, null, 2))) : null, val.next !== undefined ? /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
      style: [styles.sectionLabel, {
        color: C.textDim,
        fontSize: 10,
        marginTop: 8
      }]
    }, t.nextState) : null, val.next !== undefined ? /*#__PURE__*/_react.default.createElement(_reactNative.View, {
      style: styles.jsonBox
    }, /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
      selectable: true,
      style: styles.jsonText
    }, JSON.stringify(val.next, null, 2))) : null))) : null : selectedLog.stateData.snapshot ? /*#__PURE__*/_react.default.createElement(Section, {
      themeColors: C,
      label: t.fullState,
      json: selectedLog.stateData.snapshot,
      onCopy: handleCopy
    }) : null) : /*#__PURE__*/_react.default.createElement(_react.default.Fragment, null, /*#__PURE__*/_react.default.createElement(Section, {
      themeColors: C,
      selectable: true,
      label: selectedLog?.type === 'websocket' ? t.websocketEvent : selectedLog?.type === 'performance' ? t.performanceData : t.logMessage,
      value: selectedLog?.message,
      onCopy: handleCopy
    }), selectedLog?.url ? /*#__PURE__*/_react.default.createElement(Section, {
      themeColors: C,
      selectable: true,
      label: t.url,
      value: selectedLog.url,
      onCopy: handleCopy
    }) : null, /*#__PURE__*/_react.default.createElement(Section, {
      themeColors: C,
      label: t.data,
      json: selectedLog?.requestData,
      onCopy: handleCopy
    }), selectedLog?.type === 'performance' && selectedLog?.durationMs ? /*#__PURE__*/_react.default.createElement(Section, {
      themeColors: C,
      label: t.fps,
      value: String(selectedLog.durationMs),
      onCopy: handleCopy
    }) : null)) : detailTab === 'REQUEST' ? /*#__PURE__*/_react.default.createElement(_react.default.Fragment, null, /*#__PURE__*/_react.default.createElement(Section, {
      themeColors: C,
      label: t.method,
      value: selectedLog?.method,
      onCopy: handleCopy
    }), /*#__PURE__*/_react.default.createElement(Section, {
      themeColors: C,
      selectable: true,
      label: t.url,
      value: selectedLog?.isRedirected ? `${selectedLog?.originalUrl} ➔ ${selectedLog?.url}` : selectedLog?.url,
      onCopy: handleCopy
    }), /*#__PURE__*/_react.default.createElement(Section, {
      themeColors: C,
      label: t.headers,
      json: selectedLog?.requestHeaders,
      onCopy: handleCopy
    }), /*#__PURE__*/_react.default.createElement(Section, {
      themeColors: C,
      label: t.body,
      json: selectedLog?.requestData,
      onCopy: handleCopy
    })) : /*#__PURE__*/_react.default.createElement(_react.default.Fragment, null, /*#__PURE__*/_react.default.createElement(Section, {
      themeColors: C,
      label: t.statusCode,
      value: selectedLog?.status?.toString(),
      color: selectedLog?.status && selectedLog.status >= 400 ? C.error : C.success,
      onCopy: handleCopy
    }), /*#__PURE__*/_react.default.createElement(Section, {
      themeColors: C,
      label: t.headers,
      json: selectedLog?.responseHeaders,
      onCopy: handleCopy
    }), /*#__PURE__*/_react.default.createElement(Section, {
      themeColors: C,
      label: t.body,
      json: selectedLog?.responseData,
      onCopy: handleCopy
    })), /*#__PURE__*/_react.default.createElement(_reactNative.View, {
      style: {
        height: 100
      }
    }))));
  })())), Toasts);
};
exports.DebugMonitor = DebugMonitor;
//# sourceMappingURL=DebugMonitor.js.map