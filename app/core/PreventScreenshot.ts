import { NativeModules, Platform } from 'react-native';

// eslint-disable-next-line dot-notation
const METAMASK_ENVIRONMENT = process.env['METAMASK_ENVIRONMENT'];

const isQa = METAMASK_ENVIRONMENT === 'qa';
const isAndroid = Platform.OS === 'android';

interface PreventScreenshotNativeModule {
  forbid: () => Promise<boolean> | boolean;
  allow: () => Promise<boolean> | boolean;
}

const PreventScreenshotModule: PreventScreenshotNativeModule | undefined =
  NativeModules.PreventScreenshot;

const PreventScreenshot: PreventScreenshotNativeModule = {
  forbid: isQa
    ? () => true
    : isAndroid && PreventScreenshotModule
    ? PreventScreenshotModule.forbid
    : () => true,
  allow: isQa
    ? () => true
    : isAndroid && PreventScreenshotModule
    ? PreventScreenshotModule.allow
    : () => true,
};

export default PreventScreenshot;
