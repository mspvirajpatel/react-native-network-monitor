"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.DebugTrigger = void 0;
var _react = _interopRequireWildcard(require("react"));
var _reactNative = require("react-native");
var _storage = require("./storage");
var _reactNativeSafeAreaContext = require("react-native-safe-area-context");
var _ConsoleMonitor = require("./ConsoleMonitor");
var _DebugMonitor = require("./DebugMonitor");
var _Logger = require("./Logger");
var _DebugContext = _interopRequireDefault(require("./DebugContext"));
var _NetworkMonitor = require("./NetworkMonitor");
var _WebSocketMonitor = require("./WebSocketMonitor");
var _PerformanceMonitor = require("./PerformanceMonitor");
var _ErrorBoundary = require("./ErrorBoundary");
var _PersistenceManager = require("./PersistenceManager");
var _translations = require("./translations");
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
function _interopRequireWildcard(e, t) { if ("function" == typeof WeakMap) var r = new WeakMap(), n = new WeakMap(); return (_interopRequireWildcard = function (e, t) { if (!t && e && e.__esModule) return e; var o, i, f = { __proto__: null, default: e }; if (null === e || "object" != typeof e && "function" != typeof e) return f; if (o = t ? n : r) { if (o.has(e)) return o.get(e); o.set(e, f); } for (const t in e) "default" !== t && {}.hasOwnProperty.call(e, t) && ((i = (o = Object.defineProperty) && Object.getOwnPropertyDescriptor(e, t)) && (i.get || i.set) ? o(f, t, i) : f[t] = e[t]); return f; })(e, t); }
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); } /* eslint-disable react-native/no-inline-styles */ /* eslint-disable react-hooks/exhaustive-deps */ /* eslint-disable @typescript-eslint/no-unused-vars */
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
const styles = _reactNative.StyleSheet.create({
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
const DebugTrigger = ({
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
  features: featuresProp
}) => {
  const systemScheme = (0, _reactNative.useColorScheme)();
  const insets = (0, _reactNativeSafeAreaContext.useSafeAreaInsets)();
  const safeM = {
    x: floatingButtonMargin + insets.right,
    y: floatingButtonMargin + insets.bottom,
    left: floatingButtonMargin + insets.left,
    top: floatingButtonMargin + insets.top
  };
  const effectiveTheme = theme === "auto" ? systemScheme === "light" ? "light" : "dark" : theme;
  const isLight = effectiveTheme === "light";
  const features = {
    network: true,
    console: true,
    websocket: true,
    errorBoundary: true,
    performance: true,
    persistence: true,
    ...featuresProp
  };
  const [clicks, setClicks] = (0, _react.useState)(0);
  const [showPasswordModal, setShowPasswordModal] = (0, _react.useState)(false);
  const [showMonitor, setShowMonitor] = (0, _react.useState)(false);
  const [showFloatingButton, setShowFloatingButton] = (0, _react.useState)(false);
  const [inputPassword, setInputPassword] = (0, _react.useState)("");
  const timerRef = (0, _react.useRef)(null);
  const activeLang = (0, _translations.resolveLanguage)(language);
  const t = _translations.TRANSLATIONS[activeLang] || _translations.TRANSLATIONS.en;
  const prevShowMonitor = (0, _react.useRef)(false);
  (0, _react.useEffect)(() => {
    if (showMonitor && !prevShowMonitor.current) {
      onOpen?.();
    }
    prevShowMonitor.current = showMonitor;
  }, [showMonitor, onOpen]);
  (0, _react.useEffect)(() => {
    if (features.network) (0, _NetworkMonitor.setupNetworkMonitor)(networkConfig);
    if (features.console) (0, _ConsoleMonitor.setupConsoleMonitor)();
    if (features.websocket) (0, _WebSocketMonitor.setupWebSocketMonitor)();
    if (features.errorBoundary) (0, _ErrorBoundary.setupGlobalErrorHandlers)();
    if (features.performance) (0, _PerformanceMonitor.startPerformanceMonitor)();
    if (features.persistence) (0, _PersistenceManager.startPersistence)(15000);
    (0, _PersistenceManager.restoreLogs)().then(savedLogs => {
      if (savedLogs.length > 0) {
        savedLogs.forEach(log => {
          if (log.message && !log.url) {
            _Logger.Logger.logInfo(log.message, log.requestData);
          }
        });
      }
    });
    if (!_Logger.Logger.getBaseUrl()) {
      const initialUrl = isDemo ? testUrl : prodUrl;
      if (initialUrl) {
        _Logger.Logger.setBaseUrl(initialUrl);
      } else if (baseUrls && baseUrls.length > 0) {
        const first = baseUrls[0];
        const url = typeof first === "string" ? first : first?.url;
        _Logger.Logger.setBaseUrl(url ?? "");
      }
    }
  }, []);
  (0, _react.useEffect)(() => {
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
      const isInstallAuthenticated = await (0, _storage.getStorageValue)("networkMonitorAuthenticated", false);
      if (isInstallAuthenticated) {
        setShowMonitor(true);
        setShowFloatingButton(true);
        return;
      }
    }
    savedPos.current = {
      x: posRef.current.x,
      y: posRef.current.y
    };
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
        (0, _storage.setStorageValue)("networkMonitorAuthenticated", true);
      }
      setShowPasswordModal(false);
      setShowMonitor(true);
      setShowFloatingButton(true);
      setInputPassword("");
    } else {
      _reactNative.Alert.alert(t.error, t.wrongPass);
      setInputPassword("");
    }
  };
  const BTN_STORAGE_KEY = "networkMonitorBtnPos";
  const {
    width: initW,
    height: initH
  } = _reactNative.Dimensions.get("window");
  const initBtnW = 60;
  const initBtnH = 40;
  const initX = Math.max(safeM.left, Math.min(initW - initBtnW - safeM.x, initW - 80 - insets.right));
  const initY = Math.max(safeM.top, Math.min(initH - initBtnH - safeM.y, initH * 0.5));
  const btnX = (0, _react.useRef)(new _reactNative.Animated.Value(initX)).current;
  const btnY = (0, _react.useRef)(new _reactNative.Animated.Value(initY)).current;
  const [btnSize, setBtnSize] = (0, _react.useState)({
    w: 60,
    h: 40
  });
  const [btnHidden, setBtnHidden] = (0, _react.useState)(false);
  const inactivityTimer = (0, _react.useRef)(null);
  const posRef = (0, _react.useRef)({
    x: initX,
    y: initY
  });
  const gestureRef = (0, _react.useRef)({
    x: 0,
    y: 0
  });
  const savedPos = (0, _react.useRef)({
    x: initX,
    y: initY
  });
  const clampPosition = (x, y, bw, bh) => {
    const {
      width: sw,
      height: sh
    } = _reactNative.Dimensions.get("window");
    return {
      x: Math.max(safeM.left, Math.min(sw - bw - safeM.x, x)),
      y: Math.max(safeM.top, Math.min(sh - bh - safeM.y, y))
    };
  };
  (0, _react.useEffect)(() => {
    if (showFloatingButton) {
      setBtnHidden(false);
      if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
      inactivityTimer.current = setTimeout(() => setBtnHidden(true), 8000);
    } else {
      if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
      setBtnHidden(false);
    }
    return () => {
      if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
    };
  }, [showFloatingButton]);
  (0, _react.useEffect)(() => {
    (async () => {
      const saved = await (0, _storage.getStorageValue)(BTN_STORAGE_KEY, null);
      if (!saved) return;
      const {
        width: sw,
        height: sh
      } = _reactNative.Dimensions.get("window");
      const dx = saved.x ?? sw - 80;
      const dy = saved.y ?? sh * 0.5;
      const clamped = clampPosition(dx, dy, btnSize.w, btnSize.h);
      posRef.current = {
        x: clamped.x,
        y: clamped.y
      };
      btnX.setValue(clamped.x);
      btnY.setValue(clamped.y);
    })();
  }, []);
  const snapToEdge = (x, y, anim) => {
    const {
      width: sw
    } = _reactNative.Dimensions.get("window");
    const bw = btnSize.w;
    const bh = btnSize.h;
    const clamped = clampPosition(x, y, bw, bh);
    const leftDist = clamped.x - safeM.left;
    const rightDist = sw - clamped.x - bw - safeM.x;
    const snapX = leftDist < rightDist ? safeM.left : sw - bw - safeM.x;
    posRef.current = {
      x: snapX,
      y: clamped.y
    };
    if (anim) {
      _reactNative.Animated.spring(btnX, {
        toValue: snapX,
        useNativeDriver: false,
        friction: 7,
        tension: 40
      }).start();
      _reactNative.Animated.spring(btnY, {
        toValue: clamped.y,
        useNativeDriver: false,
        friction: 7,
        tension: 40
      }).start();
    } else {
      btnX.setValue(snapX);
      btnY.setValue(clamped.y);
    }
    (0, _storage.setStorageValue)(BTN_STORAGE_KEY, {
      x: snapX,
      y: clamped.y
    });
  };
  const snapToEdgeOnResize = () => {
    const {
      width: sw,
      height: sh
    } = _reactNative.Dimensions.get("window");
    const bw = btnSize.w;
    const bh = btnSize.h;
    const clamped = clampPosition(posRef.current.x, posRef.current.y, bw, bh);
    const leftDist = clamped.x - safeM.left;
    const rightDist = sw - clamped.x - bw - safeM.x;
    const snapX = leftDist < rightDist ? safeM.left : sw - bw - safeM.x;
    const finalPos = {
      x: snapX,
      y: clamped.y
    };
    posRef.current = finalPos;
    btnX.setValue(snapX);
    btnY.setValue(clamped.y);
    (0, _storage.setStorageValue)(BTN_STORAGE_KEY, finalPos);
  };
  const panResponder = (0, _react.useRef)(_reactNative.PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > 2 || Math.abs(g.dy) > 2,
    onPanResponderGrant: () => {
      gestureRef.current = {
        x: posRef.current.x,
        y: posRef.current.y
      };
      setBtnHidden(false);
      if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
    },
    onPanResponderMove: (_, g) => {
      const nx = gestureRef.current.x + g.dx;
      const ny = gestureRef.current.y + g.dy;
      const clamped = clampPosition(nx, ny, btnSize.w, btnSize.h);
      posRef.current = {
        x: clamped.x,
        y: clamped.y
      };
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
    }
  })).current;
  (0, _react.useEffect)(() => {
    const sub = _reactNative.Dimensions.addEventListener?.("change", snapToEdgeOnResize);
    return () => sub?.remove?.();
  }, [btnSize]);
  (0, _react.useEffect)(() => {
    if (!showPasswordModal) {
      btnX.stopAnimation();
      btnY.stopAnimation();
      btnX.setValue(savedPos.current.x);
      btnY.setValue(savedPos.current.y);
    }
  }, [showPasswordModal]);
  const handleCloseDebugger = () => {
    setShowMonitor(false);
    setShowFloatingButton(false);
  };
  const showBtn = showFloatingButton;
  const ctxValue = {
    openDebugger: handleOpen,
    closeDebugger: handleCloseDebugger,
    isDebuggerOpen: showMonitor
  };
  return /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    style: {
      flex: 1
    },
    onTouchEnd: enableTapGesture ? handleClick : undefined
  }, /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    style: {
      flex: 1
    },
    pointerEvents: "box-none"
  }, /*#__PURE__*/_react.default.createElement(_ErrorBoundary.ErrorBoundary, null, /*#__PURE__*/_react.default.createElement(_DebugContext.default.Provider, {
    value: ctxValue
  }, children))), /*#__PURE__*/_react.default.createElement(_reactNative.Modal, {
    transparent: true,
    visible: showMonitor,
    animationType: "slide",
    supportedOrientations: ["landscape", "landscape-left", "landscape-right"]
  }, /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    style: {
      flex: 1
    },
    pointerEvents: "box-none"
  }, /*#__PURE__*/_react.default.createElement(_DebugMonitor.DebugMonitor, {
    envConfig: onEnvChange ? {
      currentEnv: isDemo ? "demo" : "prod",
      onEnvChange
    } : undefined,
    baseUrls: baseUrls,
    prodUrl: prodUrl,
    testUrl: testUrl,
    language: language,
    theme: theme,
    colors: customColors,
    features: features,
    onClose: () => {
      setShowMonitor(false);
      onCloseProp?.();
    },
    onBaseUrlChange: onBaseUrlChange,
    onExitDebugMode: () => setShowFloatingButton(false)
  }))), /*#__PURE__*/_react.default.createElement(_reactNative.Modal, {
    transparent: true,
    visible: showPasswordModal,
    animationType: "fade",
    supportedOrientations: ["landscape", "landscape-left", "landscape-right"]
  }, /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    style: {
      flex: 1
    },
    pointerEvents: "box-none"
  }, /*#__PURE__*/_react.default.createElement(_reactNative.TouchableWithoutFeedback, {
    onPress: () => setShowPasswordModal(false)
  }, /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    style: styles.overlay
  }, /*#__PURE__*/_react.default.createElement(_reactNative.KeyboardAvoidingView, {
    behavior: _reactNative.Platform.OS === "ios" ? "padding" : "height",
    style: styles.keyboardView
  }, /*#__PURE__*/_react.default.createElement(_reactNative.TouchableWithoutFeedback, {
    onPress: _reactNative.Keyboard.dismiss
  }, /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    style: [styles.modal, isLight && {
      backgroundColor: '#FFFFFF',
      borderColor: '#E2E8F0'
    }]
  }, /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: [styles.title, isLight && {
      color: '#0F172A'
    }]
  }, t.login), /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: [styles.subtitle, isLight && {
      color: '#64748B'
    }]
  }, t.clicks(clicksNeeded)), /*#__PURE__*/_react.default.createElement(_reactNative.TextInput, {
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
  }), /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    style: styles.actions
  }, /*#__PURE__*/_react.default.createElement(_reactNative.TouchableOpacity, {
    style: styles.cancelBtn,
    onPress: () => setShowPasswordModal(false)
  }, /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: styles.cancelText
  }, t.cancel)), /*#__PURE__*/_react.default.createElement(_reactNative.TouchableOpacity, {
    style: styles.submitBtn,
    onPress: handlePasswordSubmit
  }, /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: styles.submitText
  }, t.confirm)))))))))), /*#__PURE__*/_react.default.createElement(_reactNative.Animated.View, {
    pointerEvents: showBtn && !showMonitor && !showPasswordModal ? 'box-none' : 'none',
    style: {
      position: "absolute",
      left: 0,
      right: 0,
      top: 0,
      bottom: 0,
      zIndex: 99999,
      opacity: showBtn && !showMonitor && !showPasswordModal ? 1 : 0
    }
  }, /*#__PURE__*/_react.default.createElement(_reactNative.Animated.View, _extends({
    style: {
      position: "absolute",
      transform: [{
        translateX: btnX
      }, {
        translateY: btnY
      }]
    }
  }, panResponder.panHandlers), /*#__PURE__*/_react.default.createElement(_reactNative.TouchableOpacity, {
    activeOpacity: 0.85,
    style: [styles.floatingButton, {
      opacity: btnHidden ? 0.35 : 1
    }],
    testID: "network-monitor-debug-button",
    onPress: handleOpen,
    onLongPress: () => setShowFloatingButton(false),
    onLayout: e => setBtnSize({
      w: e.nativeEvent.layout.width,
      h: e.nativeEvent.layout.height
    })
  }, floatingButtonContent || /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: styles.floatingButtonText
  }, t.debug)))));
};
exports.DebugTrigger = DebugTrigger;
//# sourceMappingURL=DebugTrigger.js.map