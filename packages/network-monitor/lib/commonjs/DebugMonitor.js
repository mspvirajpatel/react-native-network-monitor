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
var _MemoryMonitor = require("./MemoryMonitor");
var _DeviceInfo = require("./DeviceInfo");
var _NetworkMonitor = require("./NetworkMonitor");
var _DebugContext = require("./DebugContext");
var _Toast = require("./Toast");
var _LogItemAnimated = _interopRequireDefault(require("./LogItemAnimated"));
var _SettingsPanel = _interopRequireDefault(require("./panels/SettingsPanel"));
var _StorePanel = _interopRequireDefault(require("./panels/StorePanel"));
var _PerformancePanel = _interopRequireDefault(require("./panels/PerformancePanel"));
var _WebSocketPanel = _interopRequireDefault(require("./panels/WebSocketPanel"));
var _TimelinePanel = _interopRequireDefault(require("./panels/TimelinePanel"));
var _MemoryPanel = _interopRequireDefault(require("./panels/MemoryPanel"));
var _NotificationPanel = _interopRequireDefault(require("./panels/NotificationPanel"));
var _NavigationFlowPanel = _interopRequireDefault(require("./panels/NavigationFlowPanel"));
var _translations = require("./translations");
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
function _interopRequireWildcard(e, t) { if ("function" == typeof WeakMap) var r = new WeakMap(), n = new WeakMap(); return (_interopRequireWildcard = function (e, t) { if (!t && e && e.__esModule) return e; var o, i, f = { __proto__: null, default: e }; if (null === e || "object" != typeof e && "function" != typeof e) return f; if (o = t ? n : r) { if (o.has(e)) return o.get(e); o.set(e, f); } for (const t in e) "default" !== t && {}.hasOwnProperty.call(e, t) && ((i = (o = Object.defineProperty) && Object.getOwnPropertyDescriptor(e, t)) && (i.get || i.set) ? o(f, t, i) : f[t] = e[t]); return f; })(e, t); }
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); } /* eslint-disable no-unused-vars */ /* eslint-disable react-native/no-inline-styles */ /* eslint-disable @typescript-eslint/no-unused-vars */
/**
 * Section
 *
 * Small presentational helper that renders a labeled section used in the
 * details view inside the debug monitor.
 *
 * @param props - { label, value, json, color, selectable }
 * @returns JSX.Element | null
 */
/** Extract domain from a URL string */
const extractDomain = url => {
  try {
    const parsed = new URL(url);
    return parsed.hostname;
  } catch {
    return url;
  }
};
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
  const [filterMethod, setFilterMethod] = (0, _react.useState)('ALL');
  const [showAdvancedSearch, setShowAdvancedSearch] = (0, _react.useState)(false);
  const [selectedDomain, setSelectedDomain] = (0, _react.useState)(null);
  const [timeRangeMinutes, setTimeRangeMinutes] = (0, _react.useState)(null);
  const [regexMode, setRegexMode] = (0, _react.useState)(false);
  const [fpsStats, setFpsStats] = (0, _react.useState)(null);
  const [refreshing, setRefreshing] = (0, _react.useState)(false);
  const [showScrollTop, setShowScrollTop] = (0, _react.useState)(false);
  const [showWaterfall, setShowWaterfall] = (0, _react.useState)(false);
  const [bookmarkedIds, setBookmarkedIds] = (0, _react.useState)(new Set());
  const [searchPresets, setSearchPresets] = (0, _react.useState)([]);
  const [compareIds, setCompareIds] = (0, _react.useState)([]);
  const [showCompareModal, setShowCompareModal] = (0, _react.useState)(false);
  const flatListRef = (0, _react.useRef)(null);
  const [memStats, setMemStats] = (0, _react.useState)(null);
  const [perfRunning, setPerfRunning] = (0, _react.useState)((0, _PerformanceMonitor.isPerformanceMonitorRunning)());
  const [memRunning, setMemRunning] = (0, _react.useState)((0, _MemoryMonitor.isMemoryMonitorRunning)());
  const [deviceInfo] = (0, _react.useState)((0, _DeviceInfo.getDeviceInfo)());
  const [loading, setLoading] = (0, _react.useState)('Initializing...');
  const [receiving, setReceiving] = (0, _react.useState)(false);
  const receivingTimer = (0, _react.useRef)(null);

  // Swipe-to-dismiss animation
  const detailTranslateY = (0, _react.useRef)(new _reactNative.Animated.Value(0)).current;
  const detailOpacity = (0, _react.useRef)(new _reactNative.Animated.Value(1)).current;
  const detailPanResponder = (0, _react.useRef)(_reactNative.PanResponder.create({
    onMoveShouldSetPanResponder: (_, gestureState) => {
      return gestureState.dy > 10 && Math.abs(gestureState.dx) < Math.abs(gestureState.dy);
    },
    onPanResponderMove: (_, gestureState) => {
      if (gestureState.dy > 0) {
        detailTranslateY.setValue(gestureState.dy);
        detailOpacity.setValue(Math.max(0, 1 - gestureState.dy / 300));
      }
    },
    onPanResponderRelease: (_, gestureState) => {
      if (gestureState.dy > 120 || gestureState.vy > 0.5) {
        _reactNative.Animated.parallel([_reactNative.Animated.timing(detailTranslateY, {
          toValue: 500,
          duration: 200,
          useNativeDriver: true
        }), _reactNative.Animated.timing(detailOpacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true
        })]).start(() => {
          setSelectedLog(null);
          setShowMenu(false);
          detailTranslateY.setValue(0);
          detailOpacity.setValue(1);
        });
      } else {
        _reactNative.Animated.parallel([_reactNative.Animated.spring(detailTranslateY, {
          toValue: 0,
          useNativeDriver: true
        }), _reactNative.Animated.spring(detailOpacity, {
          toValue: 1,
          useNativeDriver: true
        })]).start();
      }
    }
  })).current;

  // Dismiss the initial loading state once the first render settles
  (0, _react.useEffect)(() => {
    const timer = setTimeout(() => setLoading(null), 400);
    return () => clearTimeout(timer);
  }, []);

  // Track when new logs arrive to show an activity pulse in the header
  (0, _react.useEffect)(() => {
    if (logs.length > 0) {
      setReceiving(true);
      if (receivingTimer.current) clearTimeout(receivingTimer.current);
      receivingTimer.current = setTimeout(() => setReceiving(false), 1200);
    }
    return () => {
      if (receivingTimer.current) clearTimeout(receivingTimer.current);
    };
  }, [logs.length]);
  const LoadingOverlay = loading ? /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    style: styles.loadingOverlay
  }, /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    style: styles.loadingBox
  }, /*#__PURE__*/_react.default.createElement(_reactNative.ActivityIndicator, {
    size: "large",
    color: C.primary,
    style: styles.loadingSpinner
  }), /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: styles.loadingText
  }, loading))) : null;
  const allTabs = ['ALL', 'NETWORK', 'LOGS', 'WEBSOCKET', 'PERFORMANCE', 'MEMORY', 'STORE', 'SETTINGS', 'NOTIFICATIONS', 'NAVFLOW'];
  const features = {
    network: true,
    console: true,
    websocket: true,
    performance: true,
    memory: true,
    notifications: true,
    navigationFlow: true,
    ...featuresProp
  };
  const tabFeatureMap = {
    NETWORK: 'network',
    LOGS: 'console',
    WEBSOCKET: 'websocket',
    PERFORMANCE: 'performance',
    MEMORY: 'memory',
    NOTIFICATIONS: 'notifications',
    NAVFLOW: 'navigationFlow'
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
    const unsubscribe = (0, _MemoryMonitor.subscribeToMemory)(stats => {
      setMemStats(stats);
    });
    return unsubscribe;
  }, []);
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
    const unsub2 = addCloseCleanup(() => {
      (0, _MemoryMonitor.destroyMemoryMonitor)();
    });
    return () => {
      unsub1();
      unsub2();
    };
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
      MEMORY: logs.filter(l => l.type === 'performance').length,
      STORE: logs.filter(l => l.type === 'action').length,
      NOTIFICATIONS: logs.filter(l => l.type === 'notification').length,
      NAVFLOW: logs.filter(l => l.type === 'navigation' || l.type === 'navigationFlow').length,
      SETTINGS: 0
    };
  }, [logs]);
  const filteredLogs = (0, _react.useMemo)(() => {
    const result = logs.filter(log => {
      const typeMatch = activeTab === 'ALL' ? true : activeTab === 'NETWORK' ? ['request', 'response'].includes(log.type) || log.type === 'error' && !!log.url : activeTab === 'LOGS' ? log.type === 'info' || log.type === 'error' && !log.url : activeTab === 'WEBSOCKET' ? log.type === 'websocket' : activeTab === 'PERFORMANCE' ? log.type === 'performance' : activeTab === 'STORE' ? log.type === 'action' : false;
      if (!typeMatch && activeTab !== 'SETTINGS') return false;
      const matchesSearch = (() => {
        if (searchQuery === '') return true;
        if (regexMode) {
          try {
            const re = new RegExp(searchQuery, 'i');
            return log.url && re.test(log.url) || log.message && re.test(log.message);
          } catch {
            return true;
          }
        }
        return log.url?.toLowerCase().includes(searchQuery.toLowerCase()) || log.message?.toLowerCase().includes(searchQuery.toLowerCase());
      })();
      const matchesMethod = filterMethod === 'ALL' || log.method === filterMethod;
      const matchesStatus = filterStatus === 'ALL' || filterStatus === 'BOOKMARKED' ? true : filterStatus === 'ERR' ? !!log.status && log.status >= 400 : !!log.status && log.status < 400;
      const matchesBookmark = filterStatus !== 'BOOKMARKED' || bookmarkedIds.has(log.id);
      const matchesDomain = selectedDomain === null || log.url && extractDomain(log.url) === selectedDomain;
      const matchesTime = timeRangeMinutes === null || (() => {
        const logTime = new Date(log.timestamp).getTime();
        const cutoff = Date.now() - timeRangeMinutes * 60 * 1000;
        return logTime >= cutoff;
      })();
      return matchesSearch && matchesMethod && matchesStatus && matchesBookmark && matchesDomain && matchesTime;
    });
    if (maxLogs && maxLogs > 0) {
      return result.slice(0, maxLogs);
    }
    return result;
  }, [logs, activeTab, searchQuery, filterMethod, filterStatus, maxLogs, bookmarkedIds, selectedDomain, timeRangeMinutes, regexMode]);
  const handleClearLogs = () => {
    _reactNative.Alert.alert(t.wipeAllRecords, 'Are you sure you want to delete all captured logs? This cannot be undone.', [{
      text: t.cancel,
      style: 'cancel'
    }, {
      text: 'Clear',
      style: 'destructive',
      onPress: () => {
        setLoading('Clearing logs...');
        // Use a microtask delay so the loading overlay renders before the clear
        setTimeout(() => {
          _Logger.Logger.clearLogs();
          setLoading(null);
        }, 50);
      }
    }]);
  };
  const handleShareLog = async log => {
    setLoading('Preparing share...');
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
    } finally {
      setLoading(null);
    }
  };
  const handleReplayRequest = async log => {
    if (!log.url) {
      showError(t.replayRequest + ' — ' + (t.noTimelineData || 'No URL'));
      return;
    }
    setLoading('Replaying request...');
    try {
      const method = log.method || 'GET';
      const url = log.url;
      const headers = {};

      // Copy request headers (skip internal header names)
      if (log.requestHeaders && typeof log.requestHeaders === 'object') {
        const raw = log.requestHeaders;
        Object.keys(raw).forEach(key => {
          if (typeof raw[key] === 'string' || typeof raw[key] === 'number') {
            headers[key] = String(raw[key]);
          }
        });
      }

      // Prepare body (exclude for GET/HEAD)
      let body;
      if (log.requestData && method !== 'GET' && method !== 'HEAD') {
        if (typeof log.requestData === 'object') {
          body = JSON.stringify(log.requestData);
          // Ensure Content-Type for JSON bodies
          if (!headers['Content-Type'] && !headers['content-type']) {
            headers['Content-Type'] = 'application/json';
          }
        } else {
          body = String(log.requestData);
        }
      }
      const response = await fetch(url, {
        method,
        headers,
        body
      });
      showSuccess(`${t.replayRequest} — ${response.status} ${response.statusText || ''}`);
    } catch (err) {
      showError(t.replayRequest + ' — ' + (err?.message || 'Failed'));
    } finally {
      setLoading(null);
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
    }, item.status)) : null, item.graphql ? /*#__PURE__*/_react.default.createElement(_reactNative.View, {
      style: [styles.graphqlBadge, {
        backgroundColor: C.secondary + '18'
      }]
    }, /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
      style: [styles.graphqlBadgeText, {
        color: C.secondary
      }]
    }, item.graphql.operationType !== 'unknown' ? item.graphql.operationType.toUpperCase().slice(0, 4) : 'GQL')) : null, /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
      style: styles.logTime
    }, new Date(item.timestamp).toLocaleTimeString([], {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })), /*#__PURE__*/_react.default.createElement(_reactNative.TouchableOpacity, {
      hitSlop: {
        top: 8,
        bottom: 8,
        left: 8,
        right: 8
      },
      accessibilityRole: "button",
      accessibilityLabel: bookmarkedIds.has(item.id) ? 'Remove bookmark' : 'Bookmark',
      onPress: () => {
        const next = new Set(bookmarkedIds);
        if (next.has(item.id)) {
          next.delete(item.id);
        } else {
          next.add(item.id);
        }
        setBookmarkedIds(next);
      }
    }, /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
      style: {
        color: bookmarkedIds.has(item.id) ? '#FFD700' : C.textDim,
        fontSize: 14,
        marginLeft: 6
      }
    }, bookmarkedIds.has(item.id) ? '★' : '☆'))), /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
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
  }, logs.length), receiving && /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    style: [styles.liveDot, {
      backgroundColor: C.success
    }]
  }))), /*#__PURE__*/_react.default.createElement(_reactNative.View, {
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
    const tabLabel = tab === 'ALL' ? t.all : tab === 'NETWORK' ? t.network : tab === 'LOGS' ? t.logs : tab === 'WEBSOCKET' ? t.ws : tab === 'PERFORMANCE' ? t.fps : tab === 'MEMORY' ? t.memory : tab === 'STORE' ? t.store : tab === 'NOTIFICATIONS' ? t.notifications || 'Notifs' : tab === 'NAVFLOW' ? t.navFlow || 'Flow' : t.settings;
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
  }, ['ALL', 'OK', 'ERR', 'BOOKMARKED'].map(s => {
    const pillLabel = s === 'ALL' ? t.allFilter : s === 'OK' ? t.success2xx3xx : s === 'ERR' ? t.error4xx5xx : t.bookmarked;
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
  }), /*#__PURE__*/_react.default.createElement(_reactNative.TouchableOpacity, {
    accessibilityRole: "button",
    accessibilityLabel: showWaterfall ? t.list : t.waterfall,
    style: [styles.filterPill, showWaterfall && styles.filterPillActive],
    onPress: () => setShowWaterfall(!showWaterfall)
  }, /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: [styles.filterPillText, showWaterfall ? styles.filterPillTextActive : styles.filterPillTextInactive]
  }, showWaterfall ? t.list : t.waterfall))) : activeTab === 'LOGS' ? /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    style: styles.filterRow
  }, ['ALL', 'OK', 'ERR'].map(s => {
    const pillLabel = s === 'ALL' ? t.allFilter : s === 'OK' ? t.info || 'Info' : t.error4xx5xx;
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
  })) : activeTab === 'WEBSOCKET' ? /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    style: styles.filterRow
  }, ['ALL', 'OPEN', 'MSG', 'CLOSE', 'ERR'].map(s => {
    const pillLabel = s === 'ALL' ? t.allFilter : s === 'OPEN' ? 'Open' : s === 'MSG' ? 'Message' : s === 'CLOSE' ? 'Close' : 'Error';
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
  })) : activeTab === 'NOTIFICATIONS' ? /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    style: styles.filterRow
  }, ['ALL', 'REMOTE', 'LOCAL'].map(s => {
    const pillLabel = s === 'ALL' ? t.allFilter : s === 'REMOTE' ? 'Remote' : 'Local';
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
  })) : activeTab === 'NAVFLOW' ? /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    style: styles.filterRow
  }, ['ALL', 'PUSH', 'POP', 'REPLACE', 'NAVIGATE'].map(s => {
    const pillLabel = s === 'ALL' ? t.allFilter : s;
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
  })) : null, activeTab === 'NETWORK' ? /*#__PURE__*/_react.default.createElement(_react.default.Fragment, null, /*#__PURE__*/_react.default.createElement(_reactNative.TouchableOpacity, {
    accessibilityRole: "button",
    accessibilityLabel: "Toggle advanced search",
    onPress: () => setShowAdvancedSearch(!showAdvancedSearch),
    style: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 10,
      paddingVertical: 4
    }
  }, /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: {
      color: C.primary,
      fontSize: 10,
      fontWeight: '700',
      letterSpacing: 0.5
    }
  }, showAdvancedSearch ? t.advancedSearchHide : t.advancedSearch)), showAdvancedSearch ? /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    style: {
      paddingHorizontal: 10,
      paddingBottom: 8,
      borderBottomWidth: 1,
      borderBottomColor: C.border
    }
  }, /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: {
      color: C.textDim,
      fontSize: 9,
      fontWeight: '700',
      letterSpacing: 0.5,
      marginBottom: 4
    }
  }, t.methodFilter), /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    style: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 4,
      marginBottom: 8
    }
  }, ['ALL', 'GET', 'POST', 'PUT', 'DELETE', 'PATCH'].map(method => /*#__PURE__*/_react.default.createElement(_reactNative.TouchableOpacity, {
    key: method,
    accessibilityRole: "radio",
    accessibilityState: {
      checked: filterMethod === method
    },
    onPress: () => setFilterMethod(method),
    style: {
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 6,
      backgroundColor: filterMethod === method ? C.primary : C.surfaceLight,
      borderWidth: 1,
      borderColor: filterMethod === method ? C.primary : C.border
    }
  }, /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: {
      color: filterMethod === method ? '#FFF' : C.text,
      fontSize: 9,
      fontWeight: '700'
    }
  }, method === 'ALL' ? t.allMethods : method)))), /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: {
      color: C.textDim,
      fontSize: 9,
      fontWeight: '700',
      letterSpacing: 0.5,
      marginBottom: 4
    }
  }, t.timeFilter), /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    style: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 4,
      marginBottom: 8
    }
  }, [{
    label: t.timeCustom,
    value: null
  }, {
    label: t.time5min,
    value: 5
  }, {
    label: t.time15min,
    value: 15
  }, {
    label: t.time1hour,
    value: 60
  }].map(opt => /*#__PURE__*/_react.default.createElement(_reactNative.TouchableOpacity, {
    key: opt.label,
    accessibilityRole: "radio",
    accessibilityState: {
      checked: timeRangeMinutes === opt.value
    },
    onPress: () => setTimeRangeMinutes(opt.value),
    style: {
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 6,
      backgroundColor: timeRangeMinutes === opt.value ? C.primary : C.surfaceLight,
      borderWidth: 1,
      borderColor: timeRangeMinutes === opt.value ? C.primary : C.border
    }
  }, /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: {
      color: timeRangeMinutes === opt.value ? '#FFF' : C.text,
      fontSize: 9,
      fontWeight: '700'
    }
  }, opt.label)))), /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: {
      color: C.textDim,
      fontSize: 9,
      fontWeight: '700',
      letterSpacing: 0.5,
      marginBottom: 4
    }
  }, t.domainFilter), /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    style: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 4,
      marginBottom: 8
    }
  }, /*#__PURE__*/_react.default.createElement(_reactNative.TouchableOpacity, {
    accessibilityRole: "radio",
    accessibilityState: {
      checked: selectedDomain === null
    },
    onPress: () => setSelectedDomain(null),
    style: {
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 6,
      backgroundColor: selectedDomain === null ? C.primary : C.surfaceLight,
      borderWidth: 1,
      borderColor: selectedDomain === null ? C.primary : C.border
    }
  }, /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: {
      color: selectedDomain === null ? '#FFF' : C.text,
      fontSize: 9,
      fontWeight: '700'
    }
  }, t.domainAny)), logs.filter(l => l.url && l.type !== 'websocket' && l.type !== 'performance' && l.type !== 'action' && l.type !== 'info').map(l => extractDomain(l.url)).filter((d, i, arr) => arr.indexOf(d) === i).slice(0, 10).map(domain => /*#__PURE__*/_react.default.createElement(_reactNative.TouchableOpacity, {
    key: domain,
    accessibilityRole: "radio",
    accessibilityState: {
      checked: selectedDomain === domain
    },
    onPress: () => setSelectedDomain(domain === selectedDomain ? null : domain),
    style: {
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 6,
      backgroundColor: selectedDomain === domain ? C.primary : C.surfaceLight,
      borderWidth: 1,
      borderColor: selectedDomain === domain ? C.primary : C.border
    }
  }, /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: {
      color: selectedDomain === domain ? '#FFF' : C.text,
      fontSize: 9,
      fontWeight: '700'
    },
    numberOfLines: 1
  }, domain.length > 20 ? domain.slice(0, 18) + '…' : domain)))), /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    style: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginTop: 4
    }
  }, /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    style: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8
    }
  }, /*#__PURE__*/_react.default.createElement(_reactNative.TouchableOpacity, {
    accessibilityRole: "switch",
    accessibilityState: {
      checked: regexMode
    },
    onPress: () => setRegexMode(!regexMode),
    style: {
      width: 36,
      height: 20,
      borderRadius: 10,
      backgroundColor: regexMode ? C.primary : C.border,
      justifyContent: 'center',
      paddingHorizontal: 2
    }
  }, /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    style: {
      width: 16,
      height: 16,
      borderRadius: 8,
      backgroundColor: '#FFF',
      alignSelf: regexMode ? 'flex-end' : 'flex-start'
    }
  })), /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: {
      color: C.text,
      fontSize: 10,
      fontWeight: '700',
      letterSpacing: 0.5
    }
  }, t.regexToggle)), /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    style: {
      flexDirection: 'row',
      gap: 6
    }
  }, /*#__PURE__*/_react.default.createElement(_reactNative.TouchableOpacity, {
    accessibilityRole: "button",
    accessibilityLabel: t.savePreset,
    onPress: () => {
      const name = `Preset ${searchPresets.length + 1}`;
      setSearchPresets([...searchPresets, {
        name,
        query: searchQuery,
        method: filterMethod,
        status: filterStatus,
        domain: selectedDomain,
        time: timeRangeMinutes,
        regex: regexMode
      }]);
    },
    style: {
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 6,
      backgroundColor: C.primary + '20',
      borderWidth: 1,
      borderColor: C.primary + '40'
    }
  }, /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: {
      color: C.primary,
      fontSize: 9,
      fontWeight: '700'
    }
  }, t.savePreset)), searchPresets.length > 0 ? /*#__PURE__*/_react.default.createElement(_reactNative.TouchableOpacity, {
    accessibilityRole: "button",
    accessibilityLabel: t.loadPreset,
    onPress: () => {
      const names = searchPresets.map(p => p.name);
      _reactNative.Alert.alert(t.presets, t.savedPresets, [...searchPresets.map((p, i) => ({
        text: p.name,
        onPress: () => {
          setSearchQuery(p.query);
          setFilterMethod(p.method);
          setFilterStatus(p.status);
          setSelectedDomain(p.domain);
          setTimeRangeMinutes(p.time);
          setRegexMode(p.regex);
        }
      })), {
        text: t.cancel,
        style: 'cancel'
      }]);
    },
    style: {
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 6,
      backgroundColor: C.primary + '20',
      borderWidth: 1,
      borderColor: C.primary + '40'
    }
  }, /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: {
      color: C.primary,
      fontSize: 9,
      fontWeight: '700'
    }
  }, t.loadPreset)) : null))) : null) : null) : null, compareIds.length > 0 && /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    style: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 10,
      paddingVertical: 6,
      backgroundColor: C.primary + '18',
      borderBottomWidth: 1,
      borderBottomColor: C.border
    }
  }, /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: {
      color: C.primary,
      fontSize: 11,
      fontWeight: '700'
    }
  }, t.compare, ": ", compareIds.length, "/2 selected"), /*#__PURE__*/_react.default.createElement(_reactNative.TouchableOpacity, {
    accessibilityRole: "button",
    accessibilityLabel: "Clear compare selection",
    hitSlop: {
      top: 8,
      bottom: 8,
      left: 8,
      right: 8
    },
    onPress: () => setCompareIds([])
  }, /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: {
      color: C.error,
      fontSize: 12,
      fontWeight: '700'
    }
  }, t.close))), activeTab === 'SETTINGS' ? /*#__PURE__*/_react.default.createElement(_SettingsPanel.default, {
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
  }) : activeTab === 'MEMORY' ? /*#__PURE__*/_react.default.createElement(_MemoryPanel.default, {
    memStats: memStats,
    memRunning: memRunning,
    C: C,
    t: t,
    onToggleMem: setMemRunning
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
  }) : activeTab === 'NOTIFICATIONS' ? /*#__PURE__*/_react.default.createElement(_NotificationPanel.default, {
    C: C,
    t: t
  }) : activeTab === 'NAVFLOW' ? /*#__PURE__*/_react.default.createElement(_NavigationFlowPanel.default, {
    C: C,
    t: t
  }) : activeTab === 'NETWORK' && showWaterfall ? /*#__PURE__*/_react.default.createElement(_TimelinePanel.default, {
    logs: filteredLogs,
    C: C,
    t: t,
    enabled: showWaterfall,
    onToggle: () => setShowWaterfall(false)
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
    }, /*#__PURE__*/_react.default.createElement(_reactNative.Animated.View, _extends({
      style: [styles.detailSheet, {
        transform: [{
          translateY: detailTranslateY
        }],
        opacity: detailOpacity
      }]
    }, detailPanResponder.panHandlers), /*#__PURE__*/_react.default.createElement(_reactNative.View, {
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
      onPress: async () => {
        if (selectedLog) {
          setLoading('Generating cURL...');
          try {
            const curl = generateCurl(selectedLog);
            await _reactNative.Share.share({
              message: curl || JSON.stringify(selectedLog, null, 2),
              title: t.curlCommand
            });
          } catch {
            // user cancelled share
          } finally {
            setLoading(null);
          }
        }
        setShowMenu(false);
      }
    }, /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
      style: styles.detailDropdownText
    }, t.shareCurl)), selectedLog?.url && /*#__PURE__*/_react.default.createElement(_reactNative.TouchableOpacity, {
      accessibilityRole: "menuitem",
      style: styles.detailDropdownItem,
      onPress: () => {
        if (selectedLog) handleReplayRequest(selectedLog);
        setShowMenu(false);
      }
    }, /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
      style: styles.detailDropdownText
    }, t.replayRequest)), /*#__PURE__*/_react.default.createElement(_reactNative.TouchableOpacity, {
      accessibilityRole: "menuitem",
      style: styles.detailDropdownItem,
      onPress: () => {
        if (selectedLog) {
          const next = new Set(bookmarkedIds);
          if (next.has(selectedLog.id)) {
            next.delete(selectedLog.id);
          } else {
            next.add(selectedLog.id);
          }
          setBookmarkedIds(next);
        }
        setShowMenu(false);
      }
    }, /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
      style: styles.detailDropdownText
    }, selectedLog && bookmarkedIds.has(selectedLog.id) ? '★ ' + t.bookmark : '☆ ' + t.bookmark)), /*#__PURE__*/_react.default.createElement(_reactNative.TouchableOpacity, {
      accessibilityRole: "menuitem",
      style: styles.detailDropdownItem,
      onPress: () => {
        if (selectedLog) {
          if (compareIds.includes(selectedLog.id)) {
            setCompareIds(compareIds.filter(id => id !== selectedLog.id));
          } else if (compareIds.length === 0) {
            setCompareIds([selectedLog.id]);
          } else if (compareIds.length === 1) {
            setCompareIds([compareIds[0], selectedLog.id]);
            setShowCompareModal(true);
          } else {
            setCompareIds([selectedLog.id]);
          }
        }
        setSelectedLog(null);
        setShowMenu(false);
      }
    }, /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
      style: [styles.detailDropdownText, compareIds.includes(selectedLog?.id || '') ? {
        color: C.primary
      } : undefined]
    }, t.selectForCompare)), customActions?.map((action, i) => /*#__PURE__*/_react.default.createElement(_reactNative.TouchableOpacity, {
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
    }), selectedLog?.graphql && selectedLog.graphql.operationType !== 'unknown' && /*#__PURE__*/_react.default.createElement(Section, {
      themeColors: C,
      label: t.graphqlOperation,
      value: selectedLog.graphql.operationType.toUpperCase(),
      onCopy: handleCopy
    }), selectedLog?.graphql?.operationName && /*#__PURE__*/_react.default.createElement(Section, {
      themeColors: C,
      label: t.graphqlOperationName,
      value: selectedLog.graphql.operationName,
      onCopy: handleCopy
    }), selectedLog?.graphql?.variables && /*#__PURE__*/_react.default.createElement(Section, {
      themeColors: C,
      label: t.graphqlVariables,
      json: selectedLog.graphql.variables,
      onCopy: handleCopy
    }), selectedLog?.graphql?.query && /*#__PURE__*/_react.default.createElement(Section, {
      themeColors: C,
      label: t.graphqlQuery,
      value: selectedLog.graphql.query,
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
  })()), /*#__PURE__*/_react.default.createElement(_reactNative.Modal, {
    visible: showCompareModal,
    animationType: "slide",
    presentationStyle: "pageSheet",
    onRequestClose: () => {
      setShowCompareModal(false);
      setCompareIds([]);
    }
  }, (() => {
    const logA = logs.find(l => l.id === compareIds[0]);
    const logB = logs.find(l => l.id === compareIds[1]);
    if (!logA || !logB) {
      return /*#__PURE__*/_react.default.createElement(_reactNative.View, {
        style: {
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: C.background
        }
      }, /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
        style: {
          color: C.textDim,
          fontSize: 14
        }
      }, t.noDiff));
    }
    const statusA = logA.status?.toString() || '-';
    const statusB = logB.status?.toString() || '-';
    const durationA = logA.durationMs ? `${logA.durationMs}ms` : '-';
    const durationB = logB.durationMs ? `${logB.durationMs}ms` : '-';
    const fields = [{
      label: 'Method',
      valueA: logA.method || '-',
      valueB: logB.method || '-',
      diff: (logA.method || '') !== (logB.method || '')
    }, {
      label: 'URL',
      valueA: logA.url || '-',
      valueB: logB.url || '-',
      diff: (logA.url || '') !== (logB.url || '')
    }, {
      label: 'Status',
      valueA: statusA,
      valueB: statusB,
      diff: statusA !== statusB
    }, {
      label: 'Duration',
      valueA: durationA,
      valueB: durationB,
      diff: durationA !== durationB
    }];
    const hasDiff = fields.some(f => f.diff);
    const CompareRow = ({
      field
    }) => /*#__PURE__*/_react.default.createElement(_reactNative.View, {
      style: {
        flexDirection: 'row',
        marginBottom: 12
      }
    }, /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
      style: {
        width: 72,
        color: C.textDim,
        fontSize: 10,
        fontWeight: '700',
        letterSpacing: 0.5
      }
    }, field.label), /*#__PURE__*/_react.default.createElement(_reactNative.View, {
      style: {
        flex: 1,
        paddingRight: 6
      }
    }, /*#__PURE__*/_react.default.createElement(_reactNative.View, {
      style: [styles.sectionBox, field.diff ? {
        borderColor: C.warning,
        borderWidth: 1
      } : undefined]
    }, /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
      selectable: true,
      style: [styles.sectionValue, field.diff ? {
        color: C.warning
      } : undefined],
      numberOfLines: 4
    }, field.valueA || '-'))), /*#__PURE__*/_react.default.createElement(_reactNative.View, {
      style: {
        flex: 1,
        paddingLeft: 6
      }
    }, /*#__PURE__*/_react.default.createElement(_reactNative.View, {
      style: [styles.sectionBox, field.diff ? {
        borderColor: C.warning,
        borderWidth: 1
      } : undefined]
    }, /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
      selectable: true,
      style: [styles.sectionValue, field.diff ? {
        color: C.warning
      } : undefined],
      numberOfLines: 4
    }, field.valueB || '-'))));
    return /*#__PURE__*/_react.default.createElement(_reactNative.View, {
      style: {
        flex: 1,
        backgroundColor: C.background
      }
    }, /*#__PURE__*/_react.default.createElement(_reactNative.View, {
      style: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: C.border
      }
    }, /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
      style: {
        color: C.text,
        fontSize: 16,
        fontWeight: '700'
      }
    }, t.comparisonTitle), /*#__PURE__*/_react.default.createElement(_reactNative.TouchableOpacity, {
      accessibilityRole: "button",
      accessibilityLabel: t.close,
      hitSlop: {
        top: 8,
        bottom: 8,
        left: 8,
        right: 8
      },
      onPress: () => {
        setShowCompareModal(false);
        setCompareIds([]);
      },
      style: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
        backgroundColor: C.surfaceLight
      }
    }, /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
      style: {
        color: C.primary,
        fontSize: 13,
        fontWeight: '700'
      }
    }, t.close))), /*#__PURE__*/_react.default.createElement(_reactNative.ScrollView, {
      style: {
        flex: 1,
        padding: 16
      },
      showsVerticalScrollIndicator: false
    }, !hasDiff ? /*#__PURE__*/_react.default.createElement(_reactNative.View, {
      style: {
        alignItems: 'center',
        paddingVertical: 12,
        marginBottom: 12
      }
    }, /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
      style: {
        color: C.success,
        fontSize: 13,
        fontWeight: '700'
      }
    }, t.noDiff)) : /*#__PURE__*/_react.default.createElement(_reactNative.View, {
      style: {
        alignItems: 'center',
        paddingVertical: 12,
        marginBottom: 12
      }
    }, /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
      style: {
        color: C.warning,
        fontSize: 11,
        fontWeight: '600'
      }
    }, "Differences highlighted in ", C.warning)), /*#__PURE__*/_react.default.createElement(_reactNative.View, {
      style: {
        flexDirection: 'row',
        marginBottom: 8
      }
    }, /*#__PURE__*/_react.default.createElement(_reactNative.View, {
      style: {
        width: 72
      }
    }), /*#__PURE__*/_react.default.createElement(_reactNative.View, {
      style: {
        flex: 1,
        alignItems: 'center',
        paddingRight: 6
      }
    }, /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
      style: {
        color: C.primary,
        fontSize: 9,
        fontWeight: '800',
        letterSpacing: 0.5
      }
    }, "REQUEST A")), /*#__PURE__*/_react.default.createElement(_reactNative.View, {
      style: {
        flex: 1,
        alignItems: 'center',
        paddingLeft: 6
      }
    }, /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
      style: {
        color: C.primary,
        fontSize: 9,
        fontWeight: '800',
        letterSpacing: 0.5
      }
    }, "REQUEST B"))), fields.map(field => /*#__PURE__*/_react.default.createElement(CompareRow, {
      key: field.label,
      field: field
    })), /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
      style: {
        color: C.textDim,
        fontSize: 10,
        fontWeight: '700',
        letterSpacing: 0.5,
        marginTop: 8,
        marginBottom: 8
      }
    }, t.headers?.toUpperCase?.() || 'HEADERS'), /*#__PURE__*/_react.default.createElement(_reactNative.View, {
      style: {
        flexDirection: 'row',
        marginBottom: 12
      }
    }, /*#__PURE__*/_react.default.createElement(_reactNative.View, {
      style: {
        flex: 1,
        paddingRight: 6
      }
    }, /*#__PURE__*/_react.default.createElement(_reactNative.View, {
      style: [styles.sectionBox]
    }, /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
      selectable: true,
      style: styles.sectionValue
    }, logA.requestHeaders ? JSON.stringify(logA.requestHeaders, null, 2) : '-'))), /*#__PURE__*/_react.default.createElement(_reactNative.View, {
      style: {
        flex: 1,
        paddingLeft: 6
      }
    }, /*#__PURE__*/_react.default.createElement(_reactNative.View, {
      style: [styles.sectionBox]
    }, /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
      selectable: true,
      style: styles.sectionValue
    }, logB.requestHeaders ? JSON.stringify(logB.requestHeaders, null, 2) : '-')))), /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
      style: {
        color: C.textDim,
        fontSize: 10,
        fontWeight: '700',
        letterSpacing: 0.5,
        marginTop: 8,
        marginBottom: 8
      }
    }, t.body?.toUpperCase?.() || 'BODY'), /*#__PURE__*/_react.default.createElement(_reactNative.View, {
      style: {
        flexDirection: 'row',
        marginBottom: 12
      }
    }, /*#__PURE__*/_react.default.createElement(_reactNative.View, {
      style: {
        flex: 1,
        paddingRight: 6
      }
    }, /*#__PURE__*/_react.default.createElement(_reactNative.View, {
      style: [styles.sectionBox]
    }, /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
      selectable: true,
      style: styles.sectionValue
    }, logA.requestData ? JSON.stringify(logA.requestData, null, 2) : '-'))), /*#__PURE__*/_react.default.createElement(_reactNative.View, {
      style: {
        flex: 1,
        paddingLeft: 6
      }
    }, /*#__PURE__*/_react.default.createElement(_reactNative.View, {
      style: [styles.sectionBox]
    }, /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
      selectable: true,
      style: styles.sectionValue
    }, logB.requestData ? JSON.stringify(logB.requestData, null, 2) : '-')))), /*#__PURE__*/_react.default.createElement(_reactNative.View, {
      style: {
        height: 40
      }
    })));
  })())), Toasts, LoadingOverlay);
};
exports.DebugMonitor = DebugMonitor;
//# sourceMappingURL=DebugMonitor.js.map