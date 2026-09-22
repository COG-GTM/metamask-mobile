import { NativeModules, Platform } from 'react-native';

// eslint-disable-next-line dot-notation
const METAMASK_ENVIRONMENT = process.env['METAMASK_ENVIRONMENT'];

const isQa = METAMASK_ENVIRONMENT === 'qa';
const isAndroid = Platform.OS === 'android';

interface PreventScreenshotApi {
  forbid: () => boolean | void;
  allow: () => boolean | void;
}

export default {
  forbid: isQa
    ? () => true
    : isAndroid
    ? NativeModules.PreventScreenshot.forbid
    : () => true,
  allow: isQa
    ? () => true
    : isAndroid
    ? NativeModules.PreventScreenshot.allow
    : () => true,
} as PreventScreenshotApi;
