import { NativeModules, Platform } from 'react-native';

/**
 * The `PreventScreenshot` native module is Android only and has no published
 * types, so its shape is declared here. Both methods resolve with a status
 * message, see `android/app/src/main/java/io/metamask/nativeModules/PreventScreenshot.java`.
 */
interface PreventScreenshotNativeModule {
  forbid: () => Promise<string>;
  allow: () => Promise<string>;
}

interface PreventScreenshotModule {
  forbid: () => Promise<string> | boolean;
  allow: () => Promise<string> | boolean;
}

const preventScreenshotNativeModule: PreventScreenshotNativeModule =
  NativeModules.PreventScreenshot;

// eslint-disable-next-line dot-notation
const METAMASK_ENVIRONMENT = process.env['METAMASK_ENVIRONMENT'];

const isQa = METAMASK_ENVIRONMENT === 'qa';
const isAndroid = Platform.OS === 'android';

const PreventScreenshot: PreventScreenshotModule = {
  forbid: isQa
    ? () => true
    : isAndroid
    ? preventScreenshotNativeModule.forbid
    : () => true,
  allow: isQa
    ? () => true
    : isAndroid
    ? preventScreenshotNativeModule.allow
    : () => true,
};

export default PreventScreenshot;
