import { NativeModules, Platform } from 'react-native';

// eslint-disable-next-line dot-notation
const METAMASK_ENVIRONMENT = process.env['METAMASK_ENVIRONMENT'];

const isQa = METAMASK_ENVIRONMENT === 'qa';
const isAndroid = Platform.OS === 'android';

interface PreventScreenshotModule {
  forbid: () => boolean;
  allow: () => boolean;
}

interface PreventScreenshotType {
  forbid: () => boolean;
  allow: () => boolean;
}

const PreventScreenshot: PreventScreenshotType = {
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

export default PreventScreenshot;
