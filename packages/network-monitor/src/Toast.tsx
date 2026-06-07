import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  Animated,
  Text,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export type ToastType = 'error' | 'success' | 'info';
type ToastItem = { id: number; message: string; type: ToastType };

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
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const nextId = useRef(0);

  const showToast = useCallback((message: string, type: ToastType = 'info') => {
    const id = nextId.current++;
    setToasts((prev) => [...prev, { id, message, type }]);
  }, []);

  const removeToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const Toasts = React.useMemo(
    () => (
      <ToastContainer toasts={toasts} onDismiss={removeToast} />
    ),
    [toasts, removeToast],
  );

  return { showToast, Toasts };
}

/* ------------------------------------------------------------------ */
/*  Internal                                                          */
/* ------------------------------------------------------------------ */

const TOAST_DURATION = 2500;
const TOAST_BOTTOM_OFFSET = 80;

const typeColors: Record<ToastType, { bg: string; text: string }> = {
  error: { bg: '#EF4444', text: '#FFFFFF' },
  success: { bg: '#22C55E', text: '#FFFFFF' },
  info: { bg: '#3B82F6', text: '#FFFFFF' },
};

const ToastContainer = React.memo(
  ({ toasts, onDismiss }: { toasts: ToastItem[]; onDismiss: (id: number) => void }) => {
    const insets = useSafeAreaInsets();

    return (
      <View
        pointerEvents="box-none"
        style={[
          styles.container,
          { bottom: insets.bottom + TOAST_BOTTOM_OFFSET },
        ]}
      >
        {toasts.map((t) => (
          <ToastItemView key={t.id} toast={t} onDismiss={onDismiss} />
        ))}
      </View>
    );
  },
);

const ToastItemView = React.memo(
  ({ toast, onDismiss }: { toast: ToastItem; onDismiss: (id: number) => void }) => {
    const opacity = useRef(new Animated.Value(0)).current;
    const translateY = useRef(new Animated.Value(30)).current;
    const colors = typeColors[toast.type];

    useEffect(() => {
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();

      const timer = setTimeout(() => {
        Animated.parallel([
          Animated.timing(opacity, {
            toValue: 0,
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.timing(translateY, {
            toValue: -20,
            duration: 200,
            useNativeDriver: true,
          }),
        ]).start(() => onDismiss(toast.id));
      }, TOAST_DURATION);

      return () => clearTimeout(timer);
    }, [toast.id, opacity, translateY, onDismiss]);

    return (
      <Animated.View
        style={[
          styles.toast,
          {
            backgroundColor: colors.bg,
            opacity,
            transform: [{ translateY }],
          },
        ]}
      >
        <Text style={[styles.toastText, { color: colors.text }]} numberOfLines={2}>
          {toast.message}
        </Text>
        <TouchableOpacity
          onPress={() => onDismiss(toast.id)}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text style={[styles.dismissBtn, { color: colors.text }]}>✕</Text>
        </TouchableOpacity>
      </Animated.View>
    );
  },
);

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 16,
    right: 16,
    alignItems: 'stretch',
    zIndex: 9999,
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
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  toastText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    marginRight: 8,
  },
  dismissBtn: {
    fontSize: 16,
    fontWeight: '700',
    opacity: 0.9,
  },
});
