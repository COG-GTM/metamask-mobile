import { NativeModules, Platform } from 'react-native';
import Logger from '../util/Logger';
import trackErrorAsAnalytics from '../util/metrics/TrackError/trackErrorAsAnalytics';

// eslint-disable-next-line dot-notation
const METAMASK_ENVIRONMENT = process.env['METAMASK_ENVIRONMENT'];

const isQa = METAMASK_ENVIRONMENT === 'qa';

const UNKNOWN_LOCATION = 'unknown';

const toError = (error) =>
  error instanceof Error ? error : new Error(String(error?.message ?? error));

/**
 * Calls the native PreventScreenshot module and reports failures.
 *
 * FLAG_SECURE is a security control protecting seed phrase and private key
 * screens, so a failure to apply or remove it must be observable. No screen
 * content is logged, only the action and the caller location.
 *
 * @param {'forbid'|'allow'} action - native method to call
 * @param {string} location - screen calling the native module
 * @returns {Promise<boolean>} whether the flag change succeeded
 */
const callNativeModule = async (action, location) => {
  if (isQa || Platform.OS !== 'android') {
    return true;
  }

  try {
    await NativeModules.PreventScreenshot[action]();
    return true;
  } catch (error) {
    const normalizedError = toError(error);
    Logger.error(normalizedError, {
      message: `PreventScreenshot.${action} failed`,
      location,
    });
    trackErrorAsAnalytics(
      `PreventScreenshot ${action} failed`,
      normalizedError.message,
      location,
    );
    return false;
  }
};

export default {
  forbid: (location = UNKNOWN_LOCATION) => callNativeModule('forbid', location),
  allow: (location = UNKNOWN_LOCATION) => callNativeModule('allow', location),
};
