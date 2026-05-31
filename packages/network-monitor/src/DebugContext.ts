import React, { createContext, useContext } from 'react';

export interface DebugContextValue {
  openDebugger: () => void;
  closeDebugger: () => void;
  isDebuggerOpen: boolean;
}

const DebugContext = createContext<DebugContextValue>({
  openDebugger: () => {},
  closeDebugger: () => {},
  isDebuggerOpen: false,
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
