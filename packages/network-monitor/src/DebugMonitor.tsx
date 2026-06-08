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
  PanResponder,
  useColorScheme,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import styleSheet, { getColors, DARK_COLORS, type ThemeColors } from './DebugMonitorStyles';
import { Logger, LogEntry } from './Logger';
import { FpsStats, subscribeToFps, isPerformanceMonitorRunning, startPerformanceMonitor, stopPerformanceMonitor, destroyPerformanceMonitor } from './PerformanceMonitor';
import { MemStats, subscribeToMemory, isMemoryMonitorRunning, startMemoryMonitor, stopMemoryMonitor, destroyMemoryMonitor } from './MemoryMonitor';
import { getDeviceInfo, DeviceInfoData } from './DeviceInfo';
import { isInternalUrl } from './NetworkMonitor';
import { useDebugger } from './DebugContext';
import { useToast, type ToastType } from './Toast';
import LogItemAnimated from './LogItemAnimated';
import SettingsPanel from './panels/SettingsPanel';
import StorePanel from './panels/StorePanel';
import PerformancePanel from './panels/PerformancePanel';
import WebSocketPanel from './panels/WebSocketPanel';
import TimelinePanel from './panels/TimelinePanel';
import MemoryPanel from './panels/MemoryPanel';
import NotificationPanel from './panels/NotificationPanel';
import NavigationFlowPanel from './panels/NavigationFlowPanel';
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
    memory?: boolean;
    notifications?: boolean;
    navigationFlow?: boolean;
  };
  headerTitle?: string;
  searchPlaceholder?: string;
  maxLogs?: number;
  customActions?: {
    label: string;
    onPress: (log: LogEntry) => void;
  }[];
}

export type TabType = 'ALL' | 'NETWORK' | 'LOGS' | 'WEBSOCKET' | 'PERFORMANCE' | 'MEMORY' | 'STORE' | 'SETTINGS' | 'NOTIFICATIONS' | 'NAVFLOW';
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
/** Extract domain from a URL string */
const extractDomain = (url: string): string => {
  try {
    const parsed = new URL(url);
    return parsed.hostname;
  } catch {
    return url;
  }
};

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
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [baseUrl, setBaseUrl] = useState(Logger.getBaseUrl());
  const [manualUrl, setManualUrl] = useState('');
  const [filterMethod, setFilterMethod] = useState<string | 'ALL'>('ALL');
  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false);
  const [selectedDomain, setSelectedDomain] = useState<string | null>(null);
  const [timeRangeMinutes, setTimeRangeMinutes] = useState<number | null>(null);
  const [regexMode, setRegexMode] = useState(false);
  const [fpsStats, setFpsStats] = useState<FpsStats | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [showWaterfall, setShowWaterfall] = useState(false);
  const [bookmarkedIds, setBookmarkedIds] = useState<Set<string>>(new Set());
  const [searchPresets, setSearchPresets] = useState<Array<{name: string; query: string; method: string | 'ALL'; status: typeof filterStatus; domain: string | null; time: number | null; regex: boolean}>>([]);
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [showCompareModal, setShowCompareModal] = useState(false);
  const flatListRef = useRef<FlatList<LogEntry>>(null);
  const [memStats, setMemStats] = useState<MemStats | null>(null);
  const [perfRunning, setPerfRunning] = useState(isPerformanceMonitorRunning());
  const [memRunning, setMemRunning] = useState(isMemoryMonitorRunning());
  const [deviceInfo] = useState<DeviceInfoData>(getDeviceInfo());
  const [loading, setLoading] = useState<string | null>('Initializing...');
  const [receiving, setReceiving] = useState(false);
  const receivingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Swipe-to-dismiss animation
  const detailTranslateY = useRef(new Animated.Value(0)).current;
  const detailOpacity = useRef(new Animated.Value(1)).current;

  const detailPanResponder = useRef(
    PanResponder.create({
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
          Animated.parallel([
            Animated.timing(detailTranslateY, {
              toValue: 500,
              duration: 200,
              useNativeDriver: true,
            }),
            Animated.timing(detailOpacity, {
              toValue: 0,
              duration: 200,
              useNativeDriver: true,
            }),
          ]).start(() => {
            setSelectedLog(null);
            setShowMenu(false);
            detailTranslateY.setValue(0);
            detailOpacity.setValue(1);
          });
        } else {
          Animated.parallel([
            Animated.spring(detailTranslateY, {
              toValue: 0,
              useNativeDriver: true,
            }),
            Animated.spring(detailOpacity, {
              toValue: 1,
              useNativeDriver: true,
            }),
          ]).start();
        }
      },
    })
  ).current;

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

  const allTabs = ['ALL', 'NETWORK', 'LOGS', 'WEBSOCKET', 'PERFORMANCE', 'MEMORY', 'STORE', 'SETTINGS', 'NOTIFICATIONS', 'NAVFLOW'] as TabType[];

  const features = { network: true, console: true, websocket: true, performance: true, memory: true, notifications: true, navigationFlow: true, ...featuresProp };
  const tabFeatureMap: Partial<Record<TabType, keyof typeof features>> = {
    NETWORK: 'network',
    LOGS: 'console',
    WEBSOCKET: 'websocket',
    PERFORMANCE: 'performance',
    MEMORY: 'memory',
    NOTIFICATIONS: 'notifications',
    NAVFLOW: 'navigationFlow',
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
    const unsubscribe = subscribeToMemory((stats) => {
      setMemStats(stats);
    });
    return unsubscribe;
  }, []);

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
    const unsub2 = addCloseCleanup(() => {
      destroyMemoryMonitor();
    });
    return () => {
      unsub1();
      unsub2();
    };
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
      MEMORY: logs.filter((l: LogEntry) => l.type === 'performance').length,
      STORE: logs.filter((l: LogEntry) => l.type === 'action').length,
      NOTIFICATIONS: logs.filter((l: LogEntry) => l.type === 'notification').length,
      NAVFLOW: logs.filter((l: LogEntry) => l.type === 'navigation' || l.type === 'navigationFlow').length,
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

      const matchesSearch = (() => {
        if (searchQuery === '') return true;
        if (regexMode) {
          try {
            const re = new RegExp(searchQuery, 'i');
            return (log.url && re.test(log.url)) || (log.message && re.test(log.message));
          } catch {
            return true;
          }
        }
        return (
          (log.url?.toLowerCase().includes(searchQuery.toLowerCase())) ||
          (log.message?.toLowerCase().includes(searchQuery.toLowerCase()))
        );
      })();

      const matchesMethod = filterMethod === 'ALL' || log.method === filterMethod;

      const matchesStatus =
        filterStatus === 'ALL' || filterStatus === 'BOOKMARKED'
          ? true
          : filterStatus === 'ERR'
            ? !!log.status && log.status >= 400
            : !!log.status && log.status < 400;

      const matchesBookmark = filterStatus !== 'BOOKMARKED' || bookmarkedIds.has(log.id);

      const matchesDomain = selectedDomain === null || (log.url && extractDomain(log.url) === selectedDomain);

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

  const handleReplayRequest = async (log: LogEntry): Promise<void> => {
    if (!log.url) {
      showError(t.replayRequest + ' — ' + (t.noTimelineData || 'No URL'));
      return;
    }

    setLoading('Replaying request...');
    try {
      const method = log.method || 'GET';
      const url = log.url;
      const headers: Record<string, string> = {};

      // Copy request headers (skip internal header names)
      if (log.requestHeaders && typeof log.requestHeaders === 'object') {
        const raw = log.requestHeaders as Record<string, unknown>;
        Object.keys(raw).forEach((key) => {
          if (typeof raw[key] === 'string' || typeof raw[key] === 'number') {
            headers[key] = String(raw[key]);
          }
        });
      }

      // Prepare body (exclude for GET/HEAD)
      let body: any;
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

      const response = await fetch(url, { method, headers, body } as RequestInit);
      showSuccess(`${t.replayRequest} — ${response.status} ${response.statusText || ''}`);
    } catch (err: unknown) {
      showError(t.replayRequest + ' — ' + ((err as Error)?.message || 'Failed'));
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
            {item.graphql ? (
              <View style={[styles.graphqlBadge, { backgroundColor: C.secondary + '18' }]}>
                <Text style={[styles.graphqlBadgeText, { color: C.secondary }]}>
                  {item.graphql.operationType !== 'unknown'
                    ? item.graphql.operationType.toUpperCase().slice(0, 4)
                    : 'GQL'}
                </Text>
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
            <TouchableOpacity
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              accessibilityRole="button"
              accessibilityLabel={bookmarkedIds.has(item.id) ? 'Remove bookmark' : 'Bookmark'}
              onPress={() => {
                const next = new Set(bookmarkedIds);
                if (next.has(item.id)) {
                  next.delete(item.id);
                } else {
                  next.add(item.id);
                }
                setBookmarkedIds(next);
              }}
            >
              <Text style={{ color: bookmarkedIds.has(item.id) ? '#FFD700' : C.textDim, fontSize: 14, marginLeft: 6 }}>
                {bookmarkedIds.has(item.id) ? '★' : '☆'}
              </Text>
            </TouchableOpacity>
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
                        : tab === 'MEMORY'
                          ? t.memory
                          : tab === 'STORE'
                            ? t.store
                            : tab === 'NOTIFICATIONS'
                              ? t.notifications || 'Notifs'
                              : tab === 'NAVFLOW'
                                ? t.navFlow || 'Flow'
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
                {(['ALL', 'OK', 'ERR', 'BOOKMARKED'] as const).map((s) => {
                  const pillLabel = s === 'ALL' ? t.allFilter : s === 'OK' ? t.success2xx3xx : s === 'ERR' ? t.error4xx5xx : t.bookmarked;
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
                <TouchableOpacity
                  accessibilityRole="button"
                  accessibilityLabel={showWaterfall ? t.list : t.waterfall}
                  style={[styles.filterPill, showWaterfall && styles.filterPillActive]}
                  onPress={() => setShowWaterfall(!showWaterfall)}
                >
                  <Text style={[styles.filterPillText, showWaterfall ? styles.filterPillTextActive : styles.filterPillTextInactive]}>
                    {showWaterfall ? t.list : t.waterfall}
                  </Text>
                </TouchableOpacity>
              </View>
            ) : activeTab === 'LOGS' ? (
              <View style={styles.filterRow}>
                {(['ALL', 'OK', 'ERR'] as const).map((s) => {
                  const pillLabel = s === 'ALL' ? t.allFilter : s === 'OK' ? t.info || 'Info' : t.error4xx5xx;
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
            ) : activeTab === 'WEBSOCKET' ? (
              <View style={styles.filterRow}>
                {(['ALL', 'OPEN', 'MSG', 'CLOSE', 'ERR'] as const).map((s) => {
                  const pillLabel = s === 'ALL' ? t.allFilter : s === 'OPEN' ? 'Open' : s === 'MSG' ? 'Message' : s === 'CLOSE' ? 'Close' : 'Error';
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
            ) : activeTab === 'NOTIFICATIONS' ? (
              <View style={styles.filterRow}>
                {(['ALL', 'REMOTE', 'LOCAL'] as const).map((s) => {
                  const pillLabel = s === 'ALL' ? t.allFilter : s === 'REMOTE' ? 'Remote' : 'Local';
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
            ) : activeTab === 'NAVFLOW' ? (
              <View style={styles.filterRow}>
                {(['ALL', 'PUSH', 'POP', 'REPLACE', 'NAVIGATE'] as const).map((s) => {
                  const pillLabel = s === 'ALL' ? t.allFilter : s;
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

            {/* Advanced Search toggle - Network tab only */}
            {activeTab === 'NETWORK' ? (
              <>
                <TouchableOpacity
                  accessibilityRole="button"
                  accessibilityLabel="Toggle advanced search"
                  onPress={() => setShowAdvancedSearch(!showAdvancedSearch)}
                  style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 4 }}
                >
                  <Text style={{ color: C.primary, fontSize: 10, fontWeight: '700', letterSpacing: 0.5 }}>
                    {showAdvancedSearch ? t.advancedSearchHide : t.advancedSearch}
                  </Text>
                </TouchableOpacity>

                {showAdvancedSearch ? (
              <View style={{ paddingHorizontal: 10, paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: C.border }}>
                {/* Method filter chips */}
                <Text style={{ color: C.textDim, fontSize: 9, fontWeight: '700', letterSpacing: 0.5, marginBottom: 4 }}>{t.methodFilter}</Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginBottom: 8 }}>
                  {['ALL', 'GET', 'POST', 'PUT', 'DELETE', 'PATCH'].map((method) => (
                    <TouchableOpacity
                      key={method}
                      accessibilityRole="radio"
                      accessibilityState={{ checked: filterMethod === method }}
                      onPress={() => setFilterMethod(method)}
                      style={{
                        paddingHorizontal: 8,
                        paddingVertical: 3,
                        borderRadius: 6,
                        backgroundColor: filterMethod === method ? C.primary : C.surfaceLight,
                        borderWidth: 1,
                        borderColor: filterMethod === method ? C.primary : C.border,
                      }}
                    >
                      <Text style={{ color: filterMethod === method ? '#FFF' : C.text, fontSize: 9, fontWeight: '700' }}>
                        {method === 'ALL' ? t.allMethods : method}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Time range chips */}
                <Text style={{ color: C.textDim, fontSize: 9, fontWeight: '700', letterSpacing: 0.5, marginBottom: 4 }}>{t.timeFilter}</Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginBottom: 8 }}>
                  {[
                    { label: t.timeCustom, value: null as number | null },
                    { label: t.time5min, value: 5 },
                    { label: t.time15min, value: 15 },
                    { label: t.time1hour, value: 60 },
                  ].map((opt) => (
                    <TouchableOpacity
                      key={opt.label}
                      accessibilityRole="radio"
                      accessibilityState={{ checked: timeRangeMinutes === opt.value }}
                      onPress={() => setTimeRangeMinutes(opt.value)}
                      style={{
                        paddingHorizontal: 8,
                        paddingVertical: 3,
                        borderRadius: 6,
                        backgroundColor: timeRangeMinutes === opt.value ? C.primary : C.surfaceLight,
                        borderWidth: 1,
                        borderColor: timeRangeMinutes === opt.value ? C.primary : C.border,
                      }}
                    >
                      <Text style={{ color: timeRangeMinutes === opt.value ? '#FFF' : C.text, fontSize: 9, fontWeight: '700' }}>
                        {opt.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Domain selector */}
                <Text style={{ color: C.textDim, fontSize: 9, fontWeight: '700', letterSpacing: 0.5, marginBottom: 4 }}>{t.domainFilter}</Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginBottom: 8 }}>
                  <TouchableOpacity
                    accessibilityRole="radio"
                    accessibilityState={{ checked: selectedDomain === null }}
                    onPress={() => setSelectedDomain(null)}
                    style={{
                      paddingHorizontal: 8,
                      paddingVertical: 3,
                      borderRadius: 6,
                      backgroundColor: selectedDomain === null ? C.primary : C.surfaceLight,
                      borderWidth: 1,
                      borderColor: selectedDomain === null ? C.primary : C.border,
                    }}
                  >
                    <Text style={{ color: selectedDomain === null ? '#FFF' : C.text, fontSize: 9, fontWeight: '700' }}>
                      {t.domainAny}
                    </Text>
                  </TouchableOpacity>
                  {logs
                    .filter((l: LogEntry) => l.url && l.type !== 'websocket' && l.type !== 'performance' && l.type !== 'action' && l.type !== 'info')
                    .map((l: LogEntry) => extractDomain(l.url!))
                    .filter((d: string, i: number, arr: string[]) => arr.indexOf(d) === i)
                    .slice(0, 10)
                    .map((domain: string) => (
                      <TouchableOpacity
                        key={domain}
                        accessibilityRole="radio"
                        accessibilityState={{ checked: selectedDomain === domain }}
                        onPress={() => setSelectedDomain(domain === selectedDomain ? null : domain)}
                        style={{
                          paddingHorizontal: 8,
                          paddingVertical: 3,
                          borderRadius: 6,
                          backgroundColor: selectedDomain === domain ? C.primary : C.surfaceLight,
                          borderWidth: 1,
                          borderColor: selectedDomain === domain ? C.primary : C.border,
                        }}
                      >
                        <Text style={{ color: selectedDomain === domain ? '#FFF' : C.text, fontSize: 9, fontWeight: '700' }} numberOfLines={1}>
                          {domain.length > 20 ? domain.slice(0, 18) + '…' : domain}
                        </Text>
                      </TouchableOpacity>
                    ))}
                </View>

                {/* Regex toggle */}
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <TouchableOpacity
                      accessibilityRole="switch"
                      accessibilityState={{ checked: regexMode }}
                      onPress={() => setRegexMode(!regexMode)}
                      style={{
                        width: 36,
                        height: 20,
                        borderRadius: 10,
                        backgroundColor: regexMode ? C.primary : C.border,
                        justifyContent: 'center',
                        paddingHorizontal: 2,
                      }}
                    >
                      <View style={{
                        width: 16,
                        height: 16,
                        borderRadius: 8,
                        backgroundColor: '#FFF',
                        alignSelf: regexMode ? 'flex-end' : 'flex-start',
                      }} />
                    </TouchableOpacity>
                    <Text style={{ color: C.text, fontSize: 10, fontWeight: '700', letterSpacing: 0.5 }}>{t.regexToggle}</Text>
                  </View>

                  {/* Presets */}
                  <View style={{ flexDirection: 'row', gap: 6 }}>
                    <TouchableOpacity
                      accessibilityRole="button"
                      accessibilityLabel={t.savePreset}
                      onPress={() => {
                        const name = `Preset ${searchPresets.length + 1}`;
                        setSearchPresets([...searchPresets, { name, query: searchQuery, method: filterMethod, status: filterStatus, domain: selectedDomain, time: timeRangeMinutes, regex: regexMode }]);
                      }}
                      style={{ paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, backgroundColor: C.primary + '20', borderWidth: 1, borderColor: C.primary + '40' }}
                    >
                      <Text style={{ color: C.primary, fontSize: 9, fontWeight: '700' }}>{t.savePreset}</Text>
                    </TouchableOpacity>
                    {searchPresets.length > 0 ? (
                      <TouchableOpacity
                        accessibilityRole="button"
                        accessibilityLabel={t.loadPreset}
                        onPress={() => {
                          const names = searchPresets.map(p => p.name);
                          Alert.alert(t.presets, t.savedPresets, [
                            ...searchPresets.map((p, i) => ({
                              text: p.name,
                              onPress: () => {
                                setSearchQuery(p.query);
                                setFilterMethod(p.method);
                                setFilterStatus(p.status);
                                setSelectedDomain(p.domain);
                                setTimeRangeMinutes(p.time);
                                setRegexMode(p.regex);
                              },
                            })),
                            { text: t.cancel, style: 'cancel' as const },
                          ]);
                        }}
                        style={{ paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, backgroundColor: C.primary + '20', borderWidth: 1, borderColor: C.primary + '40' }}
                      >
                        <Text style={{ color: C.primary, fontSize: 9, fontWeight: '700' }}>{t.loadPreset}</Text>
                      </TouchableOpacity>
                    ) : null}
                  </View>
                </View>
              </View>
            ) : null}
              </>
            ) : null}
          </View>
        ) : null}

        {compareIds.length > 0 && (
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 10, paddingVertical: 6, backgroundColor: C.primary + '18', borderBottomWidth: 1, borderBottomColor: C.border }}>
            <Text style={{ color: C.primary, fontSize: 11, fontWeight: '700' }}>
              {t.compare}: {compareIds.length}/2 selected
            </Text>
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel="Clear compare selection"
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              onPress={() => setCompareIds([])}
            >
              <Text style={{ color: C.error, fontSize: 12, fontWeight: '700' }}>{t.close}</Text>
            </TouchableOpacity>
          </View>
        )}

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
        ) : activeTab === 'MEMORY' ? (
          <MemoryPanel
            memStats={memStats}
            memRunning={memRunning}
            C={C}
            t={t}
            onToggleMem={setMemRunning}
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
        ) : activeTab === 'NOTIFICATIONS' ? (
          <NotificationPanel C={C} t={t} />
        ) : activeTab === 'NAVFLOW' ? (
          <NavigationFlowPanel C={C} t={t} />
        ) : activeTab === 'NETWORK' && showWaterfall ? (
          <TimelinePanel
            logs={filteredLogs}
            C={C}
            t={t}
            enabled={showWaterfall}
            onToggle={() => setShowWaterfall(false)}
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
                <Animated.View
                  style={[
                    styles.detailSheet,
                    {
                      transform: [{ translateY: detailTranslateY }],
                      opacity: detailOpacity,
                    },
                  ]}
                  {...detailPanResponder.panHandlers}
                >
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
                      {selectedLog?.url && (
                        <TouchableOpacity
                          accessibilityRole="menuitem"
                          style={styles.detailDropdownItem}
                          onPress={() => {
                            if (selectedLog) handleReplayRequest(selectedLog);
                            setShowMenu(false);
                          }}
                        >
                          <Text style={styles.detailDropdownText}>{t.replayRequest}</Text>
                        </TouchableOpacity>
                      )}
                      <TouchableOpacity
                        accessibilityRole="menuitem"
                        style={styles.detailDropdownItem}
                        onPress={() => {
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
                        }}
                      >
                        <Text style={styles.detailDropdownText}>
                          {selectedLog && bookmarkedIds.has(selectedLog.id) ? '★ ' + t.bookmark : '☆ ' + t.bookmark}
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        accessibilityRole="menuitem"
                        style={styles.detailDropdownItem}
                        onPress={() => {
                          if (selectedLog) {
                            if (compareIds.includes(selectedLog.id)) {
                              setCompareIds(compareIds.filter((id) => id !== selectedLog.id));
                            } else if (compareIds.length === 0) {
                              setCompareIds([selectedLog.id]);
                            } else if (compareIds.length === 1) {
                              setCompareIds([compareIds[0]!, selectedLog.id!]);
                              setShowCompareModal(true);
                            } else {
                              setCompareIds([selectedLog.id]);
                            }
                          }
                          setSelectedLog(null);
                          setShowMenu(false);
                        }}
                      >
                        <Text style={[styles.detailDropdownText, compareIds.includes(selectedLog?.id || '') ? { color: C.primary } : undefined]}>
                          {t.selectForCompare}
                        </Text>
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
                      {selectedLog?.graphql && selectedLog.graphql.operationType !== 'unknown' && (
                        <Section themeColors={C} label={t.graphqlOperation} value={selectedLog.graphql.operationType.toUpperCase()} onCopy={handleCopy} />
                      )}
                      {selectedLog?.graphql?.operationName && (
                        <Section themeColors={C} label={t.graphqlOperationName} value={selectedLog.graphql.operationName} onCopy={handleCopy} />
                      )}
                      {selectedLog?.graphql?.variables && (
                        <Section themeColors={C} label={t.graphqlVariables} json={selectedLog.graphql.variables} onCopy={handleCopy} />
                      )}
                      {selectedLog?.graphql?.query && (
                        <Section themeColors={C} label={t.graphqlQuery} value={selectedLog.graphql.query} onCopy={handleCopy} />
                      )}
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
              </Animated.View>
            </View>
            );
          })()}
        </Modal>

        {/* Comparison Modal */}
        <Modal
          visible={showCompareModal}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={() => { setShowCompareModal(false); setCompareIds([]); }}
        >
          {(() => {
            const logA = logs.find((l: LogEntry) => l.id === compareIds[0]);
            const logB = logs.find((l: LogEntry) => l.id === compareIds[1]);
            if (!logA || !logB) {
              return (
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: C.background }}>
                  <Text style={{ color: C.textDim, fontSize: 14 }}>{t.noDiff}</Text>
                </View>
              );
            }

            interface CompareField {
              label: string;
              valueA: string;
              valueB: string;
              diff: boolean;
            }

            const statusA = logA.status?.toString() || '-';
            const statusB = logB.status?.toString() || '-';
            const durationA = logA.durationMs ? `${logA.durationMs}ms` : '-';
            const durationB = logB.durationMs ? `${logB.durationMs}ms` : '-';

            const fields: CompareField[] = [
              { label: 'Method', valueA: logA.method || '-', valueB: logB.method || '-', diff: (logA.method || '') !== (logB.method || '') },
              { label: 'URL', valueA: logA.url || '-', valueB: logB.url || '-', diff: (logA.url || '') !== (logB.url || '') },
              { label: 'Status', valueA: statusA, valueB: statusB, diff: statusA !== statusB },
              { label: 'Duration', valueA: durationA, valueB: durationB, diff: durationA !== durationB },
            ];

            const hasDiff = fields.some((f) => f.diff);

            const CompareRow = ({ field }: { field: CompareField }) => (
              <View style={{ flexDirection: 'row', marginBottom: 12 }}>
                <Text style={{ width: 72, color: C.textDim, fontSize: 10, fontWeight: '700', letterSpacing: 0.5 }}>{field.label}</Text>
                <View style={{ flex: 1, paddingRight: 6 }}>
                  <View style={[styles.sectionBox, field.diff ? { borderColor: C.warning, borderWidth: 1 } : undefined]}>
                    <Text selectable style={[styles.sectionValue, field.diff ? { color: C.warning } : undefined]} numberOfLines={4}>
                      {field.valueA || '-'}
                    </Text>
                  </View>
                </View>
                <View style={{ flex: 1, paddingLeft: 6 }}>
                  <View style={[styles.sectionBox, field.diff ? { borderColor: C.warning, borderWidth: 1 } : undefined]}>
                    <Text selectable style={[styles.sectionValue, field.diff ? { color: C.warning } : undefined]} numberOfLines={4}>
                      {field.valueB || '-'}
                    </Text>
                  </View>
                </View>
              </View>
            );

            return (
              <View style={{ flex: 1, backgroundColor: C.background }}>
                {/* Header */}
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: C.border }}>
                  <Text style={{ color: C.text, fontSize: 16, fontWeight: '700' }}>{t.comparisonTitle}</Text>
                  <TouchableOpacity
                    accessibilityRole="button"
                    accessibilityLabel={t.close}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    onPress={() => { setShowCompareModal(false); setCompareIds([]); }}
                    style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, backgroundColor: C.surfaceLight }}
                  >
                    <Text style={{ color: C.primary, fontSize: 13, fontWeight: '700' }}>{t.close}</Text>
                  </TouchableOpacity>
                </View>

                <ScrollView style={{ flex: 1, padding: 16 }} showsVerticalScrollIndicator={false}>
                  {/* Diff indicator */}
                  {!hasDiff ? (
                    <View style={{ alignItems: 'center', paddingVertical: 12, marginBottom: 12 }}>
                      <Text style={{ color: C.success, fontSize: 13, fontWeight: '700' }}>{t.noDiff}</Text>
                    </View>
                  ) : (
                    <View style={{ alignItems: 'center', paddingVertical: 12, marginBottom: 12 }}>
                      <Text style={{ color: C.warning, fontSize: 11, fontWeight: '600' }}>Differences highlighted in {C.warning}</Text>
                    </View>
                  )}

                  {/* Column headers */}
                  <View style={{ flexDirection: 'row', marginBottom: 8 }}>
                    <View style={{ width: 72 }} />
                    <View style={{ flex: 1, alignItems: 'center', paddingRight: 6 }}>
                      <Text style={{ color: C.primary, fontSize: 9, fontWeight: '800', letterSpacing: 0.5 }}>REQUEST A</Text>
                    </View>
                    <View style={{ flex: 1, alignItems: 'center', paddingLeft: 6 }}>
                      <Text style={{ color: C.primary, fontSize: 9, fontWeight: '800', letterSpacing: 0.5 }}>REQUEST B</Text>
                    </View>
                  </View>

                  {/* Fields */}
                  {fields.map((field) => (
                    <CompareRow key={field.label} field={field} />
                  ))}

                  {/* Headers section */}
                  <Text style={{ color: C.textDim, fontSize: 10, fontWeight: '700', letterSpacing: 0.5, marginTop: 8, marginBottom: 8 }}>{t.headers?.toUpperCase?.() || 'HEADERS'}</Text>
                  <View style={{ flexDirection: 'row', marginBottom: 12 }}>
                    <View style={{ flex: 1, paddingRight: 6 }}>
                      <View style={[styles.sectionBox]}>
                        <Text selectable style={styles.sectionValue}>
                          {logA.requestHeaders ? JSON.stringify(logA.requestHeaders, null, 2) : '-'}
                        </Text>
                      </View>
                    </View>
                    <View style={{ flex: 1, paddingLeft: 6 }}>
                      <View style={[styles.sectionBox]}>
                        <Text selectable style={styles.sectionValue}>
                          {logB.requestHeaders ? JSON.stringify(logB.requestHeaders, null, 2) : '-'}
                        </Text>
                      </View>
                    </View>
                  </View>

                  {/* Body section */}
                  <Text style={{ color: C.textDim, fontSize: 10, fontWeight: '700', letterSpacing: 0.5, marginTop: 8, marginBottom: 8 }}>{t.body?.toUpperCase?.() || 'BODY'}</Text>
                  <View style={{ flexDirection: 'row', marginBottom: 12 }}>
                    <View style={{ flex: 1, paddingRight: 6 }}>
                      <View style={[styles.sectionBox]}>
                        <Text selectable style={styles.sectionValue}>
                          {logA.requestData ? JSON.stringify(logA.requestData, null, 2) : '-'}
                        </Text>
                      </View>
                    </View>
                    <View style={{ flex: 1, paddingLeft: 6 }}>
                      <View style={[styles.sectionBox]}>
                        <Text selectable style={styles.sectionValue}>
                          {logB.requestData ? JSON.stringify(logB.requestData, null, 2) : '-'}
                        </Text>
                      </View>
                    </View>
                  </View>

                  <View style={{ height: 40 }} />
                </ScrollView>
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
