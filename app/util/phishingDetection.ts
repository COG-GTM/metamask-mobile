import {
  PhishingDetectorResult,
  PhishingDetectorResultType,
  PhishingController as PhishingControllerClass,
  RecommendedAction,
} from '@metamask/phishing-controller';
import Engine from '../core/Engine';

/**
 * Gets detailed phishing test results for an origin
 * @param {string} origin - URL origin or hostname to check
 * @returns {PhishingDetectorResult} Phishing test result object or null if protection is disabled
 * @deprecated Use getPhishingTestResultAsync instead. This function will be removed in a future release.
 */
export const getPhishingTestResult = (
  origin: string,
): PhishingDetectorResult => {
  const { PhishingController } = Engine.context as {
    PhishingController: PhishingControllerClass;
  };
  PhishingController.maybeUpdateState();
  return PhishingController.test(origin);
};

/**
 * Gets detailed phishing test results for an origin
 * @param {string} origin - URL origin or hostname to check
 * @returns {PhishingDetectorResult} Phishing test result object - result is true if the site is UNSAFE
 */
export const getPhishingTestResultAsync = async (
  origin: string,
): Promise<PhishingDetectorResult> => {
  const { PhishingController } = Engine.context as {
    PhishingController: PhishingControllerClass;
  };

  const scanResult = await PhishingController.scanUrl(origin);
  return {
    // result is true if site is UNSAFE (Block action)
    result:
      scanResult.recommendedAction !== RecommendedAction.None &&
      scanResult.recommendedAction !== RecommendedAction.Warn,
    name: 'Product safety dapp scanning is enabled',
    type: 'DAPP_SCANNING' as PhishingDetectorResultType,
  };
};
