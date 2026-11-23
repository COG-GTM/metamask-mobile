import { NativeModules, Platform } from 'react-native';

// eslint-disable-next-line dot-notation
const METAMASK_ENVIRONMENT = process.env['METAMASK_ENVIRONMENT'];

const isQa = METAMASK_ENVIRONMENT === 'qa';
const isAndroid = Platform.OS === 'android';

interface PreventScreenshotNativeModule {
  forbid: () => boolean | void;
  allow: () => boolean | void;
}

const NativePreventScreenshot = NativeModules.PreventScreenshot as
  | PreventScreenshotNativeModule
  | undefined;

const PreventScreenshot: PreventScreenshotNativeModule = {
  forbid: isQa
    ? () => true
    : isAndroid
    ? (NativePreventScreenshot as PreventScreenshotNativeModule).forbid
    : () => true,
  allow: isQa
    ? () => true
    : isAndroid
    ? (NativePreventScreenshot as PreventScreenshotNativeModule).allow
    : () => true,
};

export default PreventScreenshot;
