import React from 'react';
export interface DebugContextValue {
    openDebugger: () => void;
    closeDebugger: () => void;
    isDebuggerOpen: boolean;
    /** Register a cleanup function to run when the debugger closes */
    addCloseCleanup: (fn: () => void) => () => void;
    /** Run all registered cleanup functions */
    cleanupOnClose: () => void;
}
declare const DebugContext: React.Context<DebugContextValue>;
export declare const useDebugger: () => DebugContextValue;
export default DebugContext;
//# sourceMappingURL=DebugContext.d.ts.map