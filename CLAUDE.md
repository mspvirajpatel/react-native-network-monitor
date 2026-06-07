# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build & Verify

```bash
# Build the package (react-native-builder-bob)
npm run build         # or: npm run prepare

# Type-check without emitting
npm run typescript    # runs: tsc --noEmit

# Lint source
npm run lint          # runs: eslint \"src/**/*.{ts,tsx}\"
```

All commands run from `packages/network-monitor`.

## Architecture

This is a yarn workspaces monorepo. The single published package is at `packages/network-monitor`.

### Singleton Logger (core)
`Logger` (`src/Logger.ts`) is a singleton `DebugLogger` class. All monitors write log entries into it via methods like `logRequest`, `logResponse`, `logInfo`, `logWebSocket`, `logPerformance`, `logAction`. Subscribers are notified via a debounced publish pattern (100ms debounce). Entries are capped at 500 (newest first).

### Monitors (feed into Logger, all in `src/`)
| File | What it does |
|------|-------------|
| `NetworkMonitor.ts` | Patches `window.fetch` and `XMLHttpRequest.prototype` to intercept requests/responses. Supports URL redirection via `getRedirectedUrl()` (`baseUrl` + `baseUrlMap`). Skips internal Metro/bundle URLs and configurable identity-host redirects. |
| `ConsoleMonitor.ts` | Patches `console.log`, `console.info`, `console.warn`, `console.error` to forward messages to Logger. Handles circular references and truncates at 20KB. |
| `WebSocketMonitor.ts` | Wraps the global `WebSocket` constructor to log open/message/close/error events. |
| `PerformanceMonitor.ts` | Uses `requestAnimationFrame` to track FPS. Exports `startPerformanceMonitor`, `stopPerformanceMonitor`, `subscribeToFps`, `isPerformanceMonitorRunning`. Logs entries only when FPS drops below 30. |
| `StateMonitor.ts` | Three exports: `subscribeToState` (generic), `createReduxMiddleware` (Redux middleware), `createZustandMonitor` (Zustand). Supports `diff` or `snapshot` mode, throttling, key filtering, max depth. |

### UI Layer
- **`DebugTrigger.tsx`** – The root wrapper component. Manages password entry (tap-count → password modal → debugger), a draggable floating DEBUG button with auto-hide (8s timeout) and edge-snapping, feature flags, i18n, theme, and safe-area insets.
- **`DebugMonitor.tsx`** – Full-screen debug UI with tabs: ALL, NETWORK, LOGS, WEBSOCKET, PERFORMANCE, STORE, SETTINGS. Includes search/filter pills, a detail bottom-sheet per entry, environment switching, custom URL management, and export.
- **`DebugContext.tsx`** – React Context providing `openDebugger`, `closeDebugger`, `isDebuggerOpen` to child components via `useDebugger()` hook.

### Theme
`DebugMonitorStyles.ts` defines two `ThemeColors` palettes (`DARK_COLORS` / `LIGHT_COLORS`). Consumers can pass `theme="light|dark|auto"` and/or `colors` (partial override) to `DebugTrigger`.

### Storage
`storage.ts` defines a `StorageAdapter` interface (`get<T>` / `set`). Defaults to in-memory. Call `setStorageAdapter(yourAdapter)` early in the app lifecycle to swap in MMKV or AsyncStorage.

### i18n
`translations.ts` supports 13 languages (en, az, ru, tr, hi, gu, es, fr, de, ar, zh, pt, ja). `resolveLanguage(lang)` handles `"auto"` (device detection). Arabic is RTL.

## Key patterns
- All monitors that patch globals check a flag (`_isPatchedByDebugLogger`, `isNetworkPatched`, `__wsPatchedByDebugLogger`) to avoid double-patching.
- The `features` prop on `DebugTrigger` controls which monitors initialize (default: all enabled).
- URL redirection in `NetworkMonitor.ts` rewrites request origins to the configured `baseUrl`, skipping internal Metro/bundle URLs and configurable third-party identity hosts (`skipRedirectHosts` in `NetworkConfig`).
- `baseUrlMap` in `NetworkConfig` allows hostname-specific redirects (e.g., `api.staging.com` → `api.local.dev`).

## Build output
`react-native-builder-bob` produces three targets in `lib/`:
- `lib/commonjs/` – CommonJS
- `lib/module/` – ES modules
- `lib/typescript/` – TypeScript declarations
