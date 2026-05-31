import { createContext, useContext } from 'react';
const DebugContext = /*#__PURE__*/createContext({
  openDebugger: () => {},
  closeDebugger: () => {},
  isDebuggerOpen: false
});
export const useDebugger = () => {
  const ctx = useContext(DebugContext);
  if (!ctx) {
    console.warn('useDebugger must be used within a <DebugTrigger> component. ' + 'Wrap your app root with <DebugTrigger> to use this hook.');
  }
  return ctx;
};
export default DebugContext;
//# sourceMappingURL=DebugContext.js.map