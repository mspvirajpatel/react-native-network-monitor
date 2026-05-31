/* eslint-disable no-unused-vars */
/* eslint-disable react-native/no-inline-styles */
/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Share, Modal, Alert, TextInput, StatusBar, FlatList, Platform, NativeModules, useColorScheme } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import styleSheet, { getColors } from './DebugMonitorStyles';
import { Logger } from './Logger';
import { subscribeToFps, isPerformanceMonitorRunning, startPerformanceMonitor, stopPerformanceMonitor } from './PerformanceMonitor';
import { getDeviceInfo } from './DeviceInfo';
import { generateExportReport, formatReportAsText } from './ExportReport';
import { isInternalUrl } from './NetworkMonitor';
import { saveReportToJson, saveReportToText } from './FileExporter';
const TRANSLATIONS = {
  az: {
    title: 'Debug Monitor',
    entries: 'qeyd',
    search: 'Axtar...',
    clear: 'Təmizlə',
    all: 'Hamısı',
    logs: 'Loglar',
    network: 'Şəbəkə',
    db: 'Baza',
    nav: 'Nav',
    settings: 'Ayarlar',
    export: 'Export',
    close: 'Bağla',
    exit: 'Xitam',
    back: 'Geri',
    empty: 'Log tapılmadı',
    request: 'Sorğu',
    response: 'Cavab',
    method: 'METOD',
    url: 'URL',
    headers: 'HEADERS',
    status: 'STATUS KODU',
    body: 'BODY',
    customUrl: 'Fərdi URL',
    selectUrl: 'MƏNBƏ SEÇİMİ',
    manualUrl: 'ƏL İLƏ DAXİL ET'
  },
  en: {
    title: 'Debug Monitor',
    entries: 'entries',
    search: 'Search...',
    clear: 'Clear',
    all: 'All',
    logs: 'Logs',
    network: 'Network',
    db: 'DB',
    nav: 'Nav',
    settings: 'Settings',
    export: 'Export',
    close: 'Close',
    exit: 'Exit',
    back: 'Back',
    empty: 'No logs found',
    request: 'Request',
    response: 'Response',
    method: 'METHOD',
    url: 'URL',
    headers: 'HEADERS',
    status: 'STATUS CODE',
    body: 'BODY',
    customUrl: 'Custom URL',
    selectUrl: 'SELECT SOURCE',
    manualUrl: 'MANUAL ENTRY'
  },
  tr: {
    title: 'Debug Monitor',
    entries: 'kayıt',
    search: 'Ara...',
    clear: 'Temizle',
    all: 'Hepsi',
    logs: 'Loglar',
    network: 'Ağ',
    db: 'Veri',
    nav: 'Nav',
    settings: 'Ayarlar',
    export: 'Dışa Aktar',
    close: 'Kapat',
    exit: 'Çıkış',
    back: 'Geri',
    empty: 'Log bulunamadı',
    request: 'Sorgu',
    response: 'Yanıt',
    method: 'METOD',
    url: 'URL',
    headers: 'HEADERS',
    status: 'DURUM KODU',
    body: 'BODY',
    customUrl: 'Özel URL',
    selectUrl: 'KAYNAK SEÇ',
    manualUrl: 'MANUEL GİRİŞ'
  },
  ru: {
    title: 'Дебаг Монитор',
    entries: 'записей',
    search: 'Поиск...',
    clear: 'Очистить',
    all: 'Все',
    logs: 'Логи',
    network: 'Сеть',
    db: 'База',
    nav: 'Нав',
    settings: 'Настройки',
    export: 'Экспорт',
    close: 'Закрыть',
    exit: 'Выход',
    back: 'Назад',
    empty: 'Логи не найдены',
    request: 'Запрос',
    response: 'Ответ',
    method: 'МЕТОД',
    url: 'URL',
    headers: 'HEADERS',
    status: 'КОД СТАТУСА',
    body: 'ТЕЛО',
    customUrl: 'Пользовательский URL',
    selectUrl: 'ВЫБОР ИСТОЧНИКА',
    manualUrl: 'РУЧНОЙ ВВОД'
  }
};
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
  return /*#__PURE__*/React.createElement(View, {
    style: styles.sectionBox
  }, /*#__PURE__*/React.createElement(Text, {
    style: styles.sectionLabel
  }, label), value ? /*#__PURE__*/React.createElement(Text, {
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
  theme = 'auto'
}) => {
  const systemScheme = useColorScheme();
  const effectiveTheme = theme === 'auto' ? systemScheme === 'light' ? 'light' : 'dark' : theme;
  const C = getColors(effectiveTheme);
  const styles = styleSheet(C);
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
  const [perfRunning, setPerfRunning] = useState(isPerformanceMonitorRunning());
  const [deviceInfo] = useState(getDeviceInfo());
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
  const t = useMemo(() => {
    let lang = language;
    if (lang === 'auto') {
      try {
        const locale = Platform.OS === 'ios' ? NativeModules.SettingsManager?.settings?.AppleLocale || NativeModules.SettingsManager?.settings?.AppleLanguages?.[0] : NativeModules.I18nManager?.localeIdentifier;
        lang = locale?.split(/[-_]/)[0] || 'en';
      } catch (e) {
        lang = 'en';
      }
    }
    return TRANSLATIONS[lang] || TRANSLATIONS.en;
  }, [language]);
  const tabCounts = useMemo(() => {
    return {
      ALL: logs.length,
      NETWORK: logs.filter(l => ['request', 'response'].includes(l.type) || l.type === 'error' && !!l.url).length,
      LOGS: logs.filter(l => l.type === 'info' || l.type === 'error' && !l.url).length,
      WEBSOCKET: logs.filter(l => l.type === 'websocket').length,
      PERFORMANCE: logs.filter(l => l.type === 'performance').length,
      SETTINGS: 0
    };
  }, [logs]);
  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      const typeMatch = activeTab === 'ALL' ? true : activeTab === 'NETWORK' ? ['request', 'response'].includes(log.type) || log.type === 'error' && !!log.url : activeTab === 'LOGS' ? log.type === 'info' || log.type === 'error' && !log.url : activeTab === 'WEBSOCKET' ? log.type === 'websocket' : activeTab === 'PERFORMANCE' ? log.type === 'performance' : false;
      if (!typeMatch && activeTab !== 'SETTINGS') return false;
      const matchesSearch = searchQuery === '' || log.url?.toLowerCase().includes(searchQuery.toLowerCase()) || log.message?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesMethod = filterMethod === 'ALL' || log.method === filterMethod;
      const matchesStatus = filterStatus === 'ALL' ? true : filterStatus === 'ERR' ? !!log.status && log.status >= 400 : !!log.status && log.status < 400;
      return matchesSearch && matchesMethod && matchesStatus;
    });
  }, [logs, activeTab, searchQuery, filterMethod, filterStatus]);
  const handleExportJson = async () => {
    try {
      const report = generateExportReport(logs);
      await Share.share({
        message: JSON.stringify(report, null, 2),
        title: 'Network Monitor Export Report'
      });
    } catch (e) {
      Alert.alert('Error', 'Could not share report');
    }
  };
  const handleExportText = async () => {
    try {
      const report = generateExportReport(logs);
      const text = formatReportAsText(report);
      await Share.share({
        message: text,
        title: 'Network Monitor Export Report'
      });
    } catch (e) {
      Alert.alert('Error', 'Could not share report');
    }
  };
  const handleShareLog = async log => {
    try {
      const lines = [`Type: ${log.type}`, `Time: ${log.timestamp}`, log.method ? `Method: ${log.method}` : null, log.url ? `URL: ${log.url}` : null, log.status ? `Status: ${log.status}` : null, log.message ? `Message: ${log.message}` : null, log.durationMs !== undefined ? `Duration: ${log.durationMs}ms` : null, log.size ? `Size: ${log.size}` : null].filter(Boolean).join('\n');
      await Share.share({
        message: lines,
        title: 'Log Entry'
      });
    } catch (e) {
      Alert.alert('Error', 'Could not share log');
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
      Alert.alert('Error', 'Please enter a URL');
      return;
    }
    try {
      const parsed = new URL(newUrl);
      if (!['http:', 'https:'].includes(parsed.protocol)) {
        Alert.alert('Error', 'URL must start with http:// or https://');
        return;
      }
      const host = parsed.hostname;
      const isIp = /^(\d{1,3}\.){3}\d{1,3}$/.test(host);
      const isLocal = host === 'localhost';
      const hasDot = host.includes('.');
      if (!isLocal && !isIp && !hasDot) {
        Alert.alert('Error', 'Invalid domain format. Example: https://api.example.com or http://localhost');
        return;
      }
    } catch (e) {
      Alert.alert('Error', 'Invalid URL format. Please include protocol (e.g., https://api.example.com)');
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
    Alert.alert('Success', 'New source applied');
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
    return /*#__PURE__*/React.createElement(TouchableOpacity, {
      activeOpacity: 0.7,
      style: styles.logItem,
      onPress: () => {
        setSelectedLog(item);
        setDetailTab('RESPONSE');
      }
    }, /*#__PURE__*/React.createElement(View, {
      style: [styles.logIndicator, {
        backgroundColor: indicatorColor
      }]
    }), /*#__PURE__*/React.createElement(View, {
      style: styles.logBody
    }, /*#__PURE__*/React.createElement(View, {
      style: styles.logRow
    }, /*#__PURE__*/React.createElement(View, {
      style: [styles.logChip, {
        backgroundColor: indicatorColor + '18'
      }]
    }, /*#__PURE__*/React.createElement(Text, {
      style: [styles.logChipText, {
        color: indicatorColor
      }]
    }, item.method || (isConsoleError ? 'ERROR' : (item.type || '').toUpperCase()))), item.status ? /*#__PURE__*/React.createElement(View, {
      style: [styles.logStatusChip, {
        backgroundColor: indicatorColor + '18'
      }]
    }, /*#__PURE__*/React.createElement(Text, {
      style: [styles.logStatusText, {
        color: indicatorColor
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
    }, "\u23F1 ", item.durationMs ?? 0, "ms")), /*#__PURE__*/React.createElement(View, {
      style: styles.metaBadge
    }, /*#__PURE__*/React.createElement(Text, {
      style: styles.logMeta
    }, "\uD83D\uDCE6 ", item.size || '0.00kb'))) : null));
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
        title: 'PRODUCTION API (PROD)',
        url: prodUrl,
        type: 'url',
        val: prodUrl
      });
    }
    if (testUrl) {
      allSources.push({
        title: 'TEST API (TEST)',
        url: testUrl,
        type: 'url',
        val: testUrl
      });
    }
    if (envConfig) {
      allSources.push({
        title: 'PRODUCTIVE (PROD)',
        type: 'env',
        val: 'prod'
      });
      allSources.push({
        title: 'DEMONSTRATION (DEMO)',
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
    }, t.selectUrl)), /*#__PURE__*/React.createElement(View, {
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
    }, t.manualUrl)), /*#__PURE__*/React.createElement(View, {
      style: styles.settingsCard
    }, /*#__PURE__*/React.createElement(View, {
      style: styles.cardInner
    }, /*#__PURE__*/React.createElement(Text, {
      style: styles.inputLabel
    }, t.customUrl?.toUpperCase() || ''), /*#__PURE__*/React.createElement(TextInput, {
      style: styles.textInput,
      value: manualUrl,
      placeholder: "https://api.example.com",
      placeholderTextColor: C.textDim,
      autoCapitalize: "none",
      keyboardType: "url",
      onChangeText: setManualUrl
    }), /*#__PURE__*/React.createElement(TouchableOpacity, {
      style: styles.saveBtn,
      onPress: handleSaveSettings
    }, /*#__PURE__*/React.createElement(Text, {
      style: styles.saveBtnText
    }, "APPLY CHANGES"))))), /*#__PURE__*/React.createElement(View, {
      style: [styles.settingsSection, {
        marginTop: 32
      }]
    }, /*#__PURE__*/React.createElement(View, {
      style: styles.settingsSectionHeader
    }, /*#__PURE__*/React.createElement(View, {
      style: styles.settingsSectionLine
    }), /*#__PURE__*/React.createElement(Text, {
      style: styles.settingsSectionTitle
    }, "DEVICE INFO")), /*#__PURE__*/React.createElement(View, {
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
    }, "ADVANCED TOOLS")), /*#__PURE__*/React.createElement(View, {
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
    }, "SHARE JSON REPORT")), /*#__PURE__*/React.createElement(TouchableOpacity, {
      style: [styles.toolBtn, {
        margin: 0,
        marginBottom: 16
      }],
      onPress: handleExportText
    }, /*#__PURE__*/React.createElement(Text, {
      style: styles.toolBtnText
    }, "SHARE TEXT REPORT")), /*#__PURE__*/React.createElement(TouchableOpacity, {
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
    }, "SAVE JSON REPORT TO FILE")), /*#__PURE__*/React.createElement(TouchableOpacity, {
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
    }, "SAVE TEXT REPORT TO FILE")), /*#__PURE__*/React.createElement(TouchableOpacity, {
      style: [styles.toolBtn, {
        margin: 0,
        borderColor: C.error + '40'
      }],
      onPress: () => Logger.clearLogs()
    }, /*#__PURE__*/React.createElement(Text, {
      style: [styles.toolBtnText, {
        color: C.error
      }]
    }, "WIPE ALL RECORDS"))))), /*#__PURE__*/React.createElement(View, {
      style: {
        height: 60
      }
    }));
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
    }, perfRunning ? 'FPS Monitor Active' : 'FPS Monitor Off'), /*#__PURE__*/React.createElement(TouchableOpacity, {
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
    }, "CURRENT FPS"), /*#__PURE__*/React.createElement(Text, {
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
    }, "AVERAGE FPS"), /*#__PURE__*/React.createElement(Text, {
      style: styles.perfValue
    }, fps.averageFps)), /*#__PURE__*/React.createElement(View, {
      style: styles.perfRow
    }, /*#__PURE__*/React.createElement(Text, {
      style: styles.perfLabel
    }, "MIN FPS"), /*#__PURE__*/React.createElement(Text, {
      style: [styles.perfValue, fps.minFps < 30 ? styles.perfValueError : styles.perfValueGood]
    }, fps.minFps)), /*#__PURE__*/React.createElement(View, {
      style: styles.perfRow
    }, /*#__PURE__*/React.createElement(Text, {
      style: styles.perfLabel
    }, "MAX FPS"), /*#__PURE__*/React.createElement(Text, {
      style: styles.perfValue
    }, fps.maxFps)), /*#__PURE__*/React.createElement(View, {
      style: styles.perfRow
    }, /*#__PURE__*/React.createElement(Text, {
      style: styles.perfLabel
    }, "DROPPED FRAMES"), /*#__PURE__*/React.createElement(Text, {
      style: [styles.perfValue, fps.droppedFrames > 10 ? styles.perfValueWarning : styles.perfValueGood]
    }, fps.droppedFrames))), /*#__PURE__*/React.createElement(View, {
      style: styles.perfCard
    }, /*#__PURE__*/React.createElement(Text, {
      style: styles.perfLabel
    }, "FPS HISTORY (LAST 60 SECONDS)"), /*#__PURE__*/React.createElement(View, {
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
      return /*#__PURE__*/React.createElement(View, {
        key: i,
        style: {
          flex: 1,
          height: h,
          backgroundColor: barColor,
          borderRadius: 1,
          opacity: 0.5 + i / 60 * 0.5
        }
      });
    })))), !fps && /*#__PURE__*/React.createElement(View, {
      style: styles.perfCard
    }, /*#__PURE__*/React.createElement(Text, {
      style: [styles.perfLabel, {
        textAlign: 'center',
        marginVertical: 20
      }]
    }, "Tap the toggle above to start monitoring FPS")), /*#__PURE__*/React.createElement(View, {
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
      }, "NO WEBSOCKET ACTIVITY"), /*#__PURE__*/React.createElement(Text, {
        style: [styles.perfLabel, {
          color: C.textSubtle,
          fontSize: 10,
          textAlign: 'center'
        }]
      }, "WebSocket connections are automatically intercepted")));
    }
    return /*#__PURE__*/React.createElement(ScrollView, {
      style: styles.wsContainer
    }, wsLogs.map(log => {
      const isOpen = log.message?.includes('OPEN');
      const isClose = log.message?.includes('CLOSE');
      const isError = log.message?.includes('ERROR');
      const badgeColor = isOpen ? C.success : isClose ? C.textDim : isError ? C.error : C.primary;
      return /*#__PURE__*/React.createElement(View, {
        key: log.id,
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
      }, isOpen ? 'OPEN' : isClose ? 'CLOSE' : isError ? 'ERROR' : 'MSG')), /*#__PURE__*/React.createElement(Text, {
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
      }, typeof log.requestData === 'string' ? log.requestData : JSON.stringify(log.requestData, null, 2))));
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
    }, "DEVICE"), /*#__PURE__*/React.createElement(View, {
      style: styles.deviceRow
    }, /*#__PURE__*/React.createElement(Text, {
      style: styles.deviceLabel
    }, "Platform"), /*#__PURE__*/React.createElement(Text, {
      style: styles.deviceValue
    }, info.platform, " ", info.osVersion)), /*#__PURE__*/React.createElement(View, {
      style: styles.deviceRow
    }, /*#__PURE__*/React.createElement(Text, {
      style: styles.deviceLabel
    }, "Model"), /*#__PURE__*/React.createElement(Text, {
      style: styles.deviceValue
    }, info.deviceName)), /*#__PURE__*/React.createElement(View, {
      style: styles.deviceRow
    }, /*#__PURE__*/React.createElement(Text, {
      style: styles.deviceLabel
    }, "Screen"), /*#__PURE__*/React.createElement(Text, {
      style: styles.deviceValue
    }, info.screenWidth, "x", info.screenHeight, " @", info.screenScale, "x")), /*#__PURE__*/React.createElement(Text, {
      style: [styles.deviceSectionTitle, {
        marginTop: 24
      }]
    }, "APPLICATION"), info.appVersion && /*#__PURE__*/React.createElement(View, {
      style: styles.deviceRow
    }, /*#__PURE__*/React.createElement(Text, {
      style: styles.deviceLabel
    }, "App Version"), /*#__PURE__*/React.createElement(Text, {
      style: styles.deviceValue
    }, info.appVersion)), info.buildVersion && /*#__PURE__*/React.createElement(View, {
      style: styles.deviceRow
    }, /*#__PURE__*/React.createElement(Text, {
      style: styles.deviceLabel
    }, "Build Version"), /*#__PURE__*/React.createElement(Text, {
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
  }, "Monitor"), /*#__PURE__*/React.createElement(View, {
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
    onPress: () => Logger.clearLogs()
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
  }, ['ALL', 'NETWORK', 'LOGS', 'WEBSOCKET', 'PERFORMANCE', 'SETTINGS'].map(tab => /*#__PURE__*/React.createElement(TouchableOpacity, {
    key: tab,
    style: styles.tabItem,
    onPress: () => setActiveTab(tab)
  }, /*#__PURE__*/React.createElement(Text, {
    style: [styles.tabText, activeTab === tab ? styles.tabTextActive : styles.tabTextInactive]
  }, tab === 'ALL' ? t.all : tab === 'NETWORK' ? t.network : tab === 'LOGS' ? t.logs : tab === 'WEBSOCKET' ? 'WS' : tab === 'PERFORMANCE' ? 'FPS' : t.settings, /*#__PURE__*/React.createElement(Text, {
    style: styles.tabBadge
  }, tab !== 'SETTINGS' ? ` ${tabCounts[tab]}` : '')), activeTab === tab ? /*#__PURE__*/React.createElement(View, {
    style: styles.tabActiveLine
  }) : null)))), activeTab !== 'SETTINGS' ? /*#__PURE__*/React.createElement(View, null, /*#__PURE__*/React.createElement(View, {
    style: styles.searchRow
  }, /*#__PURE__*/React.createElement(View, {
    style: styles.searchBox
  }, /*#__PURE__*/React.createElement(TextInput, {
    style: styles.searchInput,
    placeholder: t.search,
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
  }, s === 'ALL' ? 'All' : s === 'OK' ? '2xx/3xx' : '4xx/5xx')))) : null) : null, activeTab === 'SETTINGS' ? renderSettings() : activeTab === 'PERFORMANCE' ? renderPerformance() : activeTab === 'WEBSOCKET' ? renderWebSocket() : /*#__PURE__*/React.createElement(FlatList, {
    data: filteredLogs,
    renderItem: renderLogItem,
    keyExtractor: item => item.id,
    contentContainerStyle: [styles.listContent, filteredLogs.length === 0 && {
      flex: 1
    }],
    ListEmptyComponent: /*#__PURE__*/React.createElement(View, {
      style: styles.emptyContainer
    }, /*#__PURE__*/React.createElement(Text, {
      style: styles.emptyIcon
    }, "\uD83D\uDCAC"), /*#__PURE__*/React.createElement(Text, {
      style: styles.emptyText
    }, t.empty), /*#__PURE__*/React.createElement(Text, {
      style: styles.emptySubText
    }, "Requests will appear here automatically"))
  }), /*#__PURE__*/React.createElement(Modal, {
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
    }, selectedLog?.type === 'info' ? isSelectedConsoleError ? 'CONSOLE ERROR' : (t.logs || '').toUpperCase() : `${selectedLog?.durationMs ?? 0}ms, ${selectedLog?.size || '0.00kb'}`), /*#__PURE__*/React.createElement(TouchableOpacity, {
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
    }, "Share Entry")), /*#__PURE__*/React.createElement(TouchableOpacity, {
      style: styles.detailDropdownItem,
      onPress: () => {
        if (selectedLog) {
          const curl = generateCurl(selectedLog);
          Share.share({
            message: curl || JSON.stringify(selectedLog, null, 2),
            title: 'cURL Command'
          });
        }
        setShowMenu(false);
      }
    }, /*#__PURE__*/React.createElement(Text, {
      style: styles.detailDropdownText
    }, "Share cURL")), /*#__PURE__*/React.createElement(TouchableOpacity, {
      style: [styles.detailDropdownItem, {
        borderBottomWidth: 0
      }],
      onPress: () => setShowMenu(false)
    }, /*#__PURE__*/React.createElement(Text, {
      style: styles.detailDropdownText
    }, "Close"))) : null, selectedLog?.type !== 'info' && selectedLog?.type !== 'websocket' && selectedLog?.type !== 'performance' ? /*#__PURE__*/React.createElement(View, {
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
    }, selectedLog?.type === 'info' || selectedLog?.type === 'websocket' || selectedLog?.type === 'performance' ? /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(Section, {
      themeColors: C,
      selectable: true,
      label: selectedLog?.type === 'websocket' ? 'WEBSOCKET EVENT' : selectedLog?.type === 'performance' ? 'PERFORMANCE DATA' : 'LOG MESSAGE',
      value: selectedLog?.message
    }), selectedLog?.url ? /*#__PURE__*/React.createElement(Section, {
      themeColors: C,
      selectable: true,
      label: "URL",
      value: selectedLog.url
    }) : null, /*#__PURE__*/React.createElement(Section, {
      themeColors: C,
      label: "DATA",
      json: selectedLog?.requestData
    }), selectedLog?.type === 'performance' && selectedLog?.durationMs ? /*#__PURE__*/React.createElement(Section, {
      themeColors: C,
      label: "FPS",
      value: String(selectedLog.durationMs)
    }) : null) : detailTab === 'REQUEST' ? /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(Section, {
      themeColors: C,
      label: t.method,
      value: selectedLog?.method
    }), /*#__PURE__*/React.createElement(Section, {
      themeColors: C,
      selectable: true,
      label: t.url,
      value: selectedLog?.isRedirected ? `${selectedLog?.originalUrl} ➔ ${selectedLog?.url}` : selectedLog?.url
    }), /*#__PURE__*/React.createElement(Section, {
      themeColors: C,
      label: t.headers,
      json: selectedLog?.requestHeaders
    }), /*#__PURE__*/React.createElement(Section, {
      themeColors: C,
      label: t.body,
      json: selectedLog?.requestData
    })) : /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(Section, {
      themeColors: C,
      label: t.status,
      value: selectedLog?.status?.toString(),
      color: selectedLog?.status && selectedLog.status >= 400 ? C.error : C.success
    }), /*#__PURE__*/React.createElement(Section, {
      themeColors: C,
      label: t.headers,
      json: selectedLog?.responseHeaders
    }), /*#__PURE__*/React.createElement(Section, {
      themeColors: C,
      label: t.body,
      json: selectedLog?.responseData
    })), /*#__PURE__*/React.createElement(View, {
      style: {
        height: 100
      }
    }))));
  })())));
};
//# sourceMappingURL=DebugMonitor.js.map