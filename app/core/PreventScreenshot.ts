import { NativeModules, Platform } from 'react-native';

// eslint-disable-next-line dot-notation
const METAMASK_ENVIRONMENT = process.env['METAMASK_ENVIRONMENT'];

const isQa = METAMASK_ENVIRONMENT === 'qa';
const isAndroid = Platform.OS === 'android';

interface PreventScreenshotNativeModule {
  forbid: () => void;
  allow: () => void;
}

const preventScreenshot =
  NativeModules.PreventScreenshot as PreventScreenshotNativeModule;

export default {
  forbid: (): boolean | void =>
    isQa ? true : isAndroid ? preventScreenshot.forbid() : true,
  allow: (): boolean | void =>
    isQa ? true : isAndroid ? preventScreenshot.allow() : true,
};
