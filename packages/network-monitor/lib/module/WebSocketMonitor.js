import { Logger } from './Logger';
const OriginalWebSocket = typeof WebSocket !== 'undefined' ? WebSocket : null;
const addListener = (instance, event, handler) => {
  if (typeof instance.addEventListener === 'function') {
    try {
      instance.addEventListener(event, handler);
      return;
    } catch (_) {}
  }
  const propMap = {
    open: 'onopen',
    message: 'onmessage',
    close: 'onclose',
    error: 'onerror'
  };
  const prop = propMap[event];
  if (prop) {
    const existing = instance[prop];
    instance[prop] = existing ? (...args) => {
      existing.apply(instance, args);
      handler(...args);
    } : handler;
  }
};
export const setupWebSocketMonitor = () => {
  if (!OriginalWebSocket) return;
  if (global.__wsPatchedByDebugLogger) return;
  if (OriginalWebSocket.__wsPatchedByDebugLogger) return;
  const WS = OriginalWebSocket;
  const PatchedWebSocket = function (url, protocols) {
    const urlStr = typeof url === 'string' ? url : url.toString();
    const instance = typeof protocols !== 'undefined' ? new WS(url, protocols) : new WS(url);
    addListener(instance, 'open', () => {
      Logger.logWebSocket({
        url: urlStr,
        event: 'open',
        message: 'Connection opened'
      });
    });
    addListener(instance, 'message', event => {
      let data = event?.data ?? event;
      if (typeof data === 'string') {
        try {
          data = JSON.parse(data);
        } catch (_) {}
      }
      Logger.logWebSocket({
        url: urlStr,
        event: 'message',
        data,
        message: typeof data === 'string' ? data.substring(0, 200) : 'Message received'
      });
    });
    addListener(instance, 'close', event => {
      const code = event?.code ?? event;
      const reason = event?.reason ?? '';
      Logger.logWebSocket({
        url: urlStr,
        event: 'close',
        message: `Code: ${code}${reason ? `, Reason: ${reason}` : ''}`,
        status: code
      });
    });
    addListener(instance, 'error', () => {
      Logger.logWebSocket({
        url: urlStr,
        event: 'error',
        message: 'WebSocket error'
      });
    });
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
//# sourceMappingURL=WebSocketMonitor.js.map