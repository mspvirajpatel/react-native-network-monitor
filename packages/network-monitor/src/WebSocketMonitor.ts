import { Logger } from './Logger';

declare const global: any;

const OriginalWebSocket = typeof WebSocket !== 'undefined' ? WebSocket : null;

export const setupWebSocketMonitor = () => {
  if (!OriginalWebSocket) return;

  if (global.__wsPatchedByDebugLogger) return;
  if ((OriginalWebSocket as any).__wsPatchedByDebugLogger) return;

  const WS: any = OriginalWebSocket;

  const PatchedWebSocket = function (this: any, url: string | URL, protocols?: string | string[]) {
    const urlStr = typeof url === 'string' ? url : url.toString();
    const instance = typeof protocols !== 'undefined'
      ? new WS(url, protocols)
      : new WS(url);

    const origOnOpen = instance.onopen;
    const origOnMessage = instance.onmessage;
    const origOnClose = instance.onclose;
    const origOnError = instance.onerror;

    instance.onopen = function (...args: any[]) {
      Logger.logWebSocket({ url: urlStr, event: 'open', message: 'Connection opened' });
      if (origOnOpen) origOnOpen.apply(instance, args);
    };

    instance.onmessage = function (event: any) {
      let data = event.data;
      if (typeof data === 'string') {
        try { data = JSON.parse(data); } catch (_) {}
      }
      Logger.logWebSocket({
        url: urlStr,
        event: 'message',
        data,
        message: typeof data === 'string' ? data.substring(0, 200) : 'Message received',
      });
      if (origOnMessage) origOnMessage.call(instance, event);
    };

    instance.onclose = function (event: any) {
      Logger.logWebSocket({
        url: urlStr,
        event: 'close',
        message: `Code: ${event.code}${event.reason ? `, Reason: ${event.reason}` : ''}`,
        status: event.code,
      });
      if (origOnClose) origOnClose.call(instance, event);
    };

    instance.onerror = function (...args: any[]) {
      Logger.logWebSocket({ url: urlStr, event: 'error', message: 'WebSocket error' });
      if (origOnError) origOnError.apply(instance, args);
    };

    return instance;
  } as any;

  PatchedWebSocket.prototype = WS.prototype;
  PatchedWebSocket.CONNECTING = WS.CONNECTING;
  PatchedWebSocket.OPEN = WS.OPEN;
  PatchedWebSocket.CLOSING = WS.CLOSING;
  PatchedWebSocket.CLOSED = WS.CLOSED;

  (PatchedWebSocket as any).__wsPatchedByDebugLogger = true;
  global.__wsPatchedByDebugLogger = true;

  if (typeof global !== 'undefined') {
    global.WebSocket = PatchedWebSocket;
  }
};
