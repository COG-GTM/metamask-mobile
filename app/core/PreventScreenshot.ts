import { NativeModules, Platform } from 'react-native';

interface PreventScreenshotNativeModule {
  forbid(): Promise<boolean>;
  allow(): Promise<boolean>;
}

const PreventScreenshotModule = (
  NativeModules as { PreventScreenshot: PreventScreenshotNativeModule }
).PreventScreenshot;

// eslint-disable-next-line dot-notation
const METAMASK_ENVIRONMENT = process.env['METAMASK_ENVIRONMENT'];

const isQa = METAMASK_ENVIRONMENT === 'qa';
const isAndroid = Platform.OS === 'android';

const PreventScreenshot: {
  forbid: () => Promise<boolean> | boolean;
  allow: () => Promise<boolean> | boolean;
} = {
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

export default PreventScreenshot;
