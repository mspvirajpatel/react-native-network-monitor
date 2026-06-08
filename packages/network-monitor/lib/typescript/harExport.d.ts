import type { LogEntry } from './Logger';
/**
 * HAR (HTTP Archive) 1.2 export support.
 *
 * Converts captured network logs into the standard HAR format,
 * compatible with Chrome DevTools, Charles Proxy, and other
 * HAR viewers.
 */
interface HarEntry {
    startedDateTime: string;
    time: number;
    request: {
        method: string;
        url: string;
        httpVersion: string;
        cookies: {
            name: string;
            value: string;
        }[];
        headers: {
            name: string;
            value: string;
        }[];
        queryString: {
            name: string;
            value: string;
        }[];
        postData?: {
            mimeType: string;
            text: string;
        };
        headersSize: number;
        bodySize: number;
    };
    response: {
        status: number;
        statusText: string;
        httpVersion: string;
        cookies: {
            name: string;
            value: string;
        }[];
        headers: {
            name: string;
            value: string;
        }[];
        content: {
            size: number;
            mimeType: string;
            text?: string;
        };
        redirectURL: string;
        headersSize: number;
        bodySize: number;
    };
    cache: Record<string, unknown>;
    timings: {
        send: number;
        wait: number;
        receive: number;
    };
}
interface HarLog {
    version: string;
    creator: {
        name: string;
        version: string;
    };
    entries: HarEntry[];
}
interface HarExport {
    log: HarLog;
}
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
export declare function generateHarExport(logs: LogEntry[]): HarExport;
export {};
//# sourceMappingURL=harExport.d.ts.map