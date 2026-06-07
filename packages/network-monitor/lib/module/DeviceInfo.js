import { Platform, Dimensions, NativeModules } from 'react-native';
export const getDeviceInfo = () => {
  const {
    width,
    height,
    scale,
    fontScale
  } = Dimensions.get('window');
  let deviceName = Platform.select({
    ios: NativeModules.DeviceInfo?.model || 'Unknown iOS Device',
    android: NativeModules.DeviceInfo?.model || 'Unknown Android Device',
    default: 'Unknown Device'
  });
  let appVersion;
  let buildVersion;
  try {
    if (NativeModules.RNDeviceInfo) {
      appVersion = NativeModules.RNDeviceInfo.appVersion;
      buildVersion = NativeModules.RNDeviceInfo.buildVersion;
    } else if (NativeModules.DeviceInfo) {
      appVersion = NativeModules.DeviceInfo.appVersion;
      buildVersion = NativeModules.DeviceInfo.buildVersion;
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
    if (NativeModules.RNDeviceInfo?.isEmulator === true) {
      isEmulator = true;
    } else if (Platform.OS === 'ios') {
      isEmulator = deviceName.includes('Simulator');
    } else if (Platform.OS === 'android') {
      const fingerprint = Platform.constants?.Fingerprint || '';
      isEmulator = fingerprint.includes('generic') || fingerprint.includes('emulator');
    }
  } catch (_) {}
  return {
    platform: Platform.OS,
    osVersion: Platform.Version?.toString() || 'Unknown',
    deviceName,
    screenWidth: width,
    screenHeight: height,
    screenScale: scale,
    fontScale,
    appVersion,
    buildVersion,
    isEmulator,
    apiLevel: Platform.OS === 'android' ? Platform.Version?.toString() : undefined
  };
};
//# sourceMappingURL=DeviceInfo.js.map