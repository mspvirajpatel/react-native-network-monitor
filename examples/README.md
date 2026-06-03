# Examples for `@mspvirajpatel/react-native-network-monitor`

- `expo-demo` — comprehensive demo with live-syncing prop controls for all 16+ `DebugTrigger` props, network interception, WebSocket, console, store monitoring, performance, error boundary, programmatic API, and a 20-item recent action log.

## Quick Start

From the repo root:

```bash
npm install
```

Then run the demo:

```bash
cd examples/expo-demo
npx expo start
```

## What to try

1. Run the app — you'll see a scrollable UI with prop controls at the top.
2. Change any toggle (e.g. `passwordOptional`, `theme`, `language`) — it immediately syncs to the live `DebugTrigger` wrapping the app.
3. Tap the **floating debug button** (or shake) to open the monitor with your customised props applied.
4. Entry password: `2026`.
5. Explore all 7 tabs: ALL · NETWORK · LOGS · WEBSOCKET · PERFORMANCE · STORE · SETTINGS.
6. Use the action buttons to generate network requests (GET, POST, XHR, 404), console logs, WebSocket messages, store state updates, and performance data, then inspect everything in the debug monitor.

### Customisation controls in the demo

The demo lets you toggle every `DebugTrigger` prop in real time:

| Control | Prop | Effect |
|---------|------|--------|
| `passwordOptional` | skips password prompt | Toggle |
| `passwordFrequency` | how often password is required | all-time / per-install / app-active |
| `enableTapGesture` | tap-to-open trigger | Toggle |
| `clicksNeeded` | number of taps required | 3 / 5 / 7 |
| `checkAccess` | whether access check passes | Toggle |
| `floatingButtonMargin` | margin from screen edges | 8px / 16px / 32px |
| `theme` | colour scheme | light / dark / auto |
| `language` | UI language | 13 languages + auto |
| `env / isDemo` | environment mode | prod / demo |
| `customColors` | overrides primary/secondary/success/accent | Toggle (pink/green) |
| `custom floating button` | replaces button text with custom content | Toggle |
| `maxLogs` | limit displayed log entries | All / 10 / 50 / 200 |
| `headerTitle` | custom monitor header | Toggle "🛠 CUSTOM" |
| `searchPlaceholder` | custom search text | Toggle "Filter..." |

### State/store monitoring

The demo creates a simple pub/sub store (`appStore`) with `counter`, `features`, and `user` state, then connects it via `subscribeToState()` in diff mode. Click **"Store +counter"** or **"Store toggleBeta"** to fire state actions visible in the STORE tab.

### Programmatic API

Use **"Open"** and **"Close"** buttons to call `openDebugger()` / `closeDebugger()` from the `useDebugger()` hook — the same hook your app code can import.

## Note

`expo-demo` uses `@mspvirajpatel/react-native-network-monitor` resolved via npm workspace symlink from the monorepo root.
