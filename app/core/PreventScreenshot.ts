import { NativeModules, Platform } from 'react-native';

// eslint-disable-next-line dot-notation
const METAMASK_ENVIRONMENT = process.env['METAMASK_ENVIRONMENT'];

const isQa = METAMASK_ENVIRONMENT === 'qa';
const isAndroid = Platform.OS === 'android';

interface PreventScreenshotNativeModule {
  forbid: () => boolean;
  allow: () => boolean;
}

const nativeModules = NativeModules as {
  PreventScreenshot: PreventScreenshotNativeModule;
};

export default {
  forbid: isQa
    ? () => true
    : isAndroid
    ? nativeModules.PreventScreenshot.forbid
    : () => true,
  allow: isQa
    ? () => true
    : isAndroid
    ? nativeModules.PreventScreenshot.allow
    : () => true,
};
