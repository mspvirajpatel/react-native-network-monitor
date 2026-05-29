# @mspvirajpatel/react-native-network-monitor

A polished in-app debug monitor for React Native apps.

Use it to capture network traffic, console logs, environment switching, and secure debug access without leaving your app.

[![npm version](https://badge.fury.io/js/%40mspvirajpatel%2Freact-native-network-monitor.svg)](https://www.npmjs.com/package/@mspvirajpatel/react-native-network-monitor)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Why this package

- Capture `fetch` + `XMLHttpRequest` automatically
- Visualize request/response details in-app
- See `console.log`, `console.warn`, and `console.error` output
- Protect access with a password trigger
- Switch API endpoints in seconds
- Export logs to JSON for debugging and QA

## Features

- 🔍 Network interception for `fetch` and XHR
- 📝 Console log capture
- 🔐 Password-protected access
- 🌐 Environment / base URL switching
- 📊 Rich debug UI with search and filters
- 🌗 Light/dark theme support
- 📤 Export logs as JSON
- 🧠 Custom storage adapter support
- 🌍 Multilanguage UI with English, Russian, Turkish, Azerbaijani

## Install

```bash
npm install @mspvirajpatel/react-native-network-monitor
```

or

```bash
yarn add @mspvirajpatel/react-native-network-monitor
```

Also install its peer dependency:

```bash
npm install react-native-safe-area-context
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

## Example Usage

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

### Accessing Logs Programmatically

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
```

## API Reference

### DebugTrigger Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `children` | `ReactNode` | - | App content to wrap |
| `password` | `string` | `'2024'` | Password to access debug monitor |
| `passwordFrequency` | `'all-time' \| 'per-install' \| 'app-active'` | `'all-time'` | When to ask for password |
| `enableShake` | `boolean` | `false` | Enable shake gesture to open (not yet implemented) |
| `clicksNeeded` | `number` | `5` | Number of clicks to trigger monitor |
| `isDemo` | `boolean` | `false` | Start in demo mode |
| `onEnvChange` | `(newEnv: 'demo' \| 'prod') => void` | - | Callback when environment changes |
| `onBaseUrlChange` | `(newUrl: string) => void` | - | Callback when base URL changes |
| `baseUrls` | `string[] \| { title: string; url: string }[]` | - | Predefined base URLs for quick switching |
| `prodUrl` | `string` | - | Production API URL |
| `testUrl` | `string` | - | Test/Staging API URL |
| `enabled` | `boolean` | `true` | Enable/disable the trigger |
| `checkAccess` | `() => boolean \| Promise<boolean>` | - | Custom access check function |
| `language` | `'az' \| 'en' \| 'ru' \| 'tr' \| 'auto'` | `'auto'` | UI language |
| `theme` | `'light' \| 'dark' \| 'auto'` | `'auto'` | Color theme; `'auto'` follows the device setting |

### DebugMonitor Props (Internal)

The `DebugMonitor` component is rendered internally by `DebugTrigger`. These props are for reference:

| Prop | Type | Description |
|------|------|-------------|
| `onClose` | `() => void` | Close the monitor |
| `envConfig` | `{ currentEnv: string; onEnvChange: (env) => void }` | Environment config |
| `onBaseUrlChange` | `(url: string) => void` | URL change callback |
| `baseUrls` | `string[] \| {...}[]` | Available URLs |
| `language` | `string` | Display language |

### Logger API

```typescript
class DebugLogger {
  // Get all logs
  getLogs(): LogEntry[];

  // Clear all logs
  clearLogs(): void;

  // Set base URL for redirection
  setBaseUrl(url: string): void;
  getBaseUrl(): string;

  // Subscribe to log updates
  subscribe(listener: (logs: LogEntry[]) => void): () => void;

  // Log custom events
  logInfo(message: string, data?: any): void;
  logDatabase(query: string, data?: any): void;
  logNavigation(route: string, params?: any): void;

  // Custom URLs
  addCustomUrl(entry: CustomUrlEntry): void;
  removeCustomUrl(url: string): void;
  getCustomUrls(): CustomUrlEntry[];
}
```

### Types

```typescript
type LogType = 'request' | 'response' | 'error' | 'info' | 'database' | 'navigation';

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
```

## Examples

See the `examples/` folder for working demos.

- `examples/expo-go` — Expo Go managed example
- `examples/expo-cng` — Expo Router / CNG example

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
