/* eslint-disable no-unused-vars */
/* eslint-disable react-native/no-inline-styles */
/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Share,
  Modal,
  Alert,
  TextInput,
  StatusBar,
  FlatList,
  Platform,
  NativeModules,
  useColorScheme
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import styleSheet, { getColors, DARK_COLORS } from './DebugMonitorStyles';
import { Logger, LogEntry, CustomUrlEntry } from './Logger';

interface DebugMonitorProps {
  onClose: () => void;
  envConfig?: {
    currentEnv: string;
    onEnvChange: (newEnv: 'demo' | 'prod') => void;
  };
  onBaseUrlChange?: (newUrl: string) => void;
  baseUrls?: string[] | { title: string; url: string }[];
  prodUrl?: string;
  testUrl?: string;
  onExitDebugMode?: () => void;
  language?: 'az' | 'en' | 'ru' | 'tr' | 'auto';
  theme?: 'light' | 'dark' | 'auto';
}

const TRANSLATIONS: Record<string, any> = {
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

export type TabType = 'ALL' | 'NETWORK' | 'LOGS' | 'SETTINGS';
export type DetailTab = 'REQUEST' | 'RESPONSE';

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
}: {
  label: string;
  value?: string | null;
  json?: any;
  color?: string;
  selectable?: boolean;
  themeColors?: any;
}): React.ReactElement | null => {
  const styles = styleSheet(themeColors);
  if (!value && (!json || Object.keys(json).length === 0)) return null;
  return (
    <View style={styles.sectionBox}>
      <Text style={styles.sectionLabel}>{label}</Text>
      {value ? (
        <Text
          selectable={selectable}
          style={[styles.sectionValue, color ? { color } : undefined]}
        >
          {value}
        </Text>
      ) : (
        <View style={styles.jsonBox}>
          <Text selectable style={styles.jsonText}>
            {JSON.stringify(json, null, 2)}
          </Text>
        </View>
      )}
    </View>
  );
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
}: DebugMonitorProps) => {
  const systemScheme = useColorScheme();
  const effectiveTheme: 'dark' | 'light' =
    theme === 'auto' ? (systemScheme === 'light' ? 'light' : 'dark') : theme;
  const C = getColors(effectiveTheme);
  const styles = styleSheet(C);

  const [logs, setLogs] = useState<LogEntry[]>(Logger.getLogs());
  const [selectedLog, setSelectedLog] = useState<LogEntry | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('ALL');
  const [detailTab, setDetailTab] = useState<DetailTab>('RESPONSE');
  const [showMenu, setShowMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'OK' | 'ERR'>('ALL');
  const [baseUrl, setBaseUrl] = useState(Logger.getBaseUrl());
  const [manualUrl, setManualUrl] = useState('');
  const [, setCustomUrlEntries] = useState<CustomUrlEntry[]>(Logger.getCustomUrls());
  const [filterMethod] = useState<string | 'ALL'>('ALL');

  useEffect(() => {
    const unsubscribe = Logger.subscribe((newLogs) => {
      setLogs(newLogs);
    });
    return unsubscribe;
  }, []);

  const t = useMemo(() => {
    let lang = language;
    if (lang === 'auto') {
      try {
        const locale =
          Platform.OS === 'ios'
            ? NativeModules.SettingsManager?.settings?.AppleLocale ||
              NativeModules.SettingsManager?.settings?.AppleLanguages?.[0]
            : NativeModules.I18nManager?.localeIdentifier;
        lang = (locale?.split(/[-_]/)[0] || 'en') as any;
      } catch (e) {
        lang = 'en';
      }
    }
    return TRANSLATIONS[lang] || TRANSLATIONS.en;
  }, [language]);

  const tabCounts = useMemo(() => {
    return {
      ALL: logs.length,
      NETWORK: logs.filter(
        (l: LogEntry) => ['request', 'response'].includes(l.type) || (l.type === 'error' && !!l.url)
      ).length,
      LOGS: logs.filter((l: LogEntry) => l.type === 'info' || (l.type === 'error' && !l.url))
        .length,
      SETTINGS: 0
    };
  }, [logs]);

  const filteredLogs = useMemo(() => {
    return logs.filter((log: LogEntry) => {
      const typeMatch =
        activeTab === 'ALL'
          ? true
          : activeTab === 'NETWORK'
            ? ['request', 'response'].includes(log.type) || (log.type === 'error' && !!log.url)
            : activeTab === 'LOGS'
              ? log.type === 'info' || (log.type === 'error' && !log.url)
              : false;

      if (!typeMatch && activeTab !== 'SETTINGS') return false;

      const matchesSearch =
        searchQuery === '' ||
        log.url?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.message?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesMethod = filterMethod === 'ALL' || log.method === filterMethod;

      const matchesStatus =
        filterStatus === 'ALL'
          ? true
          : filterStatus === 'ERR'
            ? !!log.status && log.status >= 400
            : !!log.status && log.status < 400;

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
  const handleShare = async (): Promise<void> => {
    try {
      await Share.share({ message: JSON.stringify(logs, null, 2), title: 'Debug Logs' });
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
  const generateCurl = (log: LogEntry): string => {
    if (!log.url) return '';
    let curl = `curl -X ${log.method || 'GET'} "${log.url}"`;
    if (log.headers) {
      Object.keys(log.headers).forEach((key) => {
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
  const handleSaveSettings = (): void => {
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
        Alert.alert(
          'Error',
          'Invalid domain format. Example: https://api.example.com or http://localhost'
        );
        return;
      }
    } catch (e) {
      Alert.alert(
        'Error',
        'Invalid URL format. Please include protocol (e.g., https://api.example.com)'
      );
      return;
    }

    Logger.setBaseUrl(newUrl);
    setBaseUrl(newUrl);

    Logger.addCustomUrl({ title: `Custom ${Logger.getCustomUrls().length + 1}`, url: newUrl });
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
  const handleRemoveCustomUrl = (url: string): void => {
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
  const renderLogItem = ({ item }: { item: LogEntry }): React.ReactElement => {
    const isConsoleError = item.type === 'info' && item.message?.startsWith('[ERROR]');
    const isError = item.type === 'error' || (item.status && item.status >= 400) || isConsoleError;
    const indicatorColor = isError
      ? C.error
      : item.type === 'database'
        ? C.accent
        : item.type === 'navigation'
          ? C.warning
          : item.status && item.status >= 200 && item.status < 300
            ? C.success
            : C.primary;

    return (
      <TouchableOpacity
        activeOpacity={0.7}
        style={styles.logItem}
        onPress={() => {
          setSelectedLog(item);
          setDetailTab('RESPONSE');
        }}
      >
        <View style={[styles.logIndicator, { backgroundColor: indicatorColor }]} />
        <View style={styles.logBody}>
          <View style={styles.logHeader}>
            <View style={[styles.badge, { backgroundColor: indicatorColor + '18' }]}>
              <Text style={[styles.logMethod, { color: indicatorColor }]}>
                {item.method || (isConsoleError ? 'ERROR' : item.type.toUpperCase())}
              </Text>
            </View>
            {item.status ? (
              <View style={[styles.statusChip, { backgroundColor: indicatorColor + '18' }]}>
                <Text style={[styles.statusChipText, { color: indicatorColor }]}>{item.status}</Text>
              </View>
            ) : null}
            <Text style={styles.logTime}>
              {new Date(item.timestamp).toLocaleTimeString([], {
                hour12: false,
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
              })}
            </Text>
          </View>
          <Text style={styles.logUrl} numberOfLines={2}>
            {item.isRedirected ? `${item.originalUrl} ➔ ${item.url}` : item.url || item.message}
          </Text>
          {item.durationMs !== undefined ? (
            <View style={styles.logMetaBox}>
              <View style={styles.metaBadge}>
                <Text style={styles.logMeta}>⏱ {item.durationMs ?? 0}ms</Text>
              </View>
              <View style={styles.metaBadge}>
                <Text style={styles.logMeta}>📦 {item.size || '0.00kb'}</Text>
              </View>
            </View>
          ) : null}
        </View>
      </TouchableOpacity>
    );
  };



  /**
   * renderSettings
   *
   * Render settings panel including environment selection and custom URLs.
   *
   * @returns JSX.Element
   */
  const renderSettings = (): React.ReactElement => {
    const predefinedList = baseUrls ? (Array.isArray(baseUrls) ? baseUrls : []) : [];
    const allCustoms = Logger.getCustomUrls();

    const allSources: { title: string; url?: string; type: 'env' | 'url'; val: any }[] = [];

    if (prodUrl) {
      allSources.push({ title: 'PRODUCTION API (PROD)', url: prodUrl, type: 'url', val: prodUrl });
    }
    if (testUrl) {
      allSources.push({ title: 'TEST API (TEST)', url: testUrl, type: 'url', val: testUrl });
    }

    if (envConfig) {
      allSources.push({ title: 'PRODUCTIVE (PROD)', type: 'env', val: 'prod' });
      allSources.push({ title: 'DEMONSTRATION (DEMO)', type: 'env', val: 'demo' });
    }

    predefinedList.forEach((item) => {
      const title = typeof item === 'string' ? item : item.title;
      const url = typeof item === 'string' ? item : item.url;
      allSources.push({ title, url, type: 'url', val: url });
    });

    allCustoms.forEach((item) => {
      allSources.push({ title: item.title, url: item.url, type: 'url', val: item.url });
    });

    return (
      <ScrollView style={styles.settingsContainer}>
        {allSources.length > 0 ? (
          <View style={styles.section}>
            <View style={styles.sectionHeaderBox}>
              <Text style={styles.sectionTitle}>{t.selectUrl}</Text>
            </View>
            <View style={styles.card}>
              {allSources.map((item: any, index: number) => {
                const isUrlActive = baseUrl !== '' && baseUrl === item.val;
                const isEnvActive =
                  baseUrl === '' && item.type === 'env' && envConfig?.currentEnv === item.val;
                const isActive = item.type === 'env' ? isEnvActive : isUrlActive;

                const isCustom = allCustoms.some((u) => u.url === item.val);

                return (
                  <View key={index} style={[styles.urlOption, isActive && styles.urlOptionActive]}>
                    <TouchableOpacity
                      style={styles.urlOptionInfo}
                      onPress={() => {
                        if (item.type === 'env') {
                          setBaseUrl('');
                          Logger.setBaseUrl('');
                          envConfig?.onEnvChange(item.val);
                        } else {
                          setBaseUrl(item.val);
                          Logger.setBaseUrl(item.val);
                          if (onBaseUrlChange) onBaseUrlChange(item.val);
                        }
                      }}
                    >
                      <Text
                        style={[styles.urlOptionTitle, isActive && styles.urlOptionTitleActive]}
                      >
                        {item.title}
                      </Text>
                      {item.url ? (
                        <Text style={styles.urlOptionUrl} numberOfLines={1}>
                          {item.url}
                        </Text>
                      ) : null}
                    </TouchableOpacity>
                    <View style={styles.optionActions}>
                      {isCustom ? (
                        <TouchableOpacity
                          style={styles.deleteBtn}
                          onPress={() => handleRemoveCustomUrl(item.val)}
                        >
                          <Text style={styles.deleteBtnText}>✕</Text>
                        </TouchableOpacity>
                      ) : null}
                      {isActive ? <View style={styles.activeDot} /> : null}
                    </View>
                  </View>
                );
              })}
            </View>
          </View>
        ) : null}

        <View style={[styles.section, { marginTop: allSources.length > 0 ? 32 : 0 }]}>
          <View style={styles.sectionHeaderBox}>
            <Text style={styles.sectionTitle}>{t.manualUrl}</Text>
          </View>
          <View style={styles.card}>
            <View style={styles.cardInner}>
              <Text style={styles.inputLabel}>{t.customUrl.toUpperCase()}</Text>
              <TextInput
                style={styles.textInput}
                value={manualUrl}
                placeholder="https://api.example.com"
                placeholderTextColor={C.textDim}
                autoCapitalize="none"
                keyboardType="url"
                onChangeText={setManualUrl}
              />
              <TouchableOpacity style={styles.saveBtn} onPress={handleSaveSettings}>
                <Text style={styles.saveBtnText}>APPLY CHANGES</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <View style={[styles.section, { marginTop: 32 }]}>
          <View style={styles.sectionHeaderBox}>
            <Text style={styles.sectionTitle}>ADVANCED TOOLS</Text>
          </View>
          <View style={styles.card}>
            <View style={styles.cardInner}>
              <TouchableOpacity style={[styles.toolBtn, { margin: 0, marginBottom: 16 }]} onPress={handleShare}>
                <Text style={styles.toolBtnText}>EXPORT JSON REPORT</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.toolBtn, { margin: 0, borderColor: C.error + '40' }]}
                onPress={() => Logger.clearLogs()}
              >
                <Text style={[styles.toolBtnText, { color: C.error }]}>WIPE ALL RECORDS</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
        <View style={{ height: 60 }} />
      </ScrollView>
    );
  };
  const { top, bottom } = useSafeAreaInsets();
  return (
    <View style={styles.container}>
      <StatusBar barStyle={effectiveTheme === 'light' ? 'dark-content' : 'light-content'} backgroundColor={C.background} />
      <View style={{ flex: 1, paddingTop: top, paddingBottom: bottom }}>
        <View style={styles.header}>
          <View style={styles.headerInfo}>
            <View style={styles.titleRow}>
              <View style={styles.titleDot} />
              <Text style={styles.headerTitle}>{t.title.toUpperCase()}</Text>
            </View>
            <Text style={styles.headerSubtitle}>
              {logs.length} {t.entries}
            </Text>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={[styles.closeBtn, { backgroundColor: C.error + '18' }]}
              onPress={() => Logger.clearLogs()}
            >
              <Text style={[styles.closeBtnText, { color: C.error }]}>
                {t.clear.toUpperCase()}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <Text style={styles.closeBtnText}>{t.close.toUpperCase()}</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.tabContainer}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.tabScroll}
          >
            {(['ALL', 'NETWORK', 'LOGS', 'SETTINGS'] as TabType[]).map((tab) => (
              <TouchableOpacity
                key={tab}
                style={[styles.tab, activeTab === tab && styles.tabActive]}
                onPress={() => setActiveTab(tab)}
              >
                <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
                  {tab === 'ALL'
                    ? t.all
                    : tab === 'NETWORK'
                      ? t.network
                      : tab === 'LOGS'
                        ? t.logs
                        : t.settings}
                  {tab !== 'SETTINGS' ? ` (${(tabCounts as any)[tab]})` : ''}
                </Text>
                {activeTab === tab ? <View style={styles.activeTabDot} /> : null}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {activeTab !== 'SETTINGS' ? (
          <View>
            <View style={styles.searchRow}>
              <View style={styles.searchBox}>
                <Text style={styles.searchIcon}>🔍</Text>
                <TextInput
                  style={styles.searchInput}
                  placeholder={t.search}
                  placeholderTextColor={C.textDim}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                />
                {searchQuery.length > 0 ? (
                  <TouchableOpacity onPress={() => setSearchQuery('')}>
                    <Text style={styles.clearSearch}>✕</Text>
                  </TouchableOpacity>
                ) : null}
              </View>
            </View>
            {activeTab === 'NETWORK' ? (
              <View style={styles.filterRow}>
                {(['ALL', 'OK', 'ERR'] as const).map((s) => (
                  <TouchableOpacity
                    key={s}
                    style={[styles.filterPill, filterStatus === s && styles.filterPillActive]}
                    onPress={() => setFilterStatus(s)}
                  >
                    <Text style={[styles.filterPillText, filterStatus === s && styles.filterPillTextActive]}>
                      {s === 'ALL' ? '🟡 All' : s === 'OK' ? '🟢 2xx / 3xx' : '🔴 4xx / 5xx'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            ) : null}
          </View>
        ) : null}

        {activeTab === 'SETTINGS' ? (
          renderSettings()
        ) : (
          <FlatList
            data={filteredLogs}
            renderItem={renderLogItem}
            keyExtractor={(item: LogEntry) => item.id}
            contentContainerStyle={[styles.listContent, filteredLogs.length === 0 && { flex: 1 }]}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyIcon}>💬</Text>
                <Text style={styles.emptyText}>{t.empty}</Text>
                <Text style={styles.emptySubText}>Requests will appear here automatically</Text>
              </View>
            }
          />
        )}

        <Modal
          transparent
          visible={!!selectedLog}
          animationType="slide"
          presentationStyle="overFullScreen"
          supportedOrientations={['landscape', 'landscape-left', 'landscape-right']}
        >
          {(() => {
            const isSelectedConsoleError =
              selectedLog?.type === 'info' && selectedLog?.message?.startsWith('[ERROR]');
            return (
              <View style={[styles.detailsModal, { paddingTop: top, paddingBottom: bottom }]}>
                <View style={styles.detailsHeader}>
                  <View style={styles.detailsTopRow}>
                    <TouchableOpacity
                      style={styles.backBtn}
                      onPress={() => {
                        setSelectedLog(null);
                        setShowMenu(false);
                      }}
                    >
                      <Text style={styles.backBtnText}>←</Text>
                    </TouchableOpacity>
                    <Text
                      style={[
                        styles.detailsPerfText,
                        isSelectedConsoleError && { color: C.error }
                      ]}
                    >
                      {selectedLog?.type === 'info'
                        ? isSelectedConsoleError
                          ? 'CONSOLE ERROR'
                          : t.logs.toUpperCase()
                        : `${selectedLog?.durationMs ?? 0}ms, ${selectedLog?.size || '0.00kb'}`}
                    </Text>
                    <TouchableOpacity style={styles.menuBtn} onPress={() => setShowMenu(!showMenu)}>
                      <Text style={styles.menuBtnText}>⋮</Text>
                    </TouchableOpacity>
                  </View>

                  {showMenu ? (
                    <View style={styles.dropdownMenu}>
                      <TouchableOpacity
                        style={styles.menuItem}
                        onPress={() => {
                          Share.share({ message: JSON.stringify(selectedLog, null, 2) });
                          setShowMenu(false);
                        }}
                      >
                        <Text style={styles.menuItemText}>Share</Text>
                      </TouchableOpacity>
                      {selectedLog?.type !== 'info' ? (
                        <TouchableOpacity
                          style={styles.menuItem}
                          onPress={() => {
                            Share.share({ message: generateCurl(selectedLog!) });
                            setShowMenu(false);
                          }}
                        >
                          <Text style={styles.menuItemText}>Copy cURL</Text>
                        </TouchableOpacity>
                      ) : null}
                      <TouchableOpacity
                        style={[styles.menuItem, { borderBottomWidth: 0 }]}
                        onPress={() => setShowMenu(false)}
                      >
                        <Text style={styles.menuItemText}>Close</Text>
                      </TouchableOpacity>
                    </View>
                  ) : null}

                  {selectedLog?.type !== 'info' ? (
                    <View style={styles.detailsTabs}>
                      <TouchableOpacity
                        style={[
                          styles.detailTab,
                          detailTab === 'REQUEST' && styles.detailTabActive
                        ]}
                        onPress={() => setDetailTab('REQUEST')}
                      >
                        <Text
                          style={[
                            styles.detailTabText,
                            detailTab === 'REQUEST' && styles.detailTabTextActive
                          ]}
                        >
                          {t.request.toUpperCase()}
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[
                          styles.detailTab,
                          detailTab === 'RESPONSE' && styles.detailTabActive
                        ]}
                        onPress={() => setDetailTab('RESPONSE')}
                      >
                        <Text
                          style={[
                            styles.detailTabText,
                            detailTab === 'RESPONSE' && styles.detailTabTextActive
                          ]}
                        >
                          {t.response.toUpperCase()}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  ) : null}
                </View>

                <ScrollView style={styles.detailsContent} showsVerticalScrollIndicator={false}>
                  {selectedLog?.type === 'info' ? (
                    <>
                      <Section themeColors={C} selectable label="LOG MESSAGE" value={selectedLog?.message} />
                      <Section themeColors={C} label="DATA" json={selectedLog?.requestData} />
                    </>
                  ) : detailTab === 'REQUEST' ? (
                    <>
                      <Section themeColors={C} label={t.method} value={selectedLog?.method} />
                      <Section
                        themeColors={C}
                        selectable
                        label={t.url}
                        value={
                          selectedLog?.isRedirected
                            ? `${selectedLog?.originalUrl} ➔ ${selectedLog?.url}`
                            : selectedLog?.url
                        }
                      />
                      <Section themeColors={C} label={t.headers} json={selectedLog?.requestHeaders} />
                      <Section themeColors={C} label={t.body} json={selectedLog?.requestData} />
                    </>
                  ) : (
                    <>
                      <Section
                        themeColors={C}
                        label={t.status}
                        value={selectedLog?.status?.toString()}
                        color={
                          selectedLog?.status && selectedLog.status >= 400
                            ? C.error
                            : C.success
                        }
                      />
                      <Section themeColors={C} label={t.headers} json={selectedLog?.responseHeaders} />
                      <Section themeColors={C} label={t.body} json={selectedLog?.responseData} />
                    </>
                  )}
                  <View style={{ height: 100 }} />
                </ScrollView>
              </View>
            );
          })()}
        </Modal>
      </View>
    </View>
  );
};
