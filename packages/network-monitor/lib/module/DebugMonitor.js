/* eslint-disable no-unused-vars */
/* eslint-disable react-native/no-inline-styles */
/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Share, Modal, Alert, TextInput, StatusBar, FlatList, Platform, NativeModules, useColorScheme } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import styleSheet, { getColors } from './DebugMonitorStyles';
import { Logger } from './Logger';
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
    body: 'BODY'
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
    body: 'ТЕЛО'
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
const Section = ({
  label,
  value,
  json,
  color,
  selectable,
  themeColors
}) => {
  const styles = styleSheet(themeColors);
  if (!value && (!json || Object.keys(json).length === 0)) return null;
  return /*#__PURE__*/React.createElement(View, {
    style: styles.sectionBox
  }, /*#__PURE__*/React.createElement(Text, {
    style: styles.sectionLabel
  }, label), value ? /*#__PURE__*/React.createElement(Text, {
    selectable: selectable,
    style: [styles.sectionValue, color ? {
      color
    } : undefined]
  }, value) : /*#__PURE__*/React.createElement(View, {
    style: styles.jsonBox
  }, /*#__PURE__*/React.createElement(Text, {
    selectable: true,
    style: styles.jsonText
  }, JSON.stringify(json, null, 2))));
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
  useEffect(() => {
    const unsubscribe = Logger.subscribe(newLogs => {
      setLogs(newLogs);
    });
    return unsubscribe;
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
      SETTINGS: 0
    };
  }, [logs]);
  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      const typeMatch = activeTab === 'ALL' ? true : activeTab === 'NETWORK' ? ['request', 'response'].includes(log.type) || log.type === 'error' && !!log.url : activeTab === 'LOGS' ? log.type === 'info' || log.type === 'error' && !log.url : false;
      if (!typeMatch && activeTab !== 'SETTINGS') return false;
      const matchesSearch = searchQuery === '' || log.url?.toLowerCase().includes(searchQuery.toLowerCase()) || log.message?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesMethod = filterMethod === 'ALL' || log.method === filterMethod;
      const matchesStatus = filterStatus === 'ALL' ? true : filterStatus === 'ERR' ? !!log.status && log.status >= 400 : !!log.status && log.status < 400;
      return matchesSearch && matchesMethod && matchesStatus;
    });
  }, [logs, activeTab, searchQuery, filterMethod, filterStatus]);

  /**
   * handleShare
   *
   * Share the current logs as a JSON payload using the native share sheet.
   *
   * @returns Promise<void>
   */
  const handleShare = async () => {
    try {
      await Share.share({
        message: JSON.stringify(logs, null, 2),
        title: 'Debug Logs'
      });
    } catch (e) {
      Alert.alert('Error', 'Could not share logs');
    }
  };

  /**
   * generateCurl
   *
   * Create a cURL command string from a `LogEntry` for easy repro/testing.
   *
   * @param log - Log entry to convert
   * @returns cURL command string
   */
  const generateCurl = log => {
    if (!log.url) return '';
    let curl = `curl -X ${log.method || 'GET'} "${log.url}"`;
    if (log.headers) {
      Object.keys(log.headers).forEach(key => {
        curl += ` -H "${key}: ${log.headers[key]}"`;
      });
    }
    if (log.requestData) {
      curl += ` -d '${JSON.stringify(log.requestData)}'`;
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
      style: styles.logHeader
    }, /*#__PURE__*/React.createElement(View, {
      style: [styles.badge, {
        backgroundColor: indicatorColor + '18'
      }]
    }, /*#__PURE__*/React.createElement(Text, {
      style: [styles.logMethod, {
        color: indicatorColor
      }]
    }, item.method || (isConsoleError ? 'ERROR' : item.type.toUpperCase()))), item.status ? /*#__PURE__*/React.createElement(View, {
      style: [styles.statusChip, {
        backgroundColor: indicatorColor + '18'
      }]
    }, /*#__PURE__*/React.createElement(Text, {
      style: [styles.statusChipText, {
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
      style: styles.section
    }, /*#__PURE__*/React.createElement(View, {
      style: styles.sectionHeaderBox
    }, /*#__PURE__*/React.createElement(Text, {
      style: styles.sectionTitle
    }, t.selectUrl)), /*#__PURE__*/React.createElement(View, {
      style: styles.card
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
      style: [styles.section, {
        marginTop: allSources.length > 0 ? 32 : 0
      }]
    }, /*#__PURE__*/React.createElement(View, {
      style: styles.sectionHeaderBox
    }, /*#__PURE__*/React.createElement(Text, {
      style: styles.sectionTitle
    }, t.manualUrl)), /*#__PURE__*/React.createElement(View, {
      style: styles.card
    }, /*#__PURE__*/React.createElement(View, {
      style: styles.cardInner
    }, /*#__PURE__*/React.createElement(Text, {
      style: styles.inputLabel
    }, t.customUrl.toUpperCase()), /*#__PURE__*/React.createElement(TextInput, {
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
      style: [styles.section, {
        marginTop: 32
      }]
    }, /*#__PURE__*/React.createElement(View, {
      style: styles.sectionHeaderBox
    }, /*#__PURE__*/React.createElement(Text, {
      style: styles.sectionTitle
    }, "ADVANCED TOOLS")), /*#__PURE__*/React.createElement(View, {
      style: styles.card
    }, /*#__PURE__*/React.createElement(View, {
      style: styles.cardInner
    }, /*#__PURE__*/React.createElement(TouchableOpacity, {
      style: [styles.toolBtn, {
        margin: 0,
        marginBottom: 16
      }],
      onPress: handleShare
    }, /*#__PURE__*/React.createElement(Text, {
      style: styles.toolBtnText
    }, "EXPORT JSON REPORT")), /*#__PURE__*/React.createElement(TouchableOpacity, {
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
    style: styles.headerInfo
  }, /*#__PURE__*/React.createElement(View, {
    style: styles.titleRow
  }, /*#__PURE__*/React.createElement(View, {
    style: styles.titleDot
  }), /*#__PURE__*/React.createElement(Text, {
    style: styles.headerTitle
  }, t.title.toUpperCase())), /*#__PURE__*/React.createElement(Text, {
    style: styles.headerSubtitle
  }, logs.length, " ", t.entries)), /*#__PURE__*/React.createElement(View, {
    style: styles.headerActions
  }, /*#__PURE__*/React.createElement(TouchableOpacity, {
    style: [styles.closeBtn, {
      backgroundColor: C.error + '18'
    }],
    onPress: () => Logger.clearLogs()
  }, /*#__PURE__*/React.createElement(Text, {
    style: [styles.closeBtnText, {
      color: C.error
    }]
  }, t.clear.toUpperCase())), /*#__PURE__*/React.createElement(TouchableOpacity, {
    style: styles.closeBtn,
    onPress: onClose
  }, /*#__PURE__*/React.createElement(Text, {
    style: styles.closeBtnText
  }, t.close.toUpperCase())))), /*#__PURE__*/React.createElement(View, {
    style: styles.tabContainer
  }, /*#__PURE__*/React.createElement(ScrollView, {
    horizontal: true,
    showsHorizontalScrollIndicator: false,
    contentContainerStyle: styles.tabScroll
  }, ['ALL', 'NETWORK', 'LOGS', 'SETTINGS'].map(tab => /*#__PURE__*/React.createElement(TouchableOpacity, {
    key: tab,
    style: [styles.tab, activeTab === tab && styles.tabActive],
    onPress: () => setActiveTab(tab)
  }, /*#__PURE__*/React.createElement(Text, {
    style: [styles.tabText, activeTab === tab && styles.tabTextActive]
  }, tab === 'ALL' ? t.all : tab === 'NETWORK' ? t.network : tab === 'LOGS' ? t.logs : t.settings, tab !== 'SETTINGS' ? ` (${tabCounts[tab]})` : ''), activeTab === tab ? /*#__PURE__*/React.createElement(View, {
    style: styles.activeTabDot
  }) : null)))), activeTab !== 'SETTINGS' ? /*#__PURE__*/React.createElement(View, null, /*#__PURE__*/React.createElement(View, {
    style: styles.searchRow
  }, /*#__PURE__*/React.createElement(View, {
    style: styles.searchBox
  }, /*#__PURE__*/React.createElement(Text, {
    style: styles.searchIcon
  }, "\uD83D\uDD0D"), /*#__PURE__*/React.createElement(TextInput, {
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
    style: [styles.filterPillText, filterStatus === s && styles.filterPillTextActive]
  }, s === 'ALL' ? '🟡 All' : s === 'OK' ? '🟢 2xx / 3xx' : '🔴 4xx / 5xx')))) : null) : null, activeTab === 'SETTINGS' ? renderSettings() : /*#__PURE__*/React.createElement(FlatList, {
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
    presentationStyle: "overFullScreen",
    supportedOrientations: ['landscape', 'landscape-left', 'landscape-right']
  }, (() => {
    const isSelectedConsoleError = selectedLog?.type === 'info' && selectedLog?.message?.startsWith('[ERROR]');
    return /*#__PURE__*/React.createElement(View, {
      style: [styles.detailsModal, {
        paddingTop: top,
        paddingBottom: bottom
      }]
    }, /*#__PURE__*/React.createElement(View, {
      style: styles.detailsHeader
    }, /*#__PURE__*/React.createElement(View, {
      style: styles.detailsTopRow
    }, /*#__PURE__*/React.createElement(TouchableOpacity, {
      style: styles.backBtn,
      onPress: () => {
        setSelectedLog(null);
        setShowMenu(false);
      }
    }, /*#__PURE__*/React.createElement(Text, {
      style: styles.backBtnText
    }, "\u2190")), /*#__PURE__*/React.createElement(Text, {
      style: [styles.detailsPerfText, isSelectedConsoleError && {
        color: C.error
      }]
    }, selectedLog?.type === 'info' ? isSelectedConsoleError ? 'CONSOLE ERROR' : t.logs.toUpperCase() : `${selectedLog?.durationMs ?? 0}ms, ${selectedLog?.size || '0.00kb'}`), /*#__PURE__*/React.createElement(TouchableOpacity, {
      style: styles.menuBtn,
      onPress: () => setShowMenu(!showMenu)
    }, /*#__PURE__*/React.createElement(Text, {
      style: styles.menuBtnText
    }, "\u22EE"))), showMenu ? /*#__PURE__*/React.createElement(View, {
      style: styles.dropdownMenu
    }, /*#__PURE__*/React.createElement(TouchableOpacity, {
      style: styles.menuItem,
      onPress: () => {
        Share.share({
          message: JSON.stringify(selectedLog, null, 2)
        });
        setShowMenu(false);
      }
    }, /*#__PURE__*/React.createElement(Text, {
      style: styles.menuItemText
    }, "Share")), selectedLog?.type !== 'info' ? /*#__PURE__*/React.createElement(TouchableOpacity, {
      style: styles.menuItem,
      onPress: () => {
        Share.share({
          message: generateCurl(selectedLog)
        });
        setShowMenu(false);
      }
    }, /*#__PURE__*/React.createElement(Text, {
      style: styles.menuItemText
    }, "Copy cURL")) : null, /*#__PURE__*/React.createElement(TouchableOpacity, {
      style: [styles.menuItem, {
        borderBottomWidth: 0
      }],
      onPress: () => setShowMenu(false)
    }, /*#__PURE__*/React.createElement(Text, {
      style: styles.menuItemText
    }, "Close"))) : null, selectedLog?.type !== 'info' ? /*#__PURE__*/React.createElement(View, {
      style: styles.detailsTabs
    }, /*#__PURE__*/React.createElement(TouchableOpacity, {
      style: [styles.detailTab, detailTab === 'REQUEST' && styles.detailTabActive],
      onPress: () => setDetailTab('REQUEST')
    }, /*#__PURE__*/React.createElement(Text, {
      style: [styles.detailTabText, detailTab === 'REQUEST' && styles.detailTabTextActive]
    }, t.request.toUpperCase())), /*#__PURE__*/React.createElement(TouchableOpacity, {
      style: [styles.detailTab, detailTab === 'RESPONSE' && styles.detailTabActive],
      onPress: () => setDetailTab('RESPONSE')
    }, /*#__PURE__*/React.createElement(Text, {
      style: [styles.detailTabText, detailTab === 'RESPONSE' && styles.detailTabTextActive]
    }, t.response.toUpperCase()))) : null), /*#__PURE__*/React.createElement(ScrollView, {
      style: styles.detailsContent,
      showsVerticalScrollIndicator: false
    }, selectedLog?.type === 'info' ? /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(Section, {
      themeColors: C,
      selectable: true,
      label: "LOG MESSAGE",
      value: selectedLog?.message
    }), /*#__PURE__*/React.createElement(Section, {
      themeColors: C,
      label: "DATA",
      json: selectedLog?.requestData
    })) : detailTab === 'REQUEST' ? /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(Section, {
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
    })));
  })())));
};
//# sourceMappingURL=DebugMonitor.js.map