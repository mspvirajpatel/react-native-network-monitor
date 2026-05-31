# @mspvirajpatel/react-native-network-monitor

A polished in-app debug monitor for React Native apps.

Use it to capture network traffic, console logs, WebSocket messages, FPS performance, errors, and more — all without leaving your app.

<p align="center">
  <img src="./screenshots/debug-monitor.png" width="280" alt="Debug Monitor" />
  <img src="./screenshots/network-detail.png" width="280" alt="Network Detail" />
  <img src="./screenshots/floating-button.png" width="280" alt="Floating Button" />
  <img src="./screenshots/api-base-url-change.png" width="280" alt="API Base URL Change" />
</p>

[![npm version](https://badge.fury.io/js/%40mspvirajpatel%2Freact-native-network-monitor.svg)](https://www.npmjs.com/package/@mspvirajpatel/react-native-network-monitor)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Why this package

- Capture `fetch` + `XMLHttpRequest` + `WebSocket` traffic automatically
- Visualize request/response details in-app
- See `console.log`, `console.warn`, and `console.error` output
- Monitor real-time FPS performance with history chart
- Catch React render errors and unhandled promise rejections
- Protect access with a password trigger
- Switch API endpoints in seconds
- Export logs to JSON or text reports, save to device filesystem
- Persist logs across app restarts
- Open the debugger programmatically from anywhere in your app

## Features

- 🔍 Network interception for `fetch`, XHR, and WebSocket
- 📝 Console log capture
- 🔐 Password-protected access with optional skip
- 🌐 Environment / base URL switching
- 📊 Rich debug UI with search and filters
- 🌗 Light/dark theme support
- 📤 Export logs as JSON or formatted text report
- 💾 Save reports to device filesystem (expo-file-system / react-native-fs)
- 🧠 Log persistence across app restarts
- 🔌 WebSocket monitoring (open/close/message/error)
- ⚡ FPS performance monitor with live stats and history chart
- 🛡️ Error Boundary + global JS error / promise rejection capture
- 📱 Device info panel (platform, OS, model, screen, app version)
- 🚀 Programmatic open/close via `useDebugger()` hook
- 🧩 Custom storage adapter support
- 🌍 Multilanguage UI with English, Russian, Turkish, Azerbaijani
- 🔘 Draggable floating DEBUG button with auto-hide
- 📐 Safe area aware — respects device notch, rounded corners, home indicator
- ↔️ Configurable screen edge margin for floating button

## Install

```bash
npm install @mspvirajpatel/react-native-network-monitor
```

```bash
yarn add @mspvirajpatel/react-native-network-monitor
```

Also install the peer dependency:

```bash
npm install react-native-safe-area-context
```

Optional dependencies for file export:

```bash
npm install expo-file-system expo-sharing
# or
npm install react-native-fs
```

## Quick Start

Wrap your app with `DebugTrigger`:

```tsx
import React from 'react';
import { DebugTrigger } from '@mspvirajpatel/react-native-network-monitor';

export default function App() {
  return (
    <DebugTrigger
      password="2024"
      passwordFrequency="all-time"
      clicksNeeded={5}
      prodUrl="https://api.production.com"
      testUrl="https://api.staging.com"
    >
      {/* Your app content */}
    </DebugTrigger>
  );
}
```

Tap the screen 5 times → enter the password → the debug monitor opens.

## Example Usage

### Basic Setup

```tsx
import { DebugTrigger } from '@mspvirajpatel/react-native-network-monitor';

<DebugTrigger
  password="1234"
  clicksNeeded={5}
  enabled={__DEV__}
>
  <YourApp />
</DebugTrigger>
```

### Environment Switching

```tsx
<DebugTrigger
  prodUrl="https://api.production.com"
  testUrl="https://api.qa.com"
  baseUrls={[
    { title: 'Local', url: 'http://localhost:3000' },
    { title: 'QA', url: 'https://api.qa.com' }
  ]}
  onBaseUrlChange={(url) => console.log('Switched to', url)}
>
```

### Password Protection

```tsx
<DebugTrigger
  password="secure123"
  passwordFrequency="per-install"
>
```

- `all-time` — ask every time
- `per-install` — ask once per install
- `app-active` — ask once per session

### Skip Password (Optional Auth)

When `passwordOptional` is `true`, the password modal is skipped entirely and the debugger opens directly — useful for dev builds where you want fast access but still define a password for release:

```tsx
<DebugTrigger
  password="2026"
  passwordOptional     // bypass password modal
>
```

The password is still defined (for release builds), but in dev you skip the prompt.

### Floating Button

The floating DEBUG button appears when the debugger has been opened at least once. It is:

- **Draggable** — drag it anywhere on screen
- **Snaps to edge** — releases to the nearest left/right edge with spring animation
- **Auto-hides** — fades after 8 seconds of inactivity; tap to restore
- **Safe area aware** — respects device notch, rounded corners, home indicator via `react-native-safe-area-context`
- **Position persisted** — position is saved to storage and restored across sessions
- **Position preserved** — position is saved before password modal opens and restored on dismiss

Customize the edge margin with the `floatingButtonMargin` prop:

```tsx
<DebugTrigger
  password="2026"
  floatingButtonMargin={24}   // default 16
>
```

Long-press the floating button to hide it permanently. Re-trigger via 5 taps or `useDebugger().openDebugger()`.

### Floating Button Safe Area & Edge Margin

The floating button uses `react-native-safe-area-context` to automatically stay clear of:

- Status bar (top inset)
- Notch / Dynamic Island (top + left/right insets)
- Home indicator (bottom inset)
- Rounded corners (all edges)

On top of safe area insets, the `floatingButtonMargin` prop adds extra padding from all screen edges (default `16`).

### Disable Tap Gesture (use programmatic open only)

```tsx
<DebugTrigger
  password="2026"
  enableTapGesture={false}   // 5-tap gesture disabled
>
  <YourApp />
</DebugTrigger>
```

The debugger can then only be opened programmatically via `useDebugger()`.

## Programmatic Open / Close

Use the `useDebugger()` hook inside any component rendered within `<DebugTrigger>`:

```tsx
import { useDebugger } from '@mspvirajpatel/react-native-network-monitor';

function SettingsScreen() {
  const { openDebugger, closeDebugger, isDebuggerOpen } = useDebugger();

  return (
    <View>
      <Button title="Open Debugger" onPress={openDebugger} />
      <Button title="Close Debugger" onPress={closeDebugger} />
      <Text>Debugger is {isDebuggerOpen ? 'open' : 'closed'}</Text>
    </View>
  );
}
```

The same password/access checks apply as the tap gesture.

## WebSocket Monitoring

WebSocket connections are automatically intercepted — no extra setup needed.

```tsx
const ws = new WebSocket('wss://echo.example.com');
ws.onopen = () => ws.send(JSON.stringify({ message: 'Hello' }));
ws.onmessage = (event) => console.log('Received:', event.data);
ws.onerror = (err) => console.error('WS error', err);
ws.onclose = () => console.log('WS closed');
```

All WebSocket events appear in the **WS** tab of the debug monitor with open/close/error/msg badges.

## FPS Performance Monitor

Real-time FPS tracking with toggle, average/min/max stats, dropped frame count, and a mini history chart.

### Control programmatically:

```tsx
import {
  startPerformanceMonitor,
  stopPerformanceMonitor,
  subscribeToFps,
  isPerformanceMonitorRunning,
} from '@mspvirajpatel/react-native-network-monitor';

startPerformanceMonitor();
stopPerformanceMonitor();
const running = isPerformanceMonitorRunning();

subscribeToFps((stats) => {
  console.log(stats.fps, stats.averageFps, stats.minFps, stats.maxFps, stats.droppedFrames);
});
```

The FPS monitor has a built-in threshold check — when FPS drops below 30, a `performance` type log entry is automatically created.

## Error Boundary & Global Error Capture

### ErrorBoundary component

Catches React render errors and prevents the app from crashing:

```tsx
import { ErrorBoundary } from '@mspvirajpatel/react-native-network-monitor';

<ErrorBoundary>
  <YourApp />
</ErrorBoundary>
```

Render errors are logged to the debug monitor's LOGS tab.

### Global error handlers

`setupGlobalErrorHandlers()` is automatically called by `DebugTrigger`. It captures:
- Critical JS errors via `ErrorUtils.setGlobalHandler`
- Unhandled promise rejections
- Global `window.onerror` events

## Device Info Panel

The Settings tab in the debug monitor shows device information:
- Platform and OS version
- Device model name
- Screen resolution and scale
- App version and build version

You can also access this programmatically:

```tsx
import { getDeviceInfo } from '@mspvirajpatel/react-native-network-monitor';

const info = getDeviceInfo();
console.log(info.platform, info.osVersion, info.deviceName);
```

## Log Persistence

Logs are automatically saved to storage every 15 seconds and restored on app restart.

### Control persistence:

```tsx
import {
  startPersistence,
  stopPersistence,
  restoreLogs,
  clearPersistedLogs,
} from '@mspvirajpatel/react-native-network-monitor';

startPersistence(intervalMs);
stopPersistence();
clearPersistedLogs();
```

Up to 200 of the most recent log entries are persisted.

## Export Report

Generate comprehensive debug reports with summary statistics:

```tsx
import {
  generateExportReport,
  formatReportAsText,
} from '@mspvirajpatel/react-native-network-monitor';
import { Logger } from '@mspvirajpatel/react-native-network-monitor';

const logs = Logger.getLogs();
const report = generateExportReport(logs);
const text = formatReportAsText(report);

// Share
await Share.share({ message: text });
```

The report includes:
- App/device info
- Summary statistics (total requests, errors, avg duration)
- Network breakdown by method and status code
- Top 10 slowest requests
- Complete error list
- Timeline sorted by timestamp

## File Exporter

Save reports to the device filesystem with automatic fallback chain:

```tsx
import {
  saveReportToJson,
  saveReportToText,
} from '@mspvirajpatel/react-native-network-monitor';
import { Logger } from '@mspvirajpatel/react-native-network-monitor';

const logs = Logger.getLogs();
await saveReportToJson(logs);  // saves report.json
await saveReportToText(logs);  // saves report.txt
```

Fallback priority: `expo-file-system` → `react-native-fs` → Share API.

## Custom Storage Adapter

```tsx
import { setStorageAdapter } from '@mspvirajpatel/react-native-network-monitor';
import { MMKV } from 'react-native-mmkv';

const mmkv = new MMKV();

setStorageAdapter({
  get: (key, defaultValue) => {
    const value = mmkv.getString(key);
    return value !== undefined ? JSON.parse(value) : defaultValue;
  },
  set: (key, value) => {
    mmkv.set(key, JSON.stringify(value));
  },
});
```

## Logger API

```tsx
import { Logger } from 'react-native-network-monitor';

// Get all logs
const logs = Logger.getLogs();

// Subscribe to log updates
const unsubscribe = Logger.subscribe((logs) => {
  console.log('New logs:', logs);
});

// Clear logs
Logger.clearLogs();

// Log custom events
Logger.logInfo('Custom event', { data: 'value' });
Logger.logDatabase('SELECT * FROM users', { results: 42 });
Logger.logNavigation('/home', { from: 'login' });
Logger.logInfo('Analytics event', { event: 'purchase', amount: 29.99 });
```

## API Reference

### DebugTrigger Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `children` | `ReactNode` | - | App content to wrap |
| `password` | `string` | `'2024'` | Password to access debug monitor |
| `passwordFrequency` | `'all-time' \| 'per-install' \| 'app-active'` | `'all-time'` | When to ask for password |
| `passwordOptional` | `boolean` | `false` | Skip the password modal entirely and open directly |
| `enableShake` | `boolean` | `false` | Enable shake gesture to open (not yet implemented) |
| `clicksNeeded` | `number` | `5` | Number of clicks to trigger monitor |
| `isDemo` | `boolean` | `false` | Start in demo mode |
| `onEnvChange` | `(newEnv: 'demo' \| 'prod') => void` | - | Callback when environment changes |
| `onBaseUrlChange` | `(newUrl: string) => void` | - | Callback when base URL changes |
| `baseUrls` | `string[] \| { title: string; url: string }[]` | - | Predefined base URLs for quick switching |
| `prodUrl` | `string` | - | Production API URL |
| `testUrl` | `string` | - | Test/Staging API URL |
| `enabled` | `boolean` | `true` | Enable/disable the tap trigger |
| `enableTapGesture` | `boolean` | `true` | Enable/disable the multi-tap gesture. Set to `false` to only allow programmatic open via `useDebugger()` |
| `floatingButtonMargin` | `number` | `16` | Minimum distance (px) from all screen edges for the floating button, on top of safe area insets |
| `checkAccess` | `() => boolean \| Promise<boolean>` | - | Custom access check function |
| `language` | `'az' \| 'en' \| 'ru' \| 'tr' \| 'auto'` | `'auto'` | UI language |
| `theme` | `'light' \| 'dark' \| 'auto'` | `'auto'` | Color theme; `'auto'` follows the device setting |

### useDebugger Hook

```typescript
interface DebugContextValue {
  openDebugger: () => void;
  closeDebugger: () => void;
  isDebuggerOpen: boolean;
}

const { openDebugger, closeDebugger, isDebuggerOpen } = useDebugger();
```

| Method | Description |
|--------|-------------|
| `openDebugger()` | Opens the debug monitor (respects password/access checks) |
| `closeDebugger()` | Closes the debug monitor and hides the floating button |
| `isDebuggerOpen` | `boolean` — whether the debug monitor is currently visible |

### Logger API

```typescript
class DebugLogger {
  getLogs(): LogEntry[];
  clearLogs(): void;

  setBaseUrl(url: string): void;
  getBaseUrl(): string;

  subscribe(listener: (logs: LogEntry[]) => void): () => void;

  logInfo(message: string, data?: any): void;
  logDatabase(query: string, data?: any): void;
  logNavigation(route: string, params?: any): void;

  addCustomUrl(entry: CustomUrlEntry): void;
  removeCustomUrl(url: string): void;
  getCustomUrls(): CustomUrlEntry[];
}
```

### Performance Monitor API

```typescript
startPerformanceMonitor(): void;
stopPerformanceMonitor(): void;
isPerformanceMonitorRunning(): boolean;

subscribeToFps(listener: (stats: FpsStats) => void): () => void;

interface FpsStats {
  fps: number;
  averageFps: number;
  minFps: number;
  maxFps: number;
  droppedFrames: number;
}
```

### Export Report API

```typescript
generateExportReport(logs: LogEntry[]): ExportReport;
formatReportAsText(report: ExportReport): string;

saveReportToJson(logs: LogEntry[]): Promise<void>;
saveReportToText(logs: LogEntry[]): Promise<void>;

interface ExportReport {
  generatedAt: string;
  appInfo: { platform: string; osVersion: string; deviceName: string; ... };
  summary: { totalRequests: number; totalErrors: number; ... };
  networkBreakdown: { byMethod: Record<string, number>; byStatus: Record<string, number> };
  slowestRequests: LogEntry[];
  errors: LogEntry[];
  timeline: LogEntry[];
}
```

### Types

```typescript
type LogType = 'request' | 'response' | 'error' | 'info' | 'database' | 'navigation' | 'websocket' | 'performance';

interface LogEntry {
  id: string;
  type: LogType;
  timestamp: string;
  url?: string;
  originalUrl?: string;
  isRedirected?: boolean;
  method?: string;
  requestData?: any;
  responseData?: any;
  requestHeaders?: any;
  responseHeaders?: any;
  status?: number;
  message?: string;
  durationMs?: number;
  size?: string;
}

interface CustomUrlEntry {
  title: string;
  url: string;
}

interface StorageAdapter {
  get<T = any>(key: string, defaultValue: T): T;
  set(key: string, value: any): void;
}

interface DeviceInfoData {
  platform: string;
  osVersion: string;
  deviceName: string;
  screenWidth: number;
  screenHeight: number;
  screenScale: number;
  appVersion?: string;
  buildVersion?: string;
}
```

## Examples

See the `examples/` folder for working demos.

- `examples/expo-go` — Expo Go managed example demonstrating all features

## Development

Build the package with:

```bash
npm run build
```

This produces output under `lib/` and `typescript/`.

## Contributing

Contributions are welcome! Open an issue or submit a PR on GitHub.

## License

MIT
