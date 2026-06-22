# Changelog

## 0.6.1

### Patch Changes

- ba9059f: Fix NavigationTracker, WebSocketMonitor, NotificationMonitor, and default feature flags for reliable debugging in Expo and React Native CLI apps.

All notable changes to this project will be documented in this file.

## 0.5.1 (2026-06-04)

- Fixed tab visibility when certain features are disabled
- Added `features` prop to `DebugTrigger` for granular feature toggling
- Added tab auto-hide when its feature is disabled

## 0.5.0 (2026-06-04)

- Redux / Zustand state store monitoring via `StateMonitor.ts`
- `createReduxMiddleware` and `createZustandMonitor` for action/state logging
- `subscribeToState` for custom state managers
- `NetworkConfig` support with `baseUrlMap` for hostname-specific URL redirection
- `skipRedirectHosts` config for third-party identity provider URLs
- `colors` prop for custom theme overrides
- Performance history chart in the FPS tab
- Full light/dark theme system with 30+ color tokens

## 0.4.0 (2026-06-03)

- Log persistence across app restarts via `PersistenceManager`
- `StorageAdapter` system for custom storage backends (MMKV, AsyncStorage, etc.)
- Log export to JSON and formatted text reports
- File saving support (expo-file-system / react-native-fs)
- Device info panel (platform, OS, model, screen, app version)

## 0.3.0 (2026-06-01)

- WebSocket event monitoring (open, close, message, error)
- `isDemo` / environment switching support
- RTL layout support for Arabic
- i18n improvements: English, Russian, Turkish, Azerbaijani
- Error boundary for catching React render errors
- Global JS error and unhandled promise rejection capture

## 0.2.0 (2026-05-30)

- Performance monitor with FPS tracking via `requestAnimationFrame`
- Draggable floating DEBUG button with snap-to-edge and auto-hide
- Safe area awareness for notched devices
- `enableTapGesture` and `clicksNeeded` configuration
- `passwordOptional` mode for quick access
- `checkAccess` prop for custom access guards

## 0.1.0 (2026-05-29)

- Initial release
- Network interception for `fetch` and `XMLHttpRequest`
- Console log capture (log, info, warn, error)
- URL redirection with configurable base URL
- Password-protected debugger access
- Full-screen debug UI with search and filtering
- Light/dark theme support
- Programmatic open/close via `useDebugger()` hook
- `baseUrls` for quick URL switching
