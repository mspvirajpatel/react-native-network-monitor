 /* eslint-disable no-unused-vars */
 /* eslint-disable @typescript-eslint/no-unused-vars */
 import { Logger } from './Logger';

 declare const window: any;
 declare const global: any;

 const getGlobalFetch = (): any => {
   if (typeof window !== 'undefined' && window.fetch) {
     return window.fetch.bind(window);
   }
   if (typeof global !== 'undefined' && (global as any).fetch) {
     return (global as any).fetch.bind(global);
   }
   return undefined;
 };

 const getGlobalXMLHttpRequest = (): any => {
   if (typeof window !== 'undefined' && (window as any).XMLHttpRequest) {
     return (window as any).XMLHttpRequest;
   }
   if (typeof global !== 'undefined' && (global as any).XMLHttpRequest) {
     return (global as any).XMLHttpRequest;
   }
   return XMLHttpRequest;
 };

export const isInternalUrl = (originalUrl: string): boolean => {
  return (
    originalUrl.includes('localhost:8081') ||
    originalUrl.includes('10.0.2.2:8081') ||
    originalUrl.includes('127.0.0.1') ||
    originalUrl.includes('/symbolicate') ||
    originalUrl.includes('.bundle') ||
    originalUrl.includes('.hot-update')
  );
};

/**
 * getRedirectedUrl
 *
 * Compute a redirected URL based on the configured debug `baseUrl` while
 * excluding internal development/system requests.
 *
 * @param originalUrl - The original request URL
 * @returns The possibly redirected URL string
 */
const getRedirectedUrl = (originalUrl: string): string => {
  const baseUrl = Logger.getBaseUrl();
  if (!baseUrl) return originalUrl;

  if (isInternalUrl(originalUrl)) return originalUrl;

  try {
    if (originalUrl.startsWith('/')) {
      const base = new URL(baseUrl);
      return base.origin + originalUrl;
    }

    const original = new URL(originalUrl);
    const replacement = new URL(baseUrl);

    return originalUrl.replace(original.origin, replacement.origin);
  } catch (e) {
    return originalUrl;
  }
};

/**
 * Export for testing.
 */
export { getRedirectedUrl };

/**
 * setupNetworkMonitor
 *
 * Patches `window.fetch` and `XMLHttpRequest` to capture network requests
 * and responses then forward them to the debug `Logger`.
 *
 * Note: This mutates global browser/JS runtime network methods and should
 * only be called once during app initialization.
 */
export const setupNetworkMonitor = (): void => {
  if (Logger.isNetworkPatched) return;
  Logger.isNetworkPatched = true;

  const globalFetch = getGlobalFetch();
  if (globalFetch) {
    const originalFetch = globalFetch;
    const patchedFetch = async (...args: any[]) => {
      let url = '';
      let method = 'GET';
      let body = null;
      let headers = {};

      try {
        const input = args[0];
        const init = args[1];

        if (typeof input === 'string') {
          url = input;
        } else if (input instanceof URL) {
          url = input.toString();
        } else if (input && typeof input === 'object' && 'url' in input) {
          url = (input as any).url;
          method = (input as any).method || method;
          body = (input as any).body || body;
          headers = (input as any).headers || headers;
        }

        if (init) {
          method = (init.method || method || '').toUpperCase();
          body = init.body || body;
          headers = init.headers || headers;
        }
        if (typeof body === 'string') {
          try {
            body = JSON.parse(body);
          } catch (_) {}
        }
      } catch (e) {
        url = 'Unknown URL';
      }

      const redirectedUrl = getRedirectedUrl(url);
      const newArgs = [...args];
      if (typeof newArgs[0] === 'string') {
        newArgs[0] = redirectedUrl;
      } else if (newArgs[0] instanceof URL) {
        newArgs[0] = new URL(redirectedUrl);
      }

      const reqId = Logger.logRequest({
        url: redirectedUrl,
        originalUrl: url,
        isRedirected: redirectedUrl !== url,
        method,
        data: body,
        headers
      });

      try {
        const response = await originalFetch(...newArgs);

        const clonedResponse = response.clone();

        const contentType = clonedResponse.headers?.get?.('content-type') || '';
        const isBinaryOrLarge =
          contentType.includes('image/') ||
          contentType.includes('video/') ||
          contentType.includes('audio/') ||
          contentType.includes('application/pdf');

        if (isBinaryOrLarge) {
          const responseHeaders: any = {};
          if (response.headers && (response.headers as any).forEach) {
            (response.headers as any).forEach((value: string, key: string) => {
              responseHeaders[key] = value;
            });
          }
          Logger.logResponse({
            reqId,
            status: response.status,
            data: `[Binary Data: ${contentType}]`,
            url,
            method,
            headers: responseHeaders
          });
        } else {
          clonedResponse
            .text()
            .then((text: string) => {
              let responseData;
              try {
                responseData = JSON.parse(text);
              } catch (e) {
                responseData = text;
              }

              const responseHeaders: any = {};
              if (response.headers && (response.headers as any).forEach) {
                (response.headers as any).forEach((value: string, key: string) => {
                  responseHeaders[key] = value;
                });
              }

              Logger.logResponse({
                reqId,
                status: response.status,
                data: responseData,
                url,
                method,
                headers: responseHeaders
              });
            })
            .catch(() => {
              Logger.logResponse({
                reqId,
                status: response.status,
                data: '[Binary or unreadable data]',
                url,
                method
              });
            });
        }

        return response;
      } catch (error: any) {
        Logger.logError({
          reqId,
          message: error.message || 'Fetch failed',
          url,
          method
        });
        throw error;
      }
    };

    // Assign patched fetch back to global
    if (typeof window !== 'undefined' && window.fetch) {
      (window as any).fetch = patchedFetch;
    } else if (typeof global !== 'undefined') {
      (global as any).fetch = patchedFetch;
    }
  }

  const XHR = getGlobalXMLHttpRequest();
  if (!XHR || XHR.prototype._isPatchedByDebugLogger) return;
  const originalOpen = XHR.prototype.open;
  const originalSend = XHR.prototype.send;

  XHR.prototype._isPatchedByDebugLogger = true;

  const originalSetRequestHeader = XHR.prototype.setRequestHeader;

  XHR.prototype.open = function (method: string, url: string | URL) {
    this._method = (method || '').toUpperCase();
    const originalUrl = typeof url === 'string' ? url : url.toString();
    this._url = originalUrl;
    this._debugHeaders = {};

    const redirectedUrl = getRedirectedUrl(originalUrl);
    this._redirectedUrl = redirectedUrl;
    try {
      return originalOpen.apply(this, [
        method,
        redirectedUrl,
        ...Array.prototype.slice.call(arguments, 2)
      ] as any);
    } catch (err) {
      console.error('DebugLogger: Error in XHR.open', err);
      throw err;
    }
  };

  XHR.prototype.setRequestHeader = function (header: string, value: string) {
    if (!this._debugHeaders) this._debugHeaders = {};
    this._debugHeaders[header] = value;
    return originalSetRequestHeader.apply(this, arguments as any);
  };

  XHR.prototype.send = function (body: any) {
    const xhr = this as any;

    let parsedBody = body;
    if (typeof parsedBody === 'string') {
      try { parsedBody = JSON.parse(parsedBody); } catch (_) {}
    }

    const reqId = Logger.logRequest({
      url: xhr._redirectedUrl || xhr._url,
      originalUrl: xhr._url,
      isRedirected: !!xhr._redirectedUrl && xhr._redirectedUrl !== xhr._url,
      method: xhr._method,
      data: parsedBody,
      headers: xhr._debugHeaders
    });

    /**
     * onComplete
     * Handles the completion of the XHR request, logging the response or any errors that occur.
     * Ensures that logging only happens once per request.
     */
    const onComplete = () => {
      if (xhr._alreadyLogged) return;
      xhr._alreadyLogged = true;

      let responseData;
      const responseType = this.responseType;

      try {
        if (responseType === '' || responseType === 'text') {
          try {
            responseData = JSON.parse(this.responseText);
          } catch (e) {
            responseData = this.responseText;
          }
        } else if (responseType === 'json') {
          responseData = this.response;
        } else {
          responseData = `[Binary Data: ${responseType}]`;
        }
      } catch (error) {
        responseData = '[Error reading response]';
      }

      const responseHeaders: any = {};
      const headersStr = this.getAllResponseHeaders();
      if (headersStr) {
        headersStr.split('\r\n').forEach((line: string) => {
          const [key, ...val] = line.split(': ');
          if (key && val.length > 0) responseHeaders[key] = val.join(': ');
        });
      }

      Logger.logResponse({
        reqId,
        status: this.status,
        data: responseData,
        url: xhr._url,
        method: xhr._method,
        headers: responseHeaders
      });
    };

    /**
     * onError
     * Handles errors during the XHR request, ensuring that they are logged appropriately.
     * This includes network errors, timeouts, and aborted requests.
     */
    const onError = () => {
      if (xhr._alreadyLogged) return;
      xhr._alreadyLogged = true;

      Logger.logError({
        reqId,
        message: 'Network error or aborted',
        status: this.status,
        url: xhr._url,
        method: xhr._method
      });
    };

    if (this.addEventListener) {
      this.addEventListener('load', onComplete);
      this.addEventListener('error', onError);
      this.addEventListener('abort', onError);
      this.addEventListener('timeout', onError);
    } else {
      const originalOnReadyStateChange = this.onreadystatechange;
      this.onreadystatechange = function () {
        if (this.readyState === 4) {
          onComplete();
        }
        if (originalOnReadyStateChange) {
          return originalOnReadyStateChange.apply(this, arguments as any);
        }
      };
    }

    try {
      return originalSend.apply(this, arguments as any);
    } catch (err) {
      Logger.logError({
        reqId,
        message: `Send failed: ${(err as Error).message}`,
        url: xhr._url,
        method: xhr._method
      });
      throw err;
    }
  };
};
