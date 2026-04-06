import { NativeModules, Platform } from 'react-native';

// eslint-disable-next-line dot-notation
const METAMASK_ENVIRONMENT: string | undefined = process.env['METAMASK_ENVIRONMENT'];

const isQa: boolean = METAMASK_ENVIRONMENT === 'qa';
const isAndroid: boolean = Platform.OS === 'android';

interface PreventScreenshotModule {
  forbid: () => boolean;
  allow: () => boolean;
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
