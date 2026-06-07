"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _react = _interopRequireWildcard(require("react"));
var _reactNative = require("react-native");
function _interopRequireWildcard(e, t) { if ("function" == typeof WeakMap) var r = new WeakMap(), n = new WeakMap(); return (_interopRequireWildcard = function (e, t) { if (!t && e && e.__esModule) return e; var o, i, f = { __proto__: null, default: e }; if (null === e || "object" != typeof e && "function" != typeof e) return f; if (o = t ? n : r) { if (o.has(e)) return o.get(e); o.set(e, f); } for (const t in e) "default" !== t && {}.hasOwnProperty.call(e, t) && ((i = (o = Object.defineProperty) && Object.getOwnPropertyDescriptor(e, t)) && (i.get || i.set) ? o(f, t, i) : f[t] = e[t]); return f; })(e, t); }
/**
 * LogItemAnimated
 *
 * Wraps children with a fade + slide-up animation on mount.
 * Used by FlatList items and other log entry views.
 */
const LogItemAnimated = ({
  children,
  index
}) => {
  const opacity = (0, _react.useRef)(new _reactNative.Animated.Value(0)).current;
  const translateY = (0, _react.useRef)(new _reactNative.Animated.Value(12)).current;
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
  }, [opacity, translateY]);
  return /*#__PURE__*/_react.default.createElement(_reactNative.Animated.View, {
    style: {
      opacity,
      transform: [{
        translateY
      }]
    }
  }, children);
};
var _default = exports.default = LogItemAnimated;
//# sourceMappingURL=LogItemAnimated.js.map