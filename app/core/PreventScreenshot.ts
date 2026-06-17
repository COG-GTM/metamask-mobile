import { NativeModules, Platform } from 'react-native';

interface PreventScreenshotNativeModule {
  forbid(): Promise<boolean>;
  allow(): Promise<boolean>;
}

const PreventScreenshotModule = (
  NativeModules as {
    PreventScreenshot: PreventScreenshotNativeModule;
  }
).PreventScreenshot;

// eslint-disable-next-line dot-notation
const METAMASK_ENVIRONMENT = process.env['METAMASK_ENVIRONMENT'];

const isQa = METAMASK_ENVIRONMENT === 'qa';
const isAndroid = Platform.OS === 'android';

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
