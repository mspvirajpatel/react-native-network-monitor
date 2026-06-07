/* eslint-disable no-unused-vars */
/* eslint-disable react-native/no-inline-styles */
/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useState, useEffect, useMemo, useCallback } from 'react';
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
  useColorScheme
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import styleSheet, { getColors, DARK_COLORS, type ThemeColors } from './DebugMonitorStyles';
import { Logger, LogEntry, CustomUrlEntry } from './Logger';
import { FpsStats, subscribeToFps, isPerformanceMonitorRunning, startPerformanceMonitor, stopPerformanceMonitor, destroyPerformanceMonitor } from './PerformanceMonitor';
import { getDeviceInfo, DeviceInfoData } from './DeviceInfo';
import { generateExportReport, formatReportAsText } from './ExportReport';
import { isInternalUrl } from './NetworkMonitor';
import { saveReportToJson, saveReportToText } from './FileExporter';
import { useDebugger } from './DebugContext';
import { useToast, type ToastType } from './Toast';
import {
  TRANSLATIONS,
  resolveLanguage,
  type LanguageCode,
} from './translations';

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
  language?: LanguageCode;
  theme?: 'light' | 'dark' | 'auto';
  colors?: Partial<ThemeColors>;
  features?: {
    network?: boolean;
    console?: boolean;
    websocket?: boolean;
    performance?: boolean;
  };
  headerTitle?: string;
  searchPlaceholder?: string;
  maxLogs?: number;
  customActions?: {
    label: string;
    onPress: (log: LogEntry) => void;
  }[];
}

export type TabType = 'ALL' | 'NETWORK' | 'LOGS' | 'WEBSOCKET' | 'PERFORMANCE' | 'STORE' | 'SETTINGS';
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
  theme = 'auto',
  colors: customColors,
  features: featuresProp,
  headerTitle,
  searchPlaceholder,
  maxLogs,
  customActions
}: DebugMonitorProps) => {
  const systemScheme = useColorScheme();
  const effectiveTheme: 'dark' | 'light' =
    theme === 'auto' ? (systemScheme === 'light' ? 'light' : 'dark') : theme;
  const C = getColors(effectiveTheme, customColors);
  const styles = styleSheet(C);

  // Estimated fixed row height for FlatList getItemLayout performance optimization.
  // Items may vary slightly in actual rendered height, but this constant keeps
  // scroll offset calculation O(1) instead of measuring every row on mount.
  const LOG_ITEM_HEIGHT = 112;

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

  const allTabs = ['ALL', 'NETWORK', 'LOGS', 'WEBSOCKET', 'PERFORMANCE', 'STORE', 'SETTINGS'] as TabType[];

  const features = { network: true, console: true, websocket: true, performance: true, ...featuresProp };
  const tabFeatureMap: Partial<Record<TabType, keyof typeof features>> = {
    NETWORK: 'network',
    LOGS: 'console',
    WEBSOCKET: 'websocket',
    PERFORMANCE: 'performance',
  };

  const availableTabs = allTabs.filter(
    (tab) => tabFeatureMap[tab] === undefined || features[tabFeatureMap[tab]!]
  );

  useEffect(() => {
    if (!availableTabs.includes(activeTab)) {
      setActiveTab(availableTabs[0] || 'ALL');
    }
  }, [availableTabs, activeTab]);

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

  // Register cleanup callbacks that run when the debugger closes
  const { addCloseCleanup } = useDebugger();
  useEffect(() => {
    const unsub1 = addCloseCleanup(() => {
      destroyPerformanceMonitor();
    });
    return unsub1;
  }, [addCloseCleanup]);

  // Toast system for in-app notifications
  const { showToast, Toasts } = useToast();
  const showError = useCallback(
    (msg: string) => showToast(msg, 'error'),
    [showToast],
  );
  const showSuccess = useCallback(
    (msg: string) => showToast(msg, 'success'),
    [showToast],
  );

  const t = useMemo(() => {
    const lang = resolveLanguage(language);
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
      STORE: logs.filter((l: LogEntry) => l.type === 'action').length,
      SETTINGS: 0
    };
  }, [logs]);

  const filteredLogs = useMemo(() => {
    const result = logs.filter((log: LogEntry) => {
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
                  : activeTab === 'STORE'
                    ? log.type === 'action'
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
    if (maxLogs && maxLogs > 0) {
      return result.slice(0, maxLogs);
    }
    return result;
  }, [logs, activeTab, searchQuery, filterMethod, filterStatus, maxLogs]);

  const handleClearLogs = () => {
    Alert.alert(
      t.wipeAllRecords,
      'Are you sure you want to delete all captured logs? This cannot be undone.',
      [
        { text: t.cancel, style: 'cancel' },
        { text: 'Clear', style: 'destructive', onPress: () => Logger.clearLogs() },
      ]
    );
  };

  const handleExportJson = async (): Promise<void> => {
    try {
      const report = generateExportReport(logs);
      await Share.share({
        message: JSON.stringify(report, null, 2),
        title: t.reportTitle,
      });
    } catch (e) {
      showError(t.couldNotShareReport);
    }
  };

  const handleExportText = async (): Promise<void> => {
    try {
      const report = generateExportReport(logs);
      const text = formatReportAsText(report);
      await Share.share({
        message: text,
        title: t.reportTitle,
      });
    } catch (e) {
      showError(t.couldNotShareReport);
    }
  };

  const handleShareLog = async (log: LogEntry): Promise<void> => {
    try {
      const parts: string[] = [];
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
      await Share.share({ message: parts.join('\n'), title: t.logShareTitle });
    } catch (e) {
      showError(t.couldNotShareLog);
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

    Logger.addCustomUrl({ title: `Custom ${Logger.getCustomUrls().length + 1}`, url: newUrl });
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
                {item.method || (isConsoleError ? t.logChipError : (item.type || '').toUpperCase())}
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
                <Text style={styles.logMeta}>⏱ {item.durationMs ?? 0}{t.ms}</Text>
              </View>
              <View style={styles.metaBadge}>
                <Text style={styles.logMeta}>📦 {item.size || `0.00${t.kb}`}</Text>
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
      allSources.push({ title: t.productionApi, url: prodUrl, type: 'url', val: prodUrl });
    }
    if (testUrl) {
      allSources.push({ title: t.testApi, url: testUrl, type: 'url', val: testUrl });
    }

    if (envConfig) {
      allSources.push({ title: t.productive, type: 'env', val: 'prod' });
      allSources.push({ title: t.demonstration, type: 'env', val: 'demo' });
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
              <Text style={styles.settingsSectionTitle}>{t.selectSource}</Text>
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
            <Text style={styles.settingsSectionTitle}>{t.manualEntry}</Text>
          </View>
          <View style={styles.settingsCard}>
            <View style={styles.cardInner}>
              <Text style={styles.inputLabel}>{t.customUrl?.toUpperCase() || ''}</Text>
              <TextInput
                style={styles.textInput}
                value={manualUrl}
                placeholder={t.manualUrlPlaceholder}
                placeholderTextColor={C.textDim}
                autoCapitalize="none"
                keyboardType="url"
                onChangeText={setManualUrl}
              />
              <TouchableOpacity style={styles.saveBtn} onPress={handleSaveSettings}>
                <Text style={styles.saveBtnText}>{t.applyChanges}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <View style={[styles.settingsSection, { marginTop: 32 }]}>
            <View style={styles.settingsSectionHeader}>
              <View style={styles.settingsSectionLine} />
              <Text style={styles.settingsSectionTitle}>{t.deviceInfo}</Text>
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
              <Text style={styles.settingsSectionTitle}>{t.advancedTools}</Text>
          </View>
          <View style={styles.settingsCard}>
            <View style={styles.cardInner}>
              <TouchableOpacity style={[styles.toolBtn, { margin: 0, marginBottom: 12 }]} onPress={handleExportJson}>
                <Text style={styles.toolBtnText}>{t.shareJsonReport}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.toolBtn, { margin: 0, marginBottom: 16 }]} onPress={handleExportText}>
                <Text style={styles.toolBtnText}>{t.shareTextReport}</Text>
              </TouchableOpacity>

              <TouchableOpacity style={[styles.toolBtn, { margin: 0, marginBottom: 12, borderColor: C.accent + '40' }]} onPress={() => saveReportToJson(logs)}>
                <Text style={[styles.toolBtnText, { color: C.accent }]}>{t.saveJsonReportToFile}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.toolBtn, { margin: 0, marginBottom: 16, borderColor: C.accent + '40' }]} onPress={() => saveReportToText(logs)}>
                <Text style={[styles.toolBtnText, { color: C.accent }]}>{t.saveTextReportToFile}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.toolBtn, { margin: 0, borderColor: C.error + '40' }]}
                onPress={handleClearLogs}
              >
                <Text style={[styles.toolBtnText, { color: C.error }]}>{t.wipeAllRecords}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
        <View style={{ height: 60 }} />
      </ScrollView>
    );
  };
  const renderStoreLogs = (): React.ReactElement => {
    const storeLogs = logs.filter((l: LogEntry) => l.type === 'action');
    if (storeLogs.length === 0) {
      return (
        <View style={styles.wsContainer}>
          <View style={[styles.perfCard, { alignItems: 'center', padding: 40 }]}>
            <Text style={{ fontSize: 32, marginBottom: 12 }}>🗄️</Text>
            <Text style={[styles.perfLabel, { textAlign: 'center', marginBottom: 4 }]}>{t.noStoreActivity}</Text>
            <Text style={[styles.perfLabel, { color: C.textSubtle, fontSize: 10, textAlign: 'center' }]}>
              {t.storeSubtitle}
            </Text>
          </View>
        </View>
      );
    }

    return (
      <FlatList
        data={storeLogs}
        renderItem={({ item }: { item: LogEntry }) => {
          const sd = item.stateData;
          const hasDiff = sd?.diff && Object.keys(sd.diff).length > 0;
          const changedKeys = hasDiff ? Object.keys(sd!.diff!).join(', ') : null;
          return (
            <TouchableOpacity
              activeOpacity={0.7}
              style={styles.logItem}
              onPress={() => {
                setSelectedLog(item);
                setDetailTab('RESPONSE');
              }}
            >
              <View style={[styles.logIndicator, { backgroundColor: C.accent }]} />
              <View style={styles.logBody}>
                <View style={styles.logRow}>
                  <View style={[styles.logChip, { backgroundColor: C.accent + '18' }]}>
                    <Text style={[styles.logChipText, { color: C.accent }]}>
                      {sd?.actionType ? sd.actionType : t.action}
                    </Text>
                  </View>
                  <Text style={styles.logTime}>
                    {new Date(item.timestamp).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </Text>
                </View>
                <Text style={styles.logUrl} numberOfLines={2}>
                  [{sd?.storeName || 'Store'}] {sd?.actionType || t.state}
                </Text>
                {changedKeys ? (
                  <View style={styles.logMetaBox}>
                    <View style={styles.metaBadge}>
                      <Text style={styles.logMeta}>{t.changedKeys}: {changedKeys}</Text>
                    </View>
                  </View>
                ) : sd?.snapshot ? (
                  <View style={styles.logMetaBox}>
                    <View style={styles.metaBadge}>
                      <Text style={styles.logMeta}>{t.snapshot}</Text>
                    </View>
                  </View>
                ) : null}
              </View>
            </TouchableOpacity>
          );
        }}
        keyExtractor={(item: LogEntry) => item.id}
        getItemLayout={(_data, index) => ({
          length: LOG_ITEM_HEIGHT,
          offset: LOG_ITEM_HEIGHT * index,
          index,
        })}
        contentContainerStyle={[styles.listContent, storeLogs.length === 0 && { flex: 1 }]}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>🗄️</Text>
            <Text style={styles.emptyText}>{t.noStoreActivity}</Text>
            <Text style={styles.emptySubText}>{t.storeSubtitle}</Text>
          </View>
        }
      />
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
            {perfRunning ? t.fpsMonitorActive : t.fpsMonitorOff}
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
            <Text style={styles.perfLabel}>{t.currentFps}</Text>
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
                <Text style={styles.perfLabel}>{t.averageFps}</Text>
                <Text style={styles.perfValue}>{fps.averageFps}</Text>
              </View>
              <View style={styles.perfRow}>
                <Text style={styles.perfLabel}>{t.minFps}</Text>
                <Text style={[styles.perfValue, fps.minFps < 30 ? styles.perfValueError : styles.perfValueGood]}>{fps.minFps}</Text>
              </View>
              <View style={styles.perfRow}>
                <Text style={styles.perfLabel}>{t.maxFps}</Text>
                <Text style={styles.perfValue}>{fps.maxFps}</Text>
              </View>
              <View style={styles.perfRow}>
                <Text style={styles.perfLabel}>{t.droppedFrames}</Text>
                <Text style={[styles.perfValue, fps.droppedFrames > 10 ? styles.perfValueWarning : styles.perfValueGood]}>{fps.droppedFrames}</Text>
              </View>
            </View>

            <View style={styles.perfCard}>
              <Text style={styles.perfLabel}>{t.fpsHistory}</Text>
              <View style={{ height: 80, flexDirection: 'row', alignItems: 'flex-end', gap: 1, marginTop: 12 }}>
                {fps.history.length > 0 ? fps.history.map((value: number, i: number) => {
                  const barHeight = Math.max(4, (value / 60) * 80);
                  return (
                    <View
                      key={i}
                      style={{
                        flex: 1,
                        height: barHeight,
                        backgroundColor: value >= 55 ? C.success : value >= 30 ? C.warning : C.error,
                        borderRadius: 1,
                        opacity: 0.5 + (i / fps.history.length) * 0.5
                      }}
                    />
                  );
                }) : (
                  <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                    <Text style={{ color: C.textDim, fontSize: 10 }}>Collecting data...</Text>
                  </View>
                )}
              </View>
            </View>
          </>
        )}

        {!fps && (
          <View style={styles.perfCard}>
            <Text style={[styles.perfLabel, { textAlign: 'center', marginVertical: 20 }]}>
              {t.fpsEmpty}
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
            <Text style={[styles.perfLabel, { textAlign: 'center', marginBottom: 4 }]}>{t.noWebSocketActivity}</Text>
            <Text style={[styles.perfLabel, { color: C.textSubtle, fontSize: 10, textAlign: 'center' }]}>
              {t.wsSubtitle}
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
                    {isOpen ? t.wsOpen : isClose ? t.wsClose : isError ? t.wsError : t.wsMsg}
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
        <Text style={styles.deviceSectionTitle}>{t.device}</Text>
        <View style={styles.deviceRow}>
          <Text style={styles.deviceLabel}>{t.platform}</Text>
          <Text style={styles.deviceValue}>{info.platform} {info.osVersion}</Text>
        </View>
        <View style={styles.deviceRow}>
          <Text style={styles.deviceLabel}>{t.model}</Text>
          <Text style={styles.deviceValue}>{info.deviceName}</Text>
        </View>
        <View style={styles.deviceRow}>
          <Text style={styles.deviceLabel}>{t.screen}</Text>
          <Text style={styles.deviceValue}>{info.screenWidth}x{info.screenHeight} @{info.screenScale}x</Text>
        </View>
        <Text style={[styles.deviceSectionTitle, { marginTop: 24 }]}>{t.application}</Text>
        {info.appVersion && (
          <View style={styles.deviceRow}>
            <Text style={styles.deviceLabel}>{t.appVersion}</Text>
            <Text style={styles.deviceValue}>{info.appVersion}</Text>
          </View>
        )}
        {info.buildVersion && (
          <View style={styles.deviceRow}>
            <Text style={styles.deviceLabel}>{t.buildVersion}</Text>
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
              <Text style={styles.headerTitle}>{headerTitle || t.monitor}</Text>
              <View style={styles.headerCount}>
                <Text style={{ color: C.textDim, fontSize: 10, fontWeight: '700' }}>
                  {logs.length}
                </Text>
              </View>
            </View>
            <View style={styles.headerActions}>
              <TouchableOpacity
                style={[styles.headerBtn, { backgroundColor: C.errorDim }]}
                onPress={handleClearLogs}
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
            {availableTabs.map((tab) => (
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
                          ? t.ws
                          : tab === 'PERFORMANCE'
                            ? t.fps
                            : tab === 'STORE'
                              ? t.store
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
                  placeholder={searchPlaceholder || t.search}
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
                      {s === 'ALL' ? t.allFilter : s === 'OK' ? t.success2xx3xx : t.error4xx5xx}
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
        ) : activeTab === 'STORE' ? (
          renderStoreLogs()
        ) : (
          <FlatList
            data={filteredLogs}
            renderItem={renderLogItem}
            keyExtractor={(item: LogEntry) => item.id}
            getItemLayout={(_data, index) => ({
              length: LOG_ITEM_HEIGHT,
              offset: LOG_ITEM_HEIGHT * index,
              index,
            })}
            contentContainerStyle={[styles.listContent, filteredLogs.length === 0 && { flex: 1 }]}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyIcon}>💬</Text>
                <Text style={styles.emptyText}>{t.empty}</Text>
                <Text style={styles.emptySubText}>{t.emptySubtitle}</Text>
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
                      {selectedLog?.type === 'action'
                        ? `[${selectedLog?.stateData?.storeName || t.store}] ${selectedLog?.stateData?.actionType || t.action}`
                        : selectedLog?.type === 'info'
                          ? isSelectedConsoleError
                            ? t.consoleError
                            : (t.logs || '').toUpperCase()
                          : `${selectedLog?.durationMs ?? 0}${t.ms}, ${selectedLog?.size || `0.00${t.kb}`}`}
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
                        <Text style={styles.detailDropdownText}>{t.shareEntry}</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.detailDropdownItem}
                        onPress={() => {
                          if (selectedLog) {
                            const curl = generateCurl(selectedLog);
                            Share.share({
                              message: curl || JSON.stringify(selectedLog, null, 2),
                              title: t.curlCommand,
                            });
                          }
                          setShowMenu(false);
                        }}
                      >
                        <Text style={styles.detailDropdownText}>{t.shareCurl}</Text>
                      </TouchableOpacity>
                      {customActions?.map((action, i) => (
                        <TouchableOpacity
                          key={`ca-${i}`}
                          style={styles.detailDropdownItem}
                          onPress={() => {
                            if (selectedLog) action.onPress(selectedLog);
                            setShowMenu(false);
                          }}
                        >
                          <Text style={styles.detailDropdownText}>{action.label}</Text>
                        </TouchableOpacity>
                      ))}
                      <TouchableOpacity
                        style={[styles.detailDropdownItem, { borderBottomWidth: 0 }]}
                        onPress={() => setShowMenu(false)}
                      >
                        <Text style={styles.detailDropdownText}>{t.closeMenu}</Text>
                      </TouchableOpacity>
                    </View>
                  ) : null}

                  {selectedLog?.type !== 'info' &&
                   selectedLog?.type !== 'websocket' &&
                   selectedLog?.type !== 'performance' &&
                   selectedLog?.type !== 'action' ? (
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
                  {selectedLog?.type === 'info' || selectedLog?.type === 'websocket' || selectedLog?.type === 'performance' || selectedLog?.type === 'action' ? (
                    <>
                      {selectedLog?.type === 'action' && selectedLog?.stateData ? (
                        <>
                          <Section themeColors={C} label={t.actionType} value={selectedLog.stateData.actionType || '-'} />
                          <Section themeColors={C} label={t.actionPayload} json={selectedLog.stateData.actionPayload} />
                          {selectedLog.stateData.diff ? (
                            Object.keys(selectedLog.stateData.diff).length > 0 ? (
                              <>
                                <Text style={[styles.sectionLabel, { marginTop: 16, marginBottom: 8 }]}>{t.changedKeys}</Text>
                                {Object.entries(selectedLog.stateData.diff).map(([key, val]) => (
                                  <View key={key} style={styles.sectionBox}>
                                    <Text style={styles.sectionLabel}>{key}</Text>
                                    {val.prev !== undefined ? (
                                      <Text style={[styles.sectionLabel, { color: C.textDim, fontSize: 10 }]}>{t.prevState}</Text>
                                    ) : null}
                                    {val.prev !== undefined ? (
                                      <View style={styles.jsonBox}>
                                        <Text selectable style={styles.jsonText}>
                                          {JSON.stringify(val.prev, null, 2)}
                                        </Text>
                                      </View>
                                    ) : null}
                                    {val.next !== undefined ? (
                                      <Text style={[styles.sectionLabel, { color: C.textDim, fontSize: 10, marginTop: 8 }]}>{t.nextState}</Text>
                                    ) : null}
                                    {val.next !== undefined ? (
                                      <View style={styles.jsonBox}>
                                        <Text selectable style={styles.jsonText}>
                                          {JSON.stringify(val.next, null, 2)}
                                        </Text>
                                      </View>
                                    ) : null}
                                  </View>
                                ))}
                              </>
                            ) : null
                          ) : selectedLog.stateData.snapshot ? (
                            <Section themeColors={C} label={t.fullState} json={selectedLog.stateData.snapshot} />
                          ) : null}
                        </>
                      ) : (
                        <>
                          <Section themeColors={C} selectable label={selectedLog?.type === 'websocket' ? t.websocketEvent : selectedLog?.type === 'performance' ? t.performanceData : t.logMessage} value={selectedLog?.message} />
                          {selectedLog?.url ? (
                            <Section themeColors={C} selectable label={t.url} value={selectedLog.url} />
                          ) : null}
                          <Section themeColors={C} label={t.data} json={selectedLog?.requestData} />
                          {selectedLog?.type === 'performance' && selectedLog?.durationMs ? (
                            <Section themeColors={C} label={t.fps} value={String(selectedLog.durationMs)} />
                          ) : null}
                        </>
                      )}
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
                        label={t.statusCode}
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
      {Toasts}
    </View>
  );
};
