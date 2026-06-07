"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getDeviceInfo = void 0;
var _reactNative = require("react-native");
const getDeviceInfo = () => {
  const {
    width,
    height,
    scale,
    fontScale
  } = _reactNative.Dimensions.get('window');
  let deviceName = _reactNative.Platform.select({
    ios: _reactNative.NativeModules.DeviceInfo?.model || 'Unknown iOS Device',
    android: _reactNative.NativeModules.DeviceInfo?.model || 'Unknown Android Device',
    default: 'Unknown Device'
  });
  let appVersion;
  let buildVersion;
  try {
    if (_reactNative.NativeModules.RNDeviceInfo) {
      appVersion = _reactNative.NativeModules.RNDeviceInfo.appVersion;
      buildVersion = _reactNative.NativeModules.RNDeviceInfo.buildVersion;
    } else if (_reactNative.NativeModules.DeviceInfo) {
      appVersion = _reactNative.NativeModules.DeviceInfo.appVersion;
      buildVersion = _reactNative.NativeModules.DeviceInfo.buildVersion;
    }
  } catch (_) {}
  if (!appVersion) {
    try {
      const pkg = require('../../../../../app.json');
      appVersion = pkg?.expo?.version || pkg?.version;
    } catch (_) {}
  }
  let isEmulator = false;
  try {
    if (_reactNative.NativeModules.RNDeviceInfo?.isEmulator === true) {
      isEmulator = true;
    } else if (_reactNative.Platform.OS === 'ios') {
      isEmulator = deviceName.includes('Simulator');
    } else if (_reactNative.Platform.OS === 'android') {
      const fingerprint = _reactNative.Platform.constants?.Fingerprint || '';
      isEmulator = fingerprint.includes('generic') || fingerprint.includes('emulator');
    }
  } catch (_) {}
  return {
    platform: _reactNative.Platform.OS,
    osVersion: _reactNative.Platform.Version?.toString() || 'Unknown',
    deviceName,
    screenWidth: width,
    screenHeight: height,
    screenScale: scale,
    fontScale,
    appVersion,
    buildVersion,
    isEmulator,
    apiLevel: _reactNative.Platform.OS === 'android' ? _reactNative.Platform.Version?.toString() : undefined
  };
};
exports.getDeviceInfo = getDeviceInfo;
//# sourceMappingURL=DeviceInfo.js.map