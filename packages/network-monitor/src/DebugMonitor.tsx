/* eslint-disable no-unused-vars */
/* eslint-disable react-native/no-inline-styles */
/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
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
  NativeSyntheticEvent,
  NativeScrollEvent,
  Animated,
  useColorScheme,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import styleSheet, { getColors, DARK_COLORS, type ThemeColors } from './DebugMonitorStyles';
import { Logger, LogEntry } from './Logger';
import { FpsStats, subscribeToFps, isPerformanceMonitorRunning, startPerformanceMonitor, stopPerformanceMonitor, destroyPerformanceMonitor } from './PerformanceMonitor';
import { getDeviceInfo, DeviceInfoData } from './DeviceInfo';
import { isInternalUrl } from './NetworkMonitor';
import { useDebugger } from './DebugContext';
import { useToast, type ToastType } from './Toast';
import LogItemAnimated from './LogItemAnimated';
import SettingsPanel from './panels/SettingsPanel';
import StorePanel from './panels/StorePanel';
import PerformancePanel from './panels/PerformancePanel';
import WebSocketPanel from './panels/WebSocketPanel';
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
const tryParseJson = (data: unknown): unknown => {
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
}: {
  label: string;
  value?: string | null;
  json?: unknown;
  color?: string;
  selectable?: boolean;
  themeColors?: ThemeColors;
  onCopy?: (text: string) => void;
}): React.ReactElement | null => {
  const styles = styleSheet(themeColors);

  const resolvedJson = json !== undefined && json !== null ? tryParseJson(json) : json;

  const isEmpty = (val: unknown): boolean => {
    if (val === null || val === undefined) return true;
    if (typeof val === 'string') return val.length === 0;
    if (typeof val === 'object') return Object.keys(val).length === 0;
    return false;
  };

  if (!value && isEmpty(resolvedJson)) return null;

  const isJsonObject = resolvedJson !== null && typeof resolvedJson === 'object';

  const copyValue = value || (isJsonObject ? JSON.stringify(resolvedJson, null, 2) : String(resolvedJson ?? ''));

  return (
    <View style={styles.sectionBox}>
      <View style={styles.sectionLabelRow}>
        <Text style={styles.sectionLabel}>{label}</Text>
        {onCopy && copyValue ? (
          <TouchableOpacity
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            onPress={() => onCopy(copyValue)}
          >
            <Text style={[styles.copyIconText, { color: themeColors?.primary || '#7C5CFC' }]}>
              📋
            </Text>
          </TouchableOpacity>
        ) : null}
      </View>
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
  const [selectedTheme, setSelectedTheme] = useState<'light' | 'dark' | 'auto'>(theme);
  const effectiveTheme: 'dark' | 'light' =
    selectedTheme === 'auto' ? (systemScheme === 'light' ? 'light' : 'dark') : selectedTheme;
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
  const [filterMethod] = useState<string | 'ALL'>('ALL');
  const [fpsStats, setFpsStats] = useState<FpsStats | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const flatListRef = useRef<FlatList<LogEntry>>(null);
  const [perfRunning, setPerfRunning] = useState(isPerformanceMonitorRunning());
  const [deviceInfo] = useState<DeviceInfoData>(getDeviceInfo());
  const [loading, setLoading] = useState<string | null>('Initializing...');
  const [receiving, setReceiving] = useState(false);
  const receivingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Dismiss the initial loading state once the first render settles
  useEffect(() => {
    const timer = setTimeout(() => setLoading(null), 400);
    return () => clearTimeout(timer);
  }, []);

  // Track when new logs arrive to show an activity pulse in the header
  useEffect(() => {
    if (logs.length > 0) {
      setReceiving(true);
      if (receivingTimer.current) clearTimeout(receivingTimer.current);
      receivingTimer.current = setTimeout(() => setReceiving(false), 1200);
    }
    return () => {
      if (receivingTimer.current) clearTimeout(receivingTimer.current);
    };
  }, [logs.length]);

  const LoadingOverlay = loading ? (
    <View style={styles.loadingOverlay}>
      <View style={styles.loadingBox}>
        <ActivityIndicator size="large" color={C.primary} style={styles.loadingSpinner} />
        <Text style={styles.loadingText}>{loading}</Text>
      </View>
    </View>
  ) : null;

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

  // Sync the maxLogs prop to the Logger so the cap is enforced at the source
  useEffect(() => {
    if (maxLogs && maxLogs > 0) {
      Logger.setMaxLogs(maxLogs);
    }
  }, [maxLogs]);

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

  /** Share/copy a text value via the system share sheet */
  const handleCopy = useCallback(
    (text: string): void => {
      Share.share({ message: text }).catch(() => {});
    },
    [],
  );

  /** Pull-to-refresh: re-read logs from the Logger singleton */
  const onRefresh = useCallback((): void => {
    setRefreshing(true);
    setLogs(Logger.getLogs());
    setRefreshing(false);
  }, []);

  /** Track scroll offset to toggle scroll-to-top button visibility */
  const handleScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>): void => {
      const offsetY = event.nativeEvent.contentOffset.y;
      setShowScrollTop(offsetY > 400);
    },
    [],
  );

  /** Scroll the main list back to the top */
  const scrollToTop = useCallback((): void => {
    flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
  }, []);

  /** Map an HTTP method to a distinct badge color */
  const getMethodColor = useCallback((method?: string): string => {
    switch ((method || '').toUpperCase()) {
      case 'GET':     return C.success;
      case 'POST':    return C.primary;
      case 'PUT':     return C.warning;
      case 'PATCH':   return C.accent;
      case 'DELETE':  return C.error;
      default:        return C.textDim;
    }
  }, [C]);

  /** Map a numeric HTTP status to a range-based color */
  const getStatusColor = useCallback((status?: number): string => {
    if (!status) return C.textDim;
    if (status >= 200 && status < 300) return C.success;
    if (status >= 300 && status < 400) return C.warning;
    if (status >= 400 && status < 500) return C.warning;  /* 4xx = amber */
    if (status >= 500) return C.error;
    return C.textDim;
  }, [C]);

  /** Map a LogType to a consistent accent color for the indicator strip */
  const getTypeColor = useCallback((item: LogEntry): string => {
    if (item.type === 'error' || (item.status && item.status >= 400)) return C.error;
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
        {
          text: 'Clear',
          style: 'destructive',
          onPress: () => {
            setLoading('Clearing logs...');
            // Use a microtask delay so the loading overlay renders before the clear
            setTimeout(() => {
              Logger.clearLogs();
              setLoading(null);
            }, 50);
          },
        },
      ]
    );
  };

  const handleShareLog = async (log: LogEntry): Promise<void> => {
    setLoading('Preparing share...');
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
    } finally {
      setLoading(null);
    }
  };

  const escapeShell = (str: string): string => {
    return str.replace(/'/g, "'\\''");
  };

  const formatCurlBody = (data: unknown): string => {
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
   * renderLogItem
   *
   * Render function for a single log row in the FlatList.
   *
   * @param param0 - Destructured FlatList item wrapper
   * @returns JSX.Element
   */
  const renderLogItem = ({ item, index }: { item: LogEntry; index?: number }): React.ReactElement => {
    const isConsoleError = item.type === 'info' && item.message?.startsWith('[ERROR]');
    const typeColor = getTypeColor(item);
    const methodColor = getMethodColor(item.method);
    const statusColor = getStatusColor(item.status);

    const row = (
      <TouchableOpacity
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel={`${item.method || item.type || 'log'}: ${item.url || item.message || ''}`}
        style={styles.logItem}
        onPress={() => {
          setSelectedLog(item);
          setDetailTab('RESPONSE');
        }}
      >
        <View style={[styles.logIndicator, { backgroundColor: typeColor }]} />
        <View style={styles.logBody}>
          <View style={styles.logRow}>
            <View style={[styles.logChip, { backgroundColor: methodColor + '18' }]}>
              <Text style={[styles.logChipText, { color: methodColor }]}>
                {item.method || (isConsoleError ? t.logChipError : (item.type || '').toUpperCase())}
              </Text>
            </View>
            {item.status ? (
              <View style={[styles.logStatusChip, { backgroundColor: statusColor + '18' }]}>
                <Text style={[styles.logStatusText, { color: statusColor }]}>{item.status}</Text>
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

    return <LogItemAnimated index={index}>{row}</LogItemAnimated>;
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
                {receiving && (
                  <View style={[styles.liveDot, { backgroundColor: C.success }]} />
                )}
              </View>
            </View>
            <View style={styles.headerActions}>
              <TouchableOpacity
                accessibilityLabel={t.wipeAllRecords || 'Clear logs'}
                accessibilityRole="button"
                style={[styles.headerBtn, { backgroundColor: C.errorDim }]}
                onPress={handleClearLogs}
              >
                <Text style={[styles.headerBtnText, { color: C.error, fontSize: 11, fontWeight: '800' }]}>
                  ✕
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                accessibilityLabel="Close"
                accessibilityRole="button"
                style={styles.headerBtn}
                onPress={onClose}
              >
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
            {availableTabs.map((tab) => {
              const tabLabel = tab === 'ALL'
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
                          : t.settings;
              return (
                <TouchableOpacity
                  key={tab}
                  accessibilityRole="tab"
                  accessibilityState={{ selected: activeTab === tab }}
                  accessibilityLabel={`${tabLabel}${tab !== 'SETTINGS' ? `, ${(tabCounts as any)[tab]} items` : ''}`}
                  style={styles.tabItem}
                  onPress={() => setActiveTab(tab)}
                >
                  <Text style={[styles.tabText, activeTab === tab ? styles.tabTextActive : styles.tabTextInactive]}>
                    {tabLabel}
                    <Text style={styles.tabBadge}>
                      {tab !== 'SETTINGS' ? ` ${(tabCounts as any)[tab]}` : ''}
                    </Text>
                  </Text>
                  {activeTab === tab ? <View style={styles.tabActiveLine} /> : null}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {activeTab !== 'SETTINGS' ? (
          <View>
            <View style={styles.searchRow}>
              <View style={styles.searchBox}>
                <TextInput
                  accessibilityLabel={searchPlaceholder || t.search}
                  style={styles.searchInput}
                  placeholder={searchPlaceholder || t.search}
                  placeholderTextColor={C.textDim}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                />
                {searchQuery.length > 0 ? (
                  <TouchableOpacity
                    accessibilityRole="button"
                    accessibilityLabel="Clear search"
                    onPress={() => setSearchQuery('')}
                  >
                    <Text style={styles.clearSearch}>✕</Text>
                  </TouchableOpacity>
                ) : null}
              </View>
            </View>
            {activeTab === 'NETWORK' ? (
              <View style={styles.filterRow}>
                {(['ALL', 'OK', 'ERR'] as const).map((s) => {
                  const pillLabel = s === 'ALL' ? t.allFilter : s === 'OK' ? t.success2xx3xx : t.error4xx5xx;
                  return (
                    <TouchableOpacity
                      key={s}
                      accessibilityRole="radio"
                      accessibilityState={{ checked: filterStatus === s }}
                      accessibilityLabel={pillLabel}
                      style={[styles.filterPill, filterStatus === s && styles.filterPillActive]}
                      onPress={() => setFilterStatus(s)}
                    >
                      <Text style={[styles.filterPillText, filterStatus === s ? styles.filterPillTextActive : styles.filterPillTextInactive]}>
                        {pillLabel}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            ) : null}
          </View>
        ) : null}

        {activeTab === 'SETTINGS' ? (
          <SettingsPanel
            baseUrls={baseUrls}
            prodUrl={prodUrl}
            testUrl={testUrl}
            envConfig={envConfig}
            onBaseUrlChange={onBaseUrlChange}
            C={C}
            t={t}
            baseUrl={baseUrl}
            manualUrl={manualUrl}
            selectedTheme={selectedTheme}
            logs={logs}
            deviceInfo={deviceInfo}
            onSetBaseUrl={setBaseUrl}
            onSetManualUrl={setManualUrl}
            onSetSelectedTheme={setSelectedTheme}
            showError={showError}
            showSuccess={showSuccess}
          />
        ) : activeTab === 'PERFORMANCE' ? (
          <PerformancePanel
            fpsStats={fpsStats}
            perfRunning={perfRunning}
            C={C}
            t={t}
            onTogglePerf={setPerfRunning}
          />
        ) : activeTab === 'WEBSOCKET' ? (
          <WebSocketPanel logs={logs} C={C} t={t} />
        ) : activeTab === 'STORE' ? (
          <StorePanel
            logs={logs}
            C={C}
            t={t}
            LOG_ITEM_HEIGHT={LOG_ITEM_HEIGHT}
            onSelectLog={(log) => {
              setSelectedLog(log);
              setDetailTab('RESPONSE');
            }}
          />
        ) : (
          <FlatList
            ref={flatListRef}
            data={filteredLogs}
            renderItem={renderLogItem}
            keyExtractor={(item: LogEntry) => item.id}
            getItemLayout={(_data, index) => ({
              length: LOG_ITEM_HEIGHT,
              offset: LOG_ITEM_HEIGHT * index,
              index,
            })}
            contentContainerStyle={[styles.listContent, filteredLogs.length === 0 && { flex: 1 }]}
            refreshing={refreshing}
            onRefresh={onRefresh}
            onScroll={handleScroll}
            scrollEventThrottle={16}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyIcon}>💬</Text>
                <Text style={styles.emptyText}>{t.empty}</Text>
                <Text style={styles.emptySubText}>{t.emptySubtitle}</Text>
              </View>
            }
          />
        )}

        {showScrollTop && (
          <TouchableOpacity
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="Scroll to top"
            onPress={scrollToTop}
            style={[
              styles.scrollTopBtn,
              { backgroundColor: C.primary, shadowColor: C.shadow },
            ]}
          >
            <Text style={styles.scrollTopBtnText}>↑</Text>
          </TouchableOpacity>
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
                      accessibilityRole="button"
                      accessibilityLabel="Back"
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
                    <TouchableOpacity
                      accessibilityRole="button"
                      accessibilityLabel="Menu"
                      style={styles.detailMenu}
                      onPress={() => setShowMenu(!showMenu)}
                    >
                      <Text style={styles.detailMenuText}>⋮</Text>
                    </TouchableOpacity>
                  </View>

                  {showMenu ? (
                    <View style={styles.detailDropdown} accessibilityRole="menu">
                      <TouchableOpacity
                        accessibilityRole="menuitem"
                        style={styles.detailDropdownItem}
                        onPress={() => {
                          handleShareLog(selectedLog!);
                          setShowMenu(false);
                        }}
                      >
                        <Text style={styles.detailDropdownText}>{t.shareEntry}</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        accessibilityRole="menuitem"
                        style={styles.detailDropdownItem}
                        onPress={async () => {
                          if (selectedLog) {
                            setLoading('Generating cURL...');
                            try {
                              const curl = generateCurl(selectedLog);
                              await Share.share({
                                message: curl || JSON.stringify(selectedLog, null, 2),
                                title: t.curlCommand,
                              });
                            } catch {
                              // user cancelled share
                            } finally {
                              setLoading(null);
                            }
                          }
                          setShowMenu(false);
                        }}
                      >
                        <Text style={styles.detailDropdownText}>{t.shareCurl}</Text>
                      </TouchableOpacity>
                      {customActions?.map((action, i) => (
                        <TouchableOpacity
                          key={`ca-${i}`}
                          accessibilityRole="menuitem"
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
                        accessibilityRole="menuitem"
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
                    <View style={styles.detailTabs} accessibilityRole="tablist">
                      <TouchableOpacity
                        accessibilityRole="tab"
                        accessibilityState={{ selected: detailTab === 'REQUEST' }}
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
                          accessibilityRole="tab"
                          accessibilityState={{ selected: detailTab === 'RESPONSE' }}
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
                          <Section themeColors={C} label={t.actionType} value={selectedLog.stateData.actionType || '-'} onCopy={handleCopy} />
                          <Section themeColors={C} label={t.actionPayload} json={selectedLog.stateData.actionPayload} onCopy={handleCopy} />
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
                            <Section themeColors={C} label={t.fullState} json={selectedLog.stateData.snapshot} onCopy={handleCopy} />
                          ) : null}
                        </>
                      ) : (
                        <>
                          <Section themeColors={C} selectable label={selectedLog?.type === 'websocket' ? t.websocketEvent : selectedLog?.type === 'performance' ? t.performanceData : t.logMessage} value={selectedLog?.message} onCopy={handleCopy} />
                          {selectedLog?.url ? (
                            <Section themeColors={C} selectable label={t.url} value={selectedLog.url} onCopy={handleCopy} />
                          ) : null}
                          <Section themeColors={C} label={t.data} json={selectedLog?.requestData} onCopy={handleCopy} />
                          {selectedLog?.type === 'performance' && selectedLog?.durationMs ? (
                            <Section themeColors={C} label={t.fps} value={String(selectedLog.durationMs)} onCopy={handleCopy} />
                          ) : null}
                        </>
                      )}
                    </>
                  ) : detailTab === 'REQUEST' ? (
                    <>
                      <Section themeColors={C} label={t.method} value={selectedLog?.method} onCopy={handleCopy} />
                      <Section
                        themeColors={C}
                        selectable
                        label={t.url}
                        value={
                          selectedLog?.isRedirected
                            ? `${selectedLog?.originalUrl} ➔ ${selectedLog?.url}`
                            : selectedLog?.url
                        }
                        onCopy={handleCopy}
                      />
                      <Section themeColors={C} label={t.headers} json={selectedLog?.requestHeaders} onCopy={handleCopy} />
                      <Section themeColors={C} label={t.body} json={selectedLog?.requestData} onCopy={handleCopy} />
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
                        onCopy={handleCopy}
                      />
                      <Section themeColors={C} label={t.headers} json={selectedLog?.responseHeaders} onCopy={handleCopy} />
                      <Section themeColors={C} label={t.body} json={selectedLog?.responseData} onCopy={handleCopy} />
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
      {LoadingOverlay}
    </View>
  );
};
