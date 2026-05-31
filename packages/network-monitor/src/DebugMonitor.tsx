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
import { FpsStats, subscribeToFps, isPerformanceMonitorRunning, startPerformanceMonitor, stopPerformanceMonitor } from './PerformanceMonitor';
import { getDeviceInfo, DeviceInfoData } from './DeviceInfo';
import { generateExportReport, formatReportAsText } from './ExportReport';
import { isInternalUrl } from './NetworkMonitor';
import { saveReportToJson, saveReportToText } from './FileExporter';

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

export type TabType = 'ALL' | 'NETWORK' | 'LOGS' | 'WEBSOCKET' | 'PERFORMANCE' | 'SETTINGS';
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
const tryParseJson = (data: any): any => {
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
}: {
  label: string;
  value?: string | null;
  json?: any;
  color?: string;
  selectable?: boolean;
  themeColors?: any;
}): React.ReactElement | null => {
  const styles = styleSheet(themeColors);

  const resolvedJson = json !== undefined && json !== null ? tryParseJson(json) : json;

  const isEmpty = (val: any): boolean => {
    if (val === null || val === undefined) return true;
    if (typeof val === 'string') return val.length === 0;
    if (typeof val === 'object') return Object.keys(val).length === 0;
    return false;
  };

  if (!value && isEmpty(resolvedJson)) return null;

  const isJsonObject = resolvedJson !== null && typeof resolvedJson === 'object';

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
      ) : isJsonObject ? (
        <View style={styles.jsonBox}>
          <Text selectable style={styles.jsonText}>
            {JSON.stringify(resolvedJson, null, 2)}
          </Text>
        </View>
      ) : (
        <Text selectable style={styles.sectionValue}>
          {String(resolvedJson)}
        </Text>
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
  const [fpsStats, setFpsStats] = useState<FpsStats | null>(null);
  const [perfRunning, setPerfRunning] = useState(isPerformanceMonitorRunning());
  const [deviceInfo] = useState<DeviceInfoData>(getDeviceInfo());

  useEffect(() => {
    const unsubscribe = Logger.subscribe((newLogs) => {
      setLogs(newLogs);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    const unsubFps = subscribeToFps((stats) => {
      setFpsStats(stats);
    });
    return unsubFps;
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
      WEBSOCKET: logs.filter((l: LogEntry) => l.type === 'websocket').length,
      PERFORMANCE: logs.filter((l: LogEntry) => l.type === 'performance').length,
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
              : activeTab === 'WEBSOCKET'
                ? log.type === 'websocket'
                : activeTab === 'PERFORMANCE'
                  ? log.type === 'performance'
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

  const handleExportJson = async (): Promise<void> => {
    try {
      const report = generateExportReport(logs);
      await Share.share({
        message: JSON.stringify(report, null, 2),
        title: 'Network Monitor Export Report',
      });
    } catch (e) {
      Alert.alert('Error', 'Could not share report');
    }
  };

  const handleExportText = async (): Promise<void> => {
    try {
      const report = generateExportReport(logs);
      const text = formatReportAsText(report);
      await Share.share({
        message: text,
        title: 'Network Monitor Export Report',
      });
    } catch (e) {
      Alert.alert('Error', 'Could not share report');
    }
  };

  const handleShareLog = async (log: LogEntry): Promise<void> => {
    try {
      const lines = [
        `Type: ${log.type}`,
        `Time: ${log.timestamp}`,
        log.method ? `Method: ${log.method}` : null,
        log.url ? `URL: ${log.url}` : null,
        log.status ? `Status: ${log.status}` : null,
        log.message ? `Message: ${log.message}` : null,
        log.durationMs !== undefined ? `Duration: ${log.durationMs}ms` : null,
        log.size ? `Size: ${log.size}` : null,
      ].filter(Boolean).join('\n');
      await Share.share({ message: lines, title: 'Log Entry' });
    } catch (e) {
      Alert.alert('Error', 'Could not share log');
    }
  };

  const escapeShell = (str: string): string => {
    return str.replace(/'/g, "'\\''");
  };

  const formatCurlBody = (data: any): string => {
    if (data === null || data === undefined) return '';
    if (typeof data === 'string') return data;
    return JSON.stringify(data);
  };

  const generateCurl = (log: LogEntry): string => {
    if (!log.url) return '';
    if (!log.url || isInternalUrl(log.url)) return '';

    let curl = `curl -X ${log.method || 'GET'} '${escapeShell(log.url)}'`;
    if (log.requestHeaders) {
      Object.keys(log.requestHeaders).forEach((key) => {
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
          <View style={styles.logRow}>
            <View style={[styles.logChip, { backgroundColor: indicatorColor + '18' }]}>
              <Text style={[styles.logChipText, { color: indicatorColor }]}>
                {item.method || (isConsoleError ? 'ERROR' : (item.type || '').toUpperCase())}
              </Text>
            </View>
            {item.status ? (
              <View style={[styles.logStatusChip, { backgroundColor: indicatorColor + '18' }]}>
                <Text style={[styles.logStatusText, { color: indicatorColor }]}>{item.status}</Text>
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
          <View style={styles.settingsSection}>
            <View style={styles.settingsSectionHeader}>
              <View style={styles.settingsSectionLine} />
              <Text style={styles.settingsSectionTitle}>{t.selectUrl}</Text>
            </View>
            <View style={styles.settingsCard}>
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

        <View style={[styles.settingsSection, { marginTop: allSources.length > 0 ? 32 : 0 }]}>
          <View style={styles.settingsSectionHeader}>
            <View style={styles.settingsSectionLine} />
            <Text style={styles.settingsSectionTitle}>{t.manualUrl}</Text>
          </View>
          <View style={styles.settingsCard}>
            <View style={styles.cardInner}>
              <Text style={styles.inputLabel}>{t.customUrl?.toUpperCase() || ''}</Text>
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

        <View style={[styles.settingsSection, { marginTop: 32 }]}>
            <View style={styles.settingsSectionHeader}>
              <View style={styles.settingsSectionLine} />
              <Text style={styles.settingsSectionTitle}>DEVICE INFO</Text>
          </View>
          <View style={styles.settingsCard}>
            <View style={styles.cardInner}>
              {renderDeviceInfoSection()}
            </View>
          </View>
        </View>

        <View style={[styles.settingsSection, { marginTop: 32 }]}>
            <View style={styles.settingsSectionHeader}>
              <View style={styles.settingsSectionLine} />
              <Text style={styles.settingsSectionTitle}>ADVANCED TOOLS</Text>
          </View>
          <View style={styles.settingsCard}>
            <View style={styles.cardInner}>
              <TouchableOpacity style={[styles.toolBtn, { margin: 0, marginBottom: 12 }]} onPress={handleExportJson}>
                <Text style={styles.toolBtnText}>SHARE JSON REPORT</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.toolBtn, { margin: 0, marginBottom: 16 }]} onPress={handleExportText}>
                <Text style={styles.toolBtnText}>SHARE TEXT REPORT</Text>
              </TouchableOpacity>

              <TouchableOpacity style={[styles.toolBtn, { margin: 0, marginBottom: 12, borderColor: C.accent + '40' }]} onPress={() => saveReportToJson(logs)}>
                <Text style={[styles.toolBtnText, { color: C.accent }]}>SAVE JSON REPORT TO FILE</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.toolBtn, { margin: 0, marginBottom: 16, borderColor: C.accent + '40' }]} onPress={() => saveReportToText(logs)}>
                <Text style={[styles.toolBtnText, { color: C.accent }]}>SAVE TEXT REPORT TO FILE</Text>
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
  const renderPerformance = (): React.ReactElement => {
    const fps = fpsStats;
    const fpsPercent = fps ? Math.min((fps.fps / 60) * 100, 100) : 0;
    const barColor = !fps ? C.textDim : fps.fps >= 55 ? C.success : fps.fps >= 30 ? C.warning : C.error;
    const fpsLabel = !fps ? '--' : `${fps.fps}`;

    return (
      <ScrollView style={styles.perfContainer}>
        <View style={styles.perfToggle}>
          <Text style={styles.perfToggleText}>
            {perfRunning ? 'FPS Monitor Active' : 'FPS Monitor Off'}
          </Text>
          <TouchableOpacity
            style={[
              styles.toggleTrack,
              perfRunning ? styles.toggleTrackActive : styles.toggleTrackInactive
            ]}
            onPress={() => {
              if (perfRunning) {
                stopPerformanceMonitor();
                setPerfRunning(false);
              } else {
                startPerformanceMonitor();
                setPerfRunning(true);
              }
            }}
          >
            <View style={[styles.toggleThumb, { alignSelf: perfRunning ? 'flex-end' : 'flex-start' }]} />
          </TouchableOpacity>
        </View>

        <View style={styles.perfCard}>
          <View style={styles.perfRow}>
            <Text style={styles.perfLabel}>CURRENT FPS</Text>
            <Text style={[styles.perfValue, !fps ? {} : fps.fps >= 55 ? styles.perfValueGood : fps.fps >= 30 ? styles.perfValueWarning : styles.perfValueError]}>
              {fpsLabel}
            </Text>
          </View>
          <View style={styles.fpsBar}>
            <View style={[styles.fpsBarFill, { width: `${fpsPercent}%`, backgroundColor: barColor }]} />
          </View>
        </View>

        {fps && (
          <>
            <View style={styles.perfCard}>
              <View style={styles.perfRow}>
                <Text style={styles.perfLabel}>AVERAGE FPS</Text>
                <Text style={styles.perfValue}>{fps.averageFps}</Text>
              </View>
              <View style={styles.perfRow}>
                <Text style={styles.perfLabel}>MIN FPS</Text>
                <Text style={[styles.perfValue, fps.minFps < 30 ? styles.perfValueError : styles.perfValueGood]}>{fps.minFps}</Text>
              </View>
              <View style={styles.perfRow}>
                <Text style={styles.perfLabel}>MAX FPS</Text>
                <Text style={styles.perfValue}>{fps.maxFps}</Text>
              </View>
              <View style={styles.perfRow}>
                <Text style={styles.perfLabel}>DROPPED FRAMES</Text>
                <Text style={[styles.perfValue, fps.droppedFrames > 10 ? styles.perfValueWarning : styles.perfValueGood]}>{fps.droppedFrames}</Text>
              </View>
            </View>

            <View style={styles.perfCard}>
              <Text style={styles.perfLabel}>FPS HISTORY (LAST 60 SECONDS)</Text>
              <View style={{ height: 80, flexDirection: 'row', alignItems: 'flex-end', gap: 1, marginTop: 12 }}>
                {Array.from({ length: Math.min(60, fps.fps) }, (_, i) => {
                  const h = Math.max(4, (fps.averageFps / 60) * 80);
                  return (
                    <View
                      key={i}
                      style={{
                        flex: 1,
                        height: h,
                        backgroundColor: barColor,
                        borderRadius: 1,
                        opacity: 0.5 + (i / 60) * 0.5
                      }}
                    />
                  );
                })}
              </View>
            </View>
          </>
        )}

        {!fps && (
          <View style={styles.perfCard}>
            <Text style={[styles.perfLabel, { textAlign: 'center', marginVertical: 20 }]}>
              Tap the toggle above to start monitoring FPS
            </Text>
          </View>
        )}

        <View style={{ height: 60 }} />
      </ScrollView>
    );
  };

  const renderWebSocket = (): React.ReactElement => {
    const wsLogs = logs.filter((l: LogEntry) => l.type === 'websocket');

    if (wsLogs.length === 0) {
      return (
        <View style={styles.wsContainer}>
          <View style={[styles.perfCard, { alignItems: 'center', padding: 40 }]}>
            <Text style={{ fontSize: 32, marginBottom: 12 }}>🔌</Text>
            <Text style={[styles.perfLabel, { textAlign: 'center', marginBottom: 4 }]}>NO WEBSOCKET ACTIVITY</Text>
            <Text style={[styles.perfLabel, { color: C.textSubtle, fontSize: 10, textAlign: 'center' }]}>
              WebSocket connections are automatically intercepted
            </Text>
          </View>
        </View>
      );
    }

    return (
      <ScrollView style={styles.wsContainer}>
        {wsLogs.map((log) => {
          const isOpen = log.message?.includes('OPEN');
          const isClose = log.message?.includes('CLOSE');
          const isError = log.message?.includes('ERROR');
          const badgeColor = isOpen ? C.success : isClose ? C.textDim : isError ? C.error : C.primary;

          return (
            <View key={log.id} style={styles.wsItem}>
              <View style={styles.wsHeader}>
                <View style={[styles.wsBadge, { backgroundColor: badgeColor + '20' }]}>
                  <Text style={[styles.wsBadgeText, { color: badgeColor }]}>
                    {isOpen ? 'OPEN' : isClose ? 'CLOSE' : isError ? 'ERROR' : 'MSG'}
                  </Text>
                </View>
                <Text style={styles.wsUrl} numberOfLines={1}>{log.url}</Text>
                <Text style={styles.wsTime}>
                  {new Date(log.timestamp).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </Text>
              </View>
              {log.message && (
                <Text style={styles.wsMessage} numberOfLines={3}>{log.message}</Text>
              )}
              {log.requestData && (
                <View style={[styles.jsonBox, { marginTop: 8, padding: 10 }]}>
                  <Text style={styles.jsonText} numberOfLines={5}>
                    {typeof log.requestData === 'string' ? log.requestData : JSON.stringify(log.requestData, null, 2)}
                  </Text>
                </View>
              )}
            </View>
          );
        })}
        <View style={{ height: 40 }} />
      </ScrollView>
    );
  };

  const renderDeviceInfoSection = (): React.ReactElement => {
    const info = deviceInfo;
    return (
      <View>
        <Text style={styles.deviceSectionTitle}>DEVICE</Text>
        <View style={styles.deviceRow}>
          <Text style={styles.deviceLabel}>Platform</Text>
          <Text style={styles.deviceValue}>{info.platform} {info.osVersion}</Text>
        </View>
        <View style={styles.deviceRow}>
          <Text style={styles.deviceLabel}>Model</Text>
          <Text style={styles.deviceValue}>{info.deviceName}</Text>
        </View>
        <View style={styles.deviceRow}>
          <Text style={styles.deviceLabel}>Screen</Text>
          <Text style={styles.deviceValue}>{info.screenWidth}x{info.screenHeight} @{info.screenScale}x</Text>
        </View>
        <Text style={[styles.deviceSectionTitle, { marginTop: 24 }]}>APPLICATION</Text>
        {info.appVersion && (
          <View style={styles.deviceRow}>
            <Text style={styles.deviceLabel}>App Version</Text>
            <Text style={styles.deviceValue}>{info.appVersion}</Text>
          </View>
        )}
        {info.buildVersion && (
          <View style={styles.deviceRow}>
            <Text style={styles.deviceLabel}>Build Version</Text>
            <Text style={styles.deviceValue}>{info.buildVersion}</Text>
          </View>
        )}
      </View>
    );
  };

  const { top, bottom } = useSafeAreaInsets();
  return (
    <View style={styles.container}>
      <StatusBar barStyle={effectiveTheme === 'light' ? 'dark-content' : 'light-content'} backgroundColor={C.background} />
      <View style={{ flex: 1, paddingTop: top, paddingBottom: bottom }}>
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View style={styles.headerLeft}>
              <View style={styles.headerLogo}>
                <Text style={styles.headerLogoText}>N</Text>
              </View>
              <Text style={styles.headerTitle}>Monitor</Text>
              <View style={styles.headerCount}>
                <Text style={{ color: C.textDim, fontSize: 10, fontWeight: '700' }}>
                  {logs.length}
                </Text>
              </View>
            </View>
            <View style={styles.headerActions}>
              <TouchableOpacity
                style={[styles.headerBtn, { backgroundColor: C.errorDim }]}
                onPress={() => Logger.clearLogs()}
              >
                <Text style={[styles.headerBtnText, { color: C.error, fontSize: 11, fontWeight: '800' }]}>
                  ✕
                </Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.headerBtn} onPress={onClose}>
                <Text style={[styles.headerBtnText, { fontSize: 13 }]}>⌄</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <View style={styles.tabBar}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.tabScroll}
          >
            {(['ALL', 'NETWORK', 'LOGS', 'WEBSOCKET', 'PERFORMANCE', 'SETTINGS'] as TabType[]).map((tab) => (
              <TouchableOpacity
                key={tab}
                style={styles.tabItem}
                onPress={() => setActiveTab(tab)}
              >
                <Text style={[styles.tabText, activeTab === tab ? styles.tabTextActive : styles.tabTextInactive]}>
                  {tab === 'ALL'
                    ? t.all
                    : tab === 'NETWORK'
                      ? t.network
                      : tab === 'LOGS'
                        ? t.logs
                        : tab === 'WEBSOCKET'
                          ? 'WS'
                          : tab === 'PERFORMANCE'
                            ? 'FPS'
                            : t.settings}
                  <Text style={styles.tabBadge}>
                    {tab !== 'SETTINGS' ? ` ${(tabCounts as any)[tab]}` : ''}
                  </Text>
                </Text>
                {activeTab === tab ? <View style={styles.tabActiveLine} /> : null}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {activeTab !== 'SETTINGS' ? (
          <View>
            <View style={styles.searchRow}>
              <View style={styles.searchBox}>
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
                    <Text style={[styles.filterPillText, filterStatus === s ? styles.filterPillTextActive : styles.filterPillTextInactive]}>
                      {s === 'ALL' ? 'All' : s === 'OK' ? '2xx/3xx' : '4xx/5xx'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            ) : null}
          </View>
        ) : null}

        {activeTab === 'SETTINGS' ? (
          renderSettings()
        ) : activeTab === 'PERFORMANCE' ? (
          renderPerformance()
        ) : activeTab === 'WEBSOCKET' ? (
          renderWebSocket()
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
          supportedOrientations={['landscape', 'landscape-left', 'landscape-right']}
          onRequestClose={() => { setSelectedLog(null); setShowMenu(false); }}
        >
          {(() => {
            const isSelectedConsoleError =
              selectedLog?.type === 'info' && selectedLog?.message?.startsWith('[ERROR]');
            return (
              <View style={[styles.detailOverlay, { paddingTop: top, paddingBottom: bottom }]}>
                <View style={styles.detailSheet}>
                  <View style={styles.detailHandle} />
                  <View style={styles.detailHeader}>
                    <TouchableOpacity
                      style={styles.detailBack}
                      onPress={() => {
                        setSelectedLog(null);
                        setShowMenu(false);
                      }}
                    >
                      <Text style={styles.detailBackText}>←</Text>
                    </TouchableOpacity>
                    <Text
                      style={[
                        styles.detailTitle,
                        isSelectedConsoleError && { color: C.error }
                      ]}
                    >
                      {selectedLog?.type === 'info'
                        ? isSelectedConsoleError
                          ? 'CONSOLE ERROR'
                          : (t.logs || '').toUpperCase()
                        : `${selectedLog?.durationMs ?? 0}ms, ${selectedLog?.size || '0.00kb'}`}
                    </Text>
                    <TouchableOpacity style={styles.detailMenu} onPress={() => setShowMenu(!showMenu)}>
                      <Text style={styles.detailMenuText}>⋮</Text>
                    </TouchableOpacity>
                  </View>

                  {showMenu ? (
                    <View style={styles.detailDropdown}>
                      <TouchableOpacity
                        style={styles.detailDropdownItem}
                        onPress={() => {
                          handleShareLog(selectedLog!);
                          setShowMenu(false);
                        }}
                      >
                        <Text style={styles.detailDropdownText}>Share Entry</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.detailDropdownItem}
                        onPress={() => {
                          if (selectedLog) {
                            const curl = generateCurl(selectedLog);
                            Share.share({
                              message: curl || JSON.stringify(selectedLog, null, 2),
                              title: 'cURL Command',
                            });
                          }
                          setShowMenu(false);
                        }}
                      >
                        <Text style={styles.detailDropdownText}>Share cURL</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.detailDropdownItem, { borderBottomWidth: 0 }]}
                        onPress={() => setShowMenu(false)}
                      >
                        <Text style={styles.detailDropdownText}>Close</Text>
                      </TouchableOpacity>
                    </View>
                  ) : null}

                  {selectedLog?.type !== 'info' &&
                   selectedLog?.type !== 'websocket' &&
                   selectedLog?.type !== 'performance' ? (
                    <View style={styles.detailTabs}>
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
                              detailTab === 'REQUEST' ? styles.detailTabTextActive : styles.detailTabTextInactive
                            ]}
                          >
                            {(t.request || '').toUpperCase()}
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
                              detailTab === 'RESPONSE' ? styles.detailTabTextActive : styles.detailTabTextInactive
                            ]}
                          >
                            {(t.response || '').toUpperCase()}
                          </Text>
                      </TouchableOpacity>
                    </View>
                  ) : null}

                <ScrollView style={styles.detailContent} showsVerticalScrollIndicator={false}>
                  {selectedLog?.type === 'info' || selectedLog?.type === 'websocket' || selectedLog?.type === 'performance' ? (
                    <>
                      <Section themeColors={C} selectable label={selectedLog?.type === 'websocket' ? 'WEBSOCKET EVENT' : selectedLog?.type === 'performance' ? 'PERFORMANCE DATA' : 'LOG MESSAGE'} value={selectedLog?.message} />
                      {selectedLog?.url ? (
                        <Section themeColors={C} selectable label="URL" value={selectedLog.url} />
                      ) : null}
                      <Section themeColors={C} label="DATA" json={selectedLog?.requestData} />
                      {selectedLog?.type === 'performance' && selectedLog?.durationMs ? (
                        <Section themeColors={C} label="FPS" value={String(selectedLog.durationMs)} />
                      ) : null}
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
            </View>
            );
          })()}
        </Modal>
      </View>
    </View>
  );
};
