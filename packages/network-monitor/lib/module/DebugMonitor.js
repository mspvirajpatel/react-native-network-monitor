/* eslint-disable no-unused-vars */
/* eslint-disable react-native/no-inline-styles */
/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Share, Modal, Alert, TextInput, StatusBar, FlatList, Animated, useColorScheme } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import styleSheet, { getColors } from './DebugMonitorStyles';
import { Logger } from './Logger';
import { subscribeToFps, isPerformanceMonitorRunning, startPerformanceMonitor, stopPerformanceMonitor, destroyPerformanceMonitor } from './PerformanceMonitor';
import { getDeviceInfo } from './DeviceInfo';
import { generateExportReport, formatReportAsText } from './ExportReport';
import { isInternalUrl } from './NetworkMonitor';
import { saveReportToJson, saveReportToText } from './FileExporter';
import { useDebugger } from './DebugContext';
import { useToast } from './Toast';
import { TRANSLATIONS, resolveLanguage } from './translations';
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
  const styles = styleSheet(themeColors);
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
  return /*#__PURE__*/React.createElement(View, {
    style: styles.sectionBox
  }, /*#__PURE__*/React.createElement(View, {
    style: styles.sectionLabelRow
  }, /*#__PURE__*/React.createElement(Text, {
    style: styles.sectionLabel
  }, label), onCopy && copyValue ? /*#__PURE__*/React.createElement(TouchableOpacity, {
    hitSlop: {
      top: 8,
      bottom: 8,
      left: 8,
      right: 8
    },
    onPress: () => onCopy(copyValue)
  }, /*#__PURE__*/React.createElement(Text, {
    style: [styles.copyIconText, {
      color: themeColors?.primary || '#7C5CFC'
    }]
  }, "\uD83D\uDCCB")) : null), value ? /*#__PURE__*/React.createElement(Text, {
    selectable: selectable,
    style: [styles.sectionValue, color ? {
      color
    } : undefined]
  }, value) : isJsonObject ? /*#__PURE__*/React.createElement(View, {
    style: styles.jsonBox
  }, /*#__PURE__*/React.createElement(Text, {
    selectable: true,
    style: styles.jsonText
  }, JSON.stringify(resolvedJson, null, 2))) : /*#__PURE__*/React.createElement(Text, {
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
export const DebugMonitor = ({
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
  const systemScheme = useColorScheme();
  const [selectedTheme, setSelectedTheme] = useState(theme);
  const effectiveTheme = selectedTheme === 'auto' ? systemScheme === 'light' ? 'light' : 'dark' : selectedTheme;
  const C = getColors(effectiveTheme, customColors);
  const styles = styleSheet(C);

  // Estimated fixed row height for FlatList getItemLayout performance optimization.
  // Items may vary slightly in actual rendered height, but this constant keeps
  // scroll offset calculation O(1) instead of measuring every row on mount.
  const LOG_ITEM_HEIGHT = 112;
  const [logs, setLogs] = useState(Logger.getLogs());
  const [selectedLog, setSelectedLog] = useState(null);
  const [activeTab, setActiveTab] = useState('ALL');
  const [detailTab, setDetailTab] = useState('RESPONSE');
  const [showMenu, setShowMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [baseUrl, setBaseUrl] = useState(Logger.getBaseUrl());
  const [manualUrl, setManualUrl] = useState('');
  const [, setCustomUrlEntries] = useState(Logger.getCustomUrls());
  const [filterMethod] = useState('ALL');
  const [fpsStats, setFpsStats] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const flatListRef = useRef(null);
  const [perfRunning, setPerfRunning] = useState(isPerformanceMonitorRunning());
  const [deviceInfo] = useState(getDeviceInfo());
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
  useEffect(() => {
    if (!availableTabs.includes(activeTab)) {
      setActiveTab(availableTabs[0] || 'ALL');
    }
  }, [availableTabs, activeTab]);
  useEffect(() => {
    const unsubscribe = Logger.subscribe(newLogs => {
      setLogs(newLogs);
    });
    return unsubscribe;
  }, []);
  useEffect(() => {
    const unsubFps = subscribeToFps(stats => {
      setFpsStats(stats);
    });
    return unsubFps;
  }, []);

  // Register cleanup callbacks that run when the debugger closes
  const {
    addCloseCleanup
  } = useDebugger();
  useEffect(() => {
    const unsub1 = addCloseCleanup(() => {
      destroyPerformanceMonitor();
    });
    return unsub1;
  }, [addCloseCleanup]);

  // Toast system for in-app notifications
  const {
    showToast,
    Toasts
  } = useToast();
  const showError = useCallback(msg => showToast(msg, 'error'), [showToast]);
  const showSuccess = useCallback(msg => showToast(msg, 'success'), [showToast]);

  /** Share/copy a text value via the system share sheet */
  const handleCopy = useCallback(text => {
    Share.share({
      message: text
    }).catch(() => {});
  }, []);

  /** Pull-to-refresh: re-read logs from the Logger singleton */
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setLogs(Logger.getLogs());
    setRefreshing(false);
  }, []);

  /** Track scroll offset to toggle scroll-to-top button visibility */
  const handleScroll = useCallback(event => {
    const offsetY = event.nativeEvent.contentOffset.y;
    setShowScrollTop(offsetY > 400);
  }, []);

  /** Scroll the main list back to the top */
  const scrollToTop = useCallback(() => {
    flatListRef.current?.scrollToOffset({
      offset: 0,
      animated: true
    });
  }, []);

  /** Map an HTTP method to a distinct badge color */
  const getMethodColor = useCallback(method => {
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
  const getStatusColor = useCallback(status => {
    if (!status) return C.textDim;
    if (status >= 200 && status < 300) return C.success;
    if (status >= 300 && status < 400) return C.warning;
    if (status >= 400 && status < 500) return C.warning; /* 4xx = amber */
    if (status >= 500) return C.error;
    return C.textDim;
  }, [C]);

  /** Map a LogType to a consistent accent color for the indicator strip */
  const getTypeColor = useCallback(item => {
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
  const t = useMemo(() => {
    const lang = resolveLanguage(language);
    return TRANSLATIONS[lang] || TRANSLATIONS.en;
  }, [language]);
  const tabCounts = useMemo(() => {
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
  const filteredLogs = useMemo(() => {
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
    Alert.alert(t.wipeAllRecords, 'Are you sure you want to delete all captured logs? This cannot be undone.', [{
      text: t.cancel,
      style: 'cancel'
    }, {
      text: 'Clear',
      style: 'destructive',
      onPress: () => Logger.clearLogs()
    }]);
  };
  const handleExportJson = async () => {
    try {
      const report = generateExportReport(logs);
      await Share.share({
        message: JSON.stringify(report, null, 2),
        title: t.reportTitle
      });
    } catch (e) {
      showError(t.couldNotShareReport);
    }
  };
  const handleExportText = async () => {
    try {
      const report = generateExportReport(logs);
      const text = formatReportAsText(report);
      await Share.share({
        message: text,
        title: t.reportTitle
      });
    } catch (e) {
      showError(t.couldNotShareReport);
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
      await Share.share({
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
    if (!log.url || isInternalUrl(log.url)) return '';
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
      showError(t.pleaseEnterUrl);
      return;
    }
    try {
      const parsed = new URL(newUrl);
      if (!['http:', 'https:'].includes(parsed.protocol)) {
        showError(t.urlMustStartWith);
        return;
      }
      const host = parsed.hostname;
      const isIp = /^(\d{1,3}\.){3}\d{1,3}$/.test(host);
      const isLocal = host === 'localhost';
      const hasDot = host.includes('.');
      if (!isLocal && !isIp && !hasDot) {
        showError(t.invalidDomainFormat);
        return;
      }
    } catch (e) {
      showError(t.invalidUrlFormat);
      return;
    }
    Logger.setBaseUrl(newUrl);
    setBaseUrl(newUrl);
    Logger.addCustomUrl({
      title: `Custom ${Logger.getCustomUrls().length + 1}`,
      url: newUrl
    });
    setCustomUrlEntries(Logger.getCustomUrls());
    setManualUrl('');
    if (onBaseUrlChange) onBaseUrlChange(newUrl);
    showSuccess(t.newSourceApplied);
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
    Logger.removeCustomUrl(url);
    setCustomUrlEntries(Logger.getCustomUrls());
    setBaseUrl(Logger.getBaseUrl());
  };

  /** Animated wrapper that fades + slides in on mount for new log entries */
  const LogItemAnimated = ({
    children,
    index
  }) => {
    const opacity = useRef(new Animated.Value(0)).current;
    const translateY = useRef(new Animated.Value(12)).current;
    useEffect(() => {
      Animated.parallel([Animated.timing(opacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true
      }), Animated.timing(translateY, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true
      })]).start();
    }, [opacity, translateY]);
    return /*#__PURE__*/React.createElement(Animated.View, {
      style: {
        opacity,
        transform: [{
          translateY
        }]
      }
    }, children);
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
    const row = /*#__PURE__*/React.createElement(TouchableOpacity, {
      activeOpacity: 0.7,
      style: styles.logItem,
      onPress: () => {
        setSelectedLog(item);
        setDetailTab('RESPONSE');
      }
    }, /*#__PURE__*/React.createElement(View, {
      style: [styles.logIndicator, {
        backgroundColor: typeColor
      }]
    }), /*#__PURE__*/React.createElement(View, {
      style: styles.logBody
    }, /*#__PURE__*/React.createElement(View, {
      style: styles.logRow
    }, /*#__PURE__*/React.createElement(View, {
      style: [styles.logChip, {
        backgroundColor: methodColor + '18'
      }]
    }, /*#__PURE__*/React.createElement(Text, {
      style: [styles.logChipText, {
        color: methodColor
      }]
    }, item.method || (isConsoleError ? t.logChipError : (item.type || '').toUpperCase()))), item.status ? /*#__PURE__*/React.createElement(View, {
      style: [styles.logStatusChip, {
        backgroundColor: statusColor + '18'
      }]
    }, /*#__PURE__*/React.createElement(Text, {
      style: [styles.logStatusText, {
        color: statusColor
      }]
    }, item.status)) : null, /*#__PURE__*/React.createElement(Text, {
      style: styles.logTime
    }, new Date(item.timestamp).toLocaleTimeString([], {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }))), /*#__PURE__*/React.createElement(Text, {
      style: styles.logUrl,
      numberOfLines: 2
    }, item.isRedirected ? `${item.originalUrl} ➔ ${item.url}` : item.url || item.message), item.durationMs !== undefined ? /*#__PURE__*/React.createElement(View, {
      style: styles.logMetaBox
    }, /*#__PURE__*/React.createElement(View, {
      style: styles.metaBadge
    }, /*#__PURE__*/React.createElement(Text, {
      style: styles.logMeta
    }, "\u23F1 ", item.durationMs ?? 0, t.ms)), /*#__PURE__*/React.createElement(View, {
      style: styles.metaBadge
    }, /*#__PURE__*/React.createElement(Text, {
      style: styles.logMeta
    }, "\uD83D\uDCE6 ", item.size || `0.00${t.kb}`))) : null));
    return /*#__PURE__*/React.createElement(LogItemAnimated, {
      index: index
    }, row);
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
    const allCustoms = Logger.getCustomUrls();
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
    return /*#__PURE__*/React.createElement(ScrollView, {
      style: styles.settingsContainer
    }, allSources.length > 0 ? /*#__PURE__*/React.createElement(View, {
      style: styles.settingsSection
    }, /*#__PURE__*/React.createElement(View, {
      style: styles.settingsSectionHeader
    }, /*#__PURE__*/React.createElement(View, {
      style: styles.settingsSectionLine
    }), /*#__PURE__*/React.createElement(Text, {
      style: styles.settingsSectionTitle
    }, t.selectSource)), /*#__PURE__*/React.createElement(View, {
      style: styles.settingsCard
    }, allSources.map((item, index) => {
      const isUrlActive = baseUrl !== '' && baseUrl === item.val;
      const isEnvActive = baseUrl === '' && item.type === 'env' && envConfig?.currentEnv === item.val;
      const isActive = item.type === 'env' ? isEnvActive : isUrlActive;
      const isCustom = allCustoms.some(u => u.url === item.val);
      return /*#__PURE__*/React.createElement(View, {
        key: index,
        style: [styles.urlOption, isActive && styles.urlOptionActive]
      }, /*#__PURE__*/React.createElement(TouchableOpacity, {
        style: styles.urlOptionInfo,
        onPress: () => {
          if (item.type === 'env') {
            setBaseUrl('');
            Logger.setBaseUrl('');
            envConfig?.onEnvChange(item.val);
          } else {
            setBaseUrl(item.val);
            Logger.setBaseUrl(item.val);
            if (onBaseUrlChange) onBaseUrlChange(item.val);
          }
        }
      }, /*#__PURE__*/React.createElement(Text, {
        style: [styles.urlOptionTitle, isActive && styles.urlOptionTitleActive]
      }, item.title), item.url ? /*#__PURE__*/React.createElement(Text, {
        style: styles.urlOptionUrl,
        numberOfLines: 1
      }, item.url) : null), /*#__PURE__*/React.createElement(View, {
        style: styles.optionActions
      }, isCustom ? /*#__PURE__*/React.createElement(TouchableOpacity, {
        style: styles.deleteBtn,
        onPress: () => handleRemoveCustomUrl(item.val)
      }, /*#__PURE__*/React.createElement(Text, {
        style: styles.deleteBtnText
      }, "\u2715")) : null, isActive ? /*#__PURE__*/React.createElement(View, {
        style: styles.activeDot
      }) : null));
    }))) : null, /*#__PURE__*/React.createElement(View, {
      style: [styles.settingsSection, {
        marginTop: allSources.length > 0 ? 32 : 0
      }]
    }, /*#__PURE__*/React.createElement(View, {
      style: styles.settingsSectionHeader
    }, /*#__PURE__*/React.createElement(View, {
      style: styles.settingsSectionLine
    }), /*#__PURE__*/React.createElement(Text, {
      style: styles.settingsSectionTitle
    }, t.manualEntry)), /*#__PURE__*/React.createElement(View, {
      style: styles.settingsCard
    }, /*#__PURE__*/React.createElement(View, {
      style: styles.cardInner
    }, /*#__PURE__*/React.createElement(Text, {
      style: styles.inputLabel
    }, t.customUrl?.toUpperCase() || ''), /*#__PURE__*/React.createElement(TextInput, {
      style: styles.textInput,
      value: manualUrl,
      placeholder: t.manualUrlPlaceholder,
      placeholderTextColor: C.textDim,
      autoCapitalize: "none",
      keyboardType: "url",
      onChangeText: setManualUrl
    }), /*#__PURE__*/React.createElement(TouchableOpacity, {
      style: styles.saveBtn,
      onPress: handleSaveSettings
    }, /*#__PURE__*/React.createElement(Text, {
      style: styles.saveBtnText
    }, t.applyChanges))))), /*#__PURE__*/React.createElement(View, {
      style: [styles.settingsSection, {
        marginTop: 32
      }]
    }, /*#__PURE__*/React.createElement(View, {
      style: styles.settingsSectionHeader
    }, /*#__PURE__*/React.createElement(View, {
      style: styles.settingsSectionLine
    }), /*#__PURE__*/React.createElement(Text, {
      style: styles.settingsSectionTitle
    }, "Theme")), /*#__PURE__*/React.createElement(View, {
      style: styles.settingsCard
    }, /*#__PURE__*/React.createElement(View, {
      style: [styles.cardInner, {
        flexDirection: 'row',
        gap: 8
      }]
    }, ['light', 'dark', 'auto'].map(mode => {
      const active = selectedTheme === mode;
      return /*#__PURE__*/React.createElement(TouchableOpacity, {
        key: mode,
        activeOpacity: 0.7,
        onPress: () => setSelectedTheme(mode),
        style: [styles.optionChip, {
          backgroundColor: active ? C.primary : C.surfaceLight,
          borderColor: active ? C.primary : C.border
        }]
      }, /*#__PURE__*/React.createElement(Text, {
        style: [styles.optionChipText, {
          color: active ? '#FFFFFF' : C.text
        }]
      }, mode.charAt(0).toUpperCase() + mode.slice(1)));
    })))), /*#__PURE__*/React.createElement(View, {
      style: [styles.settingsSection, {
        marginTop: 32
      }]
    }, /*#__PURE__*/React.createElement(View, {
      style: styles.settingsSectionHeader
    }, /*#__PURE__*/React.createElement(View, {
      style: styles.settingsSectionLine
    }), /*#__PURE__*/React.createElement(Text, {
      style: styles.settingsSectionTitle
    }, t.deviceInfo)), /*#__PURE__*/React.createElement(View, {
      style: styles.settingsCard
    }, /*#__PURE__*/React.createElement(View, {
      style: styles.cardInner
    }, renderDeviceInfoSection()))), /*#__PURE__*/React.createElement(View, {
      style: [styles.settingsSection, {
        marginTop: 32
      }]
    }, /*#__PURE__*/React.createElement(View, {
      style: styles.settingsSectionHeader
    }, /*#__PURE__*/React.createElement(View, {
      style: styles.settingsSectionLine
    }), /*#__PURE__*/React.createElement(Text, {
      style: styles.settingsSectionTitle
    }, t.advancedTools)), /*#__PURE__*/React.createElement(View, {
      style: styles.settingsCard
    }, /*#__PURE__*/React.createElement(View, {
      style: styles.cardInner
    }, /*#__PURE__*/React.createElement(TouchableOpacity, {
      style: [styles.toolBtn, {
        margin: 0,
        marginBottom: 12
      }],
      onPress: handleExportJson
    }, /*#__PURE__*/React.createElement(Text, {
      style: styles.toolBtnText
    }, t.shareJsonReport)), /*#__PURE__*/React.createElement(TouchableOpacity, {
      style: [styles.toolBtn, {
        margin: 0,
        marginBottom: 16
      }],
      onPress: handleExportText
    }, /*#__PURE__*/React.createElement(Text, {
      style: styles.toolBtnText
    }, t.shareTextReport)), /*#__PURE__*/React.createElement(TouchableOpacity, {
      style: [styles.toolBtn, {
        margin: 0,
        marginBottom: 12,
        borderColor: C.accent + '40'
      }],
      onPress: () => saveReportToJson(logs)
    }, /*#__PURE__*/React.createElement(Text, {
      style: [styles.toolBtnText, {
        color: C.accent
      }]
    }, t.saveJsonReportToFile)), /*#__PURE__*/React.createElement(TouchableOpacity, {
      style: [styles.toolBtn, {
        margin: 0,
        marginBottom: 16,
        borderColor: C.accent + '40'
      }],
      onPress: () => saveReportToText(logs)
    }, /*#__PURE__*/React.createElement(Text, {
      style: [styles.toolBtnText, {
        color: C.accent
      }]
    }, t.saveTextReportToFile)), /*#__PURE__*/React.createElement(TouchableOpacity, {
      style: [styles.toolBtn, {
        margin: 0,
        borderColor: C.error + '40'
      }],
      onPress: handleClearLogs
    }, /*#__PURE__*/React.createElement(Text, {
      style: [styles.toolBtnText, {
        color: C.error
      }]
    }, t.wipeAllRecords))))), /*#__PURE__*/React.createElement(View, {
      style: {
        height: 60
      }
    }));
  };
  const renderStoreLogs = () => {
    const storeLogs = logs.filter(l => l.type === 'action');
    if (storeLogs.length === 0) {
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
      }, "\uD83D\uDDC4\uFE0F"), /*#__PURE__*/React.createElement(Text, {
        style: [styles.perfLabel, {
          textAlign: 'center',
          marginBottom: 4
        }]
      }, t.noStoreActivity), /*#__PURE__*/React.createElement(Text, {
        style: [styles.perfLabel, {
          color: C.textSubtle,
          fontSize: 10,
          textAlign: 'center'
        }]
      }, t.storeSubtitle)));
    }
    return /*#__PURE__*/React.createElement(FlatList, {
      data: storeLogs,
      renderItem: ({
        item
      }) => {
        const sd = item.stateData;
        const hasDiff = sd?.diff && Object.keys(sd.diff).length > 0;
        const changedKeys = hasDiff ? Object.keys(sd.diff).join(', ') : null;
        return /*#__PURE__*/React.createElement(LogItemAnimated, null, /*#__PURE__*/React.createElement(TouchableOpacity, {
          activeOpacity: 0.7,
          style: styles.logItem,
          onPress: () => {
            setSelectedLog(item);
            setDetailTab('RESPONSE');
          }
        }, /*#__PURE__*/React.createElement(View, {
          style: [styles.logIndicator, {
            backgroundColor: C.secondary
          }]
        }), /*#__PURE__*/React.createElement(View, {
          style: styles.logBody
        }, /*#__PURE__*/React.createElement(View, {
          style: styles.logRow
        }, /*#__PURE__*/React.createElement(View, {
          style: [styles.logChip, {
            backgroundColor: C.secondary + '18'
          }]
        }, /*#__PURE__*/React.createElement(Text, {
          style: [styles.logChipText, {
            color: C.secondary
          }]
        }, sd?.actionType ? sd.actionType : t.action)), /*#__PURE__*/React.createElement(Text, {
          style: styles.logTime
        }, new Date(item.timestamp).toLocaleTimeString([], {
          hour12: false,
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit'
        }))), /*#__PURE__*/React.createElement(Text, {
          style: styles.logUrl,
          numberOfLines: 2
        }, "[", sd?.storeName || 'Store', "] ", sd?.actionType || t.state), changedKeys ? /*#__PURE__*/React.createElement(View, {
          style: styles.logMetaBox
        }, /*#__PURE__*/React.createElement(View, {
          style: styles.metaBadge
        }, /*#__PURE__*/React.createElement(Text, {
          style: styles.logMeta
        }, t.changedKeys, ": ", changedKeys))) : sd?.snapshot ? /*#__PURE__*/React.createElement(View, {
          style: styles.logMetaBox
        }, /*#__PURE__*/React.createElement(View, {
          style: styles.metaBadge
        }, /*#__PURE__*/React.createElement(Text, {
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
      ListEmptyComponent: /*#__PURE__*/React.createElement(View, {
        style: styles.emptyContainer
      }, /*#__PURE__*/React.createElement(Text, {
        style: styles.emptyIcon
      }, "\uD83D\uDDC4\uFE0F"), /*#__PURE__*/React.createElement(Text, {
        style: styles.emptyText
      }, t.noStoreActivity), /*#__PURE__*/React.createElement(Text, {
        style: styles.emptySubText
      }, t.storeSubtitle))
    });
  };
  const renderPerformance = () => {
    const fps = fpsStats;
    const fpsPercent = fps ? Math.min(fps.fps / 60 * 100, 100) : 0;
    const barColor = !fps ? C.textDim : fps.fps >= 55 ? C.success : fps.fps >= 30 ? C.warning : C.error;
    const fpsLabel = !fps ? '--' : `${fps.fps}`;
    return /*#__PURE__*/React.createElement(ScrollView, {
      style: styles.perfContainer
    }, /*#__PURE__*/React.createElement(View, {
      style: styles.perfToggle
    }, /*#__PURE__*/React.createElement(Text, {
      style: styles.perfToggleText
    }, perfRunning ? t.fpsMonitorActive : t.fpsMonitorOff), /*#__PURE__*/React.createElement(TouchableOpacity, {
      style: [styles.toggleTrack, perfRunning ? styles.toggleTrackActive : styles.toggleTrackInactive],
      onPress: () => {
        if (perfRunning) {
          stopPerformanceMonitor();
          setPerfRunning(false);
        } else {
          startPerformanceMonitor();
          setPerfRunning(true);
        }
      }
    }, /*#__PURE__*/React.createElement(View, {
      style: [styles.toggleThumb, {
        alignSelf: perfRunning ? 'flex-end' : 'flex-start'
      }]
    }))), /*#__PURE__*/React.createElement(View, {
      style: styles.perfCard
    }, /*#__PURE__*/React.createElement(View, {
      style: styles.perfRow
    }, /*#__PURE__*/React.createElement(Text, {
      style: styles.perfLabel
    }, t.currentFps), /*#__PURE__*/React.createElement(Text, {
      style: [styles.perfValue, !fps ? {} : fps.fps >= 55 ? styles.perfValueGood : fps.fps >= 30 ? styles.perfValueWarning : styles.perfValueError]
    }, fpsLabel)), /*#__PURE__*/React.createElement(View, {
      style: styles.fpsBar
    }, /*#__PURE__*/React.createElement(View, {
      style: [styles.fpsBarFill, {
        width: `${fpsPercent}%`,
        backgroundColor: barColor
      }]
    }))), fps && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(View, {
      style: styles.perfCard
    }, /*#__PURE__*/React.createElement(View, {
      style: styles.perfRow
    }, /*#__PURE__*/React.createElement(Text, {
      style: styles.perfLabel
    }, t.averageFps), /*#__PURE__*/React.createElement(Text, {
      style: styles.perfValue
    }, fps.averageFps)), /*#__PURE__*/React.createElement(View, {
      style: styles.perfRow
    }, /*#__PURE__*/React.createElement(Text, {
      style: styles.perfLabel
    }, t.minFps), /*#__PURE__*/React.createElement(Text, {
      style: [styles.perfValue, fps.minFps < 30 ? styles.perfValueError : styles.perfValueGood]
    }, fps.minFps)), /*#__PURE__*/React.createElement(View, {
      style: styles.perfRow
    }, /*#__PURE__*/React.createElement(Text, {
      style: styles.perfLabel
    }, t.maxFps), /*#__PURE__*/React.createElement(Text, {
      style: styles.perfValue
    }, fps.maxFps)), /*#__PURE__*/React.createElement(View, {
      style: styles.perfRow
    }, /*#__PURE__*/React.createElement(Text, {
      style: styles.perfLabel
    }, t.droppedFrames), /*#__PURE__*/React.createElement(Text, {
      style: [styles.perfValue, fps.droppedFrames > 10 ? styles.perfValueWarning : styles.perfValueGood]
    }, fps.droppedFrames))), /*#__PURE__*/React.createElement(View, {
      style: styles.perfCard
    }, /*#__PURE__*/React.createElement(Text, {
      style: styles.perfLabel
    }, t.fpsHistory), /*#__PURE__*/React.createElement(View, {
      style: {
        height: 80,
        flexDirection: 'row',
        alignItems: 'flex-end',
        gap: 1,
        marginTop: 12
      }
    }, fps.history.length > 0 ? fps.history.map((value, i) => {
      const barHeight = Math.max(4, value / 60 * 80);
      return /*#__PURE__*/React.createElement(View, {
        key: i,
        style: {
          flex: 1,
          height: barHeight,
          backgroundColor: value >= 55 ? C.success : value >= 30 ? C.warning : C.error,
          borderRadius: 1,
          opacity: 0.5 + i / fps.history.length * 0.5
        }
      });
    }) : /*#__PURE__*/React.createElement(View, {
      style: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center'
      }
    }, /*#__PURE__*/React.createElement(Text, {
      style: {
        color: C.textDim,
        fontSize: 10
      }
    }, "Collecting data..."))))), !fps && /*#__PURE__*/React.createElement(View, {
      style: styles.perfCard
    }, /*#__PURE__*/React.createElement(Text, {
      style: [styles.perfLabel, {
        textAlign: 'center',
        marginVertical: 20
      }]
    }, t.fpsEmpty)), /*#__PURE__*/React.createElement(View, {
      style: {
        height: 60
      }
    }));
  };
  const renderWebSocket = () => {
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
  const renderDeviceInfoSection = () => {
    const info = deviceInfo;
    return /*#__PURE__*/React.createElement(View, null, /*#__PURE__*/React.createElement(Text, {
      style: styles.deviceSectionTitle
    }, t.device), /*#__PURE__*/React.createElement(View, {
      style: styles.deviceRow
    }, /*#__PURE__*/React.createElement(Text, {
      style: styles.deviceLabel
    }, t.platform), /*#__PURE__*/React.createElement(Text, {
      style: styles.deviceValue
    }, info.platform, " ", info.osVersion)), /*#__PURE__*/React.createElement(View, {
      style: styles.deviceRow
    }, /*#__PURE__*/React.createElement(Text, {
      style: styles.deviceLabel
    }, t.model), /*#__PURE__*/React.createElement(Text, {
      style: styles.deviceValue
    }, info.deviceName)), /*#__PURE__*/React.createElement(View, {
      style: styles.deviceRow
    }, /*#__PURE__*/React.createElement(Text, {
      style: styles.deviceLabel
    }, t.screen), /*#__PURE__*/React.createElement(Text, {
      style: styles.deviceValue
    }, info.screenWidth, "x", info.screenHeight, " @", info.screenScale, "x")), /*#__PURE__*/React.createElement(Text, {
      style: [styles.deviceSectionTitle, {
        marginTop: 24
      }]
    }, t.application), info.appVersion && /*#__PURE__*/React.createElement(View, {
      style: styles.deviceRow
    }, /*#__PURE__*/React.createElement(Text, {
      style: styles.deviceLabel
    }, t.appVersion), /*#__PURE__*/React.createElement(Text, {
      style: styles.deviceValue
    }, info.appVersion)), info.buildVersion && /*#__PURE__*/React.createElement(View, {
      style: styles.deviceRow
    }, /*#__PURE__*/React.createElement(Text, {
      style: styles.deviceLabel
    }, t.buildVersion), /*#__PURE__*/React.createElement(Text, {
      style: styles.deviceValue
    }, info.buildVersion)));
  };
  const {
    top,
    bottom
  } = useSafeAreaInsets();
  return /*#__PURE__*/React.createElement(View, {
    style: styles.container
  }, /*#__PURE__*/React.createElement(StatusBar, {
    barStyle: effectiveTheme === 'light' ? 'dark-content' : 'light-content',
    backgroundColor: C.background
  }), /*#__PURE__*/React.createElement(View, {
    style: {
      flex: 1,
      paddingTop: top,
      paddingBottom: bottom
    }
  }, /*#__PURE__*/React.createElement(View, {
    style: styles.header
  }, /*#__PURE__*/React.createElement(View, {
    style: styles.headerTop
  }, /*#__PURE__*/React.createElement(View, {
    style: styles.headerLeft
  }, /*#__PURE__*/React.createElement(View, {
    style: styles.headerLogo
  }, /*#__PURE__*/React.createElement(Text, {
    style: styles.headerLogoText
  }, "N")), /*#__PURE__*/React.createElement(Text, {
    style: styles.headerTitle
  }, headerTitle || t.monitor), /*#__PURE__*/React.createElement(View, {
    style: styles.headerCount
  }, /*#__PURE__*/React.createElement(Text, {
    style: {
      color: C.textDim,
      fontSize: 10,
      fontWeight: '700'
    }
  }, logs.length))), /*#__PURE__*/React.createElement(View, {
    style: styles.headerActions
  }, /*#__PURE__*/React.createElement(TouchableOpacity, {
    style: [styles.headerBtn, {
      backgroundColor: C.errorDim
    }],
    onPress: handleClearLogs
  }, /*#__PURE__*/React.createElement(Text, {
    style: [styles.headerBtnText, {
      color: C.error,
      fontSize: 11,
      fontWeight: '800'
    }]
  }, "\u2715")), /*#__PURE__*/React.createElement(TouchableOpacity, {
    style: styles.headerBtn,
    onPress: onClose
  }, /*#__PURE__*/React.createElement(Text, {
    style: [styles.headerBtnText, {
      fontSize: 13
    }]
  }, "\u2304"))))), /*#__PURE__*/React.createElement(View, {
    style: styles.tabBar
  }, /*#__PURE__*/React.createElement(ScrollView, {
    horizontal: true,
    showsHorizontalScrollIndicator: false,
    contentContainerStyle: styles.tabScroll
  }, availableTabs.map(tab => /*#__PURE__*/React.createElement(TouchableOpacity, {
    key: tab,
    style: styles.tabItem,
    onPress: () => setActiveTab(tab)
  }, /*#__PURE__*/React.createElement(Text, {
    style: [styles.tabText, activeTab === tab ? styles.tabTextActive : styles.tabTextInactive]
  }, tab === 'ALL' ? t.all : tab === 'NETWORK' ? t.network : tab === 'LOGS' ? t.logs : tab === 'WEBSOCKET' ? t.ws : tab === 'PERFORMANCE' ? t.fps : tab === 'STORE' ? t.store : t.settings, /*#__PURE__*/React.createElement(Text, {
    style: styles.tabBadge
  }, tab !== 'SETTINGS' ? ` ${tabCounts[tab]}` : '')), activeTab === tab ? /*#__PURE__*/React.createElement(View, {
    style: styles.tabActiveLine
  }) : null)))), activeTab !== 'SETTINGS' ? /*#__PURE__*/React.createElement(View, null, /*#__PURE__*/React.createElement(View, {
    style: styles.searchRow
  }, /*#__PURE__*/React.createElement(View, {
    style: styles.searchBox
  }, /*#__PURE__*/React.createElement(TextInput, {
    style: styles.searchInput,
    placeholder: searchPlaceholder || t.search,
    placeholderTextColor: C.textDim,
    value: searchQuery,
    onChangeText: setSearchQuery
  }), searchQuery.length > 0 ? /*#__PURE__*/React.createElement(TouchableOpacity, {
    onPress: () => setSearchQuery('')
  }, /*#__PURE__*/React.createElement(Text, {
    style: styles.clearSearch
  }, "\u2715")) : null)), activeTab === 'NETWORK' ? /*#__PURE__*/React.createElement(View, {
    style: styles.filterRow
  }, ['ALL', 'OK', 'ERR'].map(s => /*#__PURE__*/React.createElement(TouchableOpacity, {
    key: s,
    style: [styles.filterPill, filterStatus === s && styles.filterPillActive],
    onPress: () => setFilterStatus(s)
  }, /*#__PURE__*/React.createElement(Text, {
    style: [styles.filterPillText, filterStatus === s ? styles.filterPillTextActive : styles.filterPillTextInactive]
  }, s === 'ALL' ? t.allFilter : s === 'OK' ? t.success2xx3xx : t.error4xx5xx)))) : null) : null, activeTab === 'SETTINGS' ? renderSettings() : activeTab === 'PERFORMANCE' ? renderPerformance() : activeTab === 'WEBSOCKET' ? renderWebSocket() : activeTab === 'STORE' ? renderStoreLogs() : /*#__PURE__*/React.createElement(FlatList, {
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
    ListEmptyComponent: /*#__PURE__*/React.createElement(View, {
      style: styles.emptyContainer
    }, /*#__PURE__*/React.createElement(Text, {
      style: styles.emptyIcon
    }, "\uD83D\uDCAC"), /*#__PURE__*/React.createElement(Text, {
      style: styles.emptyText
    }, t.empty), /*#__PURE__*/React.createElement(Text, {
      style: styles.emptySubText
    }, t.emptySubtitle))
  }), showScrollTop && /*#__PURE__*/React.createElement(TouchableOpacity, {
    activeOpacity: 0.8,
    onPress: scrollToTop,
    style: [styles.scrollTopBtn, {
      backgroundColor: C.primary,
      shadowColor: C.shadow
    }]
  }, /*#__PURE__*/React.createElement(Text, {
    style: styles.scrollTopBtnText
  }, "\u2191")), /*#__PURE__*/React.createElement(Modal, {
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
    return /*#__PURE__*/React.createElement(View, {
      style: [styles.detailOverlay, {
        paddingTop: top,
        paddingBottom: bottom
      }]
    }, /*#__PURE__*/React.createElement(View, {
      style: styles.detailSheet
    }, /*#__PURE__*/React.createElement(View, {
      style: styles.detailHandle
    }), /*#__PURE__*/React.createElement(View, {
      style: styles.detailHeader
    }, /*#__PURE__*/React.createElement(TouchableOpacity, {
      style: styles.detailBack,
      onPress: () => {
        setSelectedLog(null);
        setShowMenu(false);
      }
    }, /*#__PURE__*/React.createElement(Text, {
      style: styles.detailBackText
    }, "\u2190")), /*#__PURE__*/React.createElement(Text, {
      style: [styles.detailTitle, isSelectedConsoleError && {
        color: C.error
      }]
    }, selectedLog?.type === 'action' ? `[${selectedLog?.stateData?.storeName || t.store}] ${selectedLog?.stateData?.actionType || t.action}` : selectedLog?.type === 'info' ? isSelectedConsoleError ? t.consoleError : (t.logs || '').toUpperCase() : `${selectedLog?.durationMs ?? 0}${t.ms}, ${selectedLog?.size || `0.00${t.kb}`}`), /*#__PURE__*/React.createElement(TouchableOpacity, {
      style: styles.detailMenu,
      onPress: () => setShowMenu(!showMenu)
    }, /*#__PURE__*/React.createElement(Text, {
      style: styles.detailMenuText
    }, "\u22EE"))), showMenu ? /*#__PURE__*/React.createElement(View, {
      style: styles.detailDropdown
    }, /*#__PURE__*/React.createElement(TouchableOpacity, {
      style: styles.detailDropdownItem,
      onPress: () => {
        handleShareLog(selectedLog);
        setShowMenu(false);
      }
    }, /*#__PURE__*/React.createElement(Text, {
      style: styles.detailDropdownText
    }, t.shareEntry)), /*#__PURE__*/React.createElement(TouchableOpacity, {
      style: styles.detailDropdownItem,
      onPress: () => {
        if (selectedLog) {
          const curl = generateCurl(selectedLog);
          Share.share({
            message: curl || JSON.stringify(selectedLog, null, 2),
            title: t.curlCommand
          });
        }
        setShowMenu(false);
      }
    }, /*#__PURE__*/React.createElement(Text, {
      style: styles.detailDropdownText
    }, t.shareCurl)), customActions?.map((action, i) => /*#__PURE__*/React.createElement(TouchableOpacity, {
      key: `ca-${i}`,
      style: styles.detailDropdownItem,
      onPress: () => {
        if (selectedLog) action.onPress(selectedLog);
        setShowMenu(false);
      }
    }, /*#__PURE__*/React.createElement(Text, {
      style: styles.detailDropdownText
    }, action.label))), /*#__PURE__*/React.createElement(TouchableOpacity, {
      style: [styles.detailDropdownItem, {
        borderBottomWidth: 0
      }],
      onPress: () => setShowMenu(false)
    }, /*#__PURE__*/React.createElement(Text, {
      style: styles.detailDropdownText
    }, t.closeMenu))) : null, selectedLog?.type !== 'info' && selectedLog?.type !== 'websocket' && selectedLog?.type !== 'performance' && selectedLog?.type !== 'action' ? /*#__PURE__*/React.createElement(View, {
      style: styles.detailTabs
    }, /*#__PURE__*/React.createElement(TouchableOpacity, {
      style: [styles.detailTab, detailTab === 'REQUEST' && styles.detailTabActive],
      onPress: () => setDetailTab('REQUEST')
    }, /*#__PURE__*/React.createElement(Text, {
      style: [styles.detailTabText, detailTab === 'REQUEST' ? styles.detailTabTextActive : styles.detailTabTextInactive]
    }, (t.request || '').toUpperCase())), /*#__PURE__*/React.createElement(TouchableOpacity, {
      style: [styles.detailTab, detailTab === 'RESPONSE' && styles.detailTabActive],
      onPress: () => setDetailTab('RESPONSE')
    }, /*#__PURE__*/React.createElement(Text, {
      style: [styles.detailTabText, detailTab === 'RESPONSE' ? styles.detailTabTextActive : styles.detailTabTextInactive]
    }, (t.response || '').toUpperCase()))) : null, /*#__PURE__*/React.createElement(ScrollView, {
      style: styles.detailContent,
      showsVerticalScrollIndicator: false
    }, selectedLog?.type === 'info' || selectedLog?.type === 'websocket' || selectedLog?.type === 'performance' || selectedLog?.type === 'action' ? /*#__PURE__*/React.createElement(React.Fragment, null, selectedLog?.type === 'action' && selectedLog?.stateData ? /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(Section, {
      themeColors: C,
      label: t.actionType,
      value: selectedLog.stateData.actionType || '-',
      onCopy: handleCopy
    }), /*#__PURE__*/React.createElement(Section, {
      themeColors: C,
      label: t.actionPayload,
      json: selectedLog.stateData.actionPayload,
      onCopy: handleCopy
    }), selectedLog.stateData.diff ? Object.keys(selectedLog.stateData.diff).length > 0 ? /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(Text, {
      style: [styles.sectionLabel, {
        marginTop: 16,
        marginBottom: 8
      }]
    }, t.changedKeys), Object.entries(selectedLog.stateData.diff).map(([key, val]) => /*#__PURE__*/React.createElement(View, {
      key: key,
      style: styles.sectionBox
    }, /*#__PURE__*/React.createElement(Text, {
      style: styles.sectionLabel
    }, key), val.prev !== undefined ? /*#__PURE__*/React.createElement(Text, {
      style: [styles.sectionLabel, {
        color: C.textDim,
        fontSize: 10
      }]
    }, t.prevState) : null, val.prev !== undefined ? /*#__PURE__*/React.createElement(View, {
      style: styles.jsonBox
    }, /*#__PURE__*/React.createElement(Text, {
      selectable: true,
      style: styles.jsonText
    }, JSON.stringify(val.prev, null, 2))) : null, val.next !== undefined ? /*#__PURE__*/React.createElement(Text, {
      style: [styles.sectionLabel, {
        color: C.textDim,
        fontSize: 10,
        marginTop: 8
      }]
    }, t.nextState) : null, val.next !== undefined ? /*#__PURE__*/React.createElement(View, {
      style: styles.jsonBox
    }, /*#__PURE__*/React.createElement(Text, {
      selectable: true,
      style: styles.jsonText
    }, JSON.stringify(val.next, null, 2))) : null))) : null : selectedLog.stateData.snapshot ? /*#__PURE__*/React.createElement(Section, {
      themeColors: C,
      label: t.fullState,
      json: selectedLog.stateData.snapshot,
      onCopy: handleCopy
    }) : null) : /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(Section, {
      themeColors: C,
      selectable: true,
      label: selectedLog?.type === 'websocket' ? t.websocketEvent : selectedLog?.type === 'performance' ? t.performanceData : t.logMessage,
      value: selectedLog?.message,
      onCopy: handleCopy
    }), selectedLog?.url ? /*#__PURE__*/React.createElement(Section, {
      themeColors: C,
      selectable: true,
      label: t.url,
      value: selectedLog.url,
      onCopy: handleCopy
    }) : null, /*#__PURE__*/React.createElement(Section, {
      themeColors: C,
      label: t.data,
      json: selectedLog?.requestData,
      onCopy: handleCopy
    }), selectedLog?.type === 'performance' && selectedLog?.durationMs ? /*#__PURE__*/React.createElement(Section, {
      themeColors: C,
      label: t.fps,
      value: String(selectedLog.durationMs),
      onCopy: handleCopy
    }) : null)) : detailTab === 'REQUEST' ? /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(Section, {
      themeColors: C,
      label: t.method,
      value: selectedLog?.method,
      onCopy: handleCopy
    }), /*#__PURE__*/React.createElement(Section, {
      themeColors: C,
      selectable: true,
      label: t.url,
      value: selectedLog?.isRedirected ? `${selectedLog?.originalUrl} ➔ ${selectedLog?.url}` : selectedLog?.url,
      onCopy: handleCopy
    }), /*#__PURE__*/React.createElement(Section, {
      themeColors: C,
      label: t.headers,
      json: selectedLog?.requestHeaders,
      onCopy: handleCopy
    }), /*#__PURE__*/React.createElement(Section, {
      themeColors: C,
      label: t.body,
      json: selectedLog?.requestData,
      onCopy: handleCopy
    })) : /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(Section, {
      themeColors: C,
      label: t.statusCode,
      value: selectedLog?.status?.toString(),
      color: selectedLog?.status && selectedLog.status >= 400 ? C.error : C.success,
      onCopy: handleCopy
    }), /*#__PURE__*/React.createElement(Section, {
      themeColors: C,
      label: t.headers,
      json: selectedLog?.responseHeaders,
      onCopy: handleCopy
    }), /*#__PURE__*/React.createElement(Section, {
      themeColors: C,
      label: t.body,
      json: selectedLog?.responseData,
      onCopy: handleCopy
    })), /*#__PURE__*/React.createElement(View, {
      style: {
        height: 100
      }
    }))));
  })())), Toasts);
};
//# sourceMappingURL=DebugMonitor.js.map