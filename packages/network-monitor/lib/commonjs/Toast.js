"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.useToast = useToast;
var _react = _interopRequireWildcard(require("react"));
var _reactNative = require("react-native");
var _reactNativeSafeAreaContext = require("react-native-safe-area-context");
function _interopRequireWildcard(e, t) { if ("function" == typeof WeakMap) var r = new WeakMap(), n = new WeakMap(); return (_interopRequireWildcard = function (e, t) { if (!t && e && e.__esModule) return e; var o, i, f = { __proto__: null, default: e }; if (null === e || "object" != typeof e && "function" != typeof e) return f; if (o = t ? n : r) { if (o.has(e)) return o.get(e); o.set(e, f); } for (const t in e) "default" !== t && {}.hasOwnProperty.call(e, t) && ((i = (o = Object.defineProperty) && Object.getOwnPropertyDescriptor(e, t)) && (i.get || i.set) ? o(f, t, i) : f[t] = e[t]); return f; })(e, t); }
/**
 * useToast
 *
 * Hook that returns a `showToast` function and the toast state to render.
 * Render the returned `toastState.tsx` component in your view tree.
 *
 * @returns { showToast, toastState }
 *   - showToast(msg, type) – call from anywhere to show a toast
 *   - toastState: { ToastComponent, Toasts } – render `<Toasts />` in the tree
 */
function useToast() {
  const [toasts, setToasts] = (0, _react.useState)([]);
  const nextId = (0, _react.useRef)(0);
  const showToast = (0, _react.useCallback)((message, type = 'info') => {
    const id = nextId.current++;
    setToasts(prev => [...prev, {
      id,
      message,
      type
    }]);
  }, []);
  const removeToast = (0, _react.useCallback)(id => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);
  const Toasts = _react.default.useMemo(() => /*#__PURE__*/_react.default.createElement(ToastContainer, {
    toasts: toasts,
    onDismiss: removeToast
  }), [toasts, removeToast]);
  return {
    showToast,
    Toasts
  };
}

/* ------------------------------------------------------------------ */
/*  Internal                                                          */
/* ------------------------------------------------------------------ */

const TOAST_DURATION = 2500;
const TOAST_BOTTOM_OFFSET = 80;
const typeColors = {
  error: {
    bg: '#EF4444',
    text: '#FFFFFF'
  },
  success: {
    bg: '#22C55E',
    text: '#FFFFFF'
  },
  info: {
    bg: '#3B82F6',
    text: '#FFFFFF'
  }
};
const ToastContainer = /*#__PURE__*/_react.default.memo(({
  toasts,
  onDismiss
}) => {
  const insets = (0, _reactNativeSafeAreaContext.useSafeAreaInsets)();
  return /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    pointerEvents: "box-none",
    style: [styles.container, {
      bottom: insets.bottom + TOAST_BOTTOM_OFFSET
    }]
  }, toasts.map(t => /*#__PURE__*/_react.default.createElement(ToastItemView, {
    key: t.id,
    toast: t,
    onDismiss: onDismiss
  })));
});
const ToastItemView = /*#__PURE__*/_react.default.memo(({
  toast,
  onDismiss
}) => {
  const opacity = (0, _react.useRef)(new _reactNative.Animated.Value(0)).current;
  const translateY = (0, _react.useRef)(new _reactNative.Animated.Value(30)).current;
  const colors = typeColors[toast.type];
  (0, _react.useEffect)(() => {
    _reactNative.Animated.parallel([_reactNative.Animated.timing(opacity, {
      toValue: 1,
      duration: 200,
      useNativeDriver: true
    }), _reactNative.Animated.timing(translateY, {
      toValue: 0,
      duration: 250,
      useNativeDriver: true
    })]).start();
    const timer = setTimeout(() => {
      _reactNative.Animated.parallel([_reactNative.Animated.timing(opacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true
      }), _reactNative.Animated.timing(translateY, {
        toValue: -20,
        duration: 200,
        useNativeDriver: true
      })]).start(() => onDismiss(toast.id));
    }, TOAST_DURATION);
    return () => clearTimeout(timer);
  }, [toast.id, opacity, translateY, onDismiss]);
  return /*#__PURE__*/_react.default.createElement(_reactNative.Animated.View, {
    style: [styles.toast, {
      backgroundColor: colors.bg,
      opacity,
      transform: [{
        translateY
      }]
    }]
  }, /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: [styles.toastText, {
      color: colors.text
    }],
    numberOfLines: 2
  }, toast.message), /*#__PURE__*/_react.default.createElement(_reactNative.TouchableOpacity, {
    onPress: () => onDismiss(toast.id),
    hitSlop: {
      top: 8,
      bottom: 8,
      left: 8,
      right: 8
    }
  }, /*#__PURE__*/_react.default.createElement(_reactNative.Text, {
    style: [styles.dismissBtn, {
      color: colors.text
    }]
  }, "\u2715")));
});
const styles = _reactNative.StyleSheet.create({
  container: {
    position: 'absolute',
    left: 16,
    right: 16,
    alignItems: 'stretch',
    zIndex: 9999
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginTop: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4
    },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6
  },
  toastText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    marginRight: 8
  },
  dismissBtn: {
    fontSize: 16,
    fontWeight: '700',
    opacity: 0.9
  }
});
//# sourceMappingURL=Toast.js.map