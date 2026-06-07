import React from 'react';
export type ToastType = 'error' | 'success' | 'info';
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
export declare function useToast(): {
    showToast: (message: string, type?: ToastType) => void;
    Toasts: React.JSX.Element;
};
//# sourceMappingURL=Toast.d.ts.map