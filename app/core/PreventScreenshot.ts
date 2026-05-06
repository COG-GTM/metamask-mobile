import { NativeModules, Platform } from 'react-native';

interface PreventScreenshotNativeModule {
  forbid: () => Promise<boolean>;
  allow: () => Promise<boolean>;
}

const PreventScreenshotNative = (
  NativeModules as unknown as { PreventScreenshot: PreventScreenshotNativeModule }
).PreventScreenshot;

// eslint-disable-next-line dot-notation
const METAMASK_ENVIRONMENT = process.env['METAMASK_ENVIRONMENT'];

const isQa = METAMASK_ENVIRONMENT === 'qa';
const isAndroid = Platform.OS === 'android';

interface PreventScreenshotInterface {
  forbid: () => Promise<boolean>;
  allow: () => Promise<boolean>;
}

const PreventScreenshot: PreventScreenshotInterface = {
  forbid: isQa
    ? () => Promise.resolve(true)
    : isAndroid
    ? PreventScreenshotNative.forbid
    : () => Promise.resolve(true),
  allow: isQa
    ? () => Promise.resolve(true)
    : isAndroid
    ? PreventScreenshotNative.allow
    : () => Promise.resolve(true),
};

export default PreventScreenshot;
