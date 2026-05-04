import { NativeModules, Platform } from 'react-native';

// eslint-disable-next-line dot-notation
const METAMASK_ENVIRONMENT = process.env['METAMASK_ENVIRONMENT'];

const isQa = METAMASK_ENVIRONMENT === 'qa';
const isAndroid = Platform.OS === 'android';

interface PreventScreenshotModule {
  forbid: () => boolean | void;
  allow: () => boolean | void;
}

export default {
  forbid: isQa
    ? () => true
    : isAndroid
    ? (NativeModules.PreventScreenshot as PreventScreenshotModule).forbid
    : () => true,
  allow: isQa
    ? () => true
    : isAndroid
    ? (NativeModules.PreventScreenshot as PreventScreenshotModule).allow
    : () => true,
};
