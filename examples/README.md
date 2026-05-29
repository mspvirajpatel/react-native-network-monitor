# Examples for `@mspvirajpatel/react-native-network-monitor`

These example apps show how to integrate the library in real React Native projects.

## Example apps

- `expo-go` — Expo Go managed workflow
- `expo-cng` — Expo Router / CNG example with `DebugTrigger`
- `expo-cli` — React Native CLI sample (if present)

## Quick Start

From the repo root:

```bash
cd /Users/viraj/Documents/Project/package/network-monitor
yarn install
```

Then open an example:

```bash
cd examples/expo-go
yarn start
```

Or for the CNG example:

```bash
cd examples/expo-cng
yarn start
```

## How to use the demo

1. Run the app in Expo Go or dev client.
2. Tap the screen 5 times to open the debug monitor.
3. Enter password `2026`.
4. Use the monitor to inspect network requests, logs, and environment URLs.

## What to try

- Press the Fetch button to generate a network request
- Open the debug monitor and inspect request/response headers
- Switch between environment URLs (prod/test/local)
- Export logs to JSON for debugging

## Notes

- `expo-go` is the managed Expo experience.
- `expo-cng` shows the same library integration in an Expo Router / CNG-friendly project.
- These examples use the same `DebugTrigger` wrapper and password flow.

## License

MIT
