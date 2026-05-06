import { NativeModules, Platform } from 'react-native';

interface PreventScreenshotNativeModule {
  forbid: () => Promise<boolean> | boolean;
  allow: () => Promise<boolean> | boolean;
}

// eslint-disable-next-line dot-notation
const METAMASK_ENVIRONMENT = process.env['METAMASK_ENVIRONMENT'];

const isQa = METAMASK_ENVIRONMENT === 'qa';
const isAndroid = Platform.OS === 'android';

const PreventScreenshotNative = NativeModules.PreventScreenshot as
  | PreventScreenshotNativeModule
  | undefined;

interface PreventScreenshotType {
  forbid: () => Promise<boolean> | boolean;
  allow: () => Promise<boolean> | boolean;
}

const PreventScreenshot: PreventScreenshotType = {
  forbid: isQa
    ? () => true
    : isAndroid && PreventScreenshotNative
    ? PreventScreenshotNative.forbid
    : () => true,
  allow: isQa
    ? () => true
    : isAndroid && PreventScreenshotNative
    ? PreventScreenshotNative.allow
    : () => true,
};

export default PreventScreenshot;
