import { NativeModules, Platform } from 'react-native';

interface PreventScreenshotModule {
  forbid: () => Promise<boolean>;
  allow: () => Promise<boolean>;
}

// eslint-disable-next-line dot-notation
const METAMASK_ENVIRONMENT = process.env['METAMASK_ENVIRONMENT'];

const isQa = METAMASK_ENVIRONMENT === 'qa';
const isAndroid = Platform.OS === 'android';

export default {
  forbid: isQa
    ? () => true
    : isAndroid
    ? (NativeModules as Record<string, PreventScreenshotModule>).PreventScreenshot.forbid
    : () => true,
  allow: isQa
    ? () => true
    : isAndroid
    ? (NativeModules as Record<string, PreventScreenshotModule>).PreventScreenshot.allow
    : () => true,
};
