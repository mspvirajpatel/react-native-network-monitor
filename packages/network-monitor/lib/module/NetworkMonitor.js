/* eslint-disable no-unused-vars */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { Logger } from './Logger';
const getGlobalFetch = () => {
  if (typeof window !== 'undefined' && window.fetch) {
    return window.fetch.bind(window);
  }
  if (typeof global !== 'undefined' && global.fetch) {
    return global.fetch.bind(global);
  }
  return undefined;
};
const getGlobalXMLHttpRequest = () => {
  if (typeof window !== 'undefined' && window.XMLHttpRequest) {
    return window.XMLHttpRequest;
  }
  if (typeof global !== 'undefined' && global.XMLHttpRequest) {
    return global.XMLHttpRequest;
  }
  return XMLHttpRequest;
};
const _config = {
  skipRedirectHosts: ['login.microsoftonline.com', 'login.windows.net', 'b2clogin.com', 'graph.microsoft.com', 'accounts.google.com', 'appleid.apple.com'],
  baseUrlMap: undefined
};

/**
 * Update the global network monitor config.
 * Call this before any network requests happen (or at the same time as
 * `setupNetworkMonitor`).
 */
const setNetworkConfig = config => {
  if (config.skipRedirectHosts !== undefined) {
    _config.skipRedirectHosts = config.skipRedirectHosts;
  }
  if (config.baseUrlMap !== undefined) {
    _config.baseUrlMap = config.baseUrlMap;
  }
};
export const isInternalUrl = originalUrl => {
  return originalUrl.includes('localhost:8081') || originalUrl.includes('10.0.2.2:8081') || originalUrl.includes('127.0.0.1') || originalUrl.includes('/symbolicate') || originalUrl.includes('.bundle') || originalUrl.includes('.hot-update');
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
const getRedirectedUrl = originalUrl => {
  const baseUrl = Logger.getBaseUrl();
  if (!baseUrl) return originalUrl;
  if (isInternalUrl(originalUrl)) return originalUrl;
  try {
    if (originalUrl.startsWith('/')) {
      const base = new URL(baseUrl);
      return base.origin + originalUrl;
    }
    const original = new URL(originalUrl);

    // Skip redirect for known third-party / identity hosts.
    if (_config.skipRedirectHosts && _config.skipRedirectHosts.some(h => original.hostname.endsWith(h))) {
      return originalUrl;
    }
    const replacement = new URL(baseUrl);

    // If a baseUrlMap is provided, try to match the original hostname.
    if (_config.baseUrlMap) {
      for (const entry of _config.baseUrlMap) {
        if (original.hostname.includes(entry.from)) {
          const replaced = new URL(originalUrl);
          replaced.hostname = entry.to;
          return replaced.toString();
        }
      }
    }
    return originalUrl.replace(original.origin, replacement.origin);
  } catch (e) {
    return originalUrl;
  }
};

/**
 * Export for testing.
 */
export { getRedirectedUrl, setNetworkConfig };

/**
 * setupNetworkMonitor
 *
 * Patches `window.fetch` and `XMLHttpRequest` to capture network requests
 * and responses then forward them to the debug `Logger`.
 *
 * Note: This mutates global browser/JS runtime network methods and should
 * only be called once during app initialization.
 */
export const setupNetworkMonitor = config => {
  if (Logger.isNetworkPatched) return;
  Logger.isNetworkPatched = true;
  if (config) {
    setNetworkConfig(config);
  }
  const globalFetch = getGlobalFetch();
  if (globalFetch) {
    const originalFetch = globalFetch;
    const patchedFetch = async (...args) => {
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
          url = input.url;
          method = input.method || method;
          body = input.body || body;
          headers = input.headers || headers;
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
        const isBinaryOrLarge = contentType.includes('image/') || contentType.includes('video/') || contentType.includes('audio/') || contentType.includes('application/pdf');
        if (isBinaryOrLarge) {
          const responseHeaders = {};
          if (response.headers && response.headers.forEach) {
            response.headers.forEach((value, key) => {
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
          clonedResponse.text().then(text => {
            let responseData;
            try {
              responseData = JSON.parse(text);
            } catch (e) {
              responseData = text;
            }
            const responseHeaders = {};
            if (response.headers && response.headers.forEach) {
              response.headers.forEach((value, key) => {
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
          }).catch(() => {
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
      } catch (error) {
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
      window.fetch = patchedFetch;
    } else if (typeof global !== 'undefined') {
      global.fetch = patchedFetch;
    }
  }
  const XHR = getGlobalXMLHttpRequest();
  if (!XHR || XHR.prototype._isPatchedByDebugLogger) return;
  const originalOpen = XHR.prototype.open;
  const originalSend = XHR.prototype.send;
  XHR.prototype._isPatchedByDebugLogger = true;
  const originalSetRequestHeader = XHR.prototype.setRequestHeader;
  XHR.prototype.open = function (method, url) {
    this._method = (method || '').toUpperCase();
    const originalUrl = typeof url === 'string' ? url : url.toString();
    this._url = originalUrl;
    this._debugHeaders = {};
    const redirectedUrl = getRedirectedUrl(originalUrl);
    this._redirectedUrl = redirectedUrl;
    try {
      return originalOpen.apply(this, [method, redirectedUrl, ...Array.prototype.slice.call(arguments, 2)]);
    } catch (err) {
      console.error('DebugLogger: Error in XHR.open', err);
      throw err;
    }
  };
  XHR.prototype.setRequestHeader = function (header, value) {
    if (!this._debugHeaders) this._debugHeaders = {};
    this._debugHeaders[header] = value;
    return originalSetRequestHeader.apply(this, arguments);
  };
  XHR.prototype.send = function (body) {
    const xhr = this;
    let parsedBody = body;
    if (typeof parsedBody === 'string') {
      try {
        parsedBody = JSON.parse(parsedBody);
      } catch (_) {}
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
      const responseHeaders = {};
      const headersStr = this.getAllResponseHeaders();
      if (headersStr) {
        headersStr.split('\r\n').forEach(line => {
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
          return originalOnReadyStateChange.apply(this, arguments);
        }
      };
    }
    try {
      return originalSend.apply(this, arguments);
    } catch (err) {
      Logger.logError({
        reqId,
        message: `Send failed: ${err.message}`,
        url: xhr._url,
        method: xhr._method
      });
      throw err;
    }
  };
};
//# sourceMappingURL=NetworkMonitor.js.map