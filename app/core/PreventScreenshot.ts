import { NativeModules, Platform } from 'react-native';

interface PreventScreenshotNativeModule {
  forbid(): Promise<boolean> | boolean;
  allow(): Promise<boolean> | boolean;
}

// eslint-disable-next-line dot-notation
const METAMASK_ENVIRONMENT = process.env['METAMASK_ENVIRONMENT'];

const isQa = METAMASK_ENVIRONMENT === 'qa';
const isAndroid = Platform.OS === 'android';

const PreventScreenshotModule: PreventScreenshotNativeModule =
  NativeModules.PreventScreenshot;

export default {
  forbid: isQa
    ? () => true
    : isAndroid
    ? PreventScreenshotModule.forbid
    : () => true,
  allow: isQa
    ? () => true
    : isAndroid
    ? PreventScreenshotModule.allow
    : () => true,
};
