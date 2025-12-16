import { NativeModules, Platform } from 'react-native';

// eslint-disable-next-line dot-notation
const METAMASK_ENVIRONMENT = process.env['METAMASK_ENVIRONMENT'];

const isQa = METAMASK_ENVIRONMENT === 'qa';
const isAndroid = Platform.OS === 'android';

interface PreventScreenshotModule {
  forbid: () => boolean | Promise<void>;
  allow: () => boolean | Promise<void>;
}

const PreventScreenshot: PreventScreenshotModule = {
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
};

export default PreventScreenshot;
