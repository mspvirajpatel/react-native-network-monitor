export interface NetworkConfig {
    skipRedirectHosts?: string[];
    baseUrlMap?: {
        from: string;
        to: string;
    }[];
}
/**
 * Update the global network monitor config.
 * Call this before any network requests happen (or at the same time as
 * `setupNetworkMonitor`).
 */
declare const setNetworkConfig: (config: NetworkConfig) => void;
export declare const isInternalUrl: (originalUrl: string) => boolean;
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
export declare const setupNetworkMonitor: (config?: NetworkConfig) => void;
//# sourceMappingURL=NetworkMonitor.d.ts.map