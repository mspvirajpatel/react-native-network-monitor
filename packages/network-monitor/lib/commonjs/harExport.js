"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.generateHarExport = generateHarExport;
/* eslint-disable @typescript-eslint/no-unused-vars */

/**
 * HAR (HTTP Archive) 1.2 export support.
 *
 * Converts captured network logs into the standard HAR format,
 * compatible with Chrome DevTools, Charles Proxy, and other
 * HAR viewers.
 */

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

/** Safely stringify a value for HAR text fields. */
const safeStringify = data => {
  if (data === null || data === undefined) return undefined;
  if (typeof data === 'string') return data;
  try {
    return JSON.stringify(data);
  } catch {
    return String(data);
  }
};

/** Extract query string parameters from a URL. */
const extractQueryString = url => {
  const qIndex = url.indexOf('?');
  if (qIndex === -1) return [];
  const params = [];
  const search = url.slice(qIndex + 1);
  const parts = search.split('&');
  for (const part of parts) {
    const eq = part.indexOf('=');
    if (eq === -1) {
      params.push({
        name: decodeURIComponent(part),
        value: ''
      });
    } else {
      params.push({
        name: decodeURIComponent(part.slice(0, eq)),
        value: decodeURIComponent(part.slice(eq + 1))
      });
    }
  }
  return params;
};

/** Convert a headers object (Record<string, string>) to HAR header array. */
const headersToArray = headers => {
  if (!headers || typeof headers !== 'object') return [];
  const raw = headers;
  return Object.keys(raw).map(key => ({
    name: key,
    value: raw[key] !== undefined && raw[key] !== null ? String(raw[key]) : ''
  }));
};

/** Derive MIME type from a headers object. */
const getMimeType = headers => {
  if (!headers || typeof headers !== 'object') return 'application/octet-stream';
  const raw = headers;
  const ct = raw['content-type'] || raw['Content-Type'] || raw['contentType'];
  return ct ? String(ct) : 'application/octet-stream';
};

/** Approximate byte size of a value. */
const approximateByteSize = data => {
  if (data === null || data === undefined) return 0;
  if (typeof data === 'string') return new Blob([data]).size;
  try {
    return new Blob([JSON.stringify(data)]).size;
  } catch {
    return 0;
  }
};

/** Derive statusText from an HTTP status code. */
const statusTextFromCode = status => {
  const map = {
    100: 'Continue',
    101: 'Switching Protocols',
    200: 'OK',
    201: 'Created',
    204: 'No Content',
    301: 'Moved Permanently',
    302: 'Found',
    304: 'Not Modified',
    400: 'Bad Request',
    401: 'Unauthorized',
    403: 'Forbidden',
    404: 'Not Found',
    405: 'Method Not Allowed',
    408: 'Request Timeout',
    409: 'Conflict',
    422: 'Unprocessable Entity',
    429: 'Too Many Requests',
    500: 'Internal Server Error',
    502: 'Bad Gateway',
    503: 'Service Unavailable',
    504: 'Gateway Timeout'
  };
  return map[status] || '';
};

/* ------------------------------------------------------------------ */
/*  Main export function                                               */
/* ------------------------------------------------------------------ */

/**
 * generateHarExport
 *
 * Convert an array of LogEntries into a HAR 1.2 archive object.
 * Only entries with a URL and method are included.
 * Entries are deduplicated by `id` (last seen wins, which has the most data).
 *
 * @param logs - The full log array from the Logger
 * @returns A HAR 1.2 JSON-serialisable object
 */
function generateHarExport(logs) {
  // Collect only network-related entries with URL and method, deduplicate by id
  const deduped = new Map();
  for (const entry of logs) {
    if (!entry.url || !entry.method) continue;
    if (entry.type === 'info' || entry.type === 'websocket' || entry.type === 'database') continue;
    // Last in the array wins (most complete data)
    deduped.set(entry.id, entry);
  }
  const entries = [];
  for (const log of deduped.values()) {
    const method = log.method || 'GET';
    const url = log.isRedirected && log.originalUrl ? log.originalUrl : log.url || '';
    const durationMs = log.durationMs ?? 0;
    const reqHeaders = headersToArray(log.requestHeaders || log.headers);
    const resHeaders = headersToArray(log.responseHeaders);
    const queryString = extractQueryString(url);
    const mimeType = getMimeType(log.responseHeaders || log.headers);
    const bodySize = approximateByteSize(log.requestData);
    const resBodySize = approximateByteSize(log.responseData);

    // Build postData for non-GET requests that have a body
    let postData;
    if (log.requestData && method !== 'GET' && method !== 'HEAD') {
      const text = safeStringify(log.requestData);
      if (text) {
        postData = {
          mimeType: getMimeType(log.requestHeaders || log.headers),
          text
        };
      }
    }
    const entry = {
      startedDateTime: log.timestamp,
      time: durationMs,
      request: {
        method,
        url,
        httpVersion: 'HTTP/1.1',
        cookies: [],
        headers: reqHeaders,
        queryString,
        postData,
        headersSize: -1,
        bodySize: postData ? bodySize : 0
      },
      response: {
        status: log.status || 0,
        statusText: log.status ? statusTextFromCode(log.status) : '',
        httpVersion: 'HTTP/1.1',
        cookies: [],
        headers: resHeaders,
        content: {
          size: resBodySize,
          mimeType,
          text: safeStringify(log.responseData)
        },
        redirectURL: '',
        headersSize: -1,
        bodySize: resBodySize
      },
      cache: {},
      timings: {
        send: 0,
        wait: durationMs,
        receive: 0
      }
    };
    entries.push(entry);
  }
  return {
    log: {
      version: '1.2',
      creator: {
        name: 'React Native Network Monitor',
        version: '1.0'
      },
      entries
    }
  };
}
//# sourceMappingURL=harExport.js.map