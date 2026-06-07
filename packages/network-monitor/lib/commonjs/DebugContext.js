"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.useDebugger = exports.default = void 0;
var _react = require("react");
const DebugContext = /*#__PURE__*/(0, _react.createContext)({
  openDebugger: () => {},
  closeDebugger: () => {},
  isDebuggerOpen: false,
  addCloseCleanup: () => () => {},
  cleanupOnClose: () => {}
});
const useDebugger = () => {
  const ctx = (0, _react.useContext)(DebugContext);
  if (!ctx) {
    console.warn('useDebugger must be used within a <DebugTrigger> component. ' + 'Wrap your app root with <DebugTrigger> to use this hook.');
  }
  return ctx;
};
exports.useDebugger = useDebugger;
var _default = exports.default = DebugContext;
//# sourceMappingURL=DebugContext.js.map