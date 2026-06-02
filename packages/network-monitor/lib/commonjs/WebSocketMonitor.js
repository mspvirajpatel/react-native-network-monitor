"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.setupWebSocketMonitor = void 0;
var _Logger = require("./Logger");
const OriginalWebSocket = typeof WebSocket !== 'undefined' ? WebSocket : null;
const setupWebSocketMonitor = () => {
  if (!OriginalWebSocket) return;
  if (global.__wsPatchedByDebugLogger) return;
  if (OriginalWebSocket.__wsPatchedByDebugLogger) return;
  const WS = OriginalWebSocket;
  const PatchedWebSocket = function (url, protocols) {
    const urlStr = typeof url === 'string' ? url : url.toString();
    const instance = typeof protocols !== 'undefined' ? new WS(url, protocols) : new WS(url);
    try {
      instance.addEventListener?.('open', () => {
        _Logger.Logger.logWebSocket({
          url: urlStr,
          event: 'open',
          message: 'Connection opened'
        });
      });
    } catch (_) {}
    try {
      instance.addEventListener?.('message', event => {
        let data = event?.data;
        if (typeof data === 'string') {
          try {
            data = JSON.parse(data);
          } catch (_) {}
        }
        _Logger.Logger.logWebSocket({
          url: urlStr,
          event: 'message',
          data,
          message: typeof data === 'string' ? data.substring(0, 200) : 'Message received'
        });
      });
    } catch (_) {}
    try {
      instance.addEventListener?.('close', event => {
        _Logger.Logger.logWebSocket({
          url: urlStr,
          event: 'close',
          message: `Code: ${event?.code}${event?.reason ? `, Reason: ${event.reason}` : ''}`,
          status: event?.code
        });
      });
    } catch (_) {}
    try {
      instance.addEventListener?.('error', () => {
        _Logger.Logger.logWebSocket({
          url: urlStr,
          event: 'error',
          message: 'WebSocket error'
        });
      });
    } catch (_) {}
    return instance;
  };
  PatchedWebSocket.prototype = WS.prototype;
  PatchedWebSocket.CONNECTING = WS.CONNECTING;
  PatchedWebSocket.OPEN = WS.OPEN;
  PatchedWebSocket.CLOSING = WS.CLOSING;
  PatchedWebSocket.CLOSED = WS.CLOSED;
  PatchedWebSocket.__wsPatchedByDebugLogger = true;
  global.__wsPatchedByDebugLogger = true;
  if (typeof global !== 'undefined') {
    global.WebSocket = PatchedWebSocket;
  }
};
exports.setupWebSocketMonitor = setupWebSocketMonitor;
//# sourceMappingURL=WebSocketMonitor.js.map