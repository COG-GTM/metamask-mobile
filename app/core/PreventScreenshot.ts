import { NativeModules, Platform } from 'react-native';

interface PreventScreenshotModule {
  forbid: () => Promise<boolean>;
  allow: () => Promise<boolean>;
}

// eslint-disable-next-line dot-notation
const METAMASK_ENVIRONMENT = process.env['METAMASK_ENVIRONMENT'];

const isQa = METAMASK_ENVIRONMENT === 'qa';
const isAndroid = Platform.OS === 'android';

const NativePreventScreenshot =
  NativeModules.PreventScreenshot as PreventScreenshotModule;

export default {
  forbid: isQa
    ? () => true
    : isAndroid
    ? NativePreventScreenshot.forbid
    : () => true,
  allow: isQa
    ? () => true
    : isAndroid
    ? NativePreventScreenshot.allow
    : () => true,
};
