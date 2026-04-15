import { NativeModules, Platform } from 'react-native';

interface PreventScreenshotNativeModule {
  forbid: () => boolean;
  allow: () => boolean;
}

// eslint-disable-next-line dot-notation
const METAMASK_ENVIRONMENT = process.env['METAMASK_ENVIRONMENT'];

const isQa = METAMASK_ENVIRONMENT === 'qa';
const isAndroid = Platform.OS === 'android';

const PreventScreenshotNative =
  NativeModules.PreventScreenshot as PreventScreenshotNativeModule;

const PreventScreenshot: { forbid: () => boolean; allow: () => boolean } = {
  forbid: isQa
    ? () => true
    : isAndroid
    ? PreventScreenshotNative.forbid
    : () => true,
  allow: isQa
    ? () => true
    : isAndroid
    ? PreventScreenshotNative.allow
    : () => true,
};

export default PreventScreenshot;
