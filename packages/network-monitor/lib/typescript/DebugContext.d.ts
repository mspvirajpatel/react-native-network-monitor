import React from 'react';
export interface DebugContextValue {
    openDebugger: () => void;
    closeDebugger: () => void;
    isDebuggerOpen: boolean;
}
declare const DebugContext: React.Context<DebugContextValue>;
export declare const useDebugger: () => DebugContextValue;
export default DebugContext;
//# sourceMappingURL=DebugContext.d.ts.map