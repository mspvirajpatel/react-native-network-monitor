export interface DeviceInfoData {
    platform: string;
    osVersion: string;
    deviceName: string;
    screenWidth: number;
    screenHeight: number;
    screenScale: number;
    fontScale: number;
    appVersion?: string;
    buildVersion?: string;
    isEmulator: boolean;
    apiLevel?: string;
}
export declare const getDeviceInfo: () => DeviceInfoData;
//# sourceMappingURL=DeviceInfo.d.ts.map