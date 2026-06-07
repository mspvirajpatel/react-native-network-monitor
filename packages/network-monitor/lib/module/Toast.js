import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Animated, Text, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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
export function useToast() {
  const [toasts, setToasts] = useState([]);
  const nextId = useRef(0);
  const showToast = useCallback((message, type = 'info') => {
    const id = nextId.current++;
    setToasts(prev => [...prev, {
      id,
      message,
      type
    }]);
  }, []);
  const removeToast = useCallback(id => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);
  const Toasts = React.useMemo(() => /*#__PURE__*/React.createElement(ToastContainer, {
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
const ToastContainer = /*#__PURE__*/React.memo(({
  toasts,
  onDismiss
}) => {
  const insets = useSafeAreaInsets();
  return /*#__PURE__*/React.createElement(View, {
    pointerEvents: "box-none",
    style: [styles.container, {
      bottom: insets.bottom + TOAST_BOTTOM_OFFSET
    }]
  }, toasts.map(t => /*#__PURE__*/React.createElement(ToastItemView, {
    key: t.id,
    toast: t,
    onDismiss: onDismiss
  })));
});
const ToastItemView = /*#__PURE__*/React.memo(({
  toast,
  onDismiss
}) => {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(30)).current;
  const colors = typeColors[toast.type];
  useEffect(() => {
    Animated.parallel([Animated.timing(opacity, {
      toValue: 1,
      duration: 200,
      useNativeDriver: true
    }), Animated.timing(translateY, {
      toValue: 0,
      duration: 250,
      useNativeDriver: true
    })]).start();
    const timer = setTimeout(() => {
      Animated.parallel([Animated.timing(opacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true
      }), Animated.timing(translateY, {
        toValue: -20,
        duration: 200,
        useNativeDriver: true
      })]).start(() => onDismiss(toast.id));
    }, TOAST_DURATION);
    return () => clearTimeout(timer);
  }, [toast.id, opacity, translateY, onDismiss]);
  return /*#__PURE__*/React.createElement(Animated.View, {
    style: [styles.toast, {
      backgroundColor: colors.bg,
      opacity,
      transform: [{
        translateY
      }]
    }]
  }, /*#__PURE__*/React.createElement(Text, {
    style: [styles.toastText, {
      color: colors.text
    }],
    numberOfLines: 2
  }, toast.message), /*#__PURE__*/React.createElement(TouchableOpacity, {
    onPress: () => onDismiss(toast.id),
    hitSlop: {
      top: 8,
      bottom: 8,
      left: 8,
      right: 8
    }
  }, /*#__PURE__*/React.createElement(Text, {
    style: [styles.dismissBtn, {
      color: colors.text
    }]
  }, "\u2715")));
});
const styles = StyleSheet.create({
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