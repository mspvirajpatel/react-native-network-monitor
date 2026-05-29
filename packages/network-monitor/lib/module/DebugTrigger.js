function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/* eslint-disable react-native/no-inline-styles */
/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useState, useRef, useEffect } from "react";
import { TouchableOpacity, Modal, View, Text, TextInput, StyleSheet, Alert, KeyboardAvoidingView, Platform, TouchableWithoutFeedback, Keyboard, NativeModules, Animated, PanResponder, Dimensions, useColorScheme } from "react-native";
import { getStorageValue, setStorageValue } from "./storage";
import { setupConsoleMonitor } from "./ConsoleMonitor";
import { DebugMonitor } from "./DebugMonitor";
import { Logger } from "./Logger";
import { setupNetworkMonitor } from "./NetworkMonitor";
const TRANSLATIONS = {
  az: {
    login: "Debug Girişi",
    clicks: n => `Ardıcıl ${n} klik aşkar edildi`,
    passPlaceholder: "Şifrəni daxil edin",
    cancel: "Ləğv et",
    confirm: "Təsdiqlə",
    error: "Xəta",
    wrongPass: "Şifrə yanlışdır"
  },
  en: {
    login: "Debug Login",
    clicks: n => `${n} clicks detected`,
    passPlaceholder: "Enter password",
    cancel: "Cancel",
    confirm: "Confirm",
    error: "Error",
    wrongPass: "Wrong password"
  },
  ru: {
    login: "Вход",
    clicks: n => `Обнаружено ${n} кликов`,
    passPlaceholder: "Введите пароль",
    cancel: "Отмена",
    confirm: "Ок",
    error: "Ошибка",
    wrongPass: "Неверный пароль"
  },
  tr: {
    login: "Giriş",
    clicks: n => `${n} tıklama tespit edildi`,
    passPlaceholder: "Şifreyi giriniz",
    cancel: "İptal",
    confirm: "Onayla",
    error: "Hata",
    wrongPass: "Yanlış şifre"
  }
};
const COLORS = {
  background: "#0F172A",
  surface: "#1E293B",
  primary: "#38BDF8",
  text: "#F8FAFC",
  textDim: "#94A3B8",
  disabled: "#64748B",
  border: "#334155",
  overlay: "rgba(2, 6, 23, 0.9)"
};
const styles = StyleSheet.create({
  actions: {
    flexDirection: "row",
    gap: 12
  },
  cancelBtn: {
    alignItems: "center",
    borderColor: COLORS.border,
    borderRadius: 12,
    borderWidth: 1,
    flex: 1,
    padding: 14
  },
  cancelText: {
    color: COLORS.textDim,
    fontWeight: "bold"
  },
  floatingButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 20,
    elevation: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
    position: "absolute",
    shadowColor: COLORS.primary,
    shadowOpacity: 0.5,
    shadowRadius: 10
  },
  floatingButtonText: {
    color: COLORS.text,
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 1
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
    textAlign: "center"
  },
  keyboardView: {
    alignItems: "center",
    width: "100%"
  },
  modal: {
    backgroundColor: COLORS.surface,
    borderColor: COLORS.border,
    borderRadius: 24,
    borderWidth: 1,
    padding: 24,
    width: "85%"
  },
  overlay: {
    alignItems: "center",
    backgroundColor: COLORS.overlay,
    flex: 1,
    justifyContent: "center"
  },
  submitBtn: {
    alignItems: "center",
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    flex: 2,
    padding: 14
  },
  submitText: {
    color: COLORS.background,
    fontWeight: "900"
  },
  subtitle: {
    color: COLORS.textDim,
    fontSize: 13,
    marginBottom: 20,
    textAlign: "center"
  },
  title: {
    color: COLORS.text,
    fontSize: 20,
    fontWeight: "900",
    marginBottom: 4,
    textAlign: "center"
  }
});

/**
 * getDeviceLanguage
 * Attempts to determine the device's current language setting, with fallbacks and error handling.
 * @returns A string representing the device's language, defaulting to 'en' if it cannot be determined or is unsupported.
 */
const getDeviceLanguage = () => {
  try {
    const locale = Platform.OS === "ios" ? NativeModules.SettingsManager?.settings?.AppleLocale || NativeModules.SettingsManager?.settings?.AppleLanguages?.[0] : NativeModules.I18nManager?.localeIdentifier;
    const lang = locale?.split(/[-_]/)[0] || "en";
    if (TRANSLATIONS[lang]) return lang;
  } catch (e) {
    console.warn("Error getting device language, defaulting to English:", e);
  }
  return "en";
};
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
 * @param language - Language for the monitor UI ('az', 'en', 'ru', 'tr', or 'auto' to detect from device)
 * @returns The wrapped children and the debug monitor when triggered
 */
export const DebugTrigger = ({
  children,
  password = "2024",
  passwordFrequency = "all-time",
  enableShake = false,
  clicksNeeded = 5,
  isDemo = false,
  onEnvChange,
  onBaseUrlChange,
  baseUrls,
  prodUrl,
  testUrl,
  enabled = true,
  checkAccess,
  language = "auto",
  theme = "auto"
}) => {
  const systemScheme = useColorScheme();
  const effectiveTheme = theme === "auto" ? systemScheme === "light" ? "light" : "dark" : theme;
  const isLight = effectiveTheme === "light";
  const [clicks, setClicks] = useState(0);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showMonitor, setShowMonitor] = useState(false);
  const [showFloatingButton, setShowFloatingButton] = useState(false);
  const [inputPassword, setInputPassword] = useState("");
  const timerRef = useRef(null);
  const activeLang = language === "auto" ? getDeviceLanguage() : language;
  const t = TRANSLATIONS[activeLang] || TRANSLATIONS.en;
  useEffect(() => {
    setupNetworkMonitor();
    setupConsoleMonitor();

    // Set initial base URL if not already set
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
      const isInstallAuthenticated = await getStorageValue("networkMonitorAuthenticated", false);
      if (isInstallAuthenticated) {
        setShowMonitor(true);
        setShowFloatingButton(true);
        return;
      }
    }
    setShowPasswordModal(true);
  };

  /**
   * handleClick
   * Handles click events on the trigger area, counting clicks and opening the monitor when the required number is reached.
   * Resets the click count after 2 seconds of inactivity.
   */
  const handleClick = () => {
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

  // Floating button: draggable + always-on-top via transparent Modal
  const FLOATING_BUTTON_POSITION_KEY = "networkMonitorFloatingButtonPosition";
  const pan = useRef(new Animated.ValueXY({
    x: 0,
    y: 0
  })).current;
  const [isPanReady, setIsPanReady] = useState(false);
  const [btnSize, setBtnSize] = useState({
    width: 0,
    height: 0
  });

  // Inactivity / disabled state for floating button
  const [floatingDisabled, setFloatingDisabled] = useState(false);
  const inactivityTimerRef = useRef(null);
  const INACTIVITY_MS = 3000; // 3 seconds

  const resetInactivityTimer = () => {
    try {
      if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
    } catch (_e) {
      // ignore
    }
    setFloatingDisabled(false);
    inactivityTimerRef.current = setTimeout(() => setFloatingDisabled(true), INACTIVITY_MS);
  };
  useEffect(() => {
    if (showFloatingButton) {
      resetInactivityTimer();
    } else {
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
        inactivityTimerRef.current = null;
      }
      setFloatingDisabled(false);
    }
    return () => {
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
        inactivityTimerRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showFloatingButton]);
  const HORIZONTAL_MARGIN = 20; // horizontal margin from both edges
  const TOP_MARGIN = 40; // top margin
  const BOTTOM_MARGIN = 30; // bottom margin

  /**
   * clampValue
   * Clamp a number between a minimum and maximum.
   */
  const clampValue = (v, a, b) => Math.max(a, Math.min(b, v));
  useEffect(() => {
    (async () => {
      const saved = await getStorageValue(FLOATING_BUTTON_POSITION_KEY, undefined);
      const {
        height
      } = Dimensions.get("window");
      const defaultX = 50;
      const defaultY = height - 50;
      if (saved && typeof saved === "object" && "x" in saved && "y" in saved && typeof saved.x === "number" && typeof saved.y === "number") {
        pan.setValue({
          x: saved.x,
          y: saved.y
        });
      } else {
        pan.setValue({
          x: defaultX,
          y: defaultY
        });
      }
      setIsPanReady(true);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const panResponder = useRef(PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderGrant: () => {
      // capture current offset
      try {
        pan.setOffset({
          x: pan.x._value ?? 0,
          y: pan.y._value ?? 0
        });
      } catch (_e) {
        // ignore
      }
      pan.setValue({
        x: 0,
        y: 0
      });
    },
    onPanResponderMove: Animated.event([null, {
      dx: pan.x,
      dy: pan.y
    }], {
      useNativeDriver: false
    }),
    onPanResponderRelease: (_evt, gestureState) => {
      const {
        dx,
        dy
      } = gestureState;
      pan.flattenOffset();

      // get raw final values
      let finalX = pan.x.__getValue ? pan.x.__getValue() : pan.x._value;
      let finalY = pan.y.__getValue ? pan.y.__getValue() : pan.y._value;

      // compute bounds based on measured button size (fallback sizes if not yet measured)
      const {
        width: screenW,
        height: screenH
      } = Dimensions.get("window");
      const bw = btnSize.width || 60;
      const bh = btnSize.height || 40;
      const minX = HORIZONTAL_MARGIN;
      const maxX = Math.max(minX, screenW - HORIZONTAL_MARGIN - bw);
      const minY = TOP_MARGIN;
      const maxY = Math.max(minY, screenH - BOTTOM_MARGIN - bh);
      const clampedX = clampValue(finalX, minX, maxX);
      const clampedY = clampValue(finalY, minY, maxY);
      if (clampedX !== finalX || clampedY !== finalY) {
        // animate back into bounds
        Animated.timing(pan, {
          toValue: {
            x: clampedX,
            y: clampedY
          },
          duration: 180,
          useNativeDriver: false
        }).start(() => {
          setStorageValue(FLOATING_BUTTON_POSITION_KEY, {
            x: clampedX,
            y: clampedY
          });
        });
      } else {
        setStorageValue(FLOATING_BUTTON_POSITION_KEY, {
          x: finalX,
          y: finalY
        });
      }

      // treat very small movement as a tap
      if (Math.abs(dx) < 6 && Math.abs(dy) < 6) {
        handleOpen();
      }
    }
  })).current;
  useEffect(() => {
    // whenever button size is measured or screen dims change, ensure current pos is within bounds
    if (!isPanReady) return;
    /**
     * ensureInBounds
     * Adjust current pan values so the button stays inside configured margins.
     */
    const ensureInBounds = () => {
      try {
        const {
          width: screenW,
          height: screenH
        } = Dimensions.get("window");
        const bw = btnSize.width || 60;
        const bh = btnSize.height || 40;
        const minX = HORIZONTAL_MARGIN;
        const maxX = Math.max(minX, screenW - HORIZONTAL_MARGIN - bw);
        const minY = TOP_MARGIN;
        const maxY = Math.max(minY, screenH - BOTTOM_MARGIN - bh);
        const curX = pan.x.__getValue ? pan.x.__getValue() : pan.x._value;
        const curY = pan.y.__getValue ? pan.y.__getValue() : pan.y._value;
        const clampedX = clampValue(curX, minX, maxX);
        const clampedY = clampValue(curY, minY, maxY);
        if (clampedX !== curX || clampedY !== curY) {
          Animated.timing(pan, {
            toValue: {
              x: clampedX,
              y: clampedY
            },
            duration: 180,
            useNativeDriver: false
          }).start(() => {
            setStorageValue(FLOATING_BUTTON_POSITION_KEY, {
              x: clampedX,
              y: clampedY
            });
          });
        }
      } catch (_e) {
        // ignore
      }
    };
    ensureInBounds();
    // also run on orientation change
    const sub = Dimensions.addEventListener?.("change", ensureInBounds);
    return () => sub?.remove?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPanReady, btnSize.width, btnSize.height]);

  /**
   * renderFloatingButton
   * Returns the draggable floating debug button (Animated + PanResponder).
   */
  const renderFloatingButton = () => /*#__PURE__*/React.createElement(Animated.View, _extends({
    style: {
      position: "absolute",
      transform: pan.getTranslateTransform(),
      zIndex: 9999
    },
    pointerEvents: "auto"
  }, panResponder.panHandlers), /*#__PURE__*/React.createElement(TouchableOpacity, {
    activeOpacity: 0.8,
    style: styles.floatingButton,
    testID: "network-monitor-debug-button",
    onPress: handleOpen,
    onLongPress: () => setShowFloatingButton(false),
    onLayout: e => setBtnSize({
      width: e.nativeEvent.layout.width,
      height: e.nativeEvent.layout.height
    })
  }, /*#__PURE__*/React.createElement(Text, {
    style: styles.floatingButtonText
  }, "DEBUG")));
  return /*#__PURE__*/React.createElement(View, {
    style: {
      flex: 1
    },
    onTouchEnd: handleClick
  }, /*#__PURE__*/React.createElement(View, {
    style: {
      flex: 1
    },
    pointerEvents: "box-none"
  }, children), /*#__PURE__*/React.createElement(Modal, {
    visible: showMonitor,
    animationType: "slide",
    supportedOrientations: ["landscape", "landscape-left", "landscape-right"]
  }, /*#__PURE__*/React.createElement(View, {
    style: {
      flex: 1
    },
    pointerEvents: "box-none"
  }, /*#__PURE__*/React.createElement(DebugMonitor, {
    envConfig: onEnvChange ? {
      currentEnv: isDemo ? "demo" : "prod",
      onEnvChange
    } : undefined,
    baseUrls: baseUrls,
    prodUrl: prodUrl,
    testUrl: testUrl,
    language: language,
    theme: theme,
    onClose: () => setShowMonitor(false),
    onBaseUrlChange: onBaseUrlChange,
    onExitDebugMode: () => setShowFloatingButton(false)
  }))), /*#__PURE__*/React.createElement(Modal, {
    transparent: true,
    visible: showPasswordModal,
    animationType: "fade",
    supportedOrientations: ["landscape", "landscape-left", "landscape-right"]
  }, /*#__PURE__*/React.createElement(View, {
    style: {
      flex: 1
    },
    pointerEvents: "box-none"
  }, /*#__PURE__*/React.createElement(TouchableWithoutFeedback, {
    onPress: () => setShowPasswordModal(false)
  }, /*#__PURE__*/React.createElement(View, {
    style: styles.overlay
  }, /*#__PURE__*/React.createElement(KeyboardAvoidingView, {
    behavior: Platform.OS === "ios" ? "padding" : "height",
    style: styles.keyboardView
  }, /*#__PURE__*/React.createElement(TouchableWithoutFeedback, {
    onPress: Keyboard.dismiss
  }, /*#__PURE__*/React.createElement(View, {
    style: [styles.modal, isLight && {
      backgroundColor: '#FFFFFF',
      borderColor: '#E2E8F0'
    }]
  }, /*#__PURE__*/React.createElement(Text, {
    style: [styles.title, isLight && {
      color: '#0F172A'
    }]
  }, t.login), /*#__PURE__*/React.createElement(Text, {
    style: [styles.subtitle, isLight && {
      color: '#64748B'
    }]
  }, t.clicks(clicksNeeded)), /*#__PURE__*/React.createElement(TextInput, {
    secureTextEntry: true,
    autoFocus: true,
    style: [styles.input, isLight && {
      backgroundColor: '#F8FAFC',
      borderColor: '#E2E8F0',
      color: '#0F172A'
    }],
    placeholder: t.passPlaceholder,
    placeholderTextColor: isLight ? '#94A3B8' : COLORS.textDim,
    value: inputPassword,
    onChangeText: setInputPassword,
    onSubmitEditing: handlePasswordSubmit
  }), /*#__PURE__*/React.createElement(View, {
    style: styles.actions
  }, /*#__PURE__*/React.createElement(TouchableOpacity, {
    style: styles.cancelBtn,
    onPress: () => setShowPasswordModal(false)
  }, /*#__PURE__*/React.createElement(Text, {
    style: styles.cancelText
  }, t.cancel)), /*#__PURE__*/React.createElement(TouchableOpacity, {
    style: styles.submitBtn,
    onPress: handlePasswordSubmit
  }, /*#__PURE__*/React.createElement(Text, {
    style: styles.submitText
  }, t.confirm)))))))))), !showMonitor && !showPasswordModal && showFloatingButton && isPanReady && renderFloatingButton());
};
//# sourceMappingURL=DebugTrigger.js.map