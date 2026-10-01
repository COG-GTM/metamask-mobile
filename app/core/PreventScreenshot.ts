import { NativeModules, Platform } from 'react-native';

interface PreventScreenshotNativeModule {
  forbid: () => Promise<boolean>;
  allow: () => Promise<boolean>;
}

const PreventScreenshotModule = NativeModules.PreventScreenshot as
  | PreventScreenshotNativeModule
  | undefined;

// eslint-disable-next-line dot-notation
const METAMASK_ENVIRONMENT = process.env['METAMASK_ENVIRONMENT'];

const isQa = METAMASK_ENVIRONMENT === 'qa';
const isAndroid = Platform.OS === 'android';

export default {
  forbid:
    isQa || !isAndroid
      ? () => true
      : (PreventScreenshotModule as PreventScreenshotNativeModule).forbid,
  allow:
    isQa || !isAndroid
      ? () => true
      : (PreventScreenshotModule as PreventScreenshotNativeModule).allow,
};
