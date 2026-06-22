/* eslint-disable react-native/no-inline-styles */
/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useState, ReactNode, useRef, useCallback, useEffect, useMemo } from "react";
import {
  TouchableOpacity,
  Modal,
  View,
  Text,
  TextInput,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  Animated,
  PanResponder,
  Dimensions,
  useColorScheme,
} from "react-native";
import { getStorageValue, setStorageValue } from "./storage";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { setupConsoleMonitor } from "./ConsoleMonitor";
import { DebugMonitor } from "./DebugMonitor";
import { Logger } from "./Logger";
import DebugContext from "./DebugContext";
import { setupNetworkMonitor, type NetworkConfig } from "./NetworkMonitor";
import { setupWebSocketMonitor } from "./WebSocketMonitor";
import { startPerformanceMonitor } from "./PerformanceMonitor";
import { ErrorBoundary, setupGlobalErrorHandlers } from "./ErrorBoundary";
import { startPersistence, restoreLogs } from "./PersistenceManager";
import { setupNotificationMonitor } from "./NotificationMonitor";
import { setupNavigationTracker } from "./NavigationTracker";
import { getColors, type ThemeColors } from "./DebugMonitorStyles";
import {
  TRANSLATIONS,
  resolveLanguage,
  type LanguageCode,
} from "./translations";

export interface DebugTriggerProps {
  children?: ReactNode;
  password?: string;
  passwordFrequency?: "all-time" | "per-install" | "app-active";
  passwordOptional?: boolean;
  enableShake?: boolean;
  clicksNeeded?: number;
  isDemo?: boolean;
  onEnvChange?: (newEnv: "demo" | "prod") => void;
  onBaseUrlChange?: (newUrl: string) => void;
  baseUrls?: string[] | { title: string; url: string }[];
  prodUrl?: string;
  testUrl?: string;
  enabled?: boolean;
  enableTapGesture?: boolean;
  floatingButtonMargin?: number;
  checkAccess?: () => boolean | Promise<boolean>;
  language?: LanguageCode;
  theme?: "light" | "dark" | "auto";
  colors?: Partial<ThemeColors>;
  onOpen?: () => void;
  onClose?: () => void;
  floatingButtonContent?: ReactNode;
  networkConfig?: NetworkConfig;
  features?: {
    network?: boolean;
    console?: boolean;
    websocket?: boolean;
    errorBoundary?: boolean;
    performance?: boolean;
    persistence?: boolean;
    notifications?: boolean;
    navigationFlow?: boolean;
  };
}

const COLORS = {
  background: "#0F172A",
  surface: "#1E293B",
  primary: "#38BDF8",
  text: "#F8FAFC",
  textDim: "#94A3B8",
  disabled: "#64748B",
  border: "#334155",
  overlay: "rgba(2, 6, 23, 0.9)",
};

const styles = StyleSheet.create({
  actions: { flexDirection: "row", gap: 12 },
  cancelBtn: {
    alignItems: "center",
    borderColor: COLORS.border,
    borderRadius: 12,
    borderWidth: 1,
    flex: 1,
    padding: 14,
  },
  cancelText: { color: COLORS.textDim, fontWeight: "bold" },
  floatingButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 20,
    elevation: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
    position: "absolute",
    shadowColor: COLORS.primary,
    shadowOpacity: 0.5,
    shadowRadius: 10,
  },
  floatingButtonText: {
    color: COLORS.text,
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 1,
  },
  input: {
    backgroundColor: COLORS.background,
    borderColor: COLORS.border,
    borderRadius: 12,
    borderWidth: 1,
    color: COLORS.text,
    fontSize: 16,
    marginBottom: 20,
    padding: 15,
    textAlign: "center",
  },
  keyboardView: { alignItems: "center", width: "100%" },
  modal: {
    backgroundColor: COLORS.surface,
    borderColor: COLORS.border,
    borderRadius: 24,
    borderWidth: 1,
    padding: 24,
    width: "85%",
  },
  overlay: {
    alignItems: "center",
    backgroundColor: COLORS.overlay,
    flex: 1,
    justifyContent: "center",
  },
  submitBtn: {
    alignItems: "center",
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    flex: 2,
    padding: 14,
  },
  submitText: { color: COLORS.background, fontWeight: "900" },
  subtitle: {
    color: COLORS.textDim,
    fontSize: 13,
    marginBottom: 20,
    textAlign: "center",
  },
  title: {
    color: COLORS.text,
    fontSize: 20,
    fontWeight: "900",
    marginBottom: 4,
    textAlign: "center",
  },
});

let isAppActiveAuthenticated = false;

/**
 * DebugTrigger
 *
 * A component that wraps the app and provides a hidden trigger to open a debug monitor for network requests and logs.
 * It supports password protection, configurable trigger methods, and environment switching.
 *
 * @param children - The child components to wrap
 * @param password - Optional password to protect access to the debug monitor
 * @param passwordFrequency - How often the password should be required ('all-time', 'per-install', 'app-active')
 * @param enableShake - Whether shaking the device should also trigger the monitor
 * @param clicksNeeded - Number of clicks needed to trigger the monitor
 * @param isDemo - Whether the app is in demo mode (affects initial base URL)
 * @param onEnvChange - Callback when environment is changed in the monitor
 * @param onBaseUrlChange - Callback when base URL is changed in the monitor
 * @param baseUrls - List of base URLs for quick switching in the monitor
 * @param prodUrl - Production base URL
 * @param testUrl - Test base URL
 * @param enabled - Whether the trigger is enabled
 * @param checkAccess - Optional function to perform additional access checks before showing the monitor
 * @param language - Language for the monitor UI (use 'auto' to detect from device)
 * @returns The wrapped children and the debug monitor when triggered
 */
export const DebugTrigger = ({
  children,
  password = "2024",
  passwordFrequency = "all-time",
  passwordOptional = false,
  enableShake = false,
  clicksNeeded = 5,
  isDemo = false,
  onEnvChange,
  onBaseUrlChange,
  baseUrls,
  prodUrl,
  testUrl,
  enabled = true,
  enableTapGesture = true,
  floatingButtonMargin = 16,
  checkAccess,
  language = "auto",
  theme = "auto",
  colors: customColors,
  onOpen,
  onClose: onCloseProp,
  floatingButtonContent,
  networkConfig,
  features: featuresProp,
}: DebugTriggerProps) => {
  const systemScheme = useColorScheme();
  const insets = useSafeAreaInsets();
  const safeM = { x: floatingButtonMargin + insets.right, y: floatingButtonMargin + insets.bottom, left: floatingButtonMargin + insets.left, top: floatingButtonMargin + insets.top };
  const effectiveTheme: "dark" | "light" =
    theme === "auto" ? (systemScheme === "light" ? "light" : "dark") : theme;
  const isLight = effectiveTheme === "light";

  const features = {
    network: true,
    console: true,
    websocket: true,
    errorBoundary: true,
    performance: true,
    persistence: true,
    notifications: true,
    navigationFlow: true,
    ...featuresProp,
  };

  const [clicks, setClicks] = useState(0);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showMonitor, setShowMonitor] = useState(false);
  const [showFloatingButton, setShowFloatingButton] = useState(false);
  const [inputPassword, setInputPassword] = useState("");
  const timerRef = useRef<any>(null);
  const closeCleanupRef = useRef<Array<() => void>>([]);

  const addCloseCleanup = useCallback((fn: () => void) => {
    closeCleanupRef.current.push(fn);
    return () => {
      closeCleanupRef.current = closeCleanupRef.current.filter(f => f !== fn);
    };
  }, []);

  const cleanupOnClose = useCallback(() => {
    closeCleanupRef.current.forEach(fn => fn());
    closeCleanupRef.current = [];
  }, []);

  const activeLang = resolveLanguage(language);
  const t = TRANSLATIONS[activeLang] || TRANSLATIONS.en;

  const prevShowMonitor = useRef(false);
  useEffect(() => {
    if (showMonitor && !prevShowMonitor.current) {
      onOpen?.();
    }
    prevShowMonitor.current = showMonitor;
  }, [showMonitor, onOpen]);

  useEffect(() => {
    if (features.network) setupNetworkMonitor(networkConfig);
    if (features.console) setupConsoleMonitor();
    if (features.websocket) setupWebSocketMonitor();
    if (features.errorBoundary) setupGlobalErrorHandlers();
    if (features.performance) startPerformanceMonitor();
    if (features.persistence) startPersistence(15000);
    if (features.notifications) setupNotificationMonitor();
    if (features.navigationFlow) setupNavigationTracker();

    restoreLogs().then((savedLogs) => {
      if (savedLogs.length > 0) {
        savedLogs.forEach((log) => {
          if (log.message && !log.url) {
            Logger.logInfo(log.message, log.requestData);
          }
        });
      }
    });

    if (!Logger.getBaseUrl()) {
      const initialUrl = isDemo ? testUrl : prodUrl;
      if (initialUrl) {
        Logger.setBaseUrl(initialUrl);
      } else if (baseUrls && baseUrls.length > 0) {
        const first = baseUrls[0];
        const url = typeof first === "string" ? first : first?.url;
        Logger.setBaseUrl(url ?? "");
      }
    }
  }, []);

  useEffect(() => {
    if (!enableShake) return;
  }, [enableShake]);

  /**
   * handleOpen
   * Main entry point for opening the debug monitor, checks password requirements and access control before showing the monitor.
   */
  const handleOpen = async () => {
    if (checkAccess) {
      const hasAccess = await checkAccess();
      if (!hasAccess) return;
    }

    if (passwordOptional) {
      setShowMonitor(true);
      setShowFloatingButton(true);
      return;
    }

    if (!password) {
      setShowMonitor(true);
      setShowFloatingButton(true);
      return;
    }

    if (passwordFrequency === "app-active" && isAppActiveAuthenticated) {
      setShowMonitor(true);
      setShowFloatingButton(true);
      return;
    }

    if (passwordFrequency === "per-install") {
      const isInstallAuthenticated = await getStorageValue(
        "networkMonitorAuthenticated",
        false,
      );
      if (isInstallAuthenticated) {
        setShowMonitor(true);
        setShowFloatingButton(true);
        return;
      }
    }

    savedPos.current = { x: posRef.current.x, y: posRef.current.y };
    setShowPasswordModal(true);
  };

  /**
   * handleClick
   * Handles click events on the trigger area, counting clicks and opening the monitor when the required number is reached.
   * Resets the click count after 2 seconds of inactivity.
   */
  const handleClick = () => {
    if (!enableTapGesture) return;
    if (showFloatingButton || showPasswordModal || showMonitor) {
      return;
    }
    if (!enabled) return;
    if (timerRef.current) clearTimeout(timerRef.current);

    const nextClicks = clicks + 1;
    setClicks(nextClicks);

    if (nextClicks >= clicksNeeded) {
      handleOpen();
      setClicks(0);
    } else {
      timerRef.current = setTimeout(() => setClicks(0), 400);
    }
  };

  /**
   * handlePasswordSubmit
   * Handles the submission of the password, validating it and updating the authentication state accordingly.
   */
  const handlePasswordSubmit = () => {
    if (inputPassword === password) {
      if (passwordFrequency === "app-active") {
        isAppActiveAuthenticated = true;
      } else if (passwordFrequency === "per-install") {
        setStorageValue("networkMonitorAuthenticated", true);
      }

      setShowPasswordModal(false);
      setShowMonitor(true);
      setShowFloatingButton(true);
      setInputPassword("");
    } else {
      Alert.alert(t.error, t.wrongPass);
      setInputPassword("");
    }
  };

  const BTN_STORAGE_KEY = "networkMonitorBtnPos";
  const { width: initW, height: initH } = Dimensions.get("window");
  const initBtnW = 60;
  const initBtnH = 40;
  const initX = Math.max(safeM.left, Math.min(initW - initBtnW - safeM.x, initW - 80 - insets.right));
  const initY = Math.max(safeM.top, Math.min(initH - initBtnH - safeM.y, initH * 0.5));
  const btnX = useRef(new Animated.Value(initX)).current;
  const btnY = useRef(new Animated.Value(initY)).current;
  const [btnSize, setBtnSize] = useState({ w: 60, h: 40 });
  const [btnHidden, setBtnHidden] = useState(false);
  const inactivityTimer = useRef<any>(null);

  const posRef = useRef({ x: initX, y: initY });
  const gestureRef = useRef({ x: 0, y: 0 });
  const savedPos = useRef({ x: initX, y: initY });

  const clampPosition = (x: number, y: number, bw: number, bh: number) => {
    const { width: sw, height: sh } = Dimensions.get("window");
    return {
      x: Math.max(safeM.left, Math.min(sw - bw - safeM.x, x)),
      y: Math.max(safeM.top, Math.min(sh - bh - safeM.y, y)),
    };
  };

  useEffect(() => {
    if (showFloatingButton) {
      setBtnHidden(false);
      if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
      inactivityTimer.current = setTimeout(() => setBtnHidden(true), 8000);
    } else {
      if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
      setBtnHidden(false);
    }
    return () => { if (inactivityTimer.current) clearTimeout(inactivityTimer.current); };
  }, [showFloatingButton]);

  useEffect(() => {
    (async () => {
      const saved = await getStorageValue(BTN_STORAGE_KEY, null) as any;
      if (!saved) return;
      const { width: sw, height: sh } = Dimensions.get("window");
      const dx = saved.x ?? sw - 80;
      const dy = saved.y ?? sh * 0.5;
      const clamped = clampPosition(dx, dy, btnSize.w, btnSize.h);
      posRef.current = { x: clamped.x, y: clamped.y };
      btnX.setValue(clamped.x);
      btnY.setValue(clamped.y);
    })();
  }, []);

  const snapToEdge = (x: number, y: number, anim: boolean) => {
    const { width: sw } = Dimensions.get("window");
    const bw = btnSize.w;
    const bh = btnSize.h;
    const clamped = clampPosition(x, y, bw, bh);
    const leftDist = clamped.x - safeM.left;
    const rightDist = sw - clamped.x - bw - safeM.x;
    const snapX = leftDist < rightDist ? safeM.left : sw - bw - safeM.x;

    posRef.current = { x: snapX, y: clamped.y };

    if (anim) {
      Animated.spring(btnX, { toValue: snapX, useNativeDriver: false, friction: 7, tension: 40 }).start();
      Animated.spring(btnY, { toValue: clamped.y, useNativeDriver: false, friction: 7, tension: 40 }).start();
    } else {
      btnX.setValue(snapX);
      btnY.setValue(clamped.y);
    }

    setStorageValue(BTN_STORAGE_KEY, { x: snapX, y: clamped.y });
  };

  const snapToEdgeOnResize = () => {
    const { width: sw, height: sh } = Dimensions.get("window");
    const bw = btnSize.w;
    const bh = btnSize.h;
    const clamped = clampPosition(posRef.current.x, posRef.current.y, bw, bh);
    const leftDist = clamped.x - safeM.left;
    const rightDist = sw - clamped.x - bw - safeM.x;
    const snapX = leftDist < rightDist ? safeM.left : sw - bw - safeM.x;
    const finalPos = { x: snapX, y: clamped.y };
    posRef.current = finalPos;
    btnX.setValue(snapX);
    btnY.setValue(clamped.y);
    setStorageValue(BTN_STORAGE_KEY, finalPos);
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > 2 || Math.abs(g.dy) > 2,
      onPanResponderGrant: () => {
        gestureRef.current = { x: posRef.current.x, y: posRef.current.y };
        setBtnHidden(false);
        if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
      },
      onPanResponderMove: (_, g) => {
        const nx = gestureRef.current.x + g.dx;
        const ny = gestureRef.current.y + g.dy;
        const clamped = clampPosition(nx, ny, btnSize.w, btnSize.h);
        posRef.current = { x: clamped.x, y: clamped.y };
        btnX.setValue(clamped.x);
        btnY.setValue(clamped.y);
      },
      onPanResponderRelease: (_, g) => {
        if (Math.abs(g.dx) < 5 && Math.abs(g.dy) < 5) {
          handleOpen();
          return;
        }
        snapToEdge(posRef.current.x, posRef.current.y, true);
        inactivityTimer.current = setTimeout(() => setBtnHidden(true), 8000);
      },
    }),
  ).current;

  useEffect(() => {
    const sub = Dimensions.addEventListener?.("change", snapToEdgeOnResize);
    return () => sub?.remove?.();
  }, [btnSize]);

  useEffect(() => {
    if (!showPasswordModal) {
      btnX.stopAnimation();
      btnY.stopAnimation();
      btnX.setValue(savedPos.current.x);
      btnY.setValue(savedPos.current.y);
    }
  }, [showPasswordModal]);

  const handleCloseDebugger = () => {
    cleanupOnClose();
    setShowMonitor(false);
    setShowFloatingButton(false);
  };

  const showBtn = showFloatingButton;

  const ctxValue = {
    openDebugger: handleOpen,
    closeDebugger: handleCloseDebugger,
    isDebuggerOpen: showMonitor,
    addCloseCleanup,
    cleanupOnClose,
  };

  return (
    <View style={{ flex: 1 }} onTouchEnd={enableTapGesture ? handleClick : undefined}>
      <View style={{ flex: 1 }} pointerEvents="box-none">
        <ErrorBoundary>
          <DebugContext.Provider value={ctxValue}>
            {children}
          </DebugContext.Provider>
        </ErrorBoundary>
      </View>

      <Modal
        transparent
        visible={showMonitor}
        animationType="slide"
        supportedOrientations={["landscape", "landscape-left", "landscape-right"]}
      >
        <View style={{ flex: 1 }} pointerEvents="box-none">
          <DebugMonitor
            envConfig={
              onEnvChange
                ? { currentEnv: isDemo ? "demo" : "prod", onEnvChange }
                : undefined
            }
            baseUrls={baseUrls}
            prodUrl={prodUrl}
            testUrl={testUrl}
            language={language}
            theme={theme}
            colors={customColors}
            features={features}
            onClose={() => {
              setShowMonitor(false);
              onCloseProp?.();
            }}
            onBaseUrlChange={onBaseUrlChange}
            onExitDebugMode={() => setShowFloatingButton(false)}
          />
        </View>
      </Modal>

      <Modal
        transparent
        visible={showPasswordModal}
        animationType="fade"
        supportedOrientations={["landscape", "landscape-left", "landscape-right"]}
      >
        <View style={{ flex: 1 }} pointerEvents="box-none">
          <TouchableWithoutFeedback onPress={() => setShowPasswordModal(false)}>
            <View style={styles.overlay}>
              <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                style={styles.keyboardView}
              >
                <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                  <View style={[
                    styles.modal,
                    isLight && { backgroundColor: '#FFFFFF', borderColor: '#E2E8F0' }
                  ]}>
                    <Text style={[styles.title, isLight && { color: '#0F172A' }]}>{t.login}</Text>
                    <Text style={[styles.subtitle, isLight && { color: '#64748B' }]}>
                      {t.clicks(clicksNeeded)}
                    </Text>
                    <TextInput
                      secureTextEntry
                      autoFocus
                      style={[styles.input, isLight && { backgroundColor: '#F8FAFC', borderColor: '#E2E8F0', color: '#0F172A' }]}
                      placeholder={t.passPlaceholder}
                      placeholderTextColor={isLight ? '#94A3B8' : COLORS.textDim}
                      value={inputPassword}
                      onChangeText={setInputPassword}
                      onSubmitEditing={handlePasswordSubmit}
                    />
                    <View style={styles.actions}>
                      <TouchableOpacity
                        accessibilityRole="button"
                        accessibilityLabel={t.cancel}
                        style={styles.cancelBtn}
                        onPress={() => setShowPasswordModal(false)}
                      >
                        <Text style={styles.cancelText}>{t.cancel}</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        accessibilityRole="button"
                        accessibilityLabel={t.confirm}
                        style={styles.submitBtn}
                        onPress={handlePasswordSubmit}
                      >
                        <Text style={styles.submitText}>{t.confirm}</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </TouchableWithoutFeedback>
              </KeyboardAvoidingView>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </Modal>

      <Animated.View
        pointerEvents={showBtn && !showMonitor && !showPasswordModal ? 'box-none' : 'none'}
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: 0,
          bottom: 0,
          zIndex: 99999,
          opacity: showBtn && !showMonitor && !showPasswordModal ? 1 : 0,
        }}
      >
        <Animated.View
          style={{
            position: "absolute",
            transform: [
              { translateX: btnX },
              { translateY: btnY },
            ],
          }}
          {...panResponder.panHandlers}
        >
          <TouchableOpacity
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel="Open debugger"
            style={[styles.floatingButton, { opacity: btnHidden ? 0.35 : 1 }]}
            testID="network-monitor-debug-button"
            onPress={handleOpen}
            onLongPress={() => setShowFloatingButton(false)}
            onLayout={(e) => setBtnSize({
              w: e.nativeEvent.layout.width,
              h: e.nativeEvent.layout.height,
            })}
          >
            {floatingButtonContent || <Text style={styles.floatingButtonText}>{t.debug}</Text>}
          </TouchableOpacity>
        </Animated.View>
      </Animated.View>
    </View>
  );
};
