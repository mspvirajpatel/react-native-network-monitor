import { Logger } from './Logger';

declare const global: any;

const OriginalWebSocket = typeof WebSocket !== 'undefined' ? WebSocket : null;

const addListener = (instance: any, event: string, handler: (...args: any[]) => void) => {
  if (typeof instance.addEventListener === 'function') {
    try {
      instance.addEventListener(event, handler);
      return;
    } catch (_) {}
  }
  const propMap: Record<string, string> = {
    open: 'onopen',
    message: 'onmessage',
    close: 'onclose',
    error: 'onerror',
  };
  const prop = propMap[event];
  if (prop) {
    const existing = instance[prop];
    instance[prop] = existing
      ? (...args: any[]) => { existing.apply(instance, args); handler(...args); }
      : handler;
  }
};

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

    addListener(instance, 'open', () => {
      Logger.logWebSocket({ url: urlStr, event: 'open', message: 'Connection opened' });
    });
    addListener(instance, 'message', (event: any) => {
      let data = event?.data ?? event;
      if (typeof data === 'string') {
        try { data = JSON.parse(data); } catch (_) {}
      }
      Logger.logWebSocket({
        url: urlStr,
        event: 'message',
        data,
        message: typeof data === 'string' ? data.substring(0, 200) : 'Message received',
      });
    });
    addListener(instance, 'close', (event: any) => {
      const code = event?.code ?? event;
      const reason = event?.reason ?? '';
      Logger.logWebSocket({
        url: urlStr,
        event: 'close',
        message: `Code: ${code}${reason ? `, Reason: ${reason}` : ''}`,
        status: code,
      });
    });
    addListener(instance, 'error', () => {
      Logger.logWebSocket({ url: urlStr, event: 'error', message: 'WebSocket error' });
    });

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
