import { NativeModules, Platform } from 'react-native';

interface PreventScreenshotNativeModule {
  forbid: () => void;
  allow: () => void;
}

const PreventScreenshotModule: PreventScreenshotNativeModule =
  NativeModules.PreventScreenshot;

// eslint-disable-next-line dot-notation
const METAMASK_ENVIRONMENT = process.env['METAMASK_ENVIRONMENT'];

const isQa = METAMASK_ENVIRONMENT === 'qa';
const isAndroid = Platform.OS === 'android';

const PreventScreenshot: PreventScreenshotNativeModule = {
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
