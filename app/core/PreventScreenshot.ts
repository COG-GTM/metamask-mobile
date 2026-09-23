import { NativeModules, Platform } from 'react-native';
import Logger from '../util/Logger';
import trackErrorAsAnalytics from '../util/metrics/TrackError/trackErrorAsAnalytics';

// eslint-disable-next-line dot-notation
const METAMASK_ENVIRONMENT = process.env['METAMASK_ENVIRONMENT'];

const isQa = METAMASK_ENVIRONMENT === 'qa';

const UNKNOWN_LOCATION = 'unknown';

type PreventScreenshotAction = 'forbid' | 'allow';

interface PreventScreenshotNativeModule {
  forbid: () => Promise<string>;
  allow: () => Promise<string>;
}

const toError = (error: unknown): Error => {
  if (error instanceof Error) {
    return error;
  }
  if (typeof error === 'object' && error !== null && 'message' in error) {
    return new Error(String(error.message));
  }
  return new Error(String(error));
};

/**
 * Calls the native PreventScreenshot module and reports failures.
 *
 * FLAG_SECURE is a security control protecting seed phrase and private key
 * screens, so a failure to apply or remove it must be observable. No screen
 * content is logged, only the action and the caller location.
 *
 * @param action - native method to call
 * @param location - screen calling the native module
 * @returns whether the flag change succeeded
 */
const callNativeModule = async (
  action: PreventScreenshotAction,
  location: string,
): Promise<boolean> => {
  if (isQa || Platform.OS !== 'android') {
    return true;
  }

  const nativeModule: PreventScreenshotNativeModule =
    NativeModules.PreventScreenshot;

  try {
    await nativeModule[action]();
    return true;
  } catch (error) {
    const normalizedError = toError(error);
    Logger.error(normalizedError, {
      message: `PreventScreenshot.${action} failed`,
      location,
    });
    // Telemetry failures must not surface as unhandled rejections to the
    // fire-and-forget callers.
    trackErrorAsAnalytics(
      `PreventScreenshot ${action} failed`,
      normalizedError.message,
      location,
    ).catch((analyticsError: unknown) =>
      Logger.error(toError(analyticsError), {
        message: `PreventScreenshot.${action} failure reporting failed`,
      }),
    );
    return false;
  }
};

export default {
  forbid: (location: string = UNKNOWN_LOCATION) =>
    callNativeModule('forbid', location),
  allow: (location: string = UNKNOWN_LOCATION) =>
    callNativeModule('allow', location),
};
