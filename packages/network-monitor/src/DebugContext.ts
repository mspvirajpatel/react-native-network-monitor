import React, { createContext, useContext, useRef, useCallback } from 'react';

export interface DebugContextValue {
  openDebugger: () => void;
  closeDebugger: () => void;
  isDebuggerOpen: boolean;
  /** Register a cleanup function to run when the debugger closes */
  addCloseCleanup: (fn: () => void) => () => void;
  /** Run all registered cleanup functions */
  cleanupOnClose: () => void;
}

const DebugContext = createContext<DebugContextValue>({
  openDebugger: () => {},
  closeDebugger: () => {},
  isDebuggerOpen: false,
  addCloseCleanup: () => () => {},
  cleanupOnClose: () => {},
});

export const useDebugger = (): DebugContextValue => {
  const ctx = useContext(DebugContext);
  if (!ctx) {
    console.warn(
      'useDebugger must be used within a <DebugTrigger> component. ' +
      'Wrap your app root with <DebugTrigger> to use this hook.'
    );
  }
  return ctx;
};

export default DebugContext;
