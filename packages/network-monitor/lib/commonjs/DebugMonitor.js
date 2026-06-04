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
var _ExportReport = require("./ExportReport");
var _NetworkMonitor = require("./NetworkMonitor");
var _FileExporter = require("./FileExporter");
var _translations = require("./translations");
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
  themeColors
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
  return /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    style: styles.sectionBox
  }, /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: styles.sectionLabel
  }, label), value ? /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
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
  const effectiveTheme = theme === 'auto' ? systemScheme === 'light' ? 'light' : 'dark' : theme;
  const C = (0, _DebugMonitorStyles.getColors)(effectiveTheme, customColors);
  const styles = (0, _DebugMonitorStyles.default)(C);
  const [logs, setLogs] = (0, _react.useState)(_Logger.Logger.getLogs());
  const [selectedLog, setSelectedLog] = (0, _react.useState)(null);
  const [activeTab, setActiveTab] = (0, _react.useState)('ALL');
  const [detailTab, setDetailTab] = (0, _react.useState)('RESPONSE');
  const [showMenu, setShowMenu] = (0, _react.useState)(false);
  const [searchQuery, setSearchQuery] = (0, _react.useState)('');
  const [filterStatus, setFilterStatus] = (0, _react.useState)('ALL');
  const [baseUrl, setBaseUrl] = (0, _react.useState)(_Logger.Logger.getBaseUrl());
  const [manualUrl, setManualUrl] = (0, _react.useState)('');
  const [, setCustomUrlEntries] = (0, _react.useState)(_Logger.Logger.getCustomUrls());
  const [filterMethod] = (0, _react.useState)('ALL');
  const [fpsStats, setFpsStats] = (0, _react.useState)(null);
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
  const handleExportJson = async () => {
    try {
      const report = (0, _ExportReport.generateExportReport)(logs);
      await _reactNative.Share.share({
        message: JSON.stringify(report, null, 2),
        title: t.reportTitle
      });
    } catch (e) {
      _reactNative.Alert.alert(t.error, t.couldNotShareReport);
    }
  };
  const handleExportText = async () => {
    try {
      const report = (0, _ExportReport.generateExportReport)(logs);
      const text = (0, _ExportReport.formatReportAsText)(report);
      await _reactNative.Share.share({
        message: text,
        title: t.reportTitle
      });
    } catch (e) {
      _reactNative.Alert.alert(t.error, t.couldNotShareReport);
    }
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
      _reactNative.Alert.alert(t.error, t.couldNotShareLog);
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
   * handleSaveSettings
   *
   * Validate and apply manual base URL settings supplied by the user.
   *
   * @returns void
   */
  const handleSaveSettings = () => {
    const newUrl = manualUrl.trim();
    if (!newUrl) {
      _reactNative.Alert.alert(t.error, t.pleaseEnterUrl);
      return;
    }
    try {
      const parsed = new URL(newUrl);
      if (!['http:', 'https:'].includes(parsed.protocol)) {
        _reactNative.Alert.alert(t.error, t.urlMustStartWith);
        return;
      }
      const host = parsed.hostname;
      const isIp = /^(\d{1,3}\.){3}\d{1,3}$/.test(host);
      const isLocal = host === 'localhost';
      const hasDot = host.includes('.');
      if (!isLocal && !isIp && !hasDot) {
        _reactNative.Alert.alert(t.error, t.invalidDomainFormat);
        return;
      }
    } catch (e) {
      _reactNative.Alert.alert(t.error, t.invalidUrlFormat);
      return;
    }
    _Logger.Logger.setBaseUrl(newUrl);
    setBaseUrl(newUrl);
    _Logger.Logger.addCustomUrl({
      title: `Custom ${_Logger.Logger.getCustomUrls().length + 1}`,
      url: newUrl
    });
    setCustomUrlEntries(_Logger.Logger.getCustomUrls());
    setManualUrl('');
    if (onBaseUrlChange) onBaseUrlChange(newUrl);
    _reactNative.Alert.alert(t.success, t.newSourceApplied);
  };

  /**
   * handleRemoveCustomUrl
   *
   * Remove a custom URL entry from the Logger and update local state.
   *
   * @param url - URL string to remove
   * @returns void
   */
  const handleRemoveCustomUrl = url => {
    _Logger.Logger.removeCustomUrl(url);
    setCustomUrlEntries(_Logger.Logger.getCustomUrls());
    setBaseUrl(_Logger.Logger.getBaseUrl());
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
    item
  }) => {
    const isConsoleError = item.type === 'info' && item.message?.startsWith('[ERROR]');
    const isError = item.type === 'error' || item.status && item.status >= 400 || isConsoleError;
    const indicatorColor = isError ? C.error : item.type === 'database' ? C.accent : item.type === 'navigation' ? C.warning : item.status && item.status >= 200 && item.status < 300 ? C.success : C.primary;
    return /*#__PURE__*/_react.default.createElement(_reactNative.TouchableOpacity, {
      activeOpacity: 0.7,
      style: styles.logItem,
      onPress: () => {
        setSelectedLog(item);
        setDetailTab('RESPONSE');
      }
    }, /*#__PURE__*/_react.default.createElement(_reactNative.View, {
      style: [styles.logIndicator, {
        backgroundColor: indicatorColor
      }]
    }), /*#__PURE__*/_react.default.createElement(_reactNative.View, {
      style: styles.logBody
    }, /*#__PURE__*/_react.default.createElement(_reactNative.View, {
      style: styles.logRow
    }, /*#__PURE__*/_react.default.createElement(_reactNative.View, {
      style: [styles.logChip, {
        backgroundColor: indicatorColor + '18'
      }]
    }, /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
      style: [styles.logChipText, {
        color: indicatorColor
      }]
    }, item.method || (isConsoleError ? t.logChipError : (item.type || '').toUpperCase()))), item.status ? /*#__PURE__*/_react.default.createElement(_reactNative.View, {
      style: [styles.logStatusChip, {
        backgroundColor: indicatorColor + '18'
      }]
    }, /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
      style: [styles.logStatusText, {
        color: indicatorColor
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
  };

  /**
   * renderSettings
   *
   * Render settings panel including environment selection and custom URLs.
   *
   * @returns JSX.Element
   */
  const renderSettings = () => {
    const predefinedList = baseUrls ? Array.isArray(baseUrls) ? baseUrls : [] : [];
    const allCustoms = _Logger.Logger.getCustomUrls();
    const allSources = [];
    if (prodUrl) {
      allSources.push({
        title: t.productionApi,
        url: prodUrl,
        type: 'url',
        val: prodUrl
      });
    }
    if (testUrl) {
      allSources.push({
        title: t.testApi,
        url: testUrl,
        type: 'url',
        val: testUrl
      });
    }
    if (envConfig) {
      allSources.push({
        title: t.productive,
        type: 'env',
        val: 'prod'
      });
      allSources.push({
        title: t.demonstration,
        type: 'env',
        val: 'demo'
      });
    }
    predefinedList.forEach(item => {
      const title = typeof item === 'string' ? item : item.title;
      const url = typeof item === 'string' ? item : item.url;
      allSources.push({
        title,
        url,
        type: 'url',
        val: url
      });
    });
    allCustoms.forEach(item => {
      allSources.push({
        title: item.title,
        url: item.url,
        type: 'url',
        val: item.url
      });
    });
    return /*#__PURE__*/_react.default.createElement(_reactNative.ScrollView, {
      style: styles.settingsContainer
    }, allSources.length > 0 ? /*#__PURE__*/_react.default.createElement(_reactNative.View, {
      style: styles.settingsSection
    }, /*#__PURE__*/_react.default.createElement(_reactNative.View, {
      style: styles.settingsSectionHeader
    }, /*#__PURE__*/_react.default.createElement(_reactNative.View, {
      style: styles.settingsSectionLine
    }), /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
      style: styles.settingsSectionTitle
    }, t.selectSource)), /*#__PURE__*/_react.default.createElement(_reactNative.View, {
      style: styles.settingsCard
    }, allSources.map((item, index) => {
      const isUrlActive = baseUrl !== '' && baseUrl === item.val;
      const isEnvActive = baseUrl === '' && item.type === 'env' && envConfig?.currentEnv === item.val;
      const isActive = item.type === 'env' ? isEnvActive : isUrlActive;
      const isCustom = allCustoms.some(u => u.url === item.val);
      return /*#__PURE__*/_react.default.createElement(_reactNative.View, {
        key: index,
        style: [styles.urlOption, isActive && styles.urlOptionActive]
      }, /*#__PURE__*/_react.default.createElement(_reactNative.TouchableOpacity, {
        style: styles.urlOptionInfo,
        onPress: () => {
          if (item.type === 'env') {
            setBaseUrl('');
            _Logger.Logger.setBaseUrl('');
            envConfig?.onEnvChange(item.val);
          } else {
            setBaseUrl(item.val);
            _Logger.Logger.setBaseUrl(item.val);
            if (onBaseUrlChange) onBaseUrlChange(item.val);
          }
        }
      }, /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
        style: [styles.urlOptionTitle, isActive && styles.urlOptionTitleActive]
      }, item.title), item.url ? /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
        style: styles.urlOptionUrl,
        numberOfLines: 1
      }, item.url) : null), /*#__PURE__*/_react.default.createElement(_reactNative.View, {
        style: styles.optionActions
      }, isCustom ? /*#__PURE__*/_react.default.createElement(_reactNative.TouchableOpacity, {
        style: styles.deleteBtn,
        onPress: () => handleRemoveCustomUrl(item.val)
      }, /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
        style: styles.deleteBtnText
      }, "\u2715")) : null, isActive ? /*#__PURE__*/_react.default.createElement(_reactNative.View, {
        style: styles.activeDot
      }) : null));
    }))) : null, /*#__PURE__*/_react.default.createElement(_reactNative.View, {
      style: [styles.settingsSection, {
        marginTop: allSources.length > 0 ? 32 : 0
      }]
    }, /*#__PURE__*/_react.default.createElement(_reactNative.View, {
      style: styles.settingsSectionHeader
    }, /*#__PURE__*/_react.default.createElement(_reactNative.View, {
      style: styles.settingsSectionLine
    }), /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
      style: styles.settingsSectionTitle
    }, t.manualEntry)), /*#__PURE__*/_react.default.createElement(_reactNative.View, {
      style: styles.settingsCard
    }, /*#__PURE__*/_react.default.createElement(_reactNative.View, {
      style: styles.cardInner
    }, /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
      style: styles.inputLabel
    }, t.customUrl?.toUpperCase() || ''), /*#__PURE__*/_react.default.createElement(_reactNative.TextInput, {
      style: styles.textInput,
      value: manualUrl,
      placeholder: t.manualUrlPlaceholder,
      placeholderTextColor: C.textDim,
      autoCapitalize: "none",
      keyboardType: "url",
      onChangeText: setManualUrl
    }), /*#__PURE__*/_react.default.createElement(_reactNative.TouchableOpacity, {
      style: styles.saveBtn,
      onPress: handleSaveSettings
    }, /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
      style: styles.saveBtnText
    }, t.applyChanges))))), /*#__PURE__*/_react.default.createElement(_reactNative.View, {
      style: [styles.settingsSection, {
        marginTop: 32
      }]
    }, /*#__PURE__*/_react.default.createElement(_reactNative.View, {
      style: styles.settingsSectionHeader
    }, /*#__PURE__*/_react.default.createElement(_reactNative.View, {
      style: styles.settingsSectionLine
    }), /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
      style: styles.settingsSectionTitle
    }, t.deviceInfo)), /*#__PURE__*/_react.default.createElement(_reactNative.View, {
      style: styles.settingsCard
    }, /*#__PURE__*/_react.default.createElement(_reactNative.View, {
      style: styles.cardInner
    }, renderDeviceInfoSection()))), /*#__PURE__*/_react.default.createElement(_reactNative.View, {
      style: [styles.settingsSection, {
        marginTop: 32
      }]
    }, /*#__PURE__*/_react.default.createElement(_reactNative.View, {
      style: styles.settingsSectionHeader
    }, /*#__PURE__*/_react.default.createElement(_reactNative.View, {
      style: styles.settingsSectionLine
    }), /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
      style: styles.settingsSectionTitle
    }, t.advancedTools)), /*#__PURE__*/_react.default.createElement(_reactNative.View, {
      style: styles.settingsCard
    }, /*#__PURE__*/_react.default.createElement(_reactNative.View, {
      style: styles.cardInner
    }, /*#__PURE__*/_react.default.createElement(_reactNative.TouchableOpacity, {
      style: [styles.toolBtn, {
        margin: 0,
        marginBottom: 12
      }],
      onPress: handleExportJson
    }, /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
      style: styles.toolBtnText
    }, t.shareJsonReport)), /*#__PURE__*/_react.default.createElement(_reactNative.TouchableOpacity, {
      style: [styles.toolBtn, {
        margin: 0,
        marginBottom: 16
      }],
      onPress: handleExportText
    }, /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
      style: styles.toolBtnText
    }, t.shareTextReport)), /*#__PURE__*/_react.default.createElement(_reactNative.TouchableOpacity, {
      style: [styles.toolBtn, {
        margin: 0,
        marginBottom: 12,
        borderColor: C.accent + '40'
      }],
      onPress: () => (0, _FileExporter.saveReportToJson)(logs)
    }, /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
      style: [styles.toolBtnText, {
        color: C.accent
      }]
    }, t.saveJsonReportToFile)), /*#__PURE__*/_react.default.createElement(_reactNative.TouchableOpacity, {
      style: [styles.toolBtn, {
        margin: 0,
        marginBottom: 16,
        borderColor: C.accent + '40'
      }],
      onPress: () => (0, _FileExporter.saveReportToText)(logs)
    }, /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
      style: [styles.toolBtnText, {
        color: C.accent
      }]
    }, t.saveTextReportToFile)), /*#__PURE__*/_react.default.createElement(_reactNative.TouchableOpacity, {
      style: [styles.toolBtn, {
        margin: 0,
        borderColor: C.error + '40'
      }],
      onPress: () => _Logger.Logger.clearLogs()
    }, /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
      style: [styles.toolBtnText, {
        color: C.error
      }]
    }, t.wipeAllRecords))))), /*#__PURE__*/_react.default.createElement(_reactNative.View, {
      style: {
        height: 60
      }
    }));
  };
  const renderStoreLogs = () => {
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
    return /*#__PURE__*/_react.default.createElement(_reactNative.FlatList, {
      data: storeLogs,
      renderItem: ({
        item
      }) => {
        const sd = item.stateData;
        const hasDiff = sd?.diff && Object.keys(sd.diff).length > 0;
        const changedKeys = hasDiff ? Object.keys(sd.diff).join(', ') : null;
        return /*#__PURE__*/_react.default.createElement(_reactNative.TouchableOpacity, {
          activeOpacity: 0.7,
          style: styles.logItem,
          onPress: () => {
            setSelectedLog(item);
            setDetailTab('RESPONSE');
          }
        }, /*#__PURE__*/_react.default.createElement(_reactNative.View, {
          style: [styles.logIndicator, {
            backgroundColor: C.accent
          }]
        }), /*#__PURE__*/_react.default.createElement(_reactNative.View, {
          style: styles.logBody
        }, /*#__PURE__*/_react.default.createElement(_reactNative.View, {
          style: styles.logRow
        }, /*#__PURE__*/_react.default.createElement(_reactNative.View, {
          style: [styles.logChip, {
            backgroundColor: C.accent + '18'
          }]
        }, /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
          style: [styles.logChipText, {
            color: C.accent
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
        }, t.snapshot))) : null));
      },
      keyExtractor: item => item.id,
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
    });
  };
  const renderPerformance = () => {
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
          setPerfRunning(false);
        } else {
          (0, _PerformanceMonitor.startPerformanceMonitor)();
          setPerfRunning(true);
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
    }, Array.from({
      length: Math.min(60, fps.fps)
    }, (_, i) => {
      const h = Math.max(4, fps.averageFps / 60 * 80);
      return /*#__PURE__*/_react.default.createElement(_reactNative.View, {
        key: i,
        style: {
          flex: 1,
          height: h,
          backgroundColor: barColor,
          borderRadius: 1,
          opacity: 0.5 + i / 60 * 0.5
        }
      });
    })))), !fps && /*#__PURE__*/_react.default.createElement(_reactNative.View, {
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
  const renderWebSocket = () => {
    const wsLogs = logs.filter(l => l.type === 'websocket');
    if (wsLogs.length === 0) {
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
      }, "\uD83D\uDD0C"), /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
        style: [styles.perfLabel, {
          textAlign: 'center',
          marginBottom: 4
        }]
      }, t.noWebSocketActivity), /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
        style: [styles.perfLabel, {
          color: C.textSubtle,
          fontSize: 10,
          textAlign: 'center'
        }]
      }, t.wsSubtitle)));
    }
    return /*#__PURE__*/_react.default.createElement(_reactNative.ScrollView, {
      style: styles.wsContainer
    }, wsLogs.map(log => {
      const isOpen = log.message?.includes('OPEN');
      const isClose = log.message?.includes('CLOSE');
      const isError = log.message?.includes('ERROR');
      const badgeColor = isOpen ? C.success : isClose ? C.textDim : isError ? C.error : C.primary;
      return /*#__PURE__*/_react.default.createElement(_reactNative.View, {
        key: log.id,
        style: styles.wsItem
      }, /*#__PURE__*/_react.default.createElement(_reactNative.View, {
        style: styles.wsHeader
      }, /*#__PURE__*/_react.default.createElement(_reactNative.View, {
        style: [styles.wsBadge, {
          backgroundColor: badgeColor + '20'
        }]
      }, /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
        style: [styles.wsBadgeText, {
          color: badgeColor
        }]
      }, isOpen ? t.wsOpen : isClose ? t.wsClose : isError ? t.wsError : t.wsMsg)), /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
        style: styles.wsUrl,
        numberOfLines: 1
      }, log.url), /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
        style: styles.wsTime
      }, new Date(log.timestamp).toLocaleTimeString([], {
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      }))), log.message && /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
        style: styles.wsMessage,
        numberOfLines: 3
      }, log.message), log.requestData && /*#__PURE__*/_react.default.createElement(_reactNative.View, {
        style: [styles.jsonBox, {
          marginTop: 8,
          padding: 10
        }]
      }, /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
        style: styles.jsonText,
        numberOfLines: 5
      }, typeof log.requestData === 'string' ? log.requestData : JSON.stringify(log.requestData, null, 2))));
    }), /*#__PURE__*/_react.default.createElement(_reactNative.View, {
      style: {
        height: 40
      }
    }));
  };
  const renderDeviceInfoSection = () => {
    const info = deviceInfo;
    return /*#__PURE__*/_react.default.createElement(_reactNative.View, null, /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
      style: styles.deviceSectionTitle
    }, t.device), /*#__PURE__*/_react.default.createElement(_reactNative.View, {
      style: styles.deviceRow
    }, /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
      style: styles.deviceLabel
    }, t.platform), /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
      style: styles.deviceValue
    }, info.platform, " ", info.osVersion)), /*#__PURE__*/_react.default.createElement(_reactNative.View, {
      style: styles.deviceRow
    }, /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
      style: styles.deviceLabel
    }, t.model), /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
      style: styles.deviceValue
    }, info.deviceName)), /*#__PURE__*/_react.default.createElement(_reactNative.View, {
      style: styles.deviceRow
    }, /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
      style: styles.deviceLabel
    }, t.screen), /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
      style: styles.deviceValue
    }, info.screenWidth, "x", info.screenHeight, " @", info.screenScale, "x")), /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
      style: [styles.deviceSectionTitle, {
        marginTop: 24
      }]
    }, t.application), info.appVersion && /*#__PURE__*/_react.default.createElement(_reactNative.View, {
      style: styles.deviceRow
    }, /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
      style: styles.deviceLabel
    }, t.appVersion), /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
      style: styles.deviceValue
    }, info.appVersion)), info.buildVersion && /*#__PURE__*/_react.default.createElement(_reactNative.View, {
      style: styles.deviceRow
    }, /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
      style: styles.deviceLabel
    }, t.buildVersion), /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
      style: styles.deviceValue
    }, info.buildVersion)));
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
    style: [styles.headerBtn, {
      backgroundColor: C.errorDim
    }],
    onPress: () => _Logger.Logger.clearLogs()
  }, /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: [styles.headerBtnText, {
      color: C.error,
      fontSize: 11,
      fontWeight: '800'
    }]
  }, "\u2715")), /*#__PURE__*/_react.default.createElement(_reactNative.TouchableOpacity, {
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
  }, availableTabs.map(tab => /*#__PURE__*/_react.default.createElement(_reactNative.TouchableOpacity, {
    key: tab,
    style: styles.tabItem,
    onPress: () => setActiveTab(tab)
  }, /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: [styles.tabText, activeTab === tab ? styles.tabTextActive : styles.tabTextInactive]
  }, tab === 'ALL' ? t.all : tab === 'NETWORK' ? t.network : tab === 'LOGS' ? t.logs : tab === 'WEBSOCKET' ? t.ws : tab === 'PERFORMANCE' ? t.fps : tab === 'STORE' ? t.store : t.settings, /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: styles.tabBadge
  }, tab !== 'SETTINGS' ? ` ${tabCounts[tab]}` : '')), activeTab === tab ? /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    style: styles.tabActiveLine
  }) : null)))), activeTab !== 'SETTINGS' ? /*#__PURE__*/_react.default.createElement(_reactNative.View, null, /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    style: styles.searchRow
  }, /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    style: styles.searchBox
  }, /*#__PURE__*/_react.default.createElement(_reactNative.TextInput, {
    style: styles.searchInput,
    placeholder: searchPlaceholder || t.search,
    placeholderTextColor: C.textDim,
    value: searchQuery,
    onChangeText: setSearchQuery
  }), searchQuery.length > 0 ? /*#__PURE__*/_react.default.createElement(_reactNative.TouchableOpacity, {
    onPress: () => setSearchQuery('')
  }, /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: styles.clearSearch
  }, "\u2715")) : null)), activeTab === 'NETWORK' ? /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    style: styles.filterRow
  }, ['ALL', 'OK', 'ERR'].map(s => /*#__PURE__*/_react.default.createElement(_reactNative.TouchableOpacity, {
    key: s,
    style: [styles.filterPill, filterStatus === s && styles.filterPillActive],
    onPress: () => setFilterStatus(s)
  }, /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: [styles.filterPillText, filterStatus === s ? styles.filterPillTextActive : styles.filterPillTextInactive]
  }, s === 'ALL' ? t.allFilter : s === 'OK' ? t.success2xx3xx : t.error4xx5xx)))) : null) : null, activeTab === 'SETTINGS' ? renderSettings() : activeTab === 'PERFORMANCE' ? renderPerformance() : activeTab === 'WEBSOCKET' ? renderWebSocket() : activeTab === 'STORE' ? renderStoreLogs() : /*#__PURE__*/_react.default.createElement(_reactNative.FlatList, {
    data: filteredLogs,
    renderItem: renderLogItem,
    keyExtractor: item => item.id,
    contentContainerStyle: [styles.listContent, filteredLogs.length === 0 && {
      flex: 1
    }],
    ListEmptyComponent: /*#__PURE__*/_react.default.createElement(_reactNative.View, {
      style: styles.emptyContainer
    }, /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
      style: styles.emptyIcon
    }, "\uD83D\uDCAC"), /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
      style: styles.emptyText
    }, t.empty), /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
      style: styles.emptySubText
    }, t.emptySubtitle))
  }), /*#__PURE__*/_react.default.createElement(_reactNative.Modal, {
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
      style: styles.detailMenu,
      onPress: () => setShowMenu(!showMenu)
    }, /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
      style: styles.detailMenuText
    }, "\u22EE"))), showMenu ? /*#__PURE__*/_react.default.createElement(_reactNative.View, {
      style: styles.detailDropdown
    }, /*#__PURE__*/_react.default.createElement(_reactNative.TouchableOpacity, {
      style: styles.detailDropdownItem,
      onPress: () => {
        handleShareLog(selectedLog);
        setShowMenu(false);
      }
    }, /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
      style: styles.detailDropdownText
    }, t.shareEntry)), /*#__PURE__*/_react.default.createElement(_reactNative.TouchableOpacity, {
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
      style: styles.detailDropdownItem,
      onPress: () => {
        if (selectedLog) action.onPress(selectedLog);
        setShowMenu(false);
      }
    }, /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
      style: styles.detailDropdownText
    }, action.label))), /*#__PURE__*/_react.default.createElement(_reactNative.TouchableOpacity, {
      style: [styles.detailDropdownItem, {
        borderBottomWidth: 0
      }],
      onPress: () => setShowMenu(false)
    }, /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
      style: styles.detailDropdownText
    }, t.closeMenu))) : null, selectedLog?.type !== 'info' && selectedLog?.type !== 'websocket' && selectedLog?.type !== 'performance' && selectedLog?.type !== 'action' ? /*#__PURE__*/_react.default.createElement(_reactNative.View, {
      style: styles.detailTabs
    }, /*#__PURE__*/_react.default.createElement(_reactNative.TouchableOpacity, {
      style: [styles.detailTab, detailTab === 'REQUEST' && styles.detailTabActive],
      onPress: () => setDetailTab('REQUEST')
    }, /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
      style: [styles.detailTabText, detailTab === 'REQUEST' ? styles.detailTabTextActive : styles.detailTabTextInactive]
    }, (t.request || '').toUpperCase())), /*#__PURE__*/_react.default.createElement(_reactNative.TouchableOpacity, {
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
      value: selectedLog.stateData.actionType || '-'
    }), /*#__PURE__*/_react.default.createElement(Section, {
      themeColors: C,
      label: t.actionPayload,
      json: selectedLog.stateData.actionPayload
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
      json: selectedLog.stateData.snapshot
    }) : null) : /*#__PURE__*/_react.default.createElement(_react.default.Fragment, null, /*#__PURE__*/_react.default.createElement(Section, {
      themeColors: C,
      selectable: true,
      label: selectedLog?.type === 'websocket' ? t.websocketEvent : selectedLog?.type === 'performance' ? t.performanceData : t.logMessage,
      value: selectedLog?.message
    }), selectedLog?.url ? /*#__PURE__*/_react.default.createElement(Section, {
      themeColors: C,
      selectable: true,
      label: t.url,
      value: selectedLog.url
    }) : null, /*#__PURE__*/_react.default.createElement(Section, {
      themeColors: C,
      label: t.data,
      json: selectedLog?.requestData
    }), selectedLog?.type === 'performance' && selectedLog?.durationMs ? /*#__PURE__*/_react.default.createElement(Section, {
      themeColors: C,
      label: t.fps,
      value: String(selectedLog.durationMs)
    }) : null)) : detailTab === 'REQUEST' ? /*#__PURE__*/_react.default.createElement(_react.default.Fragment, null, /*#__PURE__*/_react.default.createElement(Section, {
      themeColors: C,
      label: t.method,
      value: selectedLog?.method
    }), /*#__PURE__*/_react.default.createElement(Section, {
      themeColors: C,
      selectable: true,
      label: t.url,
      value: selectedLog?.isRedirected ? `${selectedLog?.originalUrl} ➔ ${selectedLog?.url}` : selectedLog?.url
    }), /*#__PURE__*/_react.default.createElement(Section, {
      themeColors: C,
      label: t.headers,
      json: selectedLog?.requestHeaders
    }), /*#__PURE__*/_react.default.createElement(Section, {
      themeColors: C,
      label: t.body,
      json: selectedLog?.requestData
    })) : /*#__PURE__*/_react.default.createElement(_react.default.Fragment, null, /*#__PURE__*/_react.default.createElement(Section, {
      themeColors: C,
      label: t.statusCode,
      value: selectedLog?.status?.toString(),
      color: selectedLog?.status && selectedLog.status >= 400 ? C.error : C.success
    }), /*#__PURE__*/_react.default.createElement(Section, {
      themeColors: C,
      label: t.headers,
      json: selectedLog?.responseHeaders
    }), /*#__PURE__*/_react.default.createElement(Section, {
      themeColors: C,
      label: t.body,
      json: selectedLog?.responseData
    })), /*#__PURE__*/_react.default.createElement(_reactNative.View, {
      style: {
        height: 100
      }
    }))));
  })())));
};
exports.DebugMonitor = DebugMonitor;
//# sourceMappingURL=DebugMonitor.js.map