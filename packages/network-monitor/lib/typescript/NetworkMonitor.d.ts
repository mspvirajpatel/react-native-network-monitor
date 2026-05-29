/**
 * getRedirectedUrl
 *
 * Compute a redirected URL based on the configured debug `baseUrl` while
 * excluding internal development/system requests.
 *
 * @param originalUrl - The original request URL
 * @returns The possibly redirected URL string
 */
declare const getRedirectedUrl: (originalUrl: string) => string;
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
export declare const setupNetworkMonitor: () => void;
//# sourceMappingURL=NetworkMonitor.d.ts.map